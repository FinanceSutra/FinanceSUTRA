import axios from 'axios';
import { MarketData, insertMarketDataSchema } from '@shared/schema';
import { getStockCandles, mapTimeframeToResolution, searchSymbols } from '../services/finnhub';

// Function to transform Finnhub data to our internal format
function transformFinnhubData(finnhubData: any[], symbol: string, timeframe: string): Omit<MarketData, 'id'>[] {
  if (!finnhubData || finnhubData.length === 0) {
    return [];
  }
  
  return finnhubData.map((item: any) => {
    // Make sure timestamp is valid
    const date = new Date(item.timestamp);
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return {
      symbol,
      timestamp: date,
      timeframe,
      open: String(item.open),
      high: String(item.high), 
      low: String(item.low),
      close: String(item.close),
      volume: item.volume ? String(item.volume) : null
    };
  }).filter(Boolean);
}

// For Indian symbols, format for Finnhub
// Finnhub uses format EXCHANGE:SYMBOL for international stocks
function formatSymbolForFinnhub(symbol: string): string {
  // Handle prefixed symbols like NSE:RELIANCE
  if (symbol.includes(':')) {
    return symbol;
  }
  
  // Handle indices which start with ^
  if (symbol.startsWith('^')) {
    const indexSymbol = symbol.substring(1);
    return `INDX:${indexSymbol}`;
  }
  
  // For regular Indian stocks, add the NSE prefix
  return `NSE:${symbol}`;
}

// Main function to fetch market data from Finnhub
export async function fetchMarketData(symbol: string, timeframe: string): Promise<Omit<MarketData, 'id'>[]> {
  try {
    // Format symbol for Finnhub
    const formattedSymbol = formatSymbolForFinnhub(symbol);
    // Convert timeframe to resolution
    const resolution = mapTimeframeToResolution(timeframe);
    
    // Calculate from and to timestamps based on timeframe
    const to = Math.floor(Date.now() / 1000);
    let from: number;
    
    // Set appropriate timespan based on timeframe
    switch(timeframe) {
      case '1m': case '5m': case '15m': 
        from = to - (24 * 60 * 60); // 1 day back for minutes
        break;
      case '30m': case '1h': 
        from = to - (7 * 24 * 60 * 60); // 7 days back
        break;
      case '4h': case '1d': 
        from = to - (30 * 24 * 60 * 60); // 30 days back
        break;
      case '1wk': 
        from = to - (365 * 24 * 60 * 60); // 1 year back for weekly
        break;
      case '1mo': 
        from = to - (5 * 365 * 24 * 60 * 60); // 5 years back for monthly
        break;
      default: 
        from = to - (30 * 24 * 60 * 60); // Default 30 days back
    }
    
    console.log(`Fetching market data from Finnhub for ${formattedSymbol} with resolution ${resolution}`);
    
    // Fetch data from Finnhub
    const data = await getStockCandles(formattedSymbol, resolution, from, to);
    
    // Transform to our format
    return transformFinnhubData(data, symbol, timeframe);
  } catch (error) {
    console.error(`Error fetching market data for ${symbol}:`, error);
    
    // Fallback to Yahoo Finance if needed
    console.log(`Falling back to Yahoo Finance for ${symbol}`);
    return fetchYahooMarketData(symbol, timeframe);
  }
}

// Function to get latest price for a symbol from Finnhub
export async function getLatestPrice(symbol: string): Promise<number | null> {
  try {
    // First try to get latest data from Finnhub
    const formattedSymbol = formatSymbolForFinnhub(symbol);
    const to = Math.floor(Date.now() / 1000);
    const from = to - (24 * 60 * 60); // 1 day back
    
    console.log(`Fetching latest price from Finnhub for ${formattedSymbol}`);
    
    const data = await getStockCandles(formattedSymbol, 'D', from, to);
    
    if (data && data.length > 0) {
      // Get the latest data point
      const latestData = data[data.length - 1];
      console.log(`Latest price for ${symbol}: ${latestData.close}`);
      return latestData.close;
    }
    
    console.log(`No valid close price found for ${symbol} on Finnhub, trying Yahoo Finance`);
    return getYahooLatestPrice(symbol);
  } catch (error) {
    console.error(`Error fetching latest price for ${symbol} from Finnhub:`, error);
    // Try Yahoo as fallback
    return getYahooLatestPrice(symbol);
  }
}

// ---------- YAHOO FINANCE FALLBACK METHODS ----------

// For Indian symbols, add .NS suffix for NSE and .BO for BSE
function formatIndianSymbol(symbol: string): string {
  // Check if it's already suffixed
  if (symbol.endsWith('.NS') || symbol.endsWith('.BO')) {
    return symbol;
  }
  
  // Handle indices which start with ^ - these don't need a suffix
  if (symbol.startsWith('^')) {
    return symbol;
  }
  
  // Handle prefixed symbols like NSE:RELIANCE
  if (symbol.includes(':')) {
    const parts = symbol.split(':');
    const exchange = parts[0];
    const ticker = parts[1];
    
    if (exchange === 'NSE') {
      return `${ticker}.NS`;
    } else if (exchange === 'BSE') {
      return `${ticker}.BO`;
    } else if (exchange === 'INDEX') {
      return `^${ticker}`; // Yahoo Finance uses ^ for indices
    } else {
      return ticker; // Return just the ticker for other exchanges
    }
  }
  
  // For regular Indian stocks, add the NSE suffix
  return `${symbol}.NS`;
}

// Function to convert Yahoo Finance data to our internal format
function transformYahooFinanceData(yahooData: any, symbol: string, timeframe: string): Omit<MarketData, 'id'>[] {
  if (!yahooData?.chart?.result?.[0]?.timestamp) {
    return [];
  }

  const result = yahooData.chart.result[0];
  const timestamps = result.timestamp;
  const quotes = result.indicators.quote[0];
  
  return timestamps.map((timestamp: number, index: number) => {
    // Some points might have missing data
    if (!quotes.open[index] || !quotes.high[index] || !quotes.low[index] || !quotes.close[index]) {
      return null;
    }
    
    // Make sure timestamp is valid
    const date = new Date(timestamp * 1000); // Convert Unix timestamp to Date
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return {
      symbol,
      timestamp: date,
      timeframe,
      open: String(quotes.open[index]),
      high: String(quotes.high[index]), 
      low: String(quotes.low[index]),
      close: String(quotes.close[index]),
      volume: quotes.volume[index] ? String(quotes.volume[index]) : null
    };
  }).filter(Boolean);
}

// Function to format Yahoo Finance API interval based on our timeframe
function getYahooInterval(timeframe: string): string {
  switch(timeframe) {
    case '1m': return '1m';
    case '5m': return '5m';
    case '15m': return '15m';
    case '30m': return '30m';
    case '1h': return '60m';
    case '4h': return '1d'; // Yahoo doesn't have 4h, use daily and filter
    case '1d': return '1d';
    case '1wk': return '1wk'; // Weekly timeframe
    case '1mo': return '1mo'; // Monthly timeframe
    default: return '1d';
  }
}

// Function to get range parameter based on timeframe
function getYahooRange(timeframe: string): string {
  switch(timeframe) {
    case '1m': return '1d'; // Yahoo only allows 1m data for short ranges
    case '5m': return '5d';
    case '15m': return '5d';
    case '30m': return '5d';
    case '1h': return '7d';
    case '4h': return '1mo';
    case '1d': return '3mo';
    case '1wk': return '1y';  // 1 year of weekly data
    case '1mo': return '5y';  // 5 years of monthly data
    default: return '3mo';
  }
}

// Yahoo Finance fallback method
async function fetchYahooMarketData(symbol: string, timeframe: string): Promise<Omit<MarketData, 'id'>[]> {
  try {
    // Format symbol for Yahoo Finance
    const yahooSymbol = formatIndianSymbol(symbol);
    const interval = getYahooInterval(timeframe);
    const range = getYahooRange(timeframe);
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${interval}&range=${range}`;
    
    console.log(`Fetching market data from Yahoo Finance fallback: ${url}`);
    
    const response = await axios.get(url);
    const data = response.data;
    
    return transformYahooFinanceData(data, symbol, timeframe);
  } catch (error) {
    console.error(`Error fetching market data from Yahoo Finance for ${symbol}:`, error);
    return [];
  }
}

// Function to get latest price from Yahoo Finance as fallback
async function getYahooLatestPrice(symbol: string): Promise<number | null> {
  try {
    const yahooSymbol = formatIndianSymbol(symbol);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`;
    
    console.log(`Fetching latest price from Yahoo Finance fallback: ${url}`);
    
    const response = await axios.get(url);
    const data = response.data;
    
    if (!data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close) {
      console.log(`No close price data available for ${symbol}`);
      return null;
    }
    
    const closes = data.chart.result[0].indicators.quote[0].close;
    // Get the last non-null close price
    for (let i = closes.length - 1; i >= 0; i--) {
      if (closes[i] !== null) {
        console.log(`Latest price for ${symbol}: ${closes[i]}`);
        return closes[i];
      }
    }
    
    console.log(`No valid close price found for ${symbol}`);
    return null;
  } catch (error) {
    console.error(`Error fetching latest price for ${symbol} from Yahoo:`, error);
    // Return a default price to prevent crashing the WebSocket
    return 100.0; // Default price to avoid crashes
  }
}

// List of Indian market indices available on Yahoo Finance
export const indianMarketIndices = [
  { symbol: "^NSEI", name: "NIFTY 50" },
  { symbol: "^BSESN", name: "S&P BSE SENSEX" },
  { symbol: "^NSEBANK", name: "NIFTY BANK" },
  { symbol: "^CNXIT", name: "NIFTY IT" },
  { symbol: "^CNXAUTO", name: "NIFTY AUTO" },
  { symbol: "^CNXFMCG", name: "NIFTY FMCG" },
  { symbol: "^CNXPHARMA", name: "NIFTY PHARMA" },
  { symbol: "^CNXMETAL", name: "NIFTY METAL" },
  { symbol: "^CNXREALTY", name: "NIFTY REALTY" },
  { symbol: "^CNXENERGY", name: "NIFTY ENERGY" }
];

// List of top Indian stocks
export const topIndianStocks = [
  { symbol: "RELIANCE", name: "Reliance Industries" },
  { symbol: "TCS", name: "Tata Consultancy Services" },
  { symbol: "HDFCBANK", name: "HDFC Bank" },
  { symbol: "INFY", name: "Infosys" },
  { symbol: "ICICIBANK", name: "ICICI Bank" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever" },
  { symbol: "HDFC", name: "Housing Development Finance Corporation" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance" },
  { symbol: "SBIN", name: "State Bank of India" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel" },
  { symbol: "ASIANPAINT", name: "Asian Paints" },
  { symbol: "ITC", name: "ITC Limited" },
  { symbol: "AXISBANK", name: "Axis Bank" },
  { symbol: "TATAMOTORS", name: "Tata Motors" },
  { symbol: "WIPRO", name: "Wipro" },
  { symbol: "HCLTECH", name: "HCL Technologies" },
  { symbol: "MARUTI", name: "Maruti Suzuki India" },
  { symbol: "BAJAJFINSV", name: "Bajaj Finserv" },
  { symbol: "LT", name: "Larsen & Toubro" },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement" },
  { symbol: "NTPC", name: "NTPC Limited" },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical Industries" },
  { symbol: "TITAN", name: "Titan Company" },
  { symbol: "POWERGRID", name: "Power Grid Corporation of India" }
];

export function getAllSymbols() {
  return [
    ...indianMarketIndices.map(index => ({ symbol: index.symbol, name: index.name, type: 'index' })),
    ...topIndianStocks.map(stock => ({ symbol: stock.symbol, name: stock.name, type: 'stock' }))
  ];
}