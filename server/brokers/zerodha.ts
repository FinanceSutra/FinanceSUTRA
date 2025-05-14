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

export class ZerodhaAdapter implements IBrokerAdapter {
  private apiKey: string;
  private apiSecret: string;
  private accessToken: string | null;
  private userId: string | null;
  private isPaper: boolean;

  constructor(connection: BrokerConnection) {
    this.apiKey = connection.apiKey || '';
    this.apiSecret = connection.apiSecret || '';
    this.accessToken = connection.apiToken || null;
    this.userId = connection.accountId || null;
    this.isPaper = connection.environment === 'paper';
  }

  private async makeRequest(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
    body?: any
  ): Promise<any> {
    const baseUrl = 'https://api.kite.trade';
    const url = `${baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'X-Kite-Version': '3',
      'Content-Type': 'application/json',
    };

    // Add authentication headers
    if (this.accessToken) {
      headers['Authorization'] = `Token ${this.apiKey}:${this.accessToken}`;
    }
    
    const options: RequestInit = {
      method,
      headers
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`Zerodha API error (${response.status}): ${await response.text()}`);
    }
    
    const data = await response.json();
    
    // Zerodha API returns a standard format with status and data fields
    if (data.status === 'success') {
      return data.data;
    } else {
      throw new Error(`Zerodha API error: ${data.message || 'Unknown error'}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Try to fetch user profile as a connection test
      if (!this.accessToken) {
        return false;
      }
      
      await this.makeRequest('/user/profile');
      return true;
    } catch (error) {
      console.error("Zerodha connection test failed:", error);
      return false;
    }
  }

  async getAccountInfo(): Promise<AccountInfo> {
    try {
      const profile = await this.makeRequest('/user/profile');
      const margins = await this.makeRequest('/user/margins');
      
      return {
        accountId: this.userId || profile.user_id,
        name: profile.user_name,
        balance: parseFloat(margins.equity.net), // Net balance
        currency: 'INR',
        availableBalance: parseFloat(margins.equity.available.cash),
        marginUsed: parseFloat(margins.equity.utilised.debits || 0),
      };
    } catch (error) {
      console.error("Error fetching account info:", error);
      throw new Error(`Failed to get account information: ${error.message}`);
    }
  }

  async getQuote(symbol: string): Promise<Quote> {
    try {
      // Convert symbol to Zerodha format (NSE:RELIANCE)
      const formattedSymbol = this.formatSymbol(symbol);
      const data = await this.makeRequest(`/quote?i=${encodeURIComponent(formattedSymbol)}`);
      const quote = data[formattedSymbol];
      
      return {
        symbol,
        timestamp: new Date(quote.timestamp),
        bid: quote.depth.buy[0]?.price || 0,
        ask: quote.depth.sell[0]?.price || 0,
        bidSize: quote.depth.buy[0]?.quantity || 0,
        askSize: quote.depth.sell[0]?.quantity || 0
      };
    } catch (error) {
      console.error("Error fetching quote:", error);
      throw new Error(`Failed to get quote for ${symbol}: ${error.message}`);
    }
  }

  // Helper function to format symbols
  private formatSymbol(symbol: string): string {
    // If symbol already has exchange prefix, return as is
    if (symbol.includes(':')) {
      return symbol;
    }
    
    // Default to NSE exchange
    return `NSE:${symbol}`;
  }

  async getHistoricalData(
    symbol: string, 
    timeframe: string, 
    start: Date, 
    end: Date
  ): Promise<MarketData[]> {
    try {
      // Convert symbol to Zerodha format
      const formattedSymbol = this.formatSymbol(symbol);
      
      // Map our timeframe format to Zerodha's format
      let interval: string;
      switch (timeframe.toLowerCase()) {
        case '1m':
          interval = 'minute';
          break;
        case '3m':
          interval = '3minute';
          break;
        case '5m':
          interval = '5minute';
          break;
        case '15m':
          interval = '15minute';
          break;
        case '30m':
          interval = '30minute';
          break;
        case '60m':
        case '1h':
          interval = '60minute';
          break;
        case '1d':
          interval = 'day';
          break;
        default:
          interval = 'day';
      }
      
      // Format dates for Zerodha API
      const startDate = this.formatDate(start);
      const endDate = this.formatDate(end);
      
      // Make API request to get historical data
      const data = await this.makeRequest(
        `/instruments/historical/${encodeURIComponent(formattedSymbol)}/${interval}?from=${startDate}&to=${endDate}`
      );
      
      return data.candles.map((candle: any) => ({
        symbol,
        timestamp: new Date(candle[0]),
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5]
      }));
    } catch (error) {
      console.error("Error fetching historical data:", error);
      throw new Error(`Failed to get historical data for ${symbol}: ${error.message}`);
    }
  }
  
  // Helper function to format dates for Zerodha API
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async placeOrder(order: Order): Promise<Order> {
    try {
      // Map our order types to Zerodha's
      const orderType = this.mapOrderType(order.type);
      const formattedSymbol = this.formatSymbol(order.symbol);
      
      const params = {
        exchange: formattedSymbol.split(':')[0],
        tradingsymbol: formattedSymbol.split(':')[1],
        transaction_type: order.side.toUpperCase(),
        quantity: Math.floor(order.quantity), // Zerodha requires integer quantities
        product: 'CNC', // Cash and carry (delivery)
        order_type: orderType,
        validity: this.mapTimeInForce(order.timeInForce || 'day'),
        disclosed_quantity: 0,
        trigger_price: order.stopPrice || 0,
        price: order.price || 0,
      };
      
      // If it's a market order, set price to 0
      if (order.type === 'market') {
        params.price = 0;
      }
      
      const response = await this.makeRequest('/orders/regular', 'POST', params);
      
      return {
        id: response.order_id,
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        quantity: order.quantity,
        price: order.price,
        stopPrice: order.stopPrice,
        timeInForce: order.timeInForce,
        status: 'pending' // Initial status
      };
    } catch (error) {
      console.error("Error placing order:", error);
      throw new Error(`Failed to place order: ${error.message}`);
    }
  }
  
  // Helper function to map order types
  private mapOrderType(type: string): string {
    switch (type) {
      case 'market':
        return 'MARKET';
      case 'limit':
        return 'LIMIT';
      case 'stop':
        return 'SL';
      case 'stop_limit':
        return 'SL-L';
      default:
        return 'MARKET';
    }
  }
  
  // Helper function to map time in force
  private mapTimeInForce(timeInForce: string): string {
    switch (timeInForce) {
      case 'day':
        return 'DAY';
      case 'ioc':
        return 'IOC';
      default:
        return 'DAY';
    }
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/orders/regular/${orderId}`, 'DELETE');
      return true;
    } catch (error) {
      console.error("Failed to cancel order:", error);
      return false;
    }
  }

  async getOrder(orderId: string): Promise<Order> {
    try {
      const orders = await this.makeRequest('/orders');
      const order = orders.find((o: any) => o.order_id === orderId);
      
      if (!order) {
        throw new Error(`Order with ID ${orderId} not found`);
      }
      
      return this.mapZerodhaOrder(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      throw new Error(`Failed to get order details: ${error.message}`);
    }
  }
  
  // Helper function to map Zerodha order to our format
  private mapZerodhaOrder(order: any): Order {
    const symbol = `${order.exchange}:${order.tradingsymbol}`;
    
    return {
      id: order.order_id,
      symbol,
      side: order.transaction_type.toLowerCase() === 'buy' ? 'buy' : 'sell',
      type: this.mapZerodhaOrderType(order.order_type),
      quantity: parseFloat(order.quantity),
      price: parseFloat(order.price || 0),
      stopPrice: parseFloat(order.trigger_price || 0),
      timeInForce: order.validity.toLowerCase() as 'day' | 'gtc' | 'ioc' | 'fok',
      status: this.mapZerodhaOrderStatus(order.status)
    };
  }
  
  // Helper function to map Zerodha order type to our format
  private mapZerodhaOrderType(type: string): 'market' | 'limit' | 'stop' | 'stop_limit' {
    switch (type.toUpperCase()) {
      case 'MARKET':
        return 'market';
      case 'LIMIT':
        return 'limit';
      case 'SL':
        return 'stop';
      case 'SL-L':
        return 'stop_limit';
      default:
        return 'market';
    }
  }
  
  // Helper function to map Zerodha order status to our format
  private mapZerodhaOrderStatus(status: string): string {
    switch (status.toUpperCase()) {
      case 'COMPLETE':
        return 'filled';
      case 'REJECTED':
        return 'rejected';
      case 'CANCELLED':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  async getOpenOrders(): Promise<Order[]> {
    try {
      const orders = await this.makeRequest('/orders');
      // Filter for open orders only
      const openOrders = orders.filter((o: any) => 
        ['OPEN', 'PENDING', 'TRIGGER PENDING'].includes(o.status)
      );
      
      return openOrders.map((o: any) => this.mapZerodhaOrder(o));
    } catch (error) {
      console.error("Error fetching open orders:", error);
      throw new Error(`Failed to get open orders: ${error.message}`);
    }
  }

  async getPositions(): Promise<Position[]> {
    try {
      const positions = await this.makeRequest('/portfolio/positions');
      
      return positions.day.map((p: any) => ({
        symbol: `${p.exchange}:${p.tradingsymbol}`,
        quantity: parseFloat(p.quantity),
        averagePrice: parseFloat(p.average_price),
        currentPrice: parseFloat(p.last_price),
        marketValue: parseFloat(p.pnl),
        unrealizedPnl: parseFloat(p.unrealised)
      }));
    } catch (error) {
      console.error("Error fetching positions:", error);
      throw new Error(`Failed to get positions: ${error.message}`);
    }
  }

  async getTrades(start?: Date, end?: Date): Promise<Trade[]> {
    try {
      const orders = await this.makeRequest('/orders');
      // Filter for completed orders only
      const completedOrders = orders.filter((o: any) => o.status === 'COMPLETE');
      
      return completedOrders.map((o: any) => ({
        id: o.order_id,
        symbol: `${o.exchange}:${o.tradingsymbol}`,
        side: o.transaction_type.toLowerCase() === 'buy' ? 'buy' : 'sell',
        quantity: parseFloat(o.filled_quantity),
        price: parseFloat(o.average_price),
        timestamp: new Date(o.order_timestamp),
        status: 'filled',
        commission: 0 // Zerodha doesn't provide commission details in order response
      }));
    } catch (error) {
      console.error("Error fetching trades:", error);
      throw new Error(`Failed to get trades: ${error.message}`);
    }
  }
}