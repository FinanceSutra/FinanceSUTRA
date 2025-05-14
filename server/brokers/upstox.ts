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

export class UpstoxAdapter implements IBrokerAdapter {
  private apiKey: string;
  private apiSecret: string;
  private accessToken: string | null;
  private clientId: string | null;
  private isPaper: boolean;

  constructor(connection: BrokerConnection) {
    this.apiKey = connection.apiKey || '';
    this.apiSecret = connection.apiSecret || '';
    this.accessToken = connection.apiToken || null;
    this.clientId = connection.accountId || null;
    this.isPaper = connection.environment === 'paper';
  }

  private async makeRequest(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
    body?: any
  ): Promise<any> {
    const baseUrl = 'https://api.upstox.com/v2';
    const url = `${baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    // Add authentication header if we have an access token
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
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
      throw new Error(`Upstox API error (${response.status}): ${await response.text()}`);
    }
    
    const data = await response.json();
    
    // Upstox API returns a standard format with status and data fields
    if (data.status === 'success') {
      return data.data;
    } else {
      throw new Error(`Upstox API error: ${data.message || 'Unknown error'}`);
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
      console.error("Upstox connection test failed:", error);
      return false;
    }
  }

  async getAccountInfo(): Promise<AccountInfo> {
    try {
      const profile = await this.makeRequest('/user/profile');
      const funds = await this.makeRequest('/user/funds-and-margin');
      
      // Find the equity segment in the funds data
      const equityFunds = funds.equity || {};
      
      return {
        accountId: profile.client_id || this.clientId || '',
        name: profile.name || 'Upstox Account',
        balance: parseFloat(equityFunds.used_margin || 0) + parseFloat(equityFunds.available_margin || 0),
        currency: 'INR',
        availableBalance: parseFloat(equityFunds.available_margin || 0),
        marginUsed: parseFloat(equityFunds.used_margin || 0)
      };
    } catch (error) {
      console.error("Error fetching account info:", error);
      throw new Error(`Failed to get account information: ${error.message}`);
    }
  }

  async getQuote(symbol: string): Promise<Quote> {
    try {
      // Convert symbol to Upstox format 
      const formattedSymbol = this.formatSymbol(symbol);
      const data = await this.makeRequest(`/market-quote/ltp?instrument_key=${encodeURIComponent(formattedSymbol)}`);
      const quote = data[formattedSymbol];
      
      // For more detailed quotes we need the full market quotes endpoint
      const detailedQuote = await this.makeRequest(`/market-quote/full?instrument_key=${encodeURIComponent(formattedSymbol)}`);
      const depth = detailedQuote[formattedSymbol]?.depth || {};
      
      return {
        symbol,
        timestamp: new Date(),
        bid: depth.buy?.[0]?.price || quote.last_price,
        ask: depth.sell?.[0]?.price || quote.last_price,
        bidSize: depth.buy?.[0]?.quantity || 0,
        askSize: depth.sell?.[0]?.quantity || 0
      };
    } catch (error) {
      console.error("Error fetching quote:", error);
      throw new Error(`Failed to get quote for ${symbol}: ${error.message}`);
    }
  }

  // Helper function to format symbols for Upstox API
  private formatSymbol(symbol: string): string {
    // If symbol already has exchange prefix, process it
    if (symbol.includes(':')) {
      const [exchange, ticker] = symbol.split(':');
      if (exchange === 'NSE') {
        return `NSE_EQ:${ticker}`;
      } else if (exchange === 'BSE') {
        return `BSE_EQ:${ticker}`;
      }
      return symbol;
    }
    
    // Default to NSE equities
    return `NSE_EQ:${symbol}`;
  }

  async getHistoricalData(
    symbol: string, 
    timeframe: string, 
    start: Date, 
    end: Date
  ): Promise<MarketData[]> {
    try {
      // Convert symbol to Upstox format
      const formattedSymbol = this.formatSymbol(symbol);
      
      // Map our timeframe format to Upstox interval format
      let interval: string;
      switch (timeframe.toLowerCase()) {
        case '1m':
          interval = '1minute';
          break;
        case '5m':
          interval = '5minute';
          break;
        case '10m':
          interval = '10minute';
          break;
        case '30m':
          interval = '30minute';
          break;
        case '60m':
        case '1h':
          interval = '1hour';
          break;
        case '1d':
          interval = '1day';
          break;
        default:
          interval = '1day';
      }
      
      // Format dates as required by Upstox API (Unix timestamps)
      const startTimestamp = Math.floor(start.getTime() / 1000);
      const endTimestamp = Math.floor(end.getTime() / 1000);
      
      // Make API request to get historical data
      const data = await this.makeRequest(
        `/historical-candle/${formattedSymbol}/${interval}?start_date=${startTimestamp}&end_date=${endTimestamp}`
      );
      
      return data.candles.map((candle: any) => ({
        symbol,
        timestamp: new Date(candle[0]),
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
      }));
    } catch (error) {
      console.error("Error fetching historical data:", error);
      throw new Error(`Failed to get historical data for ${symbol}: ${error.message}`);
    }
  }

  async placeOrder(order: Order): Promise<Order> {
    try {
      const formattedSymbol = this.formatSymbol(order.symbol);
      
      // Map our types to Upstox types
      const params = {
        instrument_key: formattedSymbol,
        quantity: Math.floor(order.quantity), // Upstox requires integer quantities
        product: 'D', // Delivery (CNC)
        validity: this.mapTimeInForce(order.timeInForce || 'day'),
        price: order.price || 0,
        trigger_price: order.stopPrice || 0,
        disclosed_quantity: 0,
        order_type: this.mapOrderType(order.type),
        transaction_type: order.side.toUpperCase()
      };
      
      const response = await this.makeRequest('/order', 'POST', params);
      
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
      await this.makeRequest(`/order/${orderId}`, 'DELETE');
      return true;
    } catch (error) {
      console.error("Failed to cancel order:", error);
      return false;
    }
  }

  async getOrder(orderId: string): Promise<Order> {
    try {
      const order = await this.makeRequest(`/order/${orderId}`);
      
      if (!order) {
        throw new Error(`Order with ID ${orderId} not found`);
      }
      
      return this.mapUpstoxOrder(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      throw new Error(`Failed to get order details: ${error.message}`);
    }
  }
  
  // Helper function to map Upstox order to our format
  private mapUpstoxOrder(order: any): Order {
    return {
      id: order.order_id,
      symbol: this.reverseFormatSymbol(order.instrument_key),
      side: order.transaction_type.toLowerCase() === 'buy' ? 'buy' : 'sell',
      type: this.mapUpstoxOrderType(order.order_type),
      quantity: parseFloat(order.quantity),
      price: parseFloat(order.price || 0),
      stopPrice: parseFloat(order.trigger_price || 0),
      timeInForce: order.validity.toLowerCase() as 'day' | 'gtc' | 'ioc' | 'fok',
      status: this.mapUpstoxOrderStatus(order.status)
    };
  }
  
  // Helper function to convert Upstox symbol format back to our format
  private reverseFormatSymbol(instrumentKey: string): string {
    if (instrumentKey.includes('NSE_EQ:')) {
      return instrumentKey.replace('NSE_EQ:', 'NSE:');
    } else if (instrumentKey.includes('BSE_EQ:')) {
      return instrumentKey.replace('BSE_EQ:', 'BSE:');
    }
    return instrumentKey;
  }
  
  // Helper function to map Upstox order type to our format
  private mapUpstoxOrderType(type: string): 'market' | 'limit' | 'stop' | 'stop_limit' {
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
  
  // Helper function to map Upstox order status to our format
  private mapUpstoxOrderStatus(status: string): string {
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
        ['open', 'pending', 'trigger_pending'].includes(o.status.toLowerCase())
      );
      
      return openOrders.map((o: any) => this.mapUpstoxOrder(o));
    } catch (error) {
      console.error("Error fetching open orders:", error);
      throw new Error(`Failed to get open orders: ${error.message}`);
    }
  }

  async getPositions(): Promise<Position[]> {
    try {
      const positions = await this.makeRequest('/positions');
      
      return positions.map((p: any) => ({
        symbol: this.reverseFormatSymbol(p.instrument_key),
        quantity: parseFloat(p.quantity),
        averagePrice: parseFloat(p.average_price),
        currentPrice: parseFloat(p.last_price),
        marketValue: parseFloat(p.pnl),
        unrealizedPnl: parseFloat(p.unrealized_pnl)
      }));
    } catch (error) {
      console.error("Error fetching positions:", error);
      throw new Error(`Failed to get positions: ${error.message}`);
    }
  }

  async getTrades(start?: Date, end?: Date): Promise<Trade[]> {
    try {
      const trades = await this.makeRequest('/trades');
      
      return trades.map((t: any) => ({
        id: t.order_id, // Using order_id as the trade ID
        symbol: this.reverseFormatSymbol(t.instrument_key),
        side: t.transaction_type.toLowerCase() === 'buy' ? 'buy' : 'sell',
        quantity: parseFloat(t.quantity),
        price: parseFloat(t.price),
        timestamp: new Date(t.order_execution_time),
        status: 'filled',
        commission: parseFloat(t.brokerage || 0)
      }));
    } catch (error) {
      console.error("Error fetching trades:", error);
      throw new Error(`Failed to get trades: ${error.message}`);
    }
  }
}