/**
 * Simple backtester for trading strategies
 * This provides client-side backtesting capabilities for quick strategy evaluation
 */

export interface OHLCV {
  timestamp: Date | string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface TradeResult {
  entryDate: Date;
  exitDate: Date | null;
  entryPrice: number;
  exitPrice: number | null;
  type: 'BUY' | 'SELL';
  quantity: number;
  pnl: number;
  percentPnl: number;
  isOpen: boolean;
}

export interface BacktestResult {
  initialCapital: number;
  finalCapital: number;
  totalPnl: number;
  percentReturn: number;
  trades: TradeResult[];
  equity: { date: Date | string; value: number }[];
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

interface StrategyPosition {
  type: 'BUY' | 'SELL';
  entryPrice: number;
  entryDate: Date;
  quantity: number;
}

type SignalValue = 1 | -1 | 0; // Buy, Sell, Hold

/**
 * Run a backtest on historical data
 * @param data - Array of OHLCV data
 * @param strategyFunction - Function that generates signals (1 for buy, -1 for sell, 0 for hold)
 * @param initialCapital - Starting capital
 * @param options - Backtest options
 */
export function runBacktest(
  data: OHLCV[],
  strategyFunction: (data: OHLCV[]) => SignalValue[],
  initialCapital: number = 10000,
  options: {
    commissionPercent?: number;
    slippagePercent?: number;
    positionSizing?: number; // 0-1, percentage of capital to use per trade
  } = {}
): BacktestResult {
  // Set default options
  const commissionPercent = options.commissionPercent || 0.1; // 0.1% commission
  const slippagePercent = options.slippagePercent || 0.05; // 0.05% slippage
  const positionSizing = options.positionSizing || 1; // Use 100% of available capital by default

  // Generate signals using strategy function
  const signals = strategyFunction(data);

  // Validate signals
  if (signals.length !== data.length) {
    throw new Error('Signals array length must match data array length');
  }

  let cash = initialCapital;
  let position: StrategyPosition | null = null;
  const trades: TradeResult[] = [];
  const equity: { date: Date | string; value: number }[] = [{ date: data[0].timestamp, value: initialCapital }];

  // Iterate through the data and execute trades based on signals
  for (let i = 1; i < data.length; i++) {
    const candle = data[i];
    const signal = signals[i];
    const price = candle.close;
    
    // Calculate portfolio value at this point
    let portfolioValue = cash;
    if (position) {
      const positionValue = position.quantity * price;
      portfolioValue += positionValue;
    }
    
    // Add to equity curve
    equity.push({ date: candle.timestamp, value: portfolioValue });

    // Process signals
    if (signal === 1 && !position) {
      // Buy signal and no position - enter long
      const tradeCash = cash * positionSizing;
      const effectivePrice = price * (1 + slippagePercent / 100); // Add slippage
      const commission = tradeCash * (commissionPercent / 100);
      const quantity = (tradeCash - commission) / effectivePrice;
      
      position = {
        type: 'BUY',
        entryPrice: effectivePrice,
        entryDate: new Date(candle.timestamp),
        quantity
      };
      
      cash -= (quantity * effectivePrice) + commission;
    } 
    else if (signal === -1 && !position) {
      // Sell signal and no position - enter short
      const tradeCash = cash * positionSizing;
      const effectivePrice = price * (1 - slippagePercent / 100); // Subtract slippage
      const commission = tradeCash * (commissionPercent / 100);
      const quantity = (tradeCash - commission) / effectivePrice;
      
      position = {
        type: 'SELL',
        entryPrice: effectivePrice,
        entryDate: new Date(candle.timestamp),
        quantity
      };
      
      cash -= commission; // Only deduct commission for now
    }
    else if ((signal === -1 && position?.type === 'BUY') || 
             (signal === 1 && position?.type === 'SELL')) {
      // Exit position
      if (position) {
        let exitPrice: number;
        let pnl: number;
        
        if (position.type === 'BUY') {
          exitPrice = price * (1 - slippagePercent / 100); // Subtract slippage when selling
          pnl = (exitPrice - position.entryPrice) * position.quantity;
        } else {
          exitPrice = price * (1 + slippagePercent / 100); // Add slippage when covering short
          pnl = (position.entryPrice - exitPrice) * position.quantity;
        }
        
        const exitValue = position.quantity * exitPrice;
        const commission = exitValue * (commissionPercent / 100);
        
        // Record the trade
        trades.push({
          entryDate: position.entryDate,
          exitDate: new Date(candle.timestamp),
          entryPrice: position.entryPrice,
          exitPrice,
          type: position.type,
          quantity: position.quantity,
          pnl: pnl - commission,
          percentPnl: ((pnl - commission) / (position.quantity * position.entryPrice)) * 100,
          isOpen: false
        });
        
        // Update cash
        cash += exitValue - commission;
        position = null;
      }
    }
  }

  // Close any open position using the last price
  if (position) {
    const lastCandle = data[data.length - 1];
    const lastPrice = lastCandle.close;
    let exitPrice: number;
    let pnl: number;
    
    if (position.type === 'BUY') {
      exitPrice = lastPrice * (1 - slippagePercent / 100);
      pnl = (exitPrice - position.entryPrice) * position.quantity;
    } else {
      exitPrice = lastPrice * (1 + slippagePercent / 100);
      pnl = (position.entryPrice - exitPrice) * position.quantity;
    }
    
    const exitValue = position.quantity * exitPrice;
    const commission = exitValue * (commissionPercent / 100);
    
    // Record the trade as open
    trades.push({
      entryDate: position.entryDate,
      exitDate: null,
      entryPrice: position.entryPrice,
      exitPrice: null,
      type: position.type,
      quantity: position.quantity,
      pnl: pnl - commission,
      percentPnl: ((pnl - commission) / (position.quantity * position.entryPrice)) * 100,
      isOpen: true
    });
    
    // Update cash for calculating final portfolio value, but don't actually close the position
    cash += exitValue - commission;
  }

  // Calculate final portfolio value
  const finalCapital = cash;
  const totalPnl = finalCapital - initialCapital;
  const percentReturn = (totalPnl / initialCapital) * 100;

  // Calculate win rate
  const winningTrades = trades.filter(trade => trade.pnl > 0).length;
  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  // Calculate max drawdown
  let maxDrawdown = 0;
  let peak = initialCapital;
  
  equity.forEach(point => {
    if (point.value > peak) {
      peak = point.value;
    }
    
    const drawdown = ((peak - point.value) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  // Calculate Sharpe ratio (simplified)
  const returns: number[] = [];
  for (let i = 1; i < equity.length; i++) {
    const dailyReturn = (equity[i].value / equity[i-1].value) - 1;
    returns.push(dailyReturn);
  }
  
  const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const stdDev = Math.sqrt(
    returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length
  );
  
  const sharpeRatio = stdDev !== 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

  return {
    initialCapital,
    finalCapital,
    totalPnl,
    percentReturn,
    trades,
    equity,
    winningTrades,
    losingTrades: totalTrades - winningTrades,
    winRate,
    maxDrawdown,
    sharpeRatio
  };
}

/**
 * Parse strategy code and convert it to a strategy function
 * This is a simplified implementation for demo purposes
 */
export function parseStrategyCode(code: string): (data: OHLCV[]) => SignalValue[] {
  try {
    // Try to extract signal generation logic
    // This is a simplified implementation that looks for common patterns
    if (code.includes('fast_ma') && code.includes('slow_ma')) {
      // Detect moving average crossover strategy
      return function(data: OHLCV[]): SignalValue[] {
        const fastPeriod = 12;
        const slowPeriod = 26;
        
        // Calculate fast MA
        const fastMA: number[] = Array(data.length).fill(0);
        for (let i = fastPeriod - 1; i < data.length; i++) {
          let sum = 0;
          for (let j = i - (fastPeriod - 1); j <= i; j++) {
            sum += data[j].close;
          }
          fastMA[i] = sum / fastPeriod;
        }
        
        // Calculate slow MA
        const slowMA: number[] = Array(data.length).fill(0);
        for (let i = slowPeriod - 1; i < data.length; i++) {
          let sum = 0;
          for (let j = i - (slowPeriod - 1); j <= i; j++) {
            sum += data[j].close;
          }
          slowMA[i] = sum / slowPeriod;
        }
        
        // Generate signals
        const signals: SignalValue[] = Array(data.length).fill(0);
        for (let i = slowPeriod; i < data.length; i++) {
          if (fastMA[i] > slowMA[i] && fastMA[i-1] <= slowMA[i-1]) {
            signals[i] = 1; // Buy signal
          } else if (fastMA[i] < slowMA[i] && fastMA[i-1] >= slowMA[i-1]) {
            signals[i] = -1; // Sell signal
          }
        }
        
        return signals;
      };
    } else if (code.includes('rsi')) {
      // Detect RSI strategy
      return function(data: OHLCV[]): SignalValue[] {
        const period = 14;
        const overbought = 70;
        const oversold = 30;
        
        // Calculate price changes
        const changes: number[] = [];
        for (let i = 1; i < data.length; i++) {
          changes.push(data[i].close - data[i-1].close);
        }
        
        // Calculate gains and losses
        const gains: number[] = changes.map(c => c > 0 ? c : 0);
        const losses: number[] = changes.map(c => c < 0 ? Math.abs(c) : 0);
        
        // Calculate RSI
        const rsi: number[] = Array(data.length).fill(0);
        let avgGain = gains.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
        let avgLoss = losses.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
        
        for (let i = period; i < data.length; i++) {
          if (i === period) {
            rsi[i] = 100 - (100 / (1 + avgGain / (avgLoss === 0 ? 0.001 : avgLoss)));
          } else {
            avgGain = ((avgGain * (period - 1)) + gains[i - 1]) / period;
            avgLoss = ((avgLoss * (period - 1)) + losses[i - 1]) / period;
            rsi[i] = 100 - (100 / (1 + avgGain / (avgLoss === 0 ? 0.001 : avgLoss)));
          }
        }
        
        // Generate signals
        const signals: SignalValue[] = Array(data.length).fill(0);
        for (let i = period + 1; i < data.length; i++) {
          if (rsi[i] < oversold && rsi[i-1] >= oversold) {
            signals[i] = 1; // Buy signal
          } else if (rsi[i] > overbought && rsi[i-1] <= overbought) {
            signals[i] = -1; // Sell signal
          }
        }
        
        return signals;
      };
    } else {
      // Default strategy - simple moving average crossover
      return function(data: OHLCV[]): SignalValue[] {
        const fastPeriod = 10;
        const slowPeriod = 20;
        
        // Calculate fast MA
        const fastMA: number[] = Array(data.length).fill(0);
        for (let i = fastPeriod - 1; i < data.length; i++) {
          let sum = 0;
          for (let j = i - (fastPeriod - 1); j <= i; j++) {
            sum += data[j].close;
          }
          fastMA[i] = sum / fastPeriod;
        }
        
        // Calculate slow MA
        const slowMA: number[] = Array(data.length).fill(0);
        for (let i = slowPeriod - 1; i < data.length; i++) {
          let sum = 0;
          for (let j = i - (slowPeriod - 1); j <= i; j++) {
            sum += data[j].close;
          }
          slowMA[i] = sum / slowPeriod;
        }
        
        // Generate signals
        const signals: SignalValue[] = Array(data.length).fill(0);
        for (let i = slowPeriod; i < data.length; i++) {
          if (fastMA[i] > slowMA[i] && fastMA[i-1] <= slowMA[i-1]) {
            signals[i] = 1; // Buy signal
          } else if (fastMA[i] < slowMA[i] && fastMA[i-1] >= slowMA[i-1]) {
            signals[i] = -1; // Sell signal
          }
        }
        
        return signals;
      };
    }
  } catch (error) {
    console.error("Error parsing strategy code:", error);
    // Return a do-nothing strategy that generates no signals
    return () => Array(0);
  }
}
