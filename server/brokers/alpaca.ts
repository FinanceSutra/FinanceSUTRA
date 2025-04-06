import { BrokerConnection } from '@shared/schema';
import { 
  IBrokerAdapter, 
  AccountInfo, 
  Quote, 
  MarketData, 
  Order, 
  Position, 
  Trade 
} from './index';

export class AlpacaAdapter implements IBrokerAdapter {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private accountId: string;
  private isPaper: boolean;

  constructor(connection: BrokerConnection) {
    this.apiKey = connection.apiKey || '';
    this.apiSecret = connection.apiSecret || '';
    this.baseUrl = connection.baseUrl || 'https://api.alpaca.markets';
    this.accountId = connection.accountId || '';
    this.isPaper = connection.environment === 'paper';
    
    // If paper trading, use the paper trading URL
    if (this.isPaper) {
      this.baseUrl = 'https://paper-api.alpaca.markets';
    }
  }

  private async makeRequest(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'APCA-API-KEY-ID': this.apiKey,
      'APCA-API-SECRET-KEY': this.apiSecret,
      'Content-Type': 'application/json'
    };
    
    const options: RequestInit = {
      method,
      headers
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`Alpaca API error (${response.status}): ${await response.text()}`);
    }
    
    return response.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/v2/account');
      return true;
    } catch (error) {
      console.error("Alpaca connection test failed:", error);
      return false;
    }
  }

  async getAccountInfo(): Promise<AccountInfo> {
    const account = await this.makeRequest('/v2/account');
    
    return {
      accountId: account.id,
      name: account.account_number,
      balance: parseFloat(account.portfolio_value),
      currency: 'USD',
      availableBalance: parseFloat(account.buying_power),
      marginUsed: parseFloat(account.portfolio_value) - parseFloat(account.buying_power)
    };
  }

  async getQuote(symbol: string): Promise<Quote> {
    const quote = await this.makeRequest(`/v2/stocks/${symbol}/quotes/latest`);
    
    return {
      symbol,
      timestamp: new Date(quote.t),
      bid: quote.bp,
      ask: quote.ap,
      bidSize: quote.bs,
      askSize: quote.as
    };
  }

  async getHistoricalData(
    symbol: string, 
    timeframe: string, 
    start: Date, 
    end: Date
  ): Promise<MarketData[]> {
    // Map our timeframe format to Alpaca's
    let alpacaTimeframe: string;
    switch (timeframe.toLowerCase()) {
      case '1m':
        alpacaTimeframe = '1Min';
        break;
      case '5m':
        alpacaTimeframe = '5Min';
        break;
      case '15m':
        alpacaTimeframe = '15Min';
        break;
      case '1h':
        alpacaTimeframe = '1Hour';
        break;
      case '1d':
        alpacaTimeframe = '1Day';
        break;
      default:
        alpacaTimeframe = '1Day';
    }
    
    const startStr = start.toISOString();
    const endStr = end.toISOString();
    
    const bars = await this.makeRequest(
      `/v2/stocks/${symbol}/bars?timeframe=${alpacaTimeframe}&start=${startStr}&end=${endStr}`
    );
    
    return bars.bars.map((bar: any) => ({
      symbol,
      timestamp: new Date(bar.t),
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v
    }));
  }

  async placeOrder(order: Order): Promise<Order> {
    const alpacaOrder = {
      symbol: order.symbol,
      qty: order.quantity.toString(),
      side: order.side,
      type: order.type,
      time_in_force: order.timeInForce || 'day'
    };
    
    if (order.price && (order.type === 'limit' || order.type === 'stop_limit')) {
      (alpacaOrder as any).limit_price = order.price.toString();
    }
    
    if (order.stopPrice && (order.type === 'stop' || order.type === 'stop_limit')) {
      (alpacaOrder as any).stop_price = order.stopPrice.toString();
    }
    
    const response = await this.makeRequest('/v2/orders', 'POST', alpacaOrder);
    
    return {
      id: response.id,
      symbol: response.symbol,
      side: response.side as 'buy' | 'sell',
      type: response.type as 'market' | 'limit' | 'stop' | 'stop_limit',
      quantity: parseFloat(response.qty),
      price: response.limit_price ? parseFloat(response.limit_price) : undefined,
      stopPrice: response.stop_price ? parseFloat(response.stop_price) : undefined,
      timeInForce: response.time_in_force as 'day' | 'gtc' | 'ioc' | 'fok',
      status: response.status
    };
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/v2/orders/${orderId}`, 'DELETE');
      return true;
    } catch (error) {
      console.error("Failed to cancel order:", error);
      return false;
    }
  }

  async getOrder(orderId: string): Promise<Order> {
    const response = await this.makeRequest(`/v2/orders/${orderId}`);
    
    return {
      id: response.id,
      symbol: response.symbol,
      side: response.side as 'buy' | 'sell',
      type: response.type as 'market' | 'limit' | 'stop' | 'stop_limit',
      quantity: parseFloat(response.qty),
      price: response.limit_price ? parseFloat(response.limit_price) : undefined,
      stopPrice: response.stop_price ? parseFloat(response.stop_price) : undefined,
      timeInForce: response.time_in_force as 'day' | 'gtc' | 'ioc' | 'fok',
      status: response.status
    };
  }

  async getOpenOrders(): Promise<Order[]> {
    const orders = await this.makeRequest('/v2/orders?status=open');
    
    return orders.map((o: any) => ({
      id: o.id,
      symbol: o.symbol,
      side: o.side as 'buy' | 'sell',
      type: o.type as 'market' | 'limit' | 'stop' | 'stop_limit',
      quantity: parseFloat(o.qty),
      price: o.limit_price ? parseFloat(o.limit_price) : undefined,
      stopPrice: o.stop_price ? parseFloat(o.stop_price) : undefined,
      timeInForce: o.time_in_force as 'day' | 'gtc' | 'ioc' | 'fok',
      status: o.status
    }));
  }

  async getPositions(): Promise<Position[]> {
    const positions = await this.makeRequest('/v2/positions');
    
    return positions.map((p: any) => ({
      symbol: p.symbol,
      quantity: parseFloat(p.qty),
      averagePrice: parseFloat(p.avg_entry_price),
      currentPrice: parseFloat(p.current_price),
      marketValue: parseFloat(p.market_value),
      unrealizedPnl: parseFloat(p.unrealized_pl)
    }));
  }

  async getTrades(start?: Date, end?: Date): Promise<Trade[]> {
    // Alpaca calls completed orders "activities"
    const startParam = start ? `&after=${start.toISOString()}` : '';
    const endParam = end ? `&until=${end.toISOString()}` : '';
    
    const activities = await this.makeRequest(`/v2/account/activities?activity_type=FILL${startParam}${endParam}`);
    
    return activities.map((a: any) => ({
      id: a.id,
      symbol: a.symbol,
      side: a.side.toLowerCase() as 'buy' | 'sell',
      quantity: parseFloat(a.qty),
      price: parseFloat(a.price),
      timestamp: new Date(a.transaction_time),
      status: 'filled',
      commission: parseFloat(a.commission)
    }));
  }
}