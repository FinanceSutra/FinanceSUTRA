/**
 * Technical indicators library for strategy development
 */

/**
 * Calculate Simple Moving Average (SMA)
 * @param data - Array of price data
 * @param period - Period for calculation
 */
export function sma(data: number[], period: number): number[] {
  const result: number[] = [];
  
  if (data.length < period) {
    return Array(data.length).fill(null);
  }
  
  // Calculate first SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  result.push(sum / period);
  
  // Calculate subsequent SMAs
  for (let i = period; i < data.length; i++) {
    sum = sum - data[i - period] + data[i];
    result.push(sum / period);
  }
  
  // Pad beginning with nulls for alignment
  return Array(period - 1).fill(null).concat(result);
}

/**
 * Calculate Exponential Moving Average (EMA)
 * @param data - Array of price data
 * @param period - Period for calculation
 */
export function ema(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  
  if (data.length < period) {
    return Array(data.length).fill(null);
  }
  
  // Calculate first EMA as SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  const firstEma = sum / period;
  result.push(firstEma);
  
  // Calculate subsequent EMAs
  for (let i = period; i < data.length; i++) {
    const emaValue = (data[i] - result[result.length - 1]) * multiplier + result[result.length - 1];
    result.push(emaValue);
  }
  
  // Pad beginning with nulls for alignment
  return Array(period - 1).fill(null).concat(result);
}

/**
 * Calculate Relative Strength Index (RSI)
 * @param data - Array of price data
 * @param period - Period for calculation (typically 14)
 */
export function rsi(data: number[], period: number = 14): number[] {
  const result: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  if (data.length < period + 1) {
    return Array(data.length).fill(null);
  }
  
  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // Calculate first average gain and loss
  let avgGain = gains.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  
  result.push(100 - (100 / (1 + avgGain / (avgLoss === 0 ? 0.001 : avgLoss))));
  
  // Calculate subsequent RSI values
  for (let i = period; i < gains.length; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
    
    result.push(100 - (100 / (1 + avgGain / (avgLoss === 0 ? 0.001 : avgLoss))));
  }
  
  // Pad beginning with nulls for alignment
  return Array(period).fill(null).concat(result);
}

/**
 * Calculate Bollinger Bands
 * @param data - Array of price data
 * @param period - Period for calculation (typically 20)
 * @param multiplier - Standard deviation multiplier (typically 2)
 */
export function bollingerBands(data: number[], period: number = 20, multiplier: number = 2): {
  upper: number[];
  middle: number[];
  lower: number[];
} {
  const middle = sma(data, period);
  const upper: number[] = [];
  const lower: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    
    // Calculate standard deviation
    let sum = 0;
    for (let j = i - (period - 1); j <= i; j++) {
      sum += Math.pow(data[j] - middle[i], 2);
    }
    const stdDev = Math.sqrt(sum / period);
    
    upper.push(middle[i] + (multiplier * stdDev));
    lower.push(middle[i] - (multiplier * stdDev));
  }
  
  return { upper, middle, lower };
}

/**
 * Calculate Moving Average Convergence Divergence (MACD)
 * @param data - Array of price data
 * @param fastPeriod - Fast EMA period (typically 12)
 * @param slowPeriod - Slow EMA period (typically 26)
 * @param signalPeriod - Signal line period (typically 9)
 */
export function macd(
  data: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): {
  macdLine: number[];
  signalLine: number[];
  histogram: number[];
} {
  const fastEma = ema(data, fastPeriod);
  const slowEma = ema(data, slowPeriod);
  const macdLine: number[] = [];
  
  // Calculate MACD line (fastEMA - slowEMA)
  for (let i = 0; i < data.length; i++) {
    if (fastEma[i] === null || slowEma[i] === null) {
      macdLine.push(null);
    } else {
      macdLine.push(fastEma[i] - slowEma[i]);
    }
  }
  
  // Calculate signal line (EMA of MACD line)
  const signalLine = ema(
    macdLine.filter(val => val !== null),
    signalPeriod
  );
  
  // Pad signal line with nulls for alignment
  const paddedSignalLine = Array(data.length - signalLine.length).fill(null).concat(signalLine);
  
  // Calculate histogram (MACD line - signal line)
  const histogram: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (macdLine[i] === null || paddedSignalLine[i] === null) {
      histogram.push(null);
    } else {
      histogram.push(macdLine[i] - paddedSignalLine[i]);
    }
  }
  
  return {
    macdLine,
    signalLine: paddedSignalLine,
    histogram
  };
}

/**
 * Calculate Stochastic Oscillator
 * @param highData - Array of high prices
 * @param lowData - Array of low prices
 * @param closeData - Array of close prices
 * @param period - Period for calculation (typically 14)
 * @param smoothK - Smoothing for %K (typically 3)
 * @param smoothD - Smoothing for %D (typically 3)
 */
export function stochastic(
  highData: number[],
  lowData: number[],
  closeData: number[],
  period: number = 14,
  smoothK: number = 3,
  smoothD: number = 3
): {
  k: number[];
  d: number[];
} {
  const rawK: number[] = [];
  
  for (let i = period - 1; i < closeData.length; i++) {
    const highSlice = highData.slice(i - (period - 1), i + 1);
    const lowSlice = lowData.slice(i - (period - 1), i + 1);
    const highest = Math.max(...highSlice);
    const lowest = Math.min(...lowSlice);
    
    if (highest === lowest) {
      rawK.push(100);
    } else {
      rawK.push(100 * ((closeData[i] - lowest) / (highest - lowest)));
    }
  }
  
  // Smooth %K
  const k = sma(rawK, smoothK);
  
  // Calculate %D (SMA of %K)
  const d = sma(k, smoothD);
  
  // Pad with nulls for alignment
  const paddedK = Array(closeData.length - k.length).fill(null).concat(k);
  const paddedD = Array(closeData.length - d.length).fill(null).concat(d);
  
  return { k: paddedK, d: paddedD };
}

/**
 * Calculate Average True Range (ATR)
 * @param highData - Array of high prices
 * @param lowData - Array of low prices
 * @param closeData - Array of close prices
 * @param period - Period for calculation (typically 14)
 */
export function atr(
  highData: number[],
  lowData: number[],
  closeData: number[],
  period: number = 14
): number[] {
  const trueRanges: number[] = [];
  
  // Calculate true ranges
  for (let i = 1; i < closeData.length; i++) {
    const tr1 = highData[i] - lowData[i];
    const tr2 = Math.abs(highData[i] - closeData[i - 1]);
    const tr3 = Math.abs(lowData[i] - closeData[i - 1]);
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }
  
  // Calculate first ATR as simple average
  let result: number[] = [];
  if (trueRanges.length >= period) {
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += trueRanges[i];
    }
    let prevAtr = sum / period;
    result.push(prevAtr);
    
    // Calculate subsequent ATRs using smoothing
    for (let i = period; i < trueRanges.length; i++) {
      prevAtr = ((prevAtr * (period - 1)) + trueRanges[i]) / period;
      result.push(prevAtr);
    }
  }
  
  // Pad with nulls for alignment
  return Array(closeData.length - result.length).fill(null).concat(result);
}
