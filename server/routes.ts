import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import { z } from "zod";
import {
  insertUserSchema,
  insertStrategySchema,
  insertBacktestSchema,
  insertTradeSchema,
  insertBrokerConnectionSchema,
  insertDeployedStrategySchema,
  InsertRiskLimit,
  InsertPositionSizingRule,
  InsertMarketExposure,
  InsertSectorExposure,
  InsertPortfolioRisk,
  InsertStrategyCorrelation
} from "@shared/schema";
import { getRecommendations, UserPreference } from "./recommendation-engine";
import { WebSocketServer } from 'ws';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key';
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_default_monthly'; // You should set this in your environment
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Define the session augmentation for TypeScript
declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Add an API status endpoint
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      stripe: {
        configured: !!process.env.STRIPE_SECRET_KEY,
        testMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')
      }
    });
  });
  
  // Set up WebSocket server for real-time data
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Track active subscriptions and their intervals
  const subscriptions = new Map();
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    // Create a unique ID for this connection
    const connectionId = Date.now().toString();
    
    // Store the client's subscriptions
    const clientSubscriptions = new Set();
    subscriptions.set(connectionId, clientSubscriptions);
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe') {
          const { symbol, timeframe = '1m' } = data;
          console.log(`Client subscribed to ${symbol} (${timeframe})`);
          
          // Create a unique subscription key
          const subscriptionKey = `${symbol}:${timeframe}`;
          clientSubscriptions.add(subscriptionKey);
          
          // Get most recent market data for the symbol
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 1); // Get last day's data
          
          try {
            const marketData = await storage.getMarketData(
              symbol,
              timeframe,
              startDate,
              endDate
            );
            
            // Send the latest data point if available
            if (marketData.length > 0) {
              const latestDataPoint = marketData[marketData.length - 1];
              
              ws.send(JSON.stringify({
                type: 'initial_data',
                symbol,
                data: latestDataPoint
              }));
            }
          } catch (error) {
            console.error('Error fetching market data:', error);
          }
          
          // Setup real-time updates every few seconds
          const interval = setInterval(async () => {
            try {
              // Get the latest data (in a real app, this would fetch from a market data provider)
              const lastPrice = await getLatestPrice(symbol);
              
              // Create a realistic OHLC update
              const previousClose = lastPrice.price;
              const open = previousClose * (1 + (Math.random() * 0.01 - 0.005));
              const close = open * (1 + (Math.random() * 0.01 - 0.005));
              const high = Math.max(open, close) * (1 + Math.random() * 0.005);
              const low = Math.min(open, close) * (1 - Math.random() * 0.005);
              const volume = Math.floor(1000 + Math.random() * 9000);
              
              const update = {
                type: 'price_update',
                symbol,
                data: {
                  timestamp: new Date(),
                  open,
                  high,
                  low,
                  close,
                  volume,
                  timeframe
                }
              };
              
              ws.send(JSON.stringify(update));
            } catch (error) {
              console.error('Error sending price update:', error);
            }
          }, 5000);
          
          // Store the interval ID to clear it later
          clientSubscriptions[subscriptionKey] = interval;
        } 
        else if (data.type === 'unsubscribe') {
          const { symbol, timeframe = '1m' } = data;
          const subscriptionKey = `${symbol}:${timeframe}`;
          
          // Clear the update interval
          const interval = clientSubscriptions[subscriptionKey];
          if (interval) {
            clearInterval(interval);
            delete clientSubscriptions[subscriptionKey];
            clientSubscriptions.delete(subscriptionKey);
            console.log(`Client unsubscribed from ${symbol} (${timeframe})`);
          }
        }
      } catch (err) {
        console.error('Invalid WebSocket message:', err);
      }
    });
    
    // Clean up when the connection closes
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      
      // Clear all intervals for this client
      for (const subscriptionKey of clientSubscriptions) {
        const interval = clientSubscriptions[subscriptionKey];
        if (interval) clearInterval(interval);
      }
      
      // Remove this client from the subscriptions map
      subscriptions.delete(connectionId);
    });
  });
  
  // Helper function to get the latest price for a symbol
  // In a production app, this would connect to a real market data API
  async function getLatestPrice(symbol) {
    // For demo purposes, generate realistic price movements
    const basePrice = 
      symbol.includes('NIFTY50') ? 22560 :
      symbol.includes('BANKNIFTY') ? 48750 :
      symbol.includes('SENSEX') ? 74000 :
      symbol.includes('RELIANCE') ? 2950 :
      symbol.includes('HDFCBANK') ? 1520 :
      symbol.includes('TCS') ? 3980 :
      symbol.includes('INFY') ? 1460 :
      symbol.includes('ICICIBANK') ? 1080 :
      symbol.includes('AAPL') ? 168 :
      symbol.includes('MSFT') ? 420 :
      symbol.includes('GOOG') ? 175 :
      symbol.includes('TSLA') ? 172 :
      symbol.includes('EURUSD') ? 1.08 :
      symbol.includes('GBPUSD') ? 1.26 :
      symbol.includes('USDJPY') ? 151.8 :
      symbol.includes('BTCUSD') ? 69850 :
      symbol.includes('ETHUSD') ? 3540 :
      100 + Math.random() * 50;
      
    const price = basePrice * (1 + (Math.random() * 0.01 - 0.005)); // ±0.5% movement
    
    return {
      symbol,
      price,
      timestamp: new Date()
    };
  }
  
  // Auth routes
  app.post('/api/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: 'Server error' });
      }
    }
  });
  
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.json({ message: 'Logout successful' });
    });
  });
  
  // User routes
  app.get('/api/user', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Strategy routes
  app.get('/api/strategies', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const strategies = await storage.getStrategies(req.session.userId);
      res.json(strategies);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.get('/api/strategies/:id', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const strategy = await storage.getStrategy(parseInt(req.params.id));
      
      if (!strategy) {
        return res.status(404).json({ message: 'Strategy not found' });
      }
      
      if (strategy.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      res.json(strategy);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.post('/api/strategies', async (req, res) => {
    // if (!req.session.userId) {
    //   return res.status(401).json({ message: 'Not authenticated' });
    // }
    
    try {
      const strategyData = insertStrategySchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      console.log(strategyData);
      const strategy = await storage.createStrategy(strategyData);
      res.status(201).json(strategy);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        // res.status(500).json({ message: 'Server error' });
        res.send(error);
      }
    }
  });
  
  app.put('/api/strategies/:id', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const id = parseInt(req.params.id);
      const strategy = await storage.getStrategy(id);
      
      if (!strategy) {
        return res.status(404).json({ message: 'Strategy not found' });
      }
      
      if (strategy.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const updatedStrategy = await storage.updateStrategy(id, req.body);
      res.json(updatedStrategy);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.delete('/api/strategies/:id', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const id = parseInt(req.params.id);
      const strategy = await storage.getStrategy(id);
      
      if (!strategy) {
        return res.status(404).json({ message: 'Strategy not found' });
      }
      
      if (strategy.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      await storage.deleteStrategy(id);
      res.json({ message: 'Strategy deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Backtest routes
  app.get('/api/strategies/:strategyId/backtests', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const strategyId = parseInt(req.params.strategyId);
      const strategy = await storage.getStrategy(strategyId);
      
      if (!strategy) {
        return res.status(404).json({ message: 'Strategy not found' });
      }
      
      if (strategy.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const backtests = await storage.getBacktests(strategyId);
      res.json(backtests);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.post('/api/strategies/:strategyId/backtest', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const strategyId = parseInt(req.params.strategyId);
      const strategy = await storage.getStrategy(strategyId);
      
      if (!strategy) {
        return res.status(404).json({ message: 'Strategy not found' });
      }
      
      if (strategy.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      // Run backtest (this is a simplified mock implementation)
      const { startDate, endDate, initialCapital } = req.body;
      
      // Create mock backtest result with random metrics
      const totalPnl = initialCapital * (Math.random() * 0.4 - 0.1); // between -10% and +30%
      const finalCapital = initialCapital + totalPnl;
      const percentReturn = (totalPnl / initialCapital) * 100;
      const winRate = 40 + Math.random() * 40; // between 40% and 80%
      const trades = 10 + Math.floor(Math.random() * 90); // between 10 and 100 trades
      
      // Generate mock equity curve
      const equityCurve = [];
      let current = initialCapital;
      const days = Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
      
      for (let i = 0; i <= days; i++) {
        const date = new Date(new Date(startDate).getTime() + i * 24 * 60 * 60 * 1000);
        const dayReturn = 1 + (Math.random() * 0.02 - 0.01); // Daily return between -1% and 1%
        current *= dayReturn;
        equityCurve.push({
          date: date.toISOString().split('T')[0],
          value: current
        });
      }
      
      // Force the last value to match the final capital
      equityCurve[equityCurve.length - 1].value = finalCapital;
      
      // Generate mock trades data
      const tradesData = [];
      for (let i = 0; i < Math.min(trades, 50); i++) {
        const date = new Date(
          new Date(startDate).getTime() + 
          Math.random() * (new Date(endDate).getTime() - new Date(startDate).getTime())
        );
        
        const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
        const price = 100 + Math.random() * 200;
        const quantity = 1 + Math.floor(Math.random() * 10);
        const pnl = (Math.random() * 200 - 50) * (type === 'BUY' ? 1 : -1);
        
        tradesData.push({
          date: date.toISOString().split('T')[0],
          type,
          price,
          quantity,
          pnl
        });
      }
      
      // Sort trades by date
      tradesData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const backtestData = {
        strategyId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        initialCapital,
        finalCapital,
        totalPnl,
        percentReturn,
        sharpeRatio: 1 + Math.random(),
        maxDrawdown: 5 + Math.random() * 15,
        winRate,
        trades,
        equity: equityCurve,
        trades_data: tradesData
      };
      
      const backtest = await storage.createBacktest(backtestData);
      res.status(201).json(backtest);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: String(error) });
    }
  });
  
  // Trades routes
  app.get('/api/trades', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const trades = await storage.getTrades(req.session.userId, limit);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.get('/api/strategies/:strategyId/trades', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const strategyId = parseInt(req.params.strategyId);
      const strategy = await storage.getStrategy(strategyId);
      
      if (!strategy) {
        return res.status(404).json({ message: 'Strategy not found' });
      }
      
      if (strategy.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const trades = await storage.getTradesByStrategy(strategyId);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Broker routes
  app.get('/api/broker-connections', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const connections = await storage.getBrokerConnections(req.session.userId);
      res.json(connections);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.post('/api/broker-connections', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const connectionData = insertBrokerConnectionSchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      
      const connection = await storage.createBrokerConnection(connectionData);
      res.status(201).json(connection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: String(error) });
      }
    }
  });
  
  app.put('/api/broker-connections/:id', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const id = parseInt(req.params.id);
      const connection = await storage.getBrokerConnection(id);
      
      if (!connection) {
        return res.status(404).json({ message: 'Broker connection not found' });
      }
      
      if (connection.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const updatedConnection = await storage.updateBrokerConnection(id, req.body);
      res.json(updatedConnection);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.delete('/api/broker-connections/:id', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const id = parseInt(req.params.id);
      const connection = await storage.getBrokerConnection(id);
      
      if (!connection) {
        return res.status(404).json({ message: 'Broker connection not found' });
      }
      
      if (connection.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      await storage.deleteBrokerConnection(id);
      res.json({ message: 'Broker connection deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Test broker connection
  app.post('/api/broker-connections/:id/test', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const id = parseInt(req.params.id);
      const connection = await storage.getBrokerConnection(id);
      
      if (!connection) {
        return res.status(404).json({ message: 'Broker connection not found' });
      }
      
      if (connection.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const { createBrokerAdapter } = await import('./brokers');
      
      try {
        const broker = createBrokerAdapter(connection);
        const isConnected = await broker.testConnection();
        
        // Update connection status in database
        const status = isConnected ? 'connected' : 'failed';
        const lastConnected = isConnected ? new Date() : undefined;
        
        await storage.updateBrokerConnection(id, { 
          status,
          lastConnected
        });
        
        res.json({ 
          success: isConnected,
          message: isConnected ? 'Connection successful' : 'Connection failed'
        });
      } catch (error) {
        console.error('Broker connection test error:', error);
        
        // Update status to failed in database
        await storage.updateBrokerConnection(id, { 
          status: 'failed'
        });
        
        res.status(400).json({ 
          success: false, 
          message: `Connection failed: ${error.message}` 
        });
      }
    } catch (error) {
      console.error('Broker connection test error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error'
      });
    }
  });
  
  // Get account info from broker
  app.get('/api/broker-connections/:id/account', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const id = parseInt(req.params.id);
      const connection = await storage.getBrokerConnection(id);
      
      if (!connection) {
        return res.status(404).json({ message: 'Broker connection not found' });
      }
      
      if (connection.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const { createBrokerAdapter } = await import('./brokers');
      
      try {
        const broker = createBrokerAdapter(connection);
        const accountInfo = await broker.getAccountInfo();
        res.json(accountInfo);
      } catch (error) {
        console.error('Broker account info error:', error);
        res.status(400).json({ message: `Error fetching account info: ${error.message}` });
      }
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get quotes from broker
  app.get('/api/broker-connections/:id/quote/:symbol', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const id = parseInt(req.params.id);
      const symbol = req.params.symbol;
      const connection = await storage.getBrokerConnection(id);
      
      if (!connection) {
        return res.status(404).json({ message: 'Broker connection not found' });
      }
      
      if (connection.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const { createBrokerAdapter } = await import('./brokers');
      
      try {
        const broker = createBrokerAdapter(connection);
        const quote = await broker.getQuote(symbol);
        res.json(quote);
      } catch (error) {
        console.error('Broker quote error:', error);
        res.status(400).json({ message: `Error fetching quote: ${error.message}` });
      }
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get historical data from broker or cache
  app.get('/api/broker-connections/:id/historical-data/:symbol/:timeframe', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const id = parseInt(req.params.id);
      const symbol = req.params.symbol;
      const timeframe = req.params.timeframe;
      const connection = await storage.getBrokerConnection(id);
      
      // Get date range from query params
      const start = req.query.start ? new Date(req.query.start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago
      const end = req.query.end ? new Date(req.query.end as string) : new Date(); // Default to now
      
      if (!connection) {
        return res.status(404).json({ message: 'Broker connection not found' });
      }
      
      if (connection.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      // First check if we have this data in our cache
      const cachedData = await storage.getMarketData(symbol, timeframe, start, end);
      
      // If we have enough cached data, return it
      if (cachedData.length > 0) {
        return res.json(cachedData);
      }
      
      // Otherwise fetch from the broker API
      const { createBrokerAdapter } = await import('./brokers');
      
      try {
        const broker = createBrokerAdapter(connection);
        const marketData = await broker.getHistoricalData(symbol, timeframe, start, end);
        
        // Save to cache for future use
        const dataToCache = marketData.map(bar => ({
          symbol: bar.symbol,
          timeframe,
          timestamp: bar.timestamp,
          open: bar.open.toString(),
          high: bar.high.toString(),
          low: bar.low.toString(),
          close: bar.close.toString(),
          volume: bar.volume ? bar.volume.toString() : null
        }));
        
        await storage.saveMarketData(dataToCache);
        
        res.json(marketData);
      } catch (error) {
        console.error('Broker historical data error:', error);
        res.status(400).json({ message: `Error fetching market data: ${error.message}` });
      }
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Payment routes with Stripe
  app.post('/api/create-payment-intent', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const { amount } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to paise (Indian equivalent of cents)
        currency: 'inr', // Using INR currency for Indian customers
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: `Error creating payment intent: ${error.message}` });
    }
  });
  
  app.post('/api/get-or-create-subscription', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // If user already has a subscription, retrieve it
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        res.json({
          subscriptionId: subscription.id,
          clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
        });
        
        return;
      }
      
      if (!user.email) {
        return res.status(400).json({ message: 'No user email on file' });
      }

      // Create a new customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
      });

      // Create a subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: STRIPE_PRICE_ID, // This should be set in your environment variables
          currency: 'inr', // Using INR currency for Indian customers
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with Stripe info
      await storage.updateUserStripeInfo(user.id, {
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
      });

      res.json({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      res.status(500).json({ message: `Error creating subscription: ${error.message}` });
    }
  });
  
  // Cancel subscription
  app.post('/api/cancel-subscription', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const user = await storage.getUser(req.session.userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ message: 'No active subscription found' });
      }

      // Cancel the subscription at period end
      const subscription = await stripe.subscriptions.update(
        user.stripeSubscriptionId,
        { cancel_at_period_end: true }
      );

      // Update user subscription status
      await storage.updateSubscriptionStatus(user.id, 'canceling');

      res.json({ 
        success: true, 
        message: 'Subscription will be canceled at the end of the billing period',
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      });
    } catch (error: any) {
      res.status(500).json({ message: `Error canceling subscription: ${error.message}` });
    }
  });

  // Change subscription plan
  app.post('/api/change-plan', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const { newPlanId } = req.body;
      
      if (!newPlanId) {
        return res.status(400).json({ message: 'New plan ID is required' });
      }

      const user = await storage.getUser(req.session.userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // For users with no subscription yet, create a new one
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ 
          message: 'No active subscription found. Please subscribe first.',
          redirect: '/billing'
        });
      }

      // Get the subscription
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      // Update the subscription items
      if (subscription.items.data.length > 0) {
        await stripe.subscriptions.update(
          user.stripeSubscriptionId,
          {
            items: [
              {
                id: subscription.items.data[0].id,
                price: newPlanId,
              },
            ],
            proration_behavior: 'create_prorations',
          }
        );
        
        // Update the user's plan based on the new plan ID
        let planName = 'free';
        if (newPlanId === 'price_pro') {
          planName = 'pro';
        } else if (newPlanId === 'price_enterprise') {
          planName = 'enterprise';
        }
        
        await storage.updateUserPlan(user.id, planName);
        
        res.json({ 
          success: true, 
          message: `Successfully updated to ${planName} plan`,
          plan: planName
        });
      } else {
        res.status(400).json({ message: 'No subscription items found' });
      }
    } catch (error: any) {
      res.status(500).json({ message: `Error changing plan: ${error.message}` });
    }
  });

  // Stripe webhook handler for subscription events
  app.post('/api/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';

    if (!sig) {
      return res.status(400).json({ message: 'Missing Stripe signature' });
    }

    let event;

    try {
      // Verify the webhook signature
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          
          // Get the customer ID to find the user
          if (subscription.customer) {
            const customerId = typeof subscription.customer === 'string' 
              ? subscription.customer 
              : subscription.customer.id;
            
            // Find the user with this stripeCustomerId
            const users = Array.from((await storage).users.values()).filter(
              (user) => user.stripeCustomerId === customerId
            );
            
            if (users.length > 0) {
              const user = users[0];
              // Update the user's subscription status to active
              await storage.updateSubscriptionStatus(user.id, 'active');
              console.log(`User ${user.id} subscription is now active`);
            }
          }
        }
        break;
        
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        if (failedInvoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(failedInvoice.subscription as string);
          
          if (subscription.customer) {
            const customerId = typeof subscription.customer === 'string' 
              ? subscription.customer 
              : subscription.customer.id;
            
            // Find the user with this stripeCustomerId
            const users = Array.from((await storage).users.values()).filter(
              (user) => user.stripeCustomerId === customerId
            );
            
            if (users.length > 0) {
              const user = users[0];
              // Update the user's subscription status to past_due
              await storage.updateSubscriptionStatus(user.id, 'past_due');
              console.log(`User ${user.id} subscription payment failed`);
            }
          }
        }
        break;
        
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        
        if (deletedSubscription.customer) {
          const customerId = typeof deletedSubscription.customer === 'string' 
            ? deletedSubscription.customer 
            : deletedSubscription.customer.id;
          
          // Find the user with this stripeCustomerId
          const users = Array.from((await storage).users.values()).filter(
            (user) => user.stripeCustomerId === customerId
          );
          
          if (users.length > 0) {
            const user = users[0];
            // Update the user's subscription status to canceled and plan to free
            await storage.updateSubscriptionStatus(user.id, 'canceled');
            await storage.updateUserPlan(user.id, 'free');
            console.log(`User ${user.id} subscription has been canceled`);
          }
        }
        break;
        
      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        
        if (updatedSubscription.customer) {
          const customerId = typeof updatedSubscription.customer === 'string' 
            ? updatedSubscription.customer 
            : updatedSubscription.customer.id;
          
          // Find the user with this stripeCustomerId
          const users = Array.from((await storage).users.values()).filter(
            (user) => user.stripeCustomerId === customerId
          );
          
          if (users.length > 0) {
            const user = users[0];
            // Update the user's subscription status based on the subscription status
            await storage.updateSubscriptionStatus(user.id, updatedSubscription.status);
            console.log(`User ${user.id} subscription has been updated to ${updatedSubscription.status}`);
            
            // If the subscription item was changed, update the user's plan
            if (updatedSubscription.items?.data?.length > 0) {
              const item = updatedSubscription.items.data[0];
              // Update plan based on the price ID
              if (item.price?.id === 'price_pro') {
                await storage.updateUserPlan(user.id, 'pro');
              } else if (item.price?.id === 'price_enterprise') {
                await storage.updateUserPlan(user.id, 'enterprise');
              }
            }
          }
        }
        break;
    }

    // Return a 200 success response
    res.json({ received: true });
  });

  // Market data routes
  app.get('/api/market-data', async (req, res) => {
    try {
      const { symbol, timeframe, start, end } = req.query;
      
      if (!symbol || !timeframe || !start || !end) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }
      
      const startDate = new Date(start as string);
      const endDate = new Date(end as string);
      
      const data = await storage.getMarketData(
        symbol as string,
        timeframe as string,
        startDate,
        endDate
      );
      
      if (data.length === 0) {
        // Generate mock data if no data found
        const mockData = [];
        let currentDate = new Date(startDate);
        let price = 100 + Math.random() * 50;
        
        while (currentDate <= endDate) {
          // Skip weekends for stock market simulation
          if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
            const open = price;
            const high = open * (1 + Math.random() * 0.02);
            const low = open * (1 - Math.random() * 0.02);
            const close = low + Math.random() * (high - low);
            const volume = Math.floor(Math.random() * 1000000);
            
            mockData.push({
              symbol: symbol as string,
              timeframe: timeframe as string,
              timestamp: new Date(currentDate),
              open,
              high,
              low,
              close,
              volume
            });
            
            price = close;
          }
          
          // Increment date based on timeframe
          if (timeframe === '1d') {
            currentDate.setDate(currentDate.getDate() + 1);
          } else if (timeframe === '1h') {
            currentDate.setHours(currentDate.getHours() + 1);
          } else if (timeframe === '1m') {
            currentDate.setMinutes(currentDate.getMinutes() + 1);
          }
        }
        
        await storage.saveMarketData(mockData);
        return res.json(mockData);
      }
      
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Deployed Strategies API Routes
  
  // Get all deployed strategies
  app.get("/api/deployed-strategies", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const deployedStrategies = await storage.getDeployedStrategies(req.session.userId);
      res.json(deployedStrategies);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get a specific deployed strategy
  app.get("/api/deployed-strategies/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const deployedStrategy = await storage.getDeployedStrategy(id);
      
      if (!deployedStrategy) {
        return res.status(404).json({ message: "Deployed strategy not found" });
      }
      
      if (deployedStrategy.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      res.json(deployedStrategy);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Create a new deployed strategy
  app.post("/api/deployed-strategies", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const deployedStrategyData = insertDeployedStrategySchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      
      const deployedStrategy = await storage.createDeployedStrategy(deployedStrategyData);
      res.status(201).json(deployedStrategy);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: String(error) });
      }
    }
  });
  
  // Update a deployed strategy
  app.put("/api/deployed-strategies/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const deployedStrategy = await storage.getDeployedStrategy(id);
      
      if (!deployedStrategy) {
        return res.status(404).json({ message: "Deployed strategy not found" });
      }
      
      if (deployedStrategy.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updatedStrategy = await storage.updateDeployedStrategy(id, req.body);
      res.json(updatedStrategy);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Update a deployed strategy's status
  app.patch("/api/deployed-strategies/:id/status", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const deployedStrategy = await storage.getDeployedStrategy(id);
      
      if (!deployedStrategy) {
        return res.status(404).json({ message: "Deployed strategy not found" });
      }
      
      if (deployedStrategy.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const { status } = req.body;
      
      if (!status || !['running', 'paused', 'stopped', 'archived', 'error'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const updatedStrategy = await storage.updateDeployedStrategyStatus(id, status);
      res.json(updatedStrategy);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Delete a deployed strategy
  app.delete("/api/deployed-strategies/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const deployedStrategy = await storage.getDeployedStrategy(id);
      
      if (!deployedStrategy) {
        return res.status(404).json({ message: "Deployed strategy not found" });
      }
      
      if (deployedStrategy.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const success = await storage.deleteDeployedStrategy(id);
      
      if (success) {
        res.json({ message: "Deployed strategy deleted" });
      } else {
        res.status(500).json({ message: "Failed to delete deployed strategy" });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Risk Management Routes
  
  // Portfolio Risk
  app.get("/api/risk/portfolio", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const portfolioRisk = await storage.getPortfolioRisk(req.session.userId);
      res.json(portfolioRisk || {
        userId: req.session.userId,
        totalValue: 0,
        dailyValue: 0,
        dailyChange: 0,
        weeklyChange: 0,
        monthlyChange: 0,
        currentDrawdown: 0,
        maxDrawdown: 0,
        volatility: 0,
        sharpeRatio: 0,
        beta: 0,
        strategies: 0,
        activeTrades: 0,
        updatedAt: new Date()
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.put("/api/risk/portfolio", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const updatedRisk = await storage.updatePortfolioRisk(req.session.userId, req.body);
      res.json(updatedRisk);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Risk Limits
  app.get("/api/risk/limits", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const riskLimits = await storage.getRiskLimits(req.session.userId);
      res.json(riskLimits);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/risk/limits/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const riskLimit = await storage.getRiskLimit(id);
      
      if (!riskLimit) {
        return res.status(404).json({ message: "Risk limit not found" });
      }
      
      if (riskLimit.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      res.json(riskLimit);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/risk/limits", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const riskLimitData: InsertRiskLimit = {
        ...req.body,
        userId: req.session.userId,
        currentValue: req.body.currentValue || null,
        status: req.body.status || 'safe'
      };
      
      const riskLimit = await storage.createRiskLimit(riskLimitData);
      res.status(201).json(riskLimit);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.put("/api/risk/limits/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const riskLimit = await storage.getRiskLimit(id);
      
      if (!riskLimit) {
        return res.status(404).json({ message: "Risk limit not found" });
      }
      
      if (riskLimit.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updatedRiskLimit = await storage.updateRiskLimit(id, req.body);
      res.json(updatedRiskLimit);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.delete("/api/risk/limits/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const riskLimit = await storage.getRiskLimit(id);
      
      if (!riskLimit) {
        return res.status(404).json({ message: "Risk limit not found" });
      }
      
      if (riskLimit.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const success = await storage.deleteRiskLimit(id);
      
      if (success) {
        res.json({ message: "Risk limit deleted" });
      } else {
        res.status(500).json({ message: "Failed to delete risk limit" });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Position Sizing Rules
  app.get("/api/risk/position-sizing", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const rules = await storage.getPositionSizingRules(req.session.userId);
      res.json(rules);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/risk/position-sizing/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const rule = await storage.getPositionSizingRule(id);
      
      if (!rule) {
        return res.status(404).json({ message: "Position sizing rule not found" });
      }
      
      if (rule.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      res.json(rule);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/risk/position-sizing", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const positionRuleData: InsertPositionSizingRule = {
        ...req.body,
        userId: req.session.userId
      };
      
      const rule = await storage.createPositionSizingRule(positionRuleData);
      res.status(201).json(rule);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.put("/api/risk/position-sizing/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const rule = await storage.getPositionSizingRule(id);
      
      if (!rule) {
        return res.status(404).json({ message: "Position sizing rule not found" });
      }
      
      if (rule.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updatedRule = await storage.updatePositionSizingRule(id, req.body);
      res.json(updatedRule);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.delete("/api/risk/position-sizing/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const rule = await storage.getPositionSizingRule(id);
      
      if (!rule) {
        return res.status(404).json({ message: "Position sizing rule not found" });
      }
      
      if (rule.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const success = await storage.deletePositionSizingRule(id);
      
      if (success) {
        res.json({ message: "Position sizing rule deleted" });
      } else {
        res.status(500).json({ message: "Failed to delete position sizing rule" });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Market Exposure
  app.get("/api/risk/market-exposure", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const exposures = await storage.getMarketExposures(req.session.userId);
      res.json(exposures);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.put("/api/risk/market-exposure", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const exposures: InsertMarketExposure[] = req.body.map((exposure: any) => ({
        ...exposure,
        userId: req.session.userId
      }));
      
      const updatedExposures = await storage.updateMarketExposures(req.session.userId, exposures);
      res.json(updatedExposures);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Sector Exposure
  app.get("/api/risk/sector-exposure", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const exposures = await storage.getSectorExposures(req.session.userId);
      res.json(exposures);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.put("/api/risk/sector-exposure", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const exposures: InsertSectorExposure[] = req.body.map((exposure: any) => ({
        ...exposure,
        userId: req.session.userId
      }));
      
      const updatedExposures = await storage.updateSectorExposures(req.session.userId, exposures);
      res.json(updatedExposures);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Strategy Correlation
  app.get("/api/risk/strategy-correlation", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const correlations = await storage.getStrategyCorrelations(req.session.userId);
      res.json(correlations);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.put("/api/risk/strategy-correlation", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const correlations: InsertStrategyCorrelation[] = req.body.map((correlation: any) => ({
        ...correlation,
        userId: req.session.userId
      }));
      
      const updatedCorrelations = await storage.updateStrategyCorrelations(req.session.userId, correlations);
      res.json(updatedCorrelations);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Strategy recommendation engine
  app.post("/api/strategy-recommendations", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      // Validate user preferences
      const userPreferenceSchema = z.object({
        riskTolerance: z.number().min(1).max(5),
        investmentHorizon: z.enum(['short', 'medium', 'long']),
        preferredMarkets: z.array(z.string()),
        tradingFrequency: z.enum(['day', 'swing', 'position']),
        capitalAvailable: z.number().positive(),
        automationLevel: z.enum(['manual', 'semi-automated', 'fully-automated']),
        preferredIndicators: z.array(z.string())
      });
      
      const preferences = userPreferenceSchema.parse(req.body);
      
      // Get recommendations based on user preferences
      const recommendations = await getRecommendations(req.session.userId, preferences);
      
      res.json(recommendations);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid preferences', errors: error.errors });
      } else {
        console.error('Error generating recommendations:', error);
        res.status(500).json({ message: 'Failed to generate recommendations' });
      }
    }
  });
  
  // Risk Management routes
  
  // Mock data for portfolio risk metrics
  const mockPortfolioRisk = {
    totalValue: 125800,
    dailyValue: 127430,
    dailyChange: 1.3,
    weeklyChange: -2.1,
    monthlyChange: 5.7,
    drawdown: {
      current: 2.5,
      max: 7.8,
    },
    volatility: 12.4,
    sharpeRatio: 1.2,
    beta: 0.86,
    strategies: 5,
    activeTrades: 8,
    exposureByMarket: [
      { market: 'Stocks', percentage: 45 },
      { market: 'Forex', percentage: 30 },
      { market: 'Crypto', percentage: 15 },
      { market: 'Futures', percentage: 10 },
    ],
    exposureBySector: [
      { sector: 'Technology', percentage: 30 },
      { sector: 'Financial', percentage: 20 },
      { sector: 'Healthcare', percentage: 15 },
      { sector: 'Consumer', percentage: 10 },
      { sector: 'Energy', percentage: 10 },
      { sector: 'Other', percentage: 15 },
    ],
    correlationMatrix: [
      { strategy: 'Moving Average Crossover', correlations: [1, 0.3, 0.1, -0.2, 0.7] },
      { strategy: 'RSI Mean Reversion', correlations: [0.3, 1, 0.4, 0.1, 0.2] },
      { strategy: 'Trend Following', correlations: [0.1, 0.4, 1, 0.5, -0.1] },
      { strategy: 'Bollinger Breakout', correlations: [-0.2, 0.1, 0.5, 1, 0.3] },
      { strategy: 'Options Straddle', correlations: [0.7, 0.2, -0.1, 0.3, 1] },
    ],
  };

  // Mock data for risk limits
  const mockRiskLimits = [
    {
      id: '1',
      name: 'Maximum Drawdown',
      description: 'Maximum acceptable drawdown for the entire account',
      type: 'account',
      metric: 'drawdown',
      threshold: 10,
      currentValue: 2.5,
      status: 'safe',
      action: 'notify',
      isActive: true,
    },
    {
      id: '2',
      name: 'Daily Loss Limit',
      description: 'Maximum loss allowed in a single day',
      type: 'account',
      metric: 'daily P&L',
      threshold: 3,
      currentValue: -1.3,
      status: 'safe',
      action: 'notify',
      isActive: true,
    },
    {
      id: '3',
      name: 'Position Size Limit',
      description: 'Maximum position size as a percentage of account',
      type: 'position',
      metric: 'position size',
      threshold: 5,
      currentValue: 3.2,
      status: 'safe',
      action: 'notify',
      isActive: true,
    },
    {
      id: '4',
      name: 'Market Exposure Limit',
      description: 'Maximum exposure to a single market',
      type: 'account',
      metric: 'market exposure',
      threshold: 50,
      currentValue: 45,
      status: 'warning',
      action: 'notify',
      isActive: true,
    },
    {
      id: '5',
      name: 'Strategy Loss Limit',
      description: 'Maximum loss allowed for a single strategy',
      type: 'strategy',
      metric: 'strategy P&L',
      threshold: 5,
      currentValue: 1.8,
      status: 'safe',
      action: 'reduce',
      isActive: true,
    },
  ];

  // Mock data for position sizing rules
  const mockPositionRules = [
    {
      id: '1',
      name: 'Default Risk-Based Sizing',
      description: 'Risk 1% of the account per trade',
      strategy: 'All Strategies',
      method: 'risk-based',
      riskPerTrade: 1,
      maxPositionSize: 5,
      isActive: true,
    },
    {
      id: '2',
      name: 'Trend Following Size',
      description: 'Volatility-adjusted sizing for trend strategies',
      strategy: 'Trend Following',
      method: 'volatility',
      riskPerTrade: 0.8,
      maxPositionSize: 4,
      isActive: true,
    },
    {
      id: '3',
      name: 'Mean Reversion Size',
      description: 'Kelly criterion sizing for mean reversion',
      strategy: 'RSI Mean Reversion',
      method: 'kelly',
      riskPerTrade: 0.5,
      maxPositionSize: 3,
      isActive: true,
    },
  ];
  
  // Get portfolio risk metrics
  app.get('/api/risk/portfolio', (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // In a real application, these metrics would be calculated from 
    // actual portfolio data, positions, and market conditions
    res.json(mockPortfolioRisk);
  });

  // Risk Limits endpoints
  app.get('/api/risk/limits', (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    res.json(mockRiskLimits);
  });

  app.post('/api/risk/limits', (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const { name, description, type, metric, threshold, action, isActive } = req.body;
      
      if (!name || !description || !type || !metric || !threshold) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // In a real app, this would save to a database
      const newLimit = {
        id: (mockRiskLimits.length + 1).toString(),
        name,
        description,
        type,
        metric,
        threshold,
        currentValue: 0, // Would be calculated in real-time in a real app
        status: 'safe',
        action: action || 'notify',
        isActive: isActive !== undefined ? isActive : true,
      };

      mockRiskLimits.push(newLimit);
      res.status(201).json(newLimit);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: String(error) });
    }
  });

  app.put('/api/risk/limits/:id', (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const { id } = req.params;
      const limitIndex = mockRiskLimits.findIndex(limit => limit.id === id);
      
      if (limitIndex === -1) {
        return res.status(404).json({ message: 'Risk limit not found' });
      }

      // Update the risk limit
      const updatedLimit = {
        ...mockRiskLimits[limitIndex],
        ...req.body,
      };

      mockRiskLimits[limitIndex] = updatedLimit;
      res.json(updatedLimit);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: String(error) });
    }
  });

  app.delete('/api/risk/limits/:id', (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const { id } = req.params;
      const limitIndex = mockRiskLimits.findIndex(limit => limit.id === id);
      
      if (limitIndex === -1) {
        return res.status(404).json({ message: 'Risk limit not found' });
      }

      // Remove the risk limit
      mockRiskLimits.splice(limitIndex, 1);
      res.json({ message: 'Risk limit deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: String(error) });
    }
  });

  // Position Sizing Rules endpoints
  app.get('/api/risk/position-rules', (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    res.json(mockPositionRules);
  });

  app.post('/api/risk/position-rules', (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const { name, description, strategy, method, riskPerTrade, maxPositionSize, isActive } = req.body;
      
      if (!name || !description || !strategy || !method || !riskPerTrade || !maxPositionSize) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // In a real app, this would save to a database
      const newRule = {
        id: (mockPositionRules.length + 1).toString(),
        name,
        description,
        strategy,
        method,
        riskPerTrade,
        maxPositionSize,
        isActive: isActive !== undefined ? isActive : true,
      };

      mockPositionRules.push(newRule);
      res.status(201).json(newRule);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: String(error) });
    }
  });

  app.put('/api/risk/position-rules/:id', (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const { id } = req.params;
      const ruleIndex = mockPositionRules.findIndex(rule => rule.id === id);
      
      if (ruleIndex === -1) {
        return res.status(404).json({ message: 'Position sizing rule not found' });
      }

      // Update the position sizing rule
      const updatedRule = {
        ...mockPositionRules[ruleIndex],
        ...req.body,
      };

      mockPositionRules[ruleIndex] = updatedRule;
      res.json(updatedRule);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: String(error) });
    }
  });

  app.delete('/api/risk/position-rules/:id', (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const { id } = req.params;
      const ruleIndex = mockPositionRules.findIndex(rule => rule.id === id);
      
      if (ruleIndex === -1) {
        return res.status(404).json({ message: 'Position sizing rule not found' });
      }

      // Remove the position sizing rule
      mockPositionRules.splice(ruleIndex, 1);
      res.json({ message: 'Position sizing rule deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: String(error) });
    }
  });

  // Position Size Calculator endpoint
  app.post('/api/risk/calculate-position-size', (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const { accountSize, riskPercentage, entryPrice, stopLossPrice } = req.body;
      
      if (!accountSize || !riskPercentage || !entryPrice || !stopLossPrice) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Calculate risk amount in dollars
      const riskAmount = accountSize * (riskPercentage / 100);
      
      // Calculate risk per share
      const riskPerShare = Math.abs(entryPrice - stopLossPrice);
      
      // Calculate number of shares
      const shares = Math.floor(riskAmount / riskPerShare);
      
      // Calculate position value
      const positionValue = shares * entryPrice;
      
      // Calculate account allocation percentage
      const accountAllocation = (positionValue / accountSize) * 100;

      res.json({
        riskAmount,
        riskPerShare,
        shares,
        positionValue,
        accountAllocation
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: String(error) });
    }
  });
  
  return httpServer;
}
