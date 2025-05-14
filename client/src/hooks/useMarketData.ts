import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface MarketDataItem {
  timestamp: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function useMarketData(
  symbol: string,
  timeframe: string,
  startDate?: string,
  endDate?: string,
  enabled: boolean = true
) {
  // Ensure we have valid dates or use defaults
  const start = startDate || getDefaultStartDate(timeframe);
  const end = endDate || new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: [`/api/market-data/${symbol}/${timeframe}`, { start, end }],
    queryFn: async () => {
      const queryString = `?start=${start}&end=${end}`;
      const response = await apiRequest(
        "GET", 
        `/api/market-data/${symbol}/${timeframe}${queryString}`
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch market data');
      }
      
      return response.json();
    },
    enabled: Boolean(symbol && timeframe && enabled),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSymbolSearch(query: string) {
  return useQuery({
    queryKey: ['/api/market-data/symbols', { query }],
    queryFn: async () => {
      const queryString = query ? `?query=${encodeURIComponent(query)}` : '';
      const response = await apiRequest(
        "GET", 
        `/api/market-data/symbols${queryString}`
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to search symbols');
      }
      
      return response.json();
    },
    enabled: Boolean(query && query.length > 1),
    refetchOnWindowFocus: false,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useLatestPrice(symbol: string, enabled: boolean = true) {
  return useQuery({
    queryKey: [`/api/market-data/${symbol}/price/latest`],
    queryFn: async () => {
      const response = await apiRequest(
        "GET", 
        `/api/market-data/${symbol}/price/latest`
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch latest price');
      }
      
      return response.json();
    },
    enabled: Boolean(symbol && enabled),
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // 30 seconds for real-time data
  });
}

// Helper function to get default start date based on timeframe
function getDefaultStartDate(timeframe: string): string {
  const date = new Date();
  
  switch(timeframe) {
    case '1m':
    case '5m':
      date.setHours(date.getHours() - 6); // Last 6 hours
      break;
    case '15m':
    case '30m':
      date.setHours(date.getHours() - 24); // Last 24 hours
      break;
    case '1h':
    case '4h':
      date.setDate(date.getDate() - 7); // Last week
      break;
    case '1d':
      date.setDate(date.getDate() - 90); // Last 90 days
      break;
    case '1wk':
      date.setDate(date.getDate() - 365); // Last year
      break;
    case '1mo':
      date.setDate(date.getDate() - 730); // Last 2 years
      break;
    default:
      date.setDate(date.getDate() - 30); // Default to last 30 days
  }
  
  return date.toISOString().split('T')[0];
}