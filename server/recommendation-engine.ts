import { storage } from './storage';
import type { Strategy } from '@shared/schema';

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
  {
    id: '1',
    name: 'Momentum Breakout Strategy',
    description: 'Identifies stocks breaking out of consolidation patterns with strong volume and momentum indicators.',
    matchScore: 0, // Will be calculated based on user preferences
    riskLevel: 3,
    expectedReturn: '15-25% annually',
    timeFrame: 'Daily',
    suitableMarkets: ['stocks', 'etfs'],
    keyIndicators: ['Volume', 'Moving Averages', 'RSI', 'MACD'],
    tradeFrequency: 'Medium (2-5 trades per week)',
    backtestPerformance: {
      winRate: 68,
      profitFactor: 2.3,
      maxDrawdown: 12,
      sharpeRatio: 1.8
    },
    complexity: 3,
    code: `// Momentum Breakout Strategy
const period = 20;
const volumeThreshold = 1.5;
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
  
  // Check for breakout conditions
  const priceBreakout = currentPrice > currentSMA * 1.02; // 2% above SMA
  const volumeBreakout = currentVolume > currentAvgVolume * volumeThreshold;
  const strongMomentum = currentRSI > rsiThreshold;
  
  if (priceBreakout && volumeBreakout && strongMomentum) {
    return {
      signal: 'buy',
      meta: {
        reason: 'Momentum breakout with high volume',
        confidence: 'high'
      }
    };
  }
  
  // Exit conditions (take profit/stop loss would be handled separately)
  if (currentPrice < currentSMA * 0.98 || currentRSI < 40) {
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

// Get strategy recommendations based on user preferences
export async function getRecommendations(userId: number, preferences: UserPreference): Promise<StrategyTemplate[]> {
  try {
    // Get user's trading history and strategies if they exist
    const userStrategies = await storage.getStrategies(userId);
    const userTrades = await storage.getTrades(userId);
    
    // Calculate match scores for each template
    const scoredTemplates = strategyTemplates.map(template => {
      const clone = { ...template };
      clone.matchScore = calculateMatchScore(preferences, template, userStrategies, userTrades);
      return clone;
    });
    
    // Sort by match score (highest first)
    return scoredTemplates.sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw new Error('Failed to generate recommendations');
  }
}

// Calculate match score between user preferences and strategy template
function calculateMatchScore(
  preferences: UserPreference, 
  template: StrategyTemplate,
  userStrategies: Strategy[],
  userTrades: any[]
): number {
  let score = 0;
  const weights = {
    riskLevel: 0.25,
    markets: 0.20,
    indicators: 0.15,
    tradingFrequency: 0.20,
    complexity: 0.10,
    capitalMatch: 0.10
  };
  
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
  
  // Trading frequency match
  const frequencyMap = {
    day: ['High', 'Medium to High'],
    swing: ['Medium', 'Low to Medium', 'Medium to High'],
    position: ['Low', 'Low to Medium']
  };
  
  const matchingFrequency = frequencyMap[preferences.tradingFrequency]?.some(freq => 
    template.tradeFrequency.includes(freq)
  ) ?? false;
  
  score += weights.tradingFrequency * (matchingFrequency ? 100 : 0);
  
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
  
  // Capital match
  let capitalScore = 0;
  const capitalMap = {
    low: 5000,
    medium: 15000,
    high: 50000
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
  
  // Final adjustments based on investment horizon
  if (preferences.investmentHorizon === 'short' && template.timeFrame.includes('Daily')) {
    score += 5;
  } else if (preferences.investmentHorizon === 'medium' && 
            (template.timeFrame.includes('Daily') || template.timeFrame.includes('Weekly'))) {
    score += 5;
  } else if (preferences.investmentHorizon === 'long' && template.timeFrame.includes('Weekly')) {
    score += 5;
  }
  
  // Round the score and ensure it's between 0-100
  return Math.round(Math.max(0, Math.min(100, score)));
}