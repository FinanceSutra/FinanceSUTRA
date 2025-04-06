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

export class OandaAdapter implements IBrokerAdapter {
  private apiKey: string;
  private accountId: string;
  private baseUrl: string;
  private isPractice: boolean;

  constructor(connection: BrokerConnection) {
    this.apiKey = connection.apiToken || '';
    this.accountId = connection.accountId || '';
    this.isPractice = connection.environment === 'practice' || connection.environment === 'paper';
    
    // Oanda has different URLs for practice and live accounts
    this.baseUrl = this.isPractice ? 
      'https://api-fxpractice.oanda.com/v3' : 
      'https://api-fxtrade.oanda.com/v3';
  }

  private async makeRequest(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept-Datetime-Format': 'RFC3339'
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
      throw new Error(`Oanda API error (${response.status}): ${await response.text()}`);
    }
    
    return response.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest(`/accounts/${this.accountId}`);
      return true;
    } catch (error) {
      console.error("Oanda connection test failed:", error);
      return false;
    }
  }

  async getAccountInfo(): Promise<AccountInfo> {
    const response = await this.makeRequest(`/accounts/${this.accountId}`);
    const account = response.account;
    
    return {
      accountId: account.id,
      name: account.alias || account.id,
      balance: parseFloat(account.balance),
      currency: account.currency,
      availableBalance: parseFloat(account.marginAvailable),
      marginUsed: parseFloat(account.marginUsed)
    };
  }

  async getQuote(symbol: string): Promise<Quote> {
    // Format symbol for Oanda (they use e.g., EUR_USD)
    const formattedSymbol = this.formatSymbolForOanda(symbol);
    
    const response = await this.makeRequest(`/accounts/${this.accountId}/pricing?instruments=${formattedSymbol}`);
    const pricing = response.prices[0];
    
    return {
      symbol,
      timestamp: new Date(pricing.time),
      bid: parseFloat(pricing.bids[0].price),
      ask: parseFloat(pricing.asks[0].price),
      bidSize: parseFloat(pricing.bids[0].liquidity),
      askSize: parseFloat(pricing.asks[0].liquidity)
    };
  }

  private formatSymbolForOanda(symbol: string): string {
    // Oanda uses underscores between currency pairs, e.g., EUR_USD
    // If symbol already has underscore, just return it
    if (symbol.includes('_')) {
      return symbol;
    }
    
    // If it's a 6-character forex pair, add underscore in the middle
    if (symbol.length === 6) {
      return `${symbol.substring(0, 3)}_${symbol.substring(3)}`;
    }
    
    return symbol;
  }

  async getHistoricalData(
    symbol: string, 
    timeframe: string, 
    start: Date, 
    end: Date
  ): Promise<MarketData[]> {
    // Format symbol for Oanda
    const formattedSymbol = this.formatSymbolForOanda(symbol);
    
    // Map our timeframe format to Oanda's
    let granularity: string;
    switch (timeframe.toLowerCase()) {
      case '1m':
        granularity = 'M1';
        break;
      case '5m':
        granularity = 'M5';
        break;
      case '15m':
        granularity = 'M15';
        break;
      case '1h':
        granularity = 'H1';
        break;
      case '1d':
        granularity = 'D';
        break;
      default:
        granularity = 'D';
    }
    
    const startTime = start.toISOString();
    const endTime = end.toISOString();
    
    const response = await this.makeRequest(
      `/instruments/${formattedSymbol}/candles?price=M&granularity=${granularity}&from=${startTime}&to=${endTime}`
    );
    
    return response.candles.map((candle: any) => ({
      symbol,
      timestamp: new Date(candle.time),
      open: parseFloat(candle.mid.o),
      high: parseFloat(candle.mid.h),
      low: parseFloat(candle.mid.l),
      close: parseFloat(candle.mid.c),
      volume: candle.volume
    }));
  }

  async placeOrder(order: Order): Promise<Order> {
    // Format symbol for Oanda
    const formattedSymbol = this.formatSymbolForOanda(order.symbol);
    
    const oandaOrder: any = {
      order: {
        units: order.side === 'buy' ? order.quantity : -order.quantity,
        instrument: formattedSymbol,
        timeInForce: this.mapTimeInForce(order.timeInForce),
        type: this.mapOrderType(order.type),
        positionFill: 'DEFAULT'
      }
    };
    
    if (order.price && ['limit', 'stop_limit'].includes(order.type)) {
      oandaOrder.order.price = order.price.toString();
    }
    
    if (order.stopPrice && ['stop', 'stop_limit'].includes(order.type)) {
      oandaOrder.order.priceBound = order.stopPrice.toString();
    }
    
    const response = await this.makeRequest(`/accounts/${this.accountId}/orders`, 'POST', oandaOrder);
    
    return {
      id: response.orderCreateTransaction.id,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      quantity: order.quantity,
      price: order.price,
      stopPrice: order.stopPrice,
      timeInForce: order.timeInForce,
      status: 'pending'
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
        return 'GTD';
      case 'gtc':
        return 'GTC';
      case 'ioc':
        return 'IOC';
      case 'fok':
        return 'FOK';
      default:
        return 'GTC';
    }
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/accounts/${this.accountId}/orders/${orderId}/cancel`, 'PUT');
      return true;
    } catch (error) {
      console.error("Failed to cancel order:", error);
      return false;
    }
  }

  async getOrder(orderId: string): Promise<Order> {
    const response = await this.makeRequest(`/accounts/${this.accountId}/orders/${orderId}`);
    const oandaOrder = response.order;
    
    // Parse the symbol back from Oanda format (e.g., EUR_USD -> EURUSD)
    const symbol = oandaOrder.instrument.replace('_', '');
    
    return {
      id: oandaOrder.id,
      symbol,
      side: oandaOrder.units > 0 ? 'buy' : 'sell',
      type: this.reverseMapOrderType(oandaOrder.type),
      quantity: Math.abs(oandaOrder.units),
      price: parseFloat(oandaOrder.price),
      stopPrice: oandaOrder.priceBound ? parseFloat(oandaOrder.priceBound) : undefined,
      timeInForce: this.reverseMapTimeInForce(oandaOrder.timeInForce),
      status: oandaOrder.state.toLowerCase()
    };
  }

  private reverseMapOrderType(oandaType: string): 'market' | 'limit' | 'stop' | 'stop_limit' {
    switch (oandaType) {
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

  private reverseMapTimeInForce(oandaTif: string): 'day' | 'gtc' | 'ioc' | 'fok' {
    switch (oandaTif) {
      case 'GTD':
        return 'day';
      case 'GTC':
        return 'gtc';
      case 'IOC':
        return 'ioc';
      case 'FOK':
        return 'fok';
      default:
        return 'gtc';
    }
  }

  async getOpenOrders(): Promise<Order[]> {
    const response = await this.makeRequest(`/accounts/${this.accountId}/pendingOrders`);
    
    return response.orders.map((o: any) => {
      // Parse the symbol back from Oanda format
      const symbol = o.instrument.replace('_', '');
      
      return {
        id: o.id,
        symbol,
        side: o.units > 0 ? 'buy' : 'sell',
        type: this.reverseMapOrderType(o.type),
        quantity: Math.abs(o.units),
        price: o.price ? parseFloat(o.price) : undefined,
        stopPrice: o.priceBound ? parseFloat(o.priceBound) : undefined,
        timeInForce: this.reverseMapTimeInForce(o.timeInForce),
        status: o.state.toLowerCase()
      };
    });
  }

  async getPositions(): Promise<Position[]> {
    const response = await this.makeRequest(`/accounts/${this.accountId}/openPositions`);
    
    return response.positions.map((p: any) => {
      // Parse the symbol back from Oanda format
      const symbol = p.instrument.replace('_', '');
      const isLong = p.long.units !== '0';
      const positionData = isLong ? p.long : p.short;
      
      return {
        symbol,
        quantity: isLong ? parseFloat(positionData.units) : -parseFloat(positionData.units),
        averagePrice: parseFloat(positionData.averagePrice),
        currentPrice: 0, // Need to get this from a separate price request
        marketValue: parseFloat(positionData.units) * parseFloat(positionData.averagePrice),
        unrealizedPnl: parseFloat(positionData.unrealizedPL)
      };
    });
  }

  async getTrades(start?: Date, end?: Date): Promise<Trade[]> {
    // For Oanda, we query the completed transactions
    let endpoint = `/accounts/${this.accountId}/trades?state=CLOSED`;
    
    if (start) {
      endpoint += `&from=${start.toISOString()}`;
    }
    
    if (end) {
      endpoint += `&to=${end.toISOString()}`;
    }
    
    const response = await this.makeRequest(endpoint);
    
    return response.trades.map((t: any) => {
      // Parse the symbol back from Oanda format
      const symbol = t.instrument.replace('_', '');
      
      return {
        id: t.id,
        symbol,
        side: t.currentUnits > 0 ? 'buy' : 'sell',
        quantity: Math.abs(parseFloat(t.currentUnits)),
        price: parseFloat(t.price),
        timestamp: new Date(t.closeTime),
        status: 'filled',
        commission: 0 // Oanda doesn't provide commission in the trades response
      };
    });
  }
}