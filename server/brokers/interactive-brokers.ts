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

export class InteractiveBrokersAdapter implements IBrokerAdapter {
  private apiKey: string;
  private apiSecret: string;
  private apiToken: string;
  private accountId: string;
  private baseUrl: string;
  private isPaper: boolean;

  constructor(connection: BrokerConnection) {
    this.apiKey = connection.apiKey || '';
    this.apiSecret = connection.apiSecret || '';
    this.apiToken = connection.apiToken || '';
    this.accountId = connection.accountId || '';
    this.baseUrl = connection.baseUrl || 'https://api.interactivebrokers.com/v1/portal';
    this.isPaper = connection.environment === 'paper';
    
    // Use paper trading if specified
    if (this.isPaper) {
      this.baseUrl = 'https://paper-api.interactivebrokers.com/v1/portal';
    }
  }

  private async makeRequest(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiToken}`
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
      throw new Error(`Interactive Brokers API error (${response.status}): ${await response.text()}`);
    }
    
    return response.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      // Try to get account info as a connection test
      await this.makeRequest(`/portfolio/${this.accountId}/summary`);
      return true;
    } catch (error) {
      console.error("Interactive Brokers connection test failed:", error);
      return false;
    }
  }

  async getAccountInfo(): Promise<AccountInfo> {
    const summary = await this.makeRequest(`/portfolio/${this.accountId}/summary`);
    
    return {
      accountId: this.accountId,
      name: summary.accountTitle,
      balance: summary.NetLiquidation.amount,
      currency: summary.NetLiquidation.currency,
      availableBalance: summary.AvailableFunds.amount,
      marginUsed: summary.GrossPositionValue.amount
    };
  }

  async getQuote(symbol: string): Promise<Quote> {
    const marketData = await this.makeRequest(`/iserver/marketdata/${symbol}`);
    
    return {
      symbol,
      timestamp: new Date(),
      bid: parseFloat(marketData[0].bid),
      ask: parseFloat(marketData[0].ask),
      bidSize: parseFloat(marketData[0].bidSize),
      askSize: parseFloat(marketData[0].askSize)
    };
  }

  async getHistoricalData(
    symbol: string, 
    timeframe: string, 
    start: Date, 
    end: Date
  ): Promise<MarketData[]> {
    // Map our timeframe format to IB's
    let period: string;
    switch (timeframe.toLowerCase()) {
      case '1m':
        period = '1min';
        break;
      case '5m':
        period = '5min';
        break;
      case '15m':
        period = '15min';
        break;
      case '1h':
        period = '1h';
        break;
      case '1d':
        period = '1d';
        break;
      default:
        period = '1d';
    }
    
    const params = {
      conid: symbol, // IB uses contract IDs (conid)
      period,
      bar: 'TRADES',
      outsideRth: false
    };
    
    const queryParams = new URLSearchParams(params as any).toString();
    const data = await this.makeRequest(`/iserver/marketdata/history?${queryParams}`);
    
    return data.data.map((bar: any) => ({
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
    const ibOrder = {
      acctId: this.accountId,
      conid: order.symbol,  // IB uses contract IDs
      orderType: this.mapOrderType(order.type),
      side: order.side.toUpperCase(),
      quantity: order.quantity,
      price: order.price,
      auxPrice: order.stopPrice,
      tif: this.mapTimeInForce(order.timeInForce)
    };
    
    const response = await this.makeRequest('/iserver/account/orders', 'POST', ibOrder);
    
    return {
      id: response.id,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      quantity: order.quantity,
      price: order.price,
      stopPrice: order.stopPrice,
      timeInForce: order.timeInForce,
      status: 'submitted'
    };
  }

  private mapOrderType(type: string): string {
    switch (type) {
      case 'market':
        return 'MKT';
      case 'limit':
        return 'LMT';
      case 'stop':
        return 'STP';
      case 'stop_limit':
        return 'STOP_LIMIT';
      default:
        return 'MKT';
    }
  }

  private mapTimeInForce(tif?: string): string {
    switch (tif) {
      case 'day':
        return 'DAY';
      case 'gtc':
        return 'GTC';
      case 'ioc':
        return 'IOC';
      case 'fok':
        return 'FOK';
      default:
        return 'DAY';
    }
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/iserver/account/${this.accountId}/order/${orderId}`, 'DELETE');
      return true;
    } catch (error) {
      console.error("Failed to cancel order:", error);
      return false;
    }
  }

  async getOrder(orderId: string): Promise<Order> {
    const orders = await this.makeRequest(`/iserver/account/orders`);
    const order = orders.find((o: any) => o.orderId === orderId);
    
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    return {
      id: order.orderId,
      symbol: order.conid,
      side: order.side.toLowerCase() as 'buy' | 'sell',
      type: this.reverseMapOrderType(order.orderType),
      quantity: order.quantity,
      price: order.price,
      stopPrice: order.auxPrice,
      timeInForce: this.reverseMapTimeInForce(order.tif),
      status: order.status.toLowerCase()
    };
  }

  private reverseMapOrderType(ibType: string): 'market' | 'limit' | 'stop' | 'stop_limit' {
    switch (ibType) {
      case 'MKT':
        return 'market';
      case 'LMT':
        return 'limit';
      case 'STP':
        return 'stop';
      case 'STOP_LIMIT':
        return 'stop_limit';
      default:
        return 'market';
    }
  }

  private reverseMapTimeInForce(ibTif: string): 'day' | 'gtc' | 'ioc' | 'fok' {
    switch (ibTif) {
      case 'DAY':
        return 'day';
      case 'GTC':
        return 'gtc';
      case 'IOC':
        return 'ioc';
      case 'FOK':
        return 'fok';
      default:
        return 'day';
    }
  }

  async getOpenOrders(): Promise<Order[]> {
    const orders = await this.makeRequest(`/iserver/account/orders`);
    
    return orders
      .filter((o: any) => ['PendingSubmit', 'PreSubmitted', 'Submitted'].includes(o.status))
      .map((o: any) => ({
        id: o.orderId,
        symbol: o.conid,
        side: o.side.toLowerCase() as 'buy' | 'sell',
        type: this.reverseMapOrderType(o.orderType),
        quantity: o.quantity,
        price: o.price,
        stopPrice: o.auxPrice,
        timeInForce: this.reverseMapTimeInForce(o.tif),
        status: o.status.toLowerCase()
      }));
  }

  async getPositions(): Promise<Position[]> {
    const positions = await this.makeRequest(`/portfolio/${this.accountId}/positions`);
    
    return positions.map((p: any) => ({
      symbol: p.contractDesc,
      quantity: p.position,
      averagePrice: p.avgPrice,
      currentPrice: p.mktPrice,
      marketValue: p.mktValue,
      unrealizedPnl: p.unrealizedPnl
    }));
  }

  async getTrades(start?: Date, end?: Date): Promise<Trade[]> {
    // IB provides trades through the flexreport API
    // For simplicity, we'll return the open orders that are filled
    const executions = await this.makeRequest(`/iserver/account/trades`);
    
    return executions.map((e: any) => ({
      id: e.execution.execId,
      symbol: e.contract.conid,
      side: e.execution.side.toLowerCase() as 'buy' | 'sell',
      quantity: e.execution.shares,
      price: e.execution.price,
      timestamp: new Date(e.execution.time),
      status: 'filled',
      commission: e.execution.commission
    }));
  }
}