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

export class TDAmeritrade implements IBrokerAdapter {
  private apiKey: string;
  private accessToken: string;
  private refreshToken: string | undefined;
  private accountId: string;
  private baseUrl: string = 'https://api.tdameritrade.com/v1';

  constructor(connection: BrokerConnection) {
    this.apiKey = connection.apiKey || '';
    // TD Ameritrade uses access tokens rather than API secrets
    this.accessToken = connection.apiToken || '';
    // Store refresh token if available (from metadata)
    this.refreshToken = connection.metadata?.refreshToken;
    this.accountId = connection.accountId || '';
  }

  private async makeRequest(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.accessToken}`
    };
    
    const options: RequestInit = {
      method,
      headers
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    
    if (response.status === 401 && this.refreshToken) {
      // Access token expired, try to refresh it
      await this.refreshAccessToken();
      // Update the authorization header with the new access token
      (options.headers as Record<string, string>).Authorization = `Bearer ${this.accessToken}`;
      // Retry the request
      const retryResponse = await fetch(url, options);
      
      if (!retryResponse.ok) {
        throw new Error(`TD Ameritrade API error (${retryResponse.status}): ${await retryResponse.text()}`);
      }
      
      return retryResponse.json();
    }
    
    if (!response.ok) {
      throw new Error(`TD Ameritrade API error (${response.status}): ${await response.text()}`);
    }
    
    return response.json();
  }

  private async refreshAccessToken(): Promise<void> {
    // In a real app, implement token refresh using the refresh token
    // This would typically involve a server-side call to TD's token endpoint
    console.log("Would refresh access token here in production");
    // For demonstration, we would update the access token
    // this.accessToken = newAccessToken;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest(`/accounts/${this.accountId}`);
      return true;
    } catch (error) {
      console.error("TD Ameritrade connection test failed:", error);
      return false;
    }
  }

  async getAccountInfo(): Promise<AccountInfo> {
    const response = await this.makeRequest(`/accounts/${this.accountId}`);
    const account = response.securitiesAccount;
    
    return {
      accountId: account.accountId,
      name: account.accountId,
      balance: account.currentBalances.liquidationValue,
      currency: 'USD',
      availableBalance: account.currentBalances.availableFunds,
      marginUsed: account.currentBalances.marginBalance
    };
  }

  async getQuote(symbol: string): Promise<Quote> {
    const response = await this.makeRequest(`/marketdata/${symbol}/quotes`);
    const quote = response[symbol];
    
    return {
      symbol,
      timestamp: new Date(quote.quoteTimeInLong),
      bid: quote.bidPrice,
      ask: quote.askPrice,
      bidSize: quote.bidSize,
      askSize: quote.askSize
    };
  }

  async getHistoricalData(
    symbol: string, 
    timeframe: string, 
    start: Date, 
    end: Date
  ): Promise<MarketData[]> {
    // Convert our timeframe to TD Ameritrade's format
    let periodType = 'day';
    let period = 1;
    let frequencyType = 'minute';
    let frequency = 1;
    
    switch (timeframe.toLowerCase()) {
      case '1m':
        frequencyType = 'minute';
        frequency = 1;
        break;
      case '5m':
        frequencyType = 'minute';
        frequency = 5;
        break;
      case '15m':
        frequencyType = 'minute';
        frequency = 15;
        break;
      case '1h':
        frequencyType = 'minute';
        frequency = 60;
        break;
      case '1d':
        frequencyType = 'daily';
        frequency = 1;
        break;
      default:
        frequencyType = 'daily';
        frequency = 1;
    }
    
    const startMs = start.getTime();
    const endMs = end.getTime();
    
    const response = await this.makeRequest(
      `/marketdata/${symbol}/pricehistory?periodType=${periodType}&period=${period}` +
      `&frequencyType=${frequencyType}&frequency=${frequency}&startDate=${startMs}&endDate=${endMs}`
    );
    
    return response.candles.map((candle: any) => ({
      symbol,
      timestamp: new Date(candle.datetime),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume
    }));
  }

  async placeOrder(order: Order): Promise<Order> {
    const tdaOrder = {
      orderType: this.mapOrderType(order.type),
      session: 'NORMAL',
      duration: this.mapTimeInForce(order.timeInForce),
      orderStrategyType: 'SINGLE',
      price: order.price,
      stopPrice: order.stopPrice,
      orderLegCollection: [{
        instruction: order.side === 'buy' ? 'BUY' : 'SELL',
        quantity: order.quantity,
        instrument: {
          symbol: order.symbol,
          assetType: 'EQUITY'
        }
      }]
    };
    
    const response = await this.makeRequest(`/accounts/${this.accountId}/orders`, 'POST', tdaOrder);
    
    // TDA doesn't return the order in the response, need to get order details
    const orderDetails = await this.makeRequest(`/accounts/${this.accountId}/orders/${response.orderId}`);
    
    return {
      id: orderDetails.orderId,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      quantity: order.quantity,
      price: order.price,
      stopPrice: order.stopPrice,
      timeInForce: order.timeInForce,
      status: orderDetails.status
    };
  }

  private mapOrderType(type: string): string {
    switch (type) {
      case 'market':
        return 'MARKET';
      case 'limit':
        return 'LIMIT';
      case 'stop':
        return 'STOP';
      case 'stop_limit':
        return 'STOP_LIMIT';
      default:
        return 'MARKET';
    }
  }

  private mapTimeInForce(tif?: string): string {
    switch (tif) {
      case 'day':
        return 'DAY';
      case 'gtc':
        return 'GOOD_TILL_CANCEL';
      case 'ioc':
        return 'IMMEDIATE_OR_CANCEL';
      case 'fok':
        return 'FILL_OR_KILL';
      default:
        return 'DAY';
    }
  }

  private reverseMapOrderType(tdaType: string): 'market' | 'limit' | 'stop' | 'stop_limit' {
    switch (tdaType) {
      case 'MARKET':
        return 'market';
      case 'LIMIT':
        return 'limit';
      case 'STOP':
        return 'stop';
      case 'STOP_LIMIT':
        return 'stop_limit';
      default:
        return 'market';
    }
  }

  private reverseMapTimeInForce(tdaTif: string): 'day' | 'gtc' | 'ioc' | 'fok' {
    switch (tdaTif) {
      case 'DAY':
        return 'day';
      case 'GOOD_TILL_CANCEL':
        return 'gtc';
      case 'IMMEDIATE_OR_CANCEL':
        return 'ioc';
      case 'FILL_OR_KILL':
        return 'fok';
      default:
        return 'day';
    }
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/accounts/${this.accountId}/orders/${orderId}`, 'DELETE');
      return true;
    } catch (error) {
      console.error("Failed to cancel order:", error);
      return false;
    }
  }

  async getOrder(orderId: string): Promise<Order> {
    const orderDetails = await this.makeRequest(`/accounts/${this.accountId}/orders/${orderId}`);
    
    return {
      id: orderDetails.orderId,
      symbol: orderDetails.orderLegCollection[0].instrument.symbol,
      side: orderDetails.orderLegCollection[0].instruction === 'BUY' ? 'buy' : 'sell',
      type: this.reverseMapOrderType(orderDetails.orderType),
      quantity: orderDetails.orderLegCollection[0].quantity,
      price: orderDetails.price,
      stopPrice: orderDetails.stopPrice,
      timeInForce: this.reverseMapTimeInForce(orderDetails.duration),
      status: orderDetails.status.toLowerCase()
    };
  }

  async getOpenOrders(): Promise<Order[]> {
    const response = await this.makeRequest(`/accounts/${this.accountId}/orders?status=WORKING`);
    
    return response.map((o: any) => ({
      id: o.orderId,
      symbol: o.orderLegCollection[0].instrument.symbol,
      side: o.orderLegCollection[0].instruction === 'BUY' ? 'buy' : 'sell',
      type: this.reverseMapOrderType(o.orderType),
      quantity: o.orderLegCollection[0].quantity,
      price: o.price,
      stopPrice: o.stopPrice,
      timeInForce: this.reverseMapTimeInForce(o.duration),
      status: o.status.toLowerCase()
    }));
  }

  async getPositions(): Promise<Position[]> {
    const response = await this.makeRequest(`/accounts/${this.accountId}?fields=positions`);
    
    if (!response.securitiesAccount.positions) {
      return [];
    }
    
    return response.securitiesAccount.positions.map((p: any) => ({
      symbol: p.instrument.symbol,
      quantity: p.longQuantity - p.shortQuantity,
      averagePrice: p.averagePrice,
      currentPrice: p.marketValue / Math.abs(p.longQuantity - p.shortQuantity),
      marketValue: p.marketValue,
      unrealizedPnl: p.currentDayProfitLoss
    }));
  }

  async getTrades(start?: Date, end?: Date): Promise<Trade[]> {
    // TD Ameritrade calls these "transactions"
    const startDate = start ? start.toISOString().split('T')[0] : undefined;
    const endDate = end ? end.toISOString().split('T')[0] : undefined;
    
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('type', 'TRADE');
    
    const response = await this.makeRequest(`/accounts/${this.accountId}/transactions?${params.toString()}`);
    
    return response.map((t: any) => ({
      id: t.transactionId,
      symbol: t.transactionItem.instrument.symbol,
      side: t.transactionItem.instruction === 'BUY' ? 'buy' : 'sell',
      quantity: t.transactionItem.amount,
      price: t.transactionItem.price,
      timestamp: new Date(t.transactionDate),
      status: 'filled',
      commission: t.fees.commission
    }));
  }
}