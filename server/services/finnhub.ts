import axios from 'axios';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

export interface MarketDataItem {
  timestamp: number | string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockSymbol {
  description: string;
  displaySymbol: string;
  symbol: string;
}

// Convert timestamps to expected format and map data structure
function transformCandleData(data: any): MarketDataItem[] {
  if (!data || !data.c || data.s !== 'ok') {
    return [];
  }
  
  return data.t.map((timestamp: number, index: number) => ({
    timestamp: new Date(timestamp * 1000).toISOString(),
    open: data.o[index],
    high: data.h[index],
    low: data.l[index],
    close: data.c[index],
    volume: data.v[index],
  }));
}

// Check if symbol format is supported (e.g., NSE:RELIANCE)
function parseSymbol(symbol: string): string {
  // If it's already in correct format, return as is
  if (!symbol.includes(':')) {
    return symbol;
  }
  
  // For exchange-specific symbols like NSE:RELIANCE, extract the ticker
  const parts = symbol.split(':');
  return parts[1];
}

// Get stock candles (OHLC data)
export async function getStockCandles(
  symbol: string,
  resolution: string,
  from: number,
  to: number
): Promise<MarketDataItem[]> {
  try {
    const parsedSymbol = parseSymbol(symbol);
    
    const response = await axios.get(`${BASE_URL}/stock/candle`, {
      params: {
        symbol: parsedSymbol,
        resolution, // 1, 5, 15, 30, 60, D, W, M
        from,
        to,
        token: FINNHUB_API_KEY,
      },
    });
    
    return transformCandleData(response.data);
  } catch (error) {
    console.error('Error fetching stock candles:', error);
    return [];
  }
}

// Get company symbol lookup
export async function searchSymbols(query: string): Promise<StockSymbol[]> {
  try {
    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        q: query,
        token: FINNHUB_API_KEY,
      },
    });
    
    return response.data.result || [];
  } catch (error) {
    console.error('Error searching symbols:', error);
    return [];
  }
}

// Map frontend timeframe to finnhub resolution
export function mapTimeframeToResolution(timeframe: string): string {
  const map: Record<string, string> = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '30m': '30',
    '1h': '60',
    '4h': '240',
    '1d': 'D',
    '1wk': 'W',
    '1mo': 'M',
  };
  
  return map[timeframe] || 'D'; // Default to daily
}