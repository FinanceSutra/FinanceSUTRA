import { BrokerConnection } from '@shared/schema';

// Basic trade and order types
export interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: Date;
  status: string;
  commission?: number;
}

export interface Order {
  id?: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: 'day' | 'gtc' | 'ioc' | 'fok';
  status?: string;
}

export interface MarketData {
  symbol: string;
  exchange?: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface Quote {
  symbol: string;
  exchange?: string;
  timestamp: Date;
  bid: number;
  ask: number;
  bidSize?: number;
  askSize?: number;
}

export interface AccountInfo {
  accountId: string;
  name?: string;
  balance: number;
  currency: string;
  availableBalance?: number;
  marginUsed?: number;
  positions?: Position[];
}

export interface Position {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice?: number;
  marketValue?: number;
  unrealizedPnl?: number;
}

// Common interface for all broker adapters
export interface IBrokerAdapter {
  // Connection
  testConnection(): Promise<boolean>;
  getAccountInfo(): Promise<AccountInfo>;
  
  // Market data
  getQuote(symbol: string): Promise<Quote>;
  getHistoricalData(symbol: string, timeframe: string, start: Date, end: Date): Promise<MarketData[]>;
  
  // Order management
  placeOrder(order: Order): Promise<Order>;
  cancelOrder(orderId: string): Promise<boolean>;
  getOrder(orderId: string): Promise<Order>;
  getOpenOrders(): Promise<Order[]>;
  
  // Positions and trades
  getPositions(): Promise<Position[]>;
  getTrades(start?: Date, end?: Date): Promise<Trade[]>;
}

// Factory function to create the appropriate broker adapter
export function createBrokerAdapter(connection: BrokerConnection): IBrokerAdapter {
  const brokerId = connection.broker.toLowerCase().replace(/\s/g, '_');

  switch (brokerId) {
    case 'interactive_brokers':
      return new InteractiveBrokersAdapter(connection);
    case 'td_ameritrade':
      return new TDAmeritrade(connection);
    case 'alpaca':
      return new AlpacaAdapter(connection);
    case 'oanda':
      return new OandaAdapter(connection);
    case 'zerodha':
      return new ZerodhaAdapter(connection);
    case 'upstox':
      return new UpstoxAdapter(connection);
    case 'paper_trading': // Virtual paper trading
      return new AlpacaAdapter({ ...connection, environment: 'paper' });
    default:
      throw new Error(`Broker ${connection.broker} is not supported`);
  }
}

// Import broker adapter implementations
import { InteractiveBrokersAdapter } from './interactive-brokers';
import { TDAmeritrade } from './td-ameritrade';
import { AlpacaAdapter } from './alpaca';
import { OandaAdapter } from './oanda';
import { ZerodhaAdapter } from './zerodha';
import { UpstoxAdapter } from './upstox';

export {
  InteractiveBrokersAdapter,
  TDAmeritrade,
  AlpacaAdapter,
  OandaAdapter,
  ZerodhaAdapter,
  UpstoxAdapter
};