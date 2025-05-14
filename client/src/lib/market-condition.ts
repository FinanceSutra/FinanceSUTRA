/**
 * Utility functions to determine market conditions based on price data
 */

interface PriceData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  time?: string | Date;
}

export type MarketCondition = 'bullish' | 'bearish' | 'neutral' | 'volatile';

/**
 * Determines the market condition based on recent price data
 * @param priceData - Array of price bars with OHLC data
 * @param lookbackPeriod - Optional period to analyze (default: full array)
 * @returns Market condition as 'bullish', 'bearish', 'neutral', or 'volatile'
 */
export function determineMarketCondition(
  priceData: PriceData[],
  lookbackPeriod: number = 0
): MarketCondition {
  if (!priceData || priceData.length === 0) {
    return 'neutral'; // Default when no data is available
  }

  // Use full array or specified lookback period
  const dataToAnalyze = lookbackPeriod > 0 && lookbackPeriod < priceData.length
    ? priceData.slice(-lookbackPeriod)
    : priceData;

  // Calculate percent change from first to last bar
  const firstClose = dataToAnalyze[0].close;
  const lastClose = dataToAnalyze[dataToAnalyze.length - 1].close;
  const percentChange = ((lastClose - firstClose) / firstClose) * 100;

  // Calculate average true range for volatility
  const atr = calculateATR(dataToAnalyze, 14);
  const atrPercent = (atr / lastClose) * 100;

  // Determine market condition based on percent change and volatility
  if (atrPercent > 2.5) {
    return 'volatile';
  } else if (percentChange > 1.5) {
    return 'bullish';
  } else if (percentChange < -1.5) {
    return 'bearish';
  } else {
    return 'neutral';
  }
}

/**
 * Calculates the Average True Range (ATR) - a measure of volatility
 * @param priceData - Array of price bars with OHLC data
 * @param period - Period for ATR calculation (typically 14)
 * @returns ATR value
 */
function calculateATR(priceData: PriceData[], period: number): number {
  if (priceData.length < period + 1) {
    // Not enough data for proper ATR calculation
    return estimateTrueRange(priceData);
  }

  const trValues: number[] = [];
  
  // Calculate True Range values
  for (let i = 1; i < priceData.length; i++) {
    const current = priceData[i];
    const previous = priceData[i - 1];
    
    const tr1 = current.high - current.low; // Current high - current low
    const tr2 = Math.abs(current.high - previous.close); // Current high - previous close
    const tr3 = Math.abs(current.low - previous.close); // Current low - previous close
    
    const trueRange = Math.max(tr1, tr2, tr3);
    trValues.push(trueRange);
  }
  
  // Calculate ATR using a simple average of the last 'period' true ranges
  const relevantTR = trValues.slice(-period);
  const atr = relevantTR.reduce((sum, tr) => sum + tr, 0) / relevantTR.length;
  
  return atr;
}

/**
 * Estimates true range when not enough data is available for ATR
 * @param priceData - Array of price bars with OHLC data
 * @returns Estimated true range
 */
function estimateTrueRange(priceData: PriceData[]): number {
  if (priceData.length <= 1) {
    // For a single bar, use high - low as the true range
    return priceData.length === 1 ? priceData[0].high - priceData[0].low : 0;
  }
  
  // With limited data, calculate an average of available true ranges
  let totalTR = 0;
  let count = 0;
  
  for (let i = 1; i < priceData.length; i++) {
    const current = priceData[i];
    const previous = priceData[i - 1];
    
    const tr1 = current.high - current.low;
    const tr2 = Math.abs(current.high - previous.close);
    const tr3 = Math.abs(current.low - previous.close);
    
    totalTR += Math.max(tr1, tr2, tr3);
    count++;
  }
  
  return count > 0 ? totalTR / count : 0;
}