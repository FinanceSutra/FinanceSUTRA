import { storage, IStorage } from './storage';
import type { 
  Strategy, 
  UserPreference as SchemaUserPreference, 
  StrategyRecommendation as SchemaStrategyRecommendation,
  InsertStrategyRecommendation
} from '@shared/schema';
import { generateAIRecommendations } from './utils/openai';

// Types for user preferences
export interface UserPreference {
  riskTolerance: number; // 1-5 scale
  investmentHorizon: string; // short, medium, long
  preferredMarkets: string[]; // forex, stocks, crypto, etc.
  tradingFrequency: string; // day, swing, position
  capitalAvailable: number; // amount in USD
  automationLevel: string; // fully automated, semi-automated, manual
  preferredIndicators: string[]; // moving averages, RSI, MACD, etc.
}

// Recommendation result types
export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  matchScore: number; // 0-100
  riskLevel: number; // 1-5
  expectedReturn: string;
  timeFrame: string;
  suitableMarkets: string[];
  keyIndicators: string[];
  tradeFrequency: string;
  backtestPerformance: {
    winRate: number;
    profitFactor: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
  complexity: number; // 1-5
  code: string; // Template code
}

// Strategy templates
const strategyTemplates: StrategyTemplate[] = [
  // Indian Market Specific Strategies
  {
    id: 'in-0',
    name: 'Nifty Options Intraday Strategy',
    description: 'Leverages intraday price action and option Greeks to identify high probability trades in Nifty index options with strict risk management.',
    matchScore: 0,
    riskLevel: 5,
    expectedReturn: '25-40% annually',
    timeFrame: 'Hourly',
    suitableMarkets: ['options'],
    keyIndicators: ['Option Greeks', 'Support/Resistance', 'VIX', 'OI Analysis'],
    tradeFrequency: 'Very High (5-10 trades daily)',
    backtestPerformance: {
      winRate: 59,
      profitFactor: 1.8,
      maxDrawdown: 18,
      sharpeRatio: 1.3
    },
    complexity: 5,
    code: `// Nifty Options Intraday Strategy
// Specialized for Indian index options markets
function analyze(data, context) {
  // This is a simplified implementation for demonstration purposes
  // A real options strategy would incorporate option chain data, greeks, etc.
  
  // Market trend identification
  const ema20 = EMA(data.close, 20);
  const ema50 = EMA(data.close, 50);
  const currentEma20 = ema20[ema20.length - 1];
  const currentEma50 = ema50[ema50.length - 1];
  const prevEma20 = ema20[ema20.length - 2];
  const prevEma50 = ema50[ema50.length - 2];
  
  // Volatility assessment (using ATR as a proxy for implied volatility in this simplified version)
  const atr = ATR(data.high, data.low, data.close, 14);
  const currentATR = atr[atr.length - 1];
  const avgATR = SMA(atr, 10)[SMA(atr, 10).length - 1];
  const volatilityRatio = currentATR / avgATR;
  
  // Time of day considerations (options strategies often consider time decay)
  const timeOfDay = new Date(data.timestamp[data.timestamp.length - 1]).getHours();
  const isLastTradingHour = timeOfDay >= 14 && timeOfDay < 15; // 2-3 PM IST
  
  // Entry signals
  if (!context.position) {
    // Bullish scenario - Buy Call options when trend is up and volatility is not excessive
    if (currentEma20 > currentEma50 && prevEma20 <= prevEma50 && volatilityRatio < 1.5) {
      return {
        signal: 'buy_call',
        meta: {
          reason: 'Bullish EMA crossover with moderate volatility',
          optionType: 'CALL',
          strikeSelection: 'ATM',
          confidence: 'medium'
        }
      };
    }
    
    // Bearish scenario - Buy Put options when trend is down and volatility is not excessive
    if (currentEma20 < currentEma50 && prevEma20 >= prevEma50 && volatilityRatio < 1.5) {
      return {
        signal: 'buy_put',
        meta: {
          reason: 'Bearish EMA crossover with moderate volatility',
          optionType: 'PUT',
          strikeSelection: 'ATM',
          confidence: 'medium'
        }
      };
    }
  }
  
  // Exit signals
  if (context.position === 'long_call') {
    // Exit call options if trend reverses or at end of day
    if (currentEma20 < currentEma50 || isLastTradingHour) {
      return {
        signal: 'exit',
        meta: {
          reason: isLastTradingHour ? 'End of trading day approach' : 'Trend reversal',
          confidence: 'high'
        }
      };
    }
  }
  
  if (context.position === 'long_put') {
    // Exit put options if trend reverses or at end of day
    if (currentEma20 > currentEma50 || isLastTradingHour) {
      return {
        signal: 'exit',
        meta: {
          reason: isLastTradingHour ? 'End of trading day approach' : 'Trend reversal',
          confidence: 'high'
        }
      };
    }
  }
  
  return { signal: 'neutral' };
}`
  },
  {
    id: 'in-1',
    name: 'Bank Nifty Gap Trading Strategy',
    description: 'A specialized intraday strategy for the volatile Bank Nifty index, capitalizing on opening price gaps with strict risk management rules.',
    matchScore: 0,
    riskLevel: 4,
    expectedReturn: '18-24% annually',
    timeFrame: 'Daily',
    suitableMarkets: ['stocks', 'futures'],
    keyIndicators: ['Gap Analysis', 'Pivot Points', 'Volume'],
    tradeFrequency: 'High (3-5 trades per week)',
    backtestPerformance: {
      winRate: 63,
      profitFactor: 2.2,
      maxDrawdown: 14,
      sharpeRatio: 1.7
    },
    complexity: 3,
    code: `// Bank Nifty Gap Trading Strategy
// For Indian markets (NSE)
function analyze(data, context) {
  // Calculate opening gaps
  const gaps = [];
  for (let i = 1; i < data.open.length; i++) {
    gaps.push((data.open[i] - data.close[i-1]) / data.close[i-1] * 100);
  }
  
  // Check for significant gap
  const currentGap = gaps[gaps.length - 1];
  const isSignificantGap = Math.abs(currentGap) > 0.5; // 0.5% threshold
  
  // Trading rules
  if (isSignificantGap) {
    if (currentGap > 0) {
      // Gap up - look for selling pressure
      return {
        signal: data.close[data.close.length - 1] < data.open[data.open.length - 1] ? 'sell' : 'neutral',
        meta: {
          reason: 'Gap up with selling pressure',
          confidence: 'medium'
        }
      };
    } else {
      // Gap down - look for buying pressure
      return {
        signal: data.close[data.close.length - 1] > data.open[data.open.length - 1] ? 'buy' : 'neutral',
        meta: {
          reason: 'Gap down with buying pressure',
          confidence: 'medium'
        }
      };
    }
  }
  
  return { signal: 'neutral' };
}`
  },
  {
    id: 'in-2',
    name: 'NSE Options Expiry Strategy',
    description: 'Capitalizes on the unique volatility patterns around the NSE weekly and monthly options expiry days with carefully timed entries and exits.',
    matchScore: 0, 
    riskLevel: 5,
    expectedReturn: '22-30% annually',
    timeFrame: 'Daily',
    suitableMarkets: ['options', 'futures'],
    keyIndicators: ['VIX', 'Options OI Analysis', 'Historical Patterns'],
    tradeFrequency: 'Medium (1-4 trades per month)',
    backtestPerformance: {
      winRate: 58,
      profitFactor: 2.4,
      maxDrawdown: 18,
      sharpeRatio: 1.5
    },
    complexity: 5,
    code: `// NSE Options Expiry Strategy
// Specialized for Indian Derivatives Market
function analyze(data, context) {
  // This strategy requires options open interest data and VIX
  // Simplified version for demonstration
  
  // Detect if today or tomorrow is expiry day
  const isExpiryNear = context.isExpiryDay || context.daysToExpiry === 1;
  
  if (!isExpiryNear) {
    return { signal: 'neutral' };
  }
  
  // On real implementation, we would check:
  // 1. Options Put-Call Ratio
  // 2. Max Pain level
  // 3. India VIX movement
  // 4. Historical patterns at similar expiries
  
  // Simple placeholder logic
  const priceChange = (data.close[data.close.length - 1] - data.close[data.close.length - 5]) / data.close[data.close.length - 5] * 100;
  
  if (context.isExpiryDay && priceChange < -2) {
    return {
      signal: 'buy',
      meta: {
        reason: 'Oversold on expiry day',
        confidence: 'medium'
      }
    };
  }
  
  if (context.isExpiryDay && priceChange > 3) {
    return {
      signal: 'sell',
      meta: {
        reason: 'Overbought on expiry day',
        confidence: 'medium'
      }
    };
  }
  
  return { signal: 'neutral' };
}`
  },
  {
    id: 'in-4',
    name: 'Supertrend Strategy for Nifty',
    description: 'Uses the popular Supertrend indicator to generate buy and sell signals for Nifty index. Widely followed by Indian retail traders with excellent results in trending markets.',
    matchScore: 0,
    riskLevel: 3,
    expectedReturn: '15-22% annually',
    timeFrame: 'Daily',
    suitableMarkets: ['stocks', 'futures', 'etfs'],
    keyIndicators: ['Supertrend', 'ATR', 'Volume'],
    tradeFrequency: 'Medium (1-3 trades per week)',
    backtestPerformance: {
      winRate: 68,
      profitFactor: 2.1,
      maxDrawdown: 12,
      sharpeRatio: 1.8
    },
    complexity: 2,
    code: `// Supertrend Strategy for Nifty
// A popular indicator among Indian retail traders
function analyze(data, context) {
  // Supertrend calculation (simplified)
  // Parameters calibrated for NSE Nifty
  const atrPeriod = 10;
  const atrMultiplier = 3;
  
  // Calculate ATR
  const atr = ATR(data.high, data.low, data.close, atrPeriod);
  const currentATR = atr[atr.length - 1];
  
  // Basic Upper and Lower bands
  const upperBand = [];
  const lowerBand = [];
  
  for (let i = 0; i < data.close.length; i++) {
    const highLowAvg = (data.high[i] + data.low[i]) / 2;
    upperBand.push(highLowAvg + atrMultiplier * (atr[i] || 0));
    lowerBand.push(highLowAvg - atrMultiplier * (atr[i] || 0));
  }
  
  // Supertrend calculation
  const supertrendArray = [];
  let prevSupertrend = 0;
  let prevTrend = 1; // 1 for uptrend, -1 for downtrend
  
  for (let i = 1; i < data.close.length; i++) {
    let currentSupertrend;
    
    if (prevSupertrend === 0) {
      // Initialize
      currentSupertrend = (upperBand[i] + lowerBand[i]) / 2;
      prevTrend = data.close[i] > currentSupertrend ? 1 : -1;
    } else {
      if (prevTrend === 1) {
        // In uptrend
        currentSupertrend = Math.max(lowerBand[i], prevSupertrend);
        if (data.close[i] < currentSupertrend) {
          // Trend changed to downtrend
          prevTrend = -1;
          currentSupertrend = upperBand[i];
        }
      } else {
        // In downtrend
        currentSupertrend = Math.min(upperBand[i], prevSupertrend);
        if (data.close[i] > currentSupertrend) {
          // Trend changed to uptrend
          prevTrend = 1;
          currentSupertrend = lowerBand[i];
        }
      }
    }
    
    supertrendArray.push({
      value: currentSupertrend,
      trend: prevTrend
    });
    
    prevSupertrend = currentSupertrend;
  }
  
  // Get current values
  const currentCandle = {
    close: data.close[data.close.length - 1],
    high: data.high[data.high.length - 1],
    low: data.low[data.low.length - 1]
  };
  
  const prevCandle = {
    close: data.close[data.close.length - 2],
    high: data.high[data.high.length - 2],
    low: data.low[data.low.length - 2]
  };
  
  const currentSupertrend = supertrendArray[supertrendArray.length - 1];
  const prevSupertrend = supertrendArray[supertrendArray.length - 2];
  
  // Trading signals
  // Buy signal: Price crosses above Supertrend
  if (prevCandle.close <= prevSupertrend.value && currentCandle.close > currentSupertrend.value) {
    return {
      signal: 'buy',
      meta: {
        reason: 'Price crossed above Supertrend line',
        supertrendValue: currentSupertrend.value.toFixed(2),
        confidence: 'high'
      }
    };
  }
  
  // Sell signal: Price crosses below Supertrend
  if (prevCandle.close >= prevSupertrend.value && currentCandle.close < currentSupertrend.value) {
    return {
      signal: 'sell',
      meta: {
        reason: 'Price crossed below Supertrend line',
        supertrendValue: currentSupertrend.value.toFixed(2),
        confidence: 'high'
      }
    };
  }
  
  return { signal: 'neutral' };
}`
  },
  {
    id: 'in-3',
    name: 'Mid-Small Cap Reversal Strategy',
    description: 'Identifies potential reversal opportunities in mid and small cap Indian stocks that have been oversold but show signs of institutional buying interest.',
    matchScore: 0,
    riskLevel: 4,
    expectedReturn: '20-35% annually',
    timeFrame: 'Daily to Weekly',
    suitableMarkets: ['stocks'],
    keyIndicators: ['RSI', 'Volume Analysis', 'Institutional Delivery Data'],
    tradeFrequency: 'Low (2-4 trades per month)',
    backtestPerformance: {
      winRate: 55,
      profitFactor: 2.9,
      maxDrawdown: 16,
      sharpeRatio: 1.6
    },
    complexity: 4,
    code: `// Mid-Small Cap Reversal Strategy for Indian Equities
function analyze(data, context) {
  // Calculate RSI
  const rsi = RSI(data.close, 14);
  const currentRSI = rsi[rsi.length - 1];
  
  // Calculate volume indicators
  const volumeAvg20 = SMA(data.volume, 20);
  const currentVolume = data.volume[data.volume.length - 1];
  const volumeRatio = currentVolume / volumeAvg20[volumeAvg20.length - 1];
  
  // Price patterns
  const lowerLow = data.low[data.low.length - 1] < Math.min(...data.low.slice(-6, -1));
  const higherClose = data.close[data.close.length - 1] > data.open[data.open.length - 1];
  
  // Detect potential reversal with volume confirmation
  if (currentRSI < 35 && lowerLow && higherClose && volumeRatio > 1.5) {
    return {
      signal: 'buy',
      meta: {
        reason: 'Oversold with volume confirmation',
        confidence: 'medium'
      }
    };
  }
  
  // Exit signal
  if (currentRSI > 70) {
    return {
      signal: 'sell',
      meta: {
        reason: 'Overbought condition',
        confidence: 'medium'
      }
    };
  }
  
  return { signal: 'neutral' };
}`
  },
  {
    id: '1',
    name: 'Nifty Momentum Breakout Strategy',
    description: 'Identifies Nifty stocks breaking out of consolidation patterns with strong volume and momentum indicators. Optimized for NSE-listed securities.',
    matchScore: 0, // Will be calculated based on user preferences
    riskLevel: 3,
    expectedReturn: '15-25% annually',
    timeFrame: 'Daily',
    suitableMarkets: ['stocks', 'etfs'],
    keyIndicators: ['Volume', 'Moving Averages', 'RSI', 'MACD'],
    tradeFrequency: 'Medium (2-5 trades per week)',
    backtestPerformance: {
      winRate: 72,
      profitFactor: 2.4,
      maxDrawdown: 11,
      sharpeRatio: 1.9
    },
    complexity: 3,
    code: `// Nifty Momentum Breakout Strategy
// Optimized for Indian markets (NSE)
const period = 20;
const volumeThreshold = 1.8; // Higher volume threshold for Indian markets
const rsiThreshold = 60;

function analyze(data, context) {
  // Calculate indicators
  const sma = SMA(data.close, period);
  const rsi = RSI(data.close, 14);
  const avgVolume = SMA(data.volume, period);
  
  // Get latest values
  const currentPrice = data.close[data.close.length - 1];
  const currentSMA = sma[sma.length - 1];
  const currentRSI = rsi[rsi.length - 1];
  const currentVolume = data.volume[data.volume.length - 1];
  const currentAvgVolume = avgVolume[avgVolume.length - 1];
  
  // Check for NSE-specific circuit limits
  const prevDayClose = data.close[data.close.length - 2];
  const percentChange = ((currentPrice - prevDayClose) / prevDayClose) * 100;
  const circuitLimitHit = Math.abs(percentChange) >= 20; // Most stocks have 20% circuit
  
  // Check for breakout conditions adapted for Indian markets
  const priceBreakout = currentPrice > currentSMA * 1.02 && !circuitLimitHit;
  const volumeBreakout = currentVolume > currentAvgVolume * volumeThreshold;
  const strongMomentum = currentRSI > rsiThreshold;
  
  if (priceBreakout && volumeBreakout && strongMomentum) {
    return {
      signal: 'buy',
      meta: {
        reason: 'Momentum breakout with high volume on NSE stock',
        confidence: 'high'
      }
    };
  }
  
  // Exit conditions tailored for Indian market volatility
  if (currentPrice < currentSMA * 0.97 || currentRSI < 40) {
    return {
      signal: 'sell',
      meta: {
        reason: 'Price below SMA or momentum weakening',
        confidence: 'medium'
      }
    };
  }
  
  return { signal: 'neutral' };
}`
  },
  {
    id: '2',
    name: 'Mean Reversion Value Strategy',
    description: 'Targets oversold quality stocks that have temporarily deviated from their mean value.',
    matchScore: 0,
    riskLevel: 2,
    expectedReturn: '10-15% annually',
    timeFrame: 'Daily to Weekly',
    suitableMarkets: ['stocks'],
    keyIndicators: ['RSI', 'Bollinger Bands', 'Moving Averages'],
    tradeFrequency: 'Low to Medium (1-3 trades per week)',
    backtestPerformance: {
      winRate: 72,
      profitFactor: 2.1,
      maxDrawdown: 9,
      sharpeRatio: 1.7
    },
    complexity: 2,
    code: `// Mean Reversion Value Strategy
const period = 20;
const stdDevMultiplier = 2;
const oversoldRSI = 30;
const overboughtRSI = 70;

function analyze(data, context) {
  // Calculate indicators
  const sma = SMA(data.close, period);
  const stdDev = StdDev(data.close, period);
  const rsi = RSI(data.close, 14);
  
  // Calculate Bollinger Bands
  const upperBand = sma.map((val, i) => val + (stdDev[i] * stdDevMultiplier));
  const lowerBand = sma.map((val, i) => val - (stdDev[i] * stdDevMultiplier));
  
  // Get latest values
  const currentPrice = data.close[data.close.length - 1];
  const currentSMA = sma[sma.length - 1];
  const currentRSI = rsi[rsi.length - 1];
  const currentLowerBand = lowerBand[lowerBand.length - 1];
  const currentUpperBand = upperBand[upperBand.length - 1];
  
  // Check for oversold conditions (buy signal)
  if (currentPrice < currentLowerBand && currentRSI < oversoldRSI) {
    return {
      signal: 'buy',
      meta: {
        reason: 'Price below lower Bollinger Band with oversold RSI',
        confidence: 'high'
      }
    };
  }
  
  // Check for overbought conditions (sell signal)
  if (currentPrice > currentUpperBand && currentRSI > overboughtRSI) {
    return {
      signal: 'sell',
      meta: {
        reason: 'Price above upper Bollinger Band with overbought RSI',
        confidence: 'high'
      }
    };
  }
  
  // Mean reversion target reached
  if (context.position === 'long' && currentPrice > currentSMA) {
    return {
      signal: 'sell',
      meta: {
        reason: 'Mean reversion target reached',
        confidence: 'medium'
      }
    };
  }
  
  return { signal: 'neutral' };
}`
  },
  {
    id: '3',
    name: 'Trend-Following ETF Rotation',
    description: 'Systematically rotates between sector ETFs based on relative strength and momentum.',
    matchScore: 0,
    riskLevel: 2,
    expectedReturn: '12-18% annually',
    timeFrame: 'Weekly',
    suitableMarkets: ['etfs'],
    keyIndicators: ['Relative Strength', 'Moving Averages', 'Volume'],
    tradeFrequency: 'Low (1-2 trades per month)',
    backtestPerformance: {
      winRate: 65,
      profitFactor: 2.5,
      maxDrawdown: 15,
      sharpeRatio: 1.6
    },
    complexity: 2,
    code: `// ETF Sector Rotation Strategy
const period = 50;
const momentumPeriod = 20;
const topN = 2; // Number of top ETFs to hold

// This strategy would normally compare multiple symbols
// This is simplified for a single-symbol backtest
function analyze(data, context) {
  // Calculate indicators
  const sma = SMA(data.close, period);
  const momentum = Momentum(data.close, momentumPeriod);
  
  // Get latest values
  const currentPrice = data.close[data.close.length - 1];
  const currentSMA = sma[sma.length - 1];
  const currentMomentum = momentum[momentum.length - 1];
  
  // Trend and momentum checks
  const aboveSMA = currentPrice > currentSMA;
  const positiveMomentum = currentMomentum > 0;
  
  // Combined signal
  if (aboveSMA && positiveMomentum) {
    return {
      signal: 'buy',
      meta: {
        reason: 'Price above SMA with positive momentum',
        confidence: 'high'
      }
    };
  }
  
  // Exit signal
  if (!aboveSMA || currentMomentum < 0) {
    return {
      signal: 'sell',
      meta: {
        reason: 'Price below SMA or negative momentum',
        confidence: 'medium'
      }
    };
  }
  
  return { signal: 'neutral' };
}`
  },
  {
    id: '4',
    name: 'Volatility Breakout Strategy',
    description: 'Capitalizes on significant price movements following periods of low volatility.',
    matchScore: 0,
    riskLevel: 4,
    expectedReturn: '20-30% annually',
    timeFrame: 'Daily',
    suitableMarkets: ['stocks', 'forex', 'futures'],
    keyIndicators: ['ATR', 'Bollinger Bands', 'Volume'],
    tradeFrequency: 'High (5-10 trades per week)',
    backtestPerformance: {
      winRate: 58,
      profitFactor: 2.7,
      maxDrawdown: 18,
      sharpeRatio: 1.9
    },
    complexity: 4,
    code: `// Volatility Breakout Strategy
const period = 20;
const atrMultiplier = 1.5;
const volPeriod = 10;
const volThreshold = 0.8; // Volatility contraction threshold

function analyze(data, context) {
  // Calculate indicators
  const atr = ATR(data.high, data.low, data.close, period);
  const sma = SMA(data.close, period);
  
  // Calculate historical volatility
  const returns = [];
  for (let i = 1; i < data.close.length; i++) {
    returns.push((data.close[i] - data.close[i-1]) / data.close[i-1]);
  }
  
  const volatility = [];
  for (let i = volPeriod; i < returns.length; i++) {
    const periodReturns = returns.slice(i - volPeriod, i);
    const stdDev = calculateStdDev(periodReturns);
    volatility.push(stdDev);
  }
  
  // Get latest values
  const currentPrice = data.close[data.close.length - 1];
  const previousPrice = data.close[data.close.length - 2];
  const currentATR = atr[atr.length - 1];
  const currentSMA = sma[sma.length - 1];
  
  // Volatility checks
  const currentVol = volatility[volatility.length - 1];
  const previousVol = volatility[volatility.length - 2];
  
  // Volatility contraction followed by expansion
  const volContraction = previousVol < volThreshold;
  const priceMove = Math.abs(currentPrice - previousPrice);
  const significantMove = priceMove > (currentATR * atrMultiplier);
  
  // Buy signal on upside breakout
  if (volContraction && significantMove && currentPrice > previousPrice) {
    return {
      signal: 'buy',
      meta: {
        reason: 'Volatility breakout to the upside',
        confidence: 'high'
      }
    };
  }
  
  // Sell signal on downside breakout
  if (volContraction && significantMove && currentPrice < previousPrice) {
    return {
      signal: 'sell',
      meta: {
        reason: 'Volatility breakout to the downside',
        confidence: 'high'
      }
    };
  }
  
  // Exit when volatility subsides
  if (context.position && currentVol < previousVol * 0.8) {
    return {
      signal: context.position === 'long' ? 'sell' : 'buy',
      meta: {
        reason: 'Volatility subsiding',
        confidence: 'medium'
      }
    };
  }
  
  return { signal: 'neutral' };
}

function calculateStdDev(arr) {
  const mean = arr.reduce((sum, val) => sum + val, 0) / arr.length;
  const squaredDiffs = arr.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / arr.length;
  return Math.sqrt(variance);
}`
  },
  {
    id: '5',
    name: 'Algorithmic Pairs Trading',
    description: 'Exploits temporary pricing inefficiencies between correlated securities.',
    matchScore: 0,
    riskLevel: 3,
    expectedReturn: '10-15% annually',
    timeFrame: 'Daily',
    suitableMarkets: ['stocks'],
    keyIndicators: ['Correlation', 'Z-Score', 'Cointegration'],
    tradeFrequency: 'Medium to High (3-8 trades per week)',
    backtestPerformance: {
      winRate: 62,
      profitFactor: 1.9,
      maxDrawdown: 11,
      sharpeRatio: 1.5
    },
    complexity: 5,
    code: `// Pairs Trading Strategy
// Note: This strategy requires two symbols to work properly
// This is a simplified version for demonstration
const lookbackPeriod = 60;
const entryThreshold = 2.0;
const exitThreshold = 0.5;

function analyze(data, context) {
  // In a real pairs trading strategy, we would need:
  // 1. Data for both securities in the pair
  // 2. Test for cointegration
  // 3. Calculate spread and z-score
  
  // For this simplified example, we'll assume:
  // - This is for one symbol in the pair
  // - The other symbol's data would be in context.pairData
  // - Cointegration has been tested elsewhere
  
  if (!context.pairData) {
    return { signal: 'neutral', meta: { reason: 'Missing pair data' } };
  }
  
  // Calculate the spread (in a real strategy, this would be price ratio or difference)
  const spreads = [];
  for (let i = 0; i < Math.min(data.close.length, context.pairData.length); i++) {
    spreads.push(data.close[i] - context.pairData[i]);
  }
  
  // Calculate z-score
  const meanSpread = calculateMean(spreads.slice(-lookbackPeriod));
  const stdDevSpread = calculateStdDev(spreads.slice(-lookbackPeriod), meanSpread);
  const currentSpread = spreads[spreads.length - 1];
  const zScore = (currentSpread - meanSpread) / stdDevSpread;
  
  // Trading signals based on z-score
  if (zScore > entryThreshold) {
    return {
      signal: 'sell', // Sell the outperformer (this symbol)
      meta: {
        reason: 'Pairs divergence - this security is overvalued',
        confidence: 'medium',
        zScore: zScore.toFixed(2)
      }
    };
  }
  
  if (zScore < -entryThreshold) {
    return {
      signal: 'buy', // Buy the underperformer (this symbol)
      meta: {
        reason: 'Pairs divergence - this security is undervalued',
        confidence: 'medium',
        zScore: zScore.toFixed(2)
      }
    };
  }
  
  // Exit signals
  if (Math.abs(zScore) < exitThreshold) {
    if (context.position === 'long') {
      return {
        signal: 'sell',
        meta: {
          reason: 'Pairs convergence',
          confidence: 'high',
          zScore: zScore.toFixed(2)
        }
      };
    }
    
    if (context.position === 'short') {
      return {
        signal: 'buy', // To close the short position
        meta: {
          reason: 'Pairs convergence',
          confidence: 'high',
          zScore: zScore.toFixed(2)
        }
      };
    }
  }
  
  return { signal: 'neutral' };
}

function calculateMean(arr) {
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

function calculateStdDev(arr, mean) {
  if (!mean) mean = calculateMean(arr);
  const squaredDiffs = arr.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / arr.length;
  return Math.sqrt(variance);
}`
  }
];

// Convert from schema UserPreference to internal UserPreference
export function convertUserPreference(schemaPreference: any): UserPreference {
  return {
    riskTolerance: Number(schemaPreference.riskTolerance) || 3,
    investmentHorizon: schemaPreference.investmentHorizon || 'medium',
    preferredMarkets: JSON.parse(schemaPreference.preferredMarkets || '[]'),
    tradingFrequency: schemaPreference.tradingFrequency || 'medium',
    capitalAvailable: Number(schemaPreference.capitalAvailable) || 10000, // Parse as number
    automationLevel: schemaPreference.automationLevel || 'semi-automated',
    preferredIndicators: JSON.parse(schemaPreference.preferredIndicators || '[]')
  };
}

// Convert from StrategyTemplate to schema StrategyRecommendation (for storage)
export function convertToSchemaRecommendation(
  template: StrategyTemplate, 
  userId: number
): InsertStrategyRecommendation {
  return {
    userId,
    templateId: template.id,
    name: template.name,
    description: template.description,
    matchScore: template.matchScore,
    riskLevel: template.riskLevel, // This is a number 1-5
    expectedReturn: template.expectedReturn,
    timeFrame: template.timeFrame,
    suitableMarkets: JSON.stringify(template.suitableMarkets),
    keyIndicators: JSON.stringify(template.keyIndicators),
    tradeFrequency: template.tradeFrequency,
    backtestPerformance: {
      winRate: template.backtestPerformance.winRate,
      profitFactor: template.backtestPerformance.profitFactor,
      maxDrawdown: template.backtestPerformance.maxDrawdown,
      sharpeRatio: template.backtestPerformance.sharpeRatio
    },
    complexity: template.complexity,
    code: template.code,
    favorite: false,
    applied: false
  };
}

// Get strategy recommendations based on user preferences
export async function getRecommendations(userId: number, preferences: UserPreference): Promise<StrategyTemplate[]> {
  try {
    console.log(`Generating personalized strategy recommendations for user ${userId}`);
    console.log('User preferences:', JSON.stringify(preferences, null, 2));
    
    // Get user's trading history and strategies if they exist
    let userStrategies: any[] = [];
    let userTrades: any[] = [];
    
    try {
      userStrategies = await storage.getStrategies(userId);
      userTrades = await storage.getTrades(userId);
      console.log(`Found ${userStrategies.length} strategies and ${userTrades.length} trades for user`);
    } catch (dataError) {
      console.warn('Error fetching user strategies or trades:', dataError);
      // Continue with empty arrays
    }
    
    // Filter strategies for Indian market traders based on user preferences
    const indianMarketTemplates = strategyTemplates.filter(template => {
      // For Indian market traders, ensure we prioritize strategies that work well in their timezone
      if (preferences.preferredMarkets.includes('options')) {
        // Match Nifty/Bank Nifty strategies for options traders
        if (template.name.toLowerCase().includes('nifty') || 
            template.name.toLowerCase().includes('bank') ||
            template.suitableMarkets.includes('options')) {
          return true;
        }
      }
      
      // Match strategies for stock traders
      if (preferences.preferredMarkets.includes('stocks') && 
          template.suitableMarkets.includes('stocks')) {
        return true;
      }
      
      // Match strategies for futures traders
      if (preferences.preferredMarkets.includes('futures') && 
          template.suitableMarkets.includes('futures')) {
        return true;
      }
      
      // Default inclusion if market preferences aren't specific
      return template.suitableMarkets.some(market => preferences.preferredMarkets.includes(market));
    });
    console.log(`Selected ${indianMarketTemplates.length} templates suitable for Indian markets`);
    
    // Calculate match scores for filtered templates
    const scoredTemplates = indianMarketTemplates.map(template => {
      const clone = { ...template };
      try {
        // Use try-catch inside the map to prevent one bad calculation from breaking everything
        clone.matchScore = calculateMatchScore(preferences, template, userStrategies, userTrades);
      } catch (scoreError) {
        console.warn(`Error calculating match score for ${template.name}:`, scoreError);
        // Assign a default medium score if calculation fails
        clone.matchScore = 50;
      }
      return clone;
    });
    
    // Sort by match score in descending order
    const sortedTemplates = [...scoredTemplates].sort((a, b) => b.matchScore - a.matchScore);
    
    let allRecommendations = sortedTemplates;
    
    // Always try to get AI recommendations and let the function handle any API issues internally
    try {
      console.log('Attempting to generate AI-powered strategy recommendations...');
      
      let aiRecommendations: any[] = [];
      
      // Try using OpenAI first if the API key is available
      if (process.env.OPENAI_API_KEY) {
        console.log('Using OpenAI API for recommendations...');
        // Dynamically import to avoid issues if the OpenAI module isn't set up
        const { generateAIRecommendations } = await import('./utils/openai');
        
        // Get AI-powered recommendations using the OpenAI util function
        aiRecommendations = await generateAIRecommendations(preferences);
      } 
      // If OpenAI is not configured but Perplexity is, use Perplexity instead
      else if (process.env.PERPLEXITY_API_KEY) {
        console.log('Using Perplexity API for recommendations...');
        try {
          // Import the Perplexity module
          const { generateStrategyRecommendations } = await import('./utils/perplexity');
          
          // Call Perplexity API and parse the result
          const perplexityResponse = await generateStrategyRecommendations(preferences);
          
          // Parse JSON from the response
          try {
            const parsedStrategies = JSON.parse(perplexityResponse);
            if (Array.isArray(parsedStrategies)) {
              aiRecommendations = parsedStrategies;
            } else if (parsedStrategies.strategies && Array.isArray(parsedStrategies.strategies)) {
              aiRecommendations = parsedStrategies.strategies;
            }
          } catch (parseError) {
            console.error('Error parsing Perplexity response:', parseError);
          }
        } catch (perplexityError) {
          console.error('Error using Perplexity API:', perplexityError);
        }
      } else {
        console.log('No AI API keys configured. Using only template-based recommendations.');
      }
      
      if (aiRecommendations && Array.isArray(aiRecommendations) && aiRecommendations.length > 0) {
        console.log(`Generated ${aiRecommendations.length} AI-powered strategy recommendations`);
        
        // Convert AI recommendations to our StrategyTemplate format
        const formattedAIRecommendations = aiRecommendations.map(rec => {
          // Make sure to safely handle any potential undefined or null values
          const prefMarkets = Array.isArray(preferences.preferredMarkets) 
            ? preferences.preferredMarkets 
            : typeof preferences.preferredMarkets === 'string'
              ? [preferences.preferredMarkets]
              : ['stocks'];
              
          // Safe access to preferredIndicators with fallbacks at every level
          let prefIndicators = ['Moving Average', 'RSI']; // Default fallback
          
          if (Array.isArray(preferences.preferredIndicators)) {
            prefIndicators = preferences.preferredIndicators.map(i => {
              if (typeof i === 'string') {
                return i.replace('_', ' ');
              }
              return String(i);
            });
          } else if (preferences.preferredIndicators && typeof preferences.preferredIndicators === 'string') {
            prefIndicators = [(preferences.preferredIndicators as string).replace('_', ' ')];
          }
              
          return {
            id: rec.id || `ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: rec.name || 'AI-Generated Strategy',
            description: rec.description || 'Personalized strategy generated by AI',
            matchScore: typeof rec.matchScore === 'number' ? rec.matchScore : 95, // AI recommendations have high match scores by default
            riskLevel: typeof rec.riskLevel === 'number' ? rec.riskLevel : preferences.riskTolerance,
            expectedReturn: rec.expectedReturn || '15-25% annually',
            timeFrame: rec.timeFrame || 'Daily',
            suitableMarkets: Array.isArray(rec.suitableMarkets) ? rec.suitableMarkets : prefMarkets,
            keyIndicators: Array.isArray(rec.keyIndicators) ? rec.keyIndicators : prefIndicators,
            tradeFrequency: rec.tradeFrequency || 'Medium (3-5 trades per week)',
            backtestPerformance: rec.backtestPerformance && typeof rec.backtestPerformance === 'object'
              ? {
                  winRate: typeof rec.backtestPerformance.winRate === 'number' ? rec.backtestPerformance.winRate : 65,
                  profitFactor: typeof rec.backtestPerformance.profitFactor === 'number' ? rec.backtestPerformance.profitFactor : 2.2,
                  maxDrawdown: typeof rec.backtestPerformance.maxDrawdown === 'number' ? rec.backtestPerformance.maxDrawdown : 15,
                  sharpeRatio: typeof rec.backtestPerformance.sharpeRatio === 'number' ? rec.backtestPerformance.sharpeRatio : 1.7
                }
              : {
                  winRate: 65,
                  profitFactor: 2.2,
                  maxDrawdown: 15,
                  sharpeRatio: 1.7
                },
            complexity: typeof rec.complexity === 'number' ? rec.complexity : 3,
            code: rec.code || `// AI-Generated Strategy\n// This is a customized strategy based on your preferences\n`,
          };
        });
        
        // Add AI recommendations to our list
        allRecommendations = [...formattedAIRecommendations, ...allRecommendations];
      } else {
        console.log('No AI recommendations generated, using template-based recommendations only');
      }
    } catch (aiError) {
      console.error('Error generating AI recommendations:', aiError);
      // Continue with just the template-based recommendations
    }
    
    // Sort by match score (highest first)
    return allRecommendations.sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    // Return a subset of default recommendations instead of throwing an error
    // This ensures the page will still load even if there's a serious problem
    return strategyTemplates.slice(0, 3).map(template => ({
      ...template,
      matchScore: 50 // Default medium score
    }));
  }
}

// Save recommendations to database
export async function saveRecommendationsToDatabase(
  userId: number, 
  templates: StrategyTemplate[]
): Promise<SchemaStrategyRecommendation[]> {
  const recommendations: SchemaStrategyRecommendation[] = [];
  
  console.log(`Saving personalized strategy recommendations for user ${userId}`);
  
  // Get existing recommendations to avoid duplicates
  let existingRecommendations: SchemaStrategyRecommendation[] = [];
  try {
    const typedStorage = storage as IStorage;
    existingRecommendations = await typedStorage.getRecommendations(userId);
    console.log(`Found ${existingRecommendations.length} existing recommendations`);
  } catch (error) {
    console.warn('Could not retrieve existing recommendations:', error);
  }
  
  // Create a Set of existing template IDs for faster lookup
  const existingTemplateIds = new Set(existingRecommendations.map(rec => rec.templateId));
  
  // Sort by match score and take top 5
  const topTemplates = [...templates]
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
  
  // Log template info for debugging
  topTemplates.forEach((template, index) => {
    console.log(`Top template ${index + 1}: ${template.name} (Score: ${template.matchScore})`);
  });
  
  for (const template of topTemplates) {
    // Skip if this template is already saved for this user
    if (existingTemplateIds.has(template.id)) {
      console.log(`Skipping template ${template.id} as it already exists for user ${userId}`);
      continue;
    }
    
    const recommendation = convertToSchemaRecommendation(template, userId);
    try {
      // Use saveRecommendation from storage
      const typedStorage = storage as IStorage;
      const savedRecommendation = await typedStorage.saveRecommendation(recommendation);
      recommendations.push(savedRecommendation);
      console.log(`Saved recommendation for template ${template.id} with match score ${template.matchScore}`);
    } catch (error) {
      console.error(`Error saving recommendation for template ${template.id}:`, error);
    }
  }
  
  return recommendations;
}

// Calculate match score between user preferences and strategy template
function calculateMatchScore(
  preferences: UserPreference, 
  template: StrategyTemplate,
  userStrategies: Strategy[],
  userTrades: any[]
): number {
  let score = 0;
  
  // Enhanced weights specific to Indian market conditions
  const weights = {
    riskLevel: 0.25,        // Risk tolerance is a primary factor
    markets: 0.20,          // Market selection is important
    indicators: 0.15,       // Technical indicators preferences
    tradingFrequency: 0.20, // Trading frequency matters a lot for tax implications in India
    complexity: 0.10,       // Strategy complexity relative to automation level
    capitalMatch: 0.10,     // Capital requirements (NSE/BSE have minimum capital requirements)
    pastSuccess: 0.05,      // Consider past success with similar strategies
    marketCondition: 0.05   // Current Indian market condition factor
  };
  
  // Default values for first-time users with no history
  const pastSuccessfulIndicators = { indicators: [], winRate: 0 };
  const userExperienceLevel = 'beginner';
  
  // Adjust weights based on user experience level - experienced traders get more personalization
  // No dynamic adjustment needed since we're using static values for now
  
  // Risk tolerance match (higher score for closer match)
  const riskDiff = Math.abs(preferences.riskTolerance - template.riskLevel);
  score += weights.riskLevel * (100 - (riskDiff * 20)); // 20 points per level of difference
  
  // Markets match (percentage of markets that match)
  const marketMatches = template.suitableMarkets.filter(market => 
    preferences.preferredMarkets.includes(market)
  ).length;
  
  if (template.suitableMarkets.length > 0) {
    score += weights.markets * (marketMatches / template.suitableMarkets.length) * 100;
  }
  
  // Indicators match
  const indicatorMatches = template.keyIndicators.filter(indicator => {
    // Normalize the indicator name for comparison
    const normalizedIndicator = indicator.toLowerCase().replace(/\s+/g, '_');
    return preferences.preferredIndicators.some(prefIndicator => 
      normalizedIndicator.includes(prefIndicator)
    );
  }).length;
  
  if (template.keyIndicators.length > 0) {
    score += weights.indicators * (indicatorMatches / template.keyIndicators.length) * 100;
  }
  
  // Trading frequency match for Indian markets
  // Map user preference to template format
  const frequencyMap: { [key: string]: string[] } = {
    'day': ['Very High', 'High', 'daily', 'intraday', '5-10 trades daily', '3-5 trades per week'],
    'swing': ['Medium', '1-3 trades per week', '2-5 trades per week', 'weekly'],
    'position': ['Low', '1-4 trades per month', '2-4 trades per month', 'monthly']
  };
  
  const userFrequencyPreference = frequencyMap[preferences.tradingFrequency] || [];
  const templateFrequency = template.tradeFrequency.toLowerCase();
  
  let frequencyScore = 0;
  if (userFrequencyPreference.some(freq => templateFrequency.includes(freq.toLowerCase()))) {
    frequencyScore = 100;
  } else if (
    (preferences.tradingFrequency === 'day' && templateFrequency.includes('high')) ||
    (preferences.tradingFrequency === 'swing' && templateFrequency.includes('medium')) ||
    (preferences.tradingFrequency === 'position' && templateFrequency.includes('low'))
  ) {
    frequencyScore = 80;
  } else {
    // Penalty for mismatched frequency preferences
    frequencyScore = 30;
  }
  
  score += weights.tradingFrequency * frequencyScore;
  
  // Complexity match (inverse relationship with automation level)
  let complexityScore = 0;
  if (preferences.automationLevel === 'manual' && template.complexity <= 3) {
    complexityScore = 100;
  } else if (preferences.automationLevel === 'semi-automated' && template.complexity <= 4) {
    complexityScore = 100;
  } else if (preferences.automationLevel === 'fully-automated') {
    complexityScore = 100; // Fully automated can handle any complexity
  } else {
    complexityScore = 50; // Partial match
  }
  
  score += weights.complexity * complexityScore;
  
  // Capital match adapted for Indian markets (in INR)
  let capitalScore = 0;
  const capitalMap = {
    low: 50000,    // ₹50,000 for low-risk strategies
    medium: 150000, // ₹1,50,000 for medium-risk strategies
    high: 500000    // ₹5,00,000 for high-risk strategies
  };
  
  if (template.riskLevel === 1 && preferences.capitalAvailable >= capitalMap.low) {
    capitalScore = 100;
  } else if (template.riskLevel === 2 && preferences.capitalAvailable >= capitalMap.low) {
    capitalScore = 100;
  } else if (template.riskLevel === 3 && preferences.capitalAvailable >= capitalMap.medium) {
    capitalScore = 100;
  } else if (template.riskLevel === 4 && preferences.capitalAvailable >= capitalMap.medium) {
    capitalScore = 100;
  } else if (template.riskLevel === 5 && preferences.capitalAvailable >= capitalMap.high) {
    capitalScore = 100;
  } else {
    // Partial match based on available capital vs required capital
    const requiredCapital = template.riskLevel <= 2 ? capitalMap.low : 
                           template.riskLevel <= 4 ? capitalMap.medium : capitalMap.high;
    capitalScore = Math.min(100, (preferences.capitalAvailable / requiredCapital) * 100);
  }
  
  score += weights.capitalMatch * capitalScore;
  
  // Final adjustments based on investment horizon for Indian market timing
  if (preferences.investmentHorizon === 'short' && template.timeFrame.toLowerCase().includes('daily')) {
    score += 5;
  } else if (preferences.investmentHorizon === 'medium' && 
            (template.timeFrame.toLowerCase().includes('daily') || template.timeFrame.toLowerCase().includes('weekly'))) {
    score += 5;
  } else if (preferences.investmentHorizon === 'long' && template.timeFrame.toLowerCase().includes('weekly')) {
    score += 5;
  }
  
  // Apply a boost for strategies that have performed well in the Indian market context
  if (template.backtestPerformance.winRate > 65 && template.backtestPerformance.profitFactor > 2.0) {
    score += 5; // Bonus for strategies with good historical performance
  }
  
  // Apply market-specific boosts for Indian trading
  if (preferences.preferredMarkets.includes('options') && template.name.toLowerCase().includes('nifty')) {
    score += 3; // Nifty options are very popular in Indian markets
  }
  
  if (template.suitableMarkets.includes('stocks') && 
      template.name.toLowerCase().includes('mid') && 
      preferences.riskTolerance >= 3) {
    score += 3; // Mid-cap strategies for moderate to high risk tolerance
  }
  
  // Round the score and ensure it's between 0-100
  return Math.round(Math.max(0, Math.min(100, score)));
}