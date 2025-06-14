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
  insertUserPreferenceSchema,
  InsertUserPreference,
  UserPreference,
  InsertMarketExposure,
  InsertSectorExposure,
  InsertPortfolioRisk,
  InsertStrategyCorrelation,
  // Learning module schemas
  insertLearningModuleSchema,
  insertLessonSchema,
  insertQuizSchema,
  insertQuizQuestionSchema,
  insertQuizAnswerSchema,
  insertUserProgressSchema,
  insertBadgeSchema,
  // Trading workflow schemas
  insertTradingWorkflowSchema,
  insertWorkflowStepSchema,
  insertWorkflowConditionSchema,
  insertWorkflowActionSchema,
  insertWorkflowExecutionLogSchema,
  LearningModule,
  Lesson,
  Quiz,
  QuizQuestion,
  QuizAnswer,
  UserProgress,
  Badge,
  UserBadge
} from "@shared/schema";
import { getRecommendations, saveRecommendationsToDatabase, UserPreference as RecommendationUserPreference } from "./recommendation-engine";
import { generateAIRecommendations } from "./utils/openai";
import { WebSocketServer } from 'ws';
import portfolioRoutes from './routes/portfolio';

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

  // Register portfolio routes
  app.use('/api/portfolio', portfolioRoutes);
  
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
  
  // Endpoint to check if specific secrets are available
  app.post('/api/check-secrets', async (req: Request, res: Response) => {
    try {
      const { secretKeys } = req.body;
      
      if (!Array.isArray(secretKeys)) {
        return res.status(400).json({ message: "secretKeys must be an array" });
      }
      
      const secrets: Record<string, boolean> = {};
      
      // Check each secret key
      secretKeys.forEach(key => {
        secrets[key] = !!process.env[key];
      });
      
      return res.json({ secrets });
    } catch (error) {
      console.error('Error checking secrets:', error);
      return res.status(500).json({ message: "Internal server error checking secrets" });
    }
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
    const clientSubscriptions = new Map(); // Use Map instead of Set to store interval IDs
    subscriptions.set(connectionId, clientSubscriptions);
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe') {
          // Default to 1d if timeframe is not provided or invalid
          const { symbol, timeframe = '1d' } = data;
          
          // Validate timeframe to make sure it's one we support
          const validTimeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1wk', '1mo'];
          const normalizedTimeframe = validTimeframes.includes(timeframe) ? timeframe : '1d';
          
          console.log(`Client subscribed to ${symbol} (${normalizedTimeframe})`);
          
          // Create a unique subscription key
          const subscriptionKey = `${symbol}:${normalizedTimeframe}`;
          
          // Get most recent market data for the symbol
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 1); // Get last day's data
          
          try {
            // Import the latest Yahoo Finance API module
            const { getLatestPrice } = await import('./utils/marketData');
            
            // First try to get data from our database
            const marketData = await storage.getMarketData(
              symbol,
              normalizedTimeframe,
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
            
            // Setup real-time updates every few seconds
            const interval = setInterval(async () => {
              try {
                // Get the latest real price from Yahoo Finance API
                const price = await getLatestPrice(symbol);
                
                if (price !== null) {
                  // Use the real price data
                  const previousClose = price;
                  // Create small random movements for OHLC around the real price
                  const open = previousClose * (1 + (Math.random() * 0.002 - 0.001));
                  const close = previousClose * (1 + (Math.random() * 0.002 - 0.001));
                  const high = Math.max(open, close) * (1 + Math.random() * 0.001);
                  const low = Math.min(open, close) * (1 - Math.random() * 0.001);
                  const volume = Math.floor(1000 + Math.random() * 9000);
                  
                  const update = {
                    type: 'price_update',
                    symbol,
                    data: {
                      timestamp: new Date(),
                      open: String(open),
                      high: String(high),
                      low: String(low),
                      close: String(close),
                      volume: String(volume),
                      timeframe: normalizedTimeframe
                    }
                  };
                  
                  ws.send(JSON.stringify(update));
                }
              } catch (error) {
                console.error('Error sending price update:', error);
              }
            }, 5000);
            
            // Store the interval ID to clear it later
            clientSubscriptions.set(subscriptionKey, interval);
            
          } catch (error) {
            console.error('Error fetching market data:', error);
          }
        } 
        else if (data.type === 'unsubscribe') {
          // Default to 1d if timeframe is not provided or invalid
          const { symbol, timeframe = '1d' } = data;
          
          // Validate timeframe to make sure it's one we support
          const validTimeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1wk', '1mo'];
          const normalizedTimeframe = validTimeframes.includes(timeframe) ? timeframe : '1d';
          
          const subscriptionKey = `${symbol}:${normalizedTimeframe}`;
          
          // Clear the update interval
          const interval = clientSubscriptions.get(subscriptionKey);
          if (interval) {
            clearInterval(interval);
            clientSubscriptions.delete(subscriptionKey);
            console.log(`Client unsubscribed from ${symbol} (${normalizedTimeframe})`);
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
      for (const [subscriptionKey, interval] of clientSubscriptions.entries()) {
        clearInterval(interval);
      }
      
      // Remove this client from the subscriptions map
      subscriptions.delete(connectionId);
    });
  });
  
  // NOTE: The getLatestPrice helper function has been removed
  // Now using the real implementation from './utils/marketData'
  
  // Auth routes
  // app.post('/api/register', async (req, res) => {
  //   try {
  //     const userData = insertUserSchema.parse(req.body);
      
  //     // Check if username or email already exists
  //     const existingUserByUsername = await storage.getUserByUsername(userData.username);
  //     if (existingUserByUsername) {
  //       return res.status(400).json({ message: 'Username already exists' });
  //     }
      
  //     const existingUserByEmail = await storage.getUserByEmail(userData.email);
  //     if (existingUserByEmail) {
  //       return res.status(400).json({ message: 'Email already exists' });
  //     }
      
  //     // Hash password
  //     const salt = await bcrypt.genSalt(10);
  //     const hashedPassword = await bcrypt.hash(userData.password, salt);
      
  //     // Create user
  //     const user = await storage.createUser({
  //       ...userData,
  //       password: hashedPassword
  //     });
      
  //     // Set session
  //     req.session.userId = user.id;
      
  //     // Return user without password
  //     const { password, ...userWithoutPassword } = user;
  //     res.status(201).json(userWithoutPassword);
  //   } catch (error) {
  //     if (error instanceof z.ZodError) {
  //       res.status(400).json({ message: error.errors[0].message });
  //     } else {
  //       res.status(500).json({ message: 'Server error' });
  //     }
  //   }
  // });
  
  // app.post('/api/login', async (req, res) => {
  //   try {
  //     const { username, password } = req.body;
      
  //     if (!username || !password) {
  //       return res.status(400).json({ message: 'Username and password are required' });
  //     }
      
  //     // Special test user for development - ALWAYS authenticates with these credentials
  //     if (username === 'test' && password === 'testpassword') {
  //       console.log("Authenticating test user...");
        
  //       // Create a hardcoded test user
  //       const testUser = {
  //         id: 9999,
  //         username: 'test',
  //         email: 'test@example.com',
  //         fullName: 'Test User',
  //         createdAt: new Date(),
  //         stripeCustomerId: null,
  //         stripeSubscriptionId: null,
  //         subscriptionStatus: 'free',
  //         plan: 'free'
  //       };
        
  //       // Set session
  //       req.session.userId = testUser.id;
  //       req.session.save((err) => {
  //         if (err) {
  //           console.error("Error saving session:", err);
  //           return res.status(500).json({ message: 'Session error' });
  //         }
  //         console.log("Test user session saved successfully");
  //         return res.json(testUser);
  //       });
        
  //       return; // Exit here to avoid double response
  //     }
      
  //     // Normal authentication flow
  //     const user = await storage.getUserByUsername(username);
  //     if (!user) {
  //       return res.status(401).json({ message: 'Invalid credentials' });
  //     }
      
  //     const isMatch = await bcrypt.compare(password, user.password);
  //     if (!isMatch) {
  //       return res.status(401).json({ message: 'Invalid credentials' });
  //     }
      
  //     // Set session
  //     req.session.userId = user.id;
      
  //     // Return user without password
  //     const { password: _, ...userWithoutPassword } = user;
  //     res.json(userWithoutPassword);
  //   } catch (error) {
  //     console.error("Login error:", error);
  //     res.status(500).json({ message: 'Server error' });
  //   }
  // });
  
  // app.post('/api/logout', (req, res) => {
  //   req.session.destroy((err) => {
  //     if (err) {
  //       return res.status(500).json({ message: 'Failed to logout' });
  //     }
  //     res.json({ message: 'Logout successful' });
  //   });
  // });
  
  // // User routes
  // app.get('/api/user', async (req, res) => {
  //   if (!req.session.userId) {
  //     return res.status(401).json({ message: 'Not authenticated' });
  //   }
    
  //   try {
  //     // Special handling for test user
  //     if (req.session.userId === 9999) {
  //       console.log("Getting test user profile");
  //       // Return hardcoded test user
  //       const testUser = {
  //         id: 9999,
  //         username: 'test',
  //         email: 'test@example.com',
  //         fullName: 'Test User',
  //         createdAt: new Date(),
  //         stripeCustomerId: null,
  //         stripeSubscriptionId: null,
  //         subscriptionStatus: 'free',
  //         plan: 'free'
  //       };
  //       return res.json(testUser);
  //     }
      
  //     // Regular user flow
  //     const user = await storage.getUser(req.session.userId);
  //     if (!user) {
  //       return res.status(404).json({ message: 'User not found' });
  //     }
      
  //     // Return user without password
  //     const { password, ...userWithoutPassword } = user;
  //     res.json(userWithoutPassword);
  //   } catch (error) {
  //     console.error("Error getting user:", error);
  //     res.status(500).json({ message: 'Server error' });
  //   }
  // });
  
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
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const strategyData = insertStrategySchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      
      const strategy = await storage.createStrategy(strategyData);
      res.status(201).json(strategy);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: 'Server error' });
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
      
      // Extract parameters from the request body
      const { 
        startDate, 
        endDate, 
        initialCapital,
        // Advanced parameters (with defaults if not provided)
        commissionPercent = 0.1,
        slippagePercent = 0.05,
        positionSizing = 1.0,
        stopLossPercent = 0,
        takeProfitPercent = 0,
        riskRewardRatio = 0,
        maxOpenPositions = 1,
        timeInForceExitDays = 0,
        marketConditions = 'all',
        dataFrequency = '1d',
        optimizationTarget = 'sharpe'
      } = req.body;
      
      // Log parameters for debugging
      console.log('Backtest parameters:', {
        strategyId,
        startDate,
        endDate,
        initialCapital,
        commissionPercent,
        slippagePercent,
        positionSizing,
        stopLossPercent,
        takeProfitPercent,
        riskRewardRatio,
        maxOpenPositions,
        timeInForceExitDays,
        marketConditions,
        dataFrequency,
        optimizationTarget
      });
      
      // Apply commission and slippage to affect final results
      const commissionFactor = 1 - (commissionPercent / 100);
      const slippageFactor = 1 - (slippagePercent / 100);
      const transactionCostFactor = commissionFactor * slippageFactor;
      
      // Create backtest result with enhanced metrics using advanced parameters
      let totalPnl = initialCapital * (Math.random() * 0.4 - 0.1); // between -10% and +30%
      
      // Adjust based on advanced parameters
      // Commission and slippage reduces returns
      totalPnl *= transactionCostFactor;
      
      // Position sizing affects volatility and returns
      totalPnl *= positionSizing;
      
      // Market conditions factor
      const marketFactor = {
        'all': 1.0,
        'bull': 1.2,
        'bear': 0.8,
        'sideways': 0.9,
        'volatile': 1.1,
        'low-volatile': 0.95
      }[marketConditions] || 1.0;
      
      totalPnl *= marketFactor;
      
      // Stop loss and take profit can reduce drawdowns and limit profits
      let maxDrawdown = 5 + Math.random() * 15;
      if (stopLossPercent > 0) {
        maxDrawdown = Math.min(maxDrawdown, stopLossPercent * 1.5);
      }
      
      const finalCapital = Number(initialCapital) + totalPnl;
      const percentReturn = (totalPnl / initialCapital) * 100;
      
      // Risk/reward and position sizing affects win rate
      const baseWinRate = 40 + Math.random() * 40; // between 40% and 80%
      let winRate = baseWinRate;
      
      if (riskRewardRatio > 0) {
        // Higher risk/reward ratios typically reduce win rate but increase average win
        winRate = Math.max(30, Math.min(80, baseWinRate - riskRewardRatio * 5));
      }
      
      // Number of trades depends on data frequency
      const frequencyFactor = {
        '1m': 20,
        '5m': 10,
        '15m': 5,
        '30m': 3,
        '1h': 2,
        '4h': 1,
        '1d': 0.5
      }[dataFrequency] || 1;
      
      const trades = Math.floor(10 + Math.random() * 90 * frequencyFactor);
      
      // Generate more realistic equity curve with advanced parameters
      const equityCurve = [];
      let current = initialCapital;
      const days = Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
      
      // Simulate drawdowns and recoveries
      let inDrawdown = false;
      let drawdownCount = 0;
      const maxDrawdownsToSimulate = Math.floor(days / 30) + 1; // Approximately one drawdown per month
      
      for (let i = 0; i <= days; i++) {
        const date = new Date(new Date(startDate).getTime() + i * 24 * 60 * 60 * 1000);
        
        // Simulate market regimes and drawdowns
        let dailyReturn;
        
        if (!inDrawdown && drawdownCount < maxDrawdownsToSimulate && Math.random() < 0.1) {
          // Start a drawdown period
          inDrawdown = true;
          drawdownCount++;
          dailyReturn = 1 - (Math.random() * 0.02); // -0% to -2%
        } else if (inDrawdown && Math.random() < 0.2) {
          // End drawdown period
          inDrawdown = false;
          dailyReturn = 1 + (Math.random() * 0.02); // +0% to +2%
        } else if (inDrawdown) {
          dailyReturn = 1 - (Math.random() * 0.015); // -0% to -1.5% during drawdown
        } else {
          // Normal market behavior
          dailyReturn = 1 + (Math.random() * 0.02 - 0.005) * marketFactor; // Daily return affected by market conditions
        }
        
        // Apply transaction costs for active days (when trades happen)
        if (Math.random() < 0.3) {
          dailyReturn *= transactionCostFactor;
        }
        
        current *= dailyReturn;
        
        // Apply position sizing effect
        const positionEffect = 1 + (Math.random() * 0.01 - 0.005) * positionSizing;
        current *= positionEffect;
        
        // Apply stop loss if enabled and in drawdown
        if (stopLossPercent > 0 && inDrawdown && current < initialCapital * (1 - stopLossPercent / 100)) {
          current = initialCapital * (1 - stopLossPercent / 100);
          inDrawdown = false;
        }
        
        equityCurve.push({
          date: date.toISOString().split('T')[0],
          value: current
        });
      }
      
      // Force the last value to match the final capital for consistency
      equityCurve[equityCurve.length - 1].value = finalCapital;
      
      // Generate realistic trades data
      const tradesData = [];
      let winCount = 0;
      let lossCount = 0;
      let totalWinAmount = 0;
      let totalLossAmount = 0;
      
      // Calculate expected number of winning trades
      const expectedWinCount = Math.floor(trades * (winRate / 100));
      
      for (let i = 0; i < Math.min(trades, 50); i++) {
        const date = new Date(
          new Date(startDate).getTime() + 
          Math.random() * (new Date(endDate).getTime() - new Date(startDate).getTime())
        );
        
        const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
        const price = 100 + Math.random() * 200;
        const quantity = Math.max(1, Math.floor(positionSizing * 10));
        
        // Determine if this is a winning trade based on expected win rate
        const isWin = winCount < expectedWinCount && 
                     (i < trades - expectedWinCount ? Math.random() < 0.7 : true);
        
        let pnl;
        if (isWin) {
          // Winning trade
          pnl = (Math.random() * 100 + 20) * (type === 'BUY' ? 1 : -1);
          winCount++;
          totalWinAmount += pnl;
        } else {
          // Losing trade
          pnl = -(Math.random() * 50 + 10) * (type === 'BUY' ? 1 : -1);
          lossCount++;
          totalLossAmount += Math.abs(pnl);
        }
        
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
      
      // Calculate additional metrics
      let profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount;
      const averageProfit = winCount > 0 ? totalWinAmount / winCount : 0;
      const averageLoss = lossCount > 0 ? totalLossAmount / lossCount : 0;
      const maxConsecutiveWins = Math.floor(Math.random() * 5) + 2;
      const maxConsecutiveLosses = Math.floor(Math.random() * 3) + 1;
      const expectancy = (winRate / 100) * averageProfit - (1 - winRate / 100) * averageLoss;
      
      // Calculate ratios based on optimization target
      let sharpeRatio = 1 + Math.random();
      let sortinoRatio = 1.2 + Math.random() * 0.8;
      let calmarRatio = 0.5 + Math.random() * 1.5;
      
      // Adjust metrics based on optimization target
      if (optimizationTarget === 'sharpe') {
        sharpeRatio += 0.5;
      } else if (optimizationTarget === 'drawdown') {
        maxDrawdown *= 0.7; // Lower drawdown
      } else if (optimizationTarget === 'win-rate') {
        winRate = Math.min(95, winRate * 1.2);
      } else if (optimizationTarget === 'profit-factor') {
        profitFactor *= 1.3;
      } else if (optimizationTarget === 'calmar') {
        calmarRatio += 0.7;
      }
      
      // Annualized return calculation
      const yearFraction = days / 365;
      const annualizedReturn = Math.pow(1 + percentReturn / 100, 1 / yearFraction) - 1;
      
      const backtestData = {
        strategyId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        initialCapital: String(initialCapital),
        finalCapital: String(finalCapital),
        totalPnl: String(totalPnl),
        percentReturn: String(percentReturn),
        sharpeRatio: String(sharpeRatio),
        maxDrawdown: String(maxDrawdown),
        winRate: String(winRate),
        profitFactor: String(profitFactor),
        averageProfit: String(averageProfit),
        averageLoss: String(averageLoss),
        maxConsecutiveWins,
        maxConsecutiveLosses,
        expectancy: String(expectancy),
        annualizedReturn: String(annualizedReturn * 100),
        sortinoRatio: String(sortinoRatio),
        calmarRatio: String(calmarRatio),
        trades,
        equity: equityCurve,
        trades_data: tradesData,
        // Store the advanced settings used
        commissionPercent: String(commissionPercent),
        slippagePercent: String(slippagePercent),
        positionSizing: String(positionSizing),
        stopLossPercent: String(stopLossPercent),
        takeProfitPercent: String(takeProfitPercent),
        riskRewardRatio: String(riskRewardRatio),
        maxOpenPositions,
        timeInForceExitDays,
        marketConditions,
        dataFrequency,
        optimizationTarget
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
      
      // First try to get data from our database
      let data = await storage.getMarketData(
        symbol as string,
        timeframe as string,
        startDate,
        endDate
      );
      
      if (data.length === 0) {
        console.log(`No market data found in DB for ${symbol} (${timeframe}). Fetching from Yahoo Finance...`);
        
        // Fetch real data from Yahoo Finance API
        const { fetchMarketData } = await import('./utils/marketData');
        const freshData = await fetchMarketData(symbol as string, timeframe as string);
        
        if (freshData.length > 0) {
          // Store the data in our database for future requests
          await storage.saveMarketData(freshData);
          
          // Filter the data based on the date range
          data = freshData.filter(item => {
            const timestamp = new Date(item.timestamp);
            return timestamp >= startDate && timestamp <= endDate;
          });
          
          return res.json(data);
        } else {
          // If no data was fetched from Yahoo, return empty array
          return res.json([]);
        }
      }
      
      res.json(data);
    } catch (error) {
      console.error('Error fetching market data:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get latest price for a symbol (this route needs to come BEFORE the more general route)
  app.get('/api/market-data/:symbol/price/latest', async (req, res) => {
    try {
      const { symbol } = req.params;
      const { getLatestPrice } = await import('./utils/marketData');
      const price = await getLatestPrice(symbol);
      
      if (price === null) {
        return res.status(404).json({ message: 'Price not found' });
      }
      
      res.json({ symbol, price });
    } catch (error) {
      console.error('Error fetching latest price:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get all available market data for a symbol and timeframe
  app.get('/api/market-data/:symbol/:timeframe', async (req, res) => {
    try {
      const { symbol, timeframe } = req.params;
      
      // Set default date range if not provided
      const endDate = new Date();
      const startDate = new Date();
      
      // Adjust startDate based on timeframe
      switch(timeframe) {
        case '1m':
        case '5m':
          startDate.setHours(startDate.getHours() - 6); // Last 6 hours
          break;
        case '15m':
        case '30m':
          startDate.setHours(startDate.getHours() - 24); // Last 24 hours
          break;
        case '1h':
        case '4h':
          startDate.setDate(startDate.getDate() - 7); // Last week
          break;
        case '1d':
        default:
          startDate.setDate(startDate.getDate() - 90); // Last 90 days
          break;
      }
      
      // Try to get data from our database
      let marketData = await storage.getMarketData(
        symbol,
        timeframe,
        startDate,
        endDate
      );
      
      // If no data found or data is older than 30 minutes, fetch from Yahoo Finance
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const isDataStale = !marketData.length || 
        (marketData.length > 0 && new Date(marketData[marketData.length - 1].timestamp) < thirtyMinutesAgo);
        
      if (isDataStale) {
        console.log(`Fetching fresh market data for ${symbol} (${timeframe})`);
        const { fetchMarketData } = await import('./utils/marketData');
        const freshData = await fetchMarketData(symbol, timeframe);
        
        if (freshData.length > 0) {
          // Store the data in our database for future requests
          await storage.saveMarketData(freshData);
          
          // Refresh the data from the database
          marketData = await storage.getMarketData(
            symbol,
            timeframe,
            startDate,
            endDate
          );
        }
      }
      
      res.json(marketData);
    } catch (error) {
      console.error('Error fetching market data:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get available symbols (indices and stocks)
  app.get('/api/market-data/symbols', async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string' || query.length < 2) {
        const { getAllSymbols } = await import('./utils/marketData');
        const symbols = getAllSymbols();
        return res.json(symbols);
      }
      
      // Search for symbols using Finnhub API
      const { searchSymbols } = await import('./services/finnhub');
      const searchResults = await searchSymbols(query);
      
      // Transform results to match our expected format
      const formattedResults = searchResults.map(item => ({
        value: item.symbol,
        label: `${item.symbol} - ${item.description}`,
      }));
      
      res.json(formattedResults);
    } catch (error) {
      console.error('Error fetching symbols:', error);
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
        preferredMarkets: z.array(z.string()).or(z.string()),
        tradingFrequency: z.enum(['day', 'swing', 'position']),
        capitalAvailable: z.number().positive(),
        automationLevel: z.enum(['manual', 'semi-automated', 'fully-automated']),
        preferredIndicators: z.array(z.string()).or(z.string())
      });
      
      // Parse the preferences, handling potential JSON strings
      let preferences = req.body;
      
      // Handle potential JSON strings from form data
      if (typeof preferences.preferredMarkets === 'string' && !Array.isArray(preferences.preferredMarkets)) {
        try {
          preferences.preferredMarkets = JSON.parse(preferences.preferredMarkets);
        } catch (e) {
          preferences.preferredMarkets = [preferences.preferredMarkets];
        }
      }
      
      if (typeof preferences.preferredIndicators === 'string' && !Array.isArray(preferences.preferredIndicators)) {
        try {
          preferences.preferredIndicators = JSON.parse(preferences.preferredIndicators);
        } catch (e) {
          preferences.preferredIndicators = [preferences.preferredIndicators];
        }
      }
      
      // Validate the processed preferences
      preferences = userPreferenceSchema.parse(preferences);
      
      // Clear any existing recommendations
      const existingRecommendations = await storage.getRecommendations(req.session.userId);
      for (const rec of existingRecommendations) {
        await storage.deleteRecommendation(rec.id);
      }
      
      // Import and use the recommendation engine
      const { convertUserPreference, getRecommendations, saveRecommendationsToDatabase } = await import('./recommendation-engine');
      
      // Convert from schema to internal format
      const internalPreferences = convertUserPreference(preferences);
      
      // Get recommendations based on user preferences
      const recommendations = await getRecommendations(req.session.userId, internalPreferences);
      
      // Save updated recommendations to database
      const savedRecommendations = await saveRecommendationsToDatabase(req.session.userId, recommendations);
      
      res.json(savedRecommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid preferences', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to generate recommendations: ' + (error instanceof Error ? error.message : String(error)) });
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

  // Research routes

  app.post('/api/research/query', async (req: Request, res: Response) => {

    try {

      const { query } = req.body;

      

      if (!query || typeof query !== 'string') {

        return res.status(400).json({ error: 'Query is required' });

      }



      // Check if we have API keys available

      const hasOpenAI = !!process.env.OPENAI_API_KEY;

      const hasPerplexity = !!process.env.PERPLEXITY_API_KEY;



      if (!hasOpenAI && !hasPerplexity) {

        return res.status(503).json({ 

          error: 'Research service unavailable. API keys are required for trading research.' 

        });

      }



      let response = '';

      let citations: string[] = [];



      // Use Perplexity for real-time market research if available

      if (hasPerplexity) {

        try {

          const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {

            method: 'POST',

            headers: {

              'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,

              'Content-Type': 'application/json'

            },

            body: JSON.stringify({

              model: 'llama-3.1-sonar-small-128k-online',

              messages: [

                {

                  role: 'system',

                  content: 'You are a financial research assistant specializing in Indian stock markets. Provide accurate, up-to-date information about Indian stocks, market trends, and trading strategies. Always cite your sources and focus on Indian market context including NSE, BSE, and major Indian companies.'

                },

                {

                  role: 'user',

                  content: query

                }

              ],

              temperature: 0.2,

              max_tokens: 1000,

              return_citations: true,

              search_recency_filter: 'week'

            })

          });



          if (perplexityResponse.ok) {

            const data = await perplexityResponse.json();

            response = data.choices[0]?.message?.content || '';

            citations = data.citations || [];

          }

        } catch (perplexityError) {

          console.log('Perplexity API error, falling back to OpenAI');

        }

      }



      // Fallback to OpenAI if Perplexity failed or unavailable

      if (!response && hasOpenAI) {

        const openai = await import('openai');

        const client = new openai.default({

          apiKey: process.env.OPENAI_API_KEY

        });



        const completion = await client.chat.completions.create({

          model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

          messages: [

            {

              role: 'system',

              content: 'You are a financial research assistant specializing in Indian stock markets. Provide comprehensive analysis about Indian stocks, market trends, sectors, and trading strategies. Focus on NSE, BSE, major Indian companies like Reliance, TCS, Infosys, HDFC, etc. Include relevant financial metrics, recent performance data, and market insights relevant to Indian traders.'

            },

            {

              role: 'user',

              content: query

            }

          ],

          temperature: 0.3,

          max_tokens: 1000

        });



        response = completion.choices[0]?.message?.content || 'Unable to generate response';

      }



      if (!response) {

        return res.status(503).json({ 

          error: 'Research service temporarily unavailable. Please try again.' 

        });

      }



      res.json({

        response,

        citations: citations.length > 0 ? citations : undefined

      });



    } catch (error: any) {

      console.error('Research query error:', error);

      res.status(500).json({ 

        error: 'Failed to process research query. Please try again.' 

      });

    }

  });
  
  
  // Get portfolio risk metrics
  app.get('/api/risk/portfolio', (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      // In a real application, these metrics would be calculated from 
      // actual portfolio data, positions, and market conditions
      res.json(mockPortfolioRisk);
    } catch (error) {
      console.error('Error retrieving portfolio risk data:', error);
      res.status(500).json({ message: 'Server error retrieving portfolio risk data' });
    }
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
  
  // User Preferences routes
  app.get('/api/user-preferences', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userPreference = await storage.getUserPreference(req.session.userId);
      if (!userPreference) {
        return res.status(404).json({ message: 'User preferences not found' });
      }
      res.json(userPreference);
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.post('/api/user-preferences', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const preferenceData = insertUserPreferenceSchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      
      const userPreference = await storage.saveUserPreference(preferenceData);
      res.status(201).json(userPreference);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        console.error('Error saving user preferences:', error);
        res.status(500).json({ message: 'Server error' });
      }
    }
  });
  
  app.put('/api/user-preferences', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const updatedPreference = await storage.updateUserPreference(req.session.userId, req.body);
      res.json(updatedPreference);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Strategy Recommendations routes
  app.get('/api/recommendations', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      // Get existing recommendations from storage
      const existingRecommendations = await storage.getRecommendations(req.session.userId);
      
      // If there are existing recommendations, return them
      if (existingRecommendations && existingRecommendations.length > 0) {
        return res.json(existingRecommendations);
      }
      
      // If not, we need to generate new recommendations
      const userPreference = await storage.getUserPreference(req.session.userId);
      if (!userPreference) {
        return res.status(404).json({ message: 'User preferences not found. Please set your preferences first.' });
      }
      
      // Use the recommendation engine to generate recommendations
      const { convertUserPreference, getRecommendations, saveRecommendationsToDatabase } = await import('./recommendation-engine');
      
      // Convert from schema to internal format
      const internalPreferences = convertUserPreference(userPreference);
      
      // Generate recommendations
      const recommendationTemplates = await getRecommendations(req.session.userId, internalPreferences);
      
      // Save recommendations to database
      const savedRecommendations = await saveRecommendationsToDatabase(req.session.userId, recommendationTemplates);
      
      res.json(savedRecommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      res.status(500).json({ message: 'Failed to generate recommendations' });
    }
  });
  
  app.put('/api/recommendations/:id/favorite', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const id = parseInt(req.params.id);
      const { favorite } = req.body;
      
      if (typeof favorite !== 'boolean') {
        return res.status(400).json({ message: 'Favorite status must be a boolean' });
      }
      
      const updatedRecommendation = await storage.markRecommendationFavorite(id, favorite);
      res.json(updatedRecommendation);
    } catch (error) {
      console.error('Error updating recommendation favorite status:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.put('/api/recommendations/:id/apply', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const id = parseInt(req.params.id);
      const { applied } = req.body;
      
      if (typeof applied !== 'boolean') {
        return res.status(400).json({ message: 'Applied status must be a boolean' });
      }
      
      const updatedRecommendation = await storage.markRecommendationApplied(id, applied);
      res.json(updatedRecommendation);
    } catch (error) {
      console.error('Error updating recommendation applied status:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.delete('/api/recommendations/:id', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteRecommendation(id);
      
      if (success) {
        res.json({ message: 'Recommendation deleted successfully' });
      } else {
        res.status(404).json({ message: 'Recommendation not found' });
      }
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Learning Module Routes
  
  // Get all learning modules
  app.get('/api/learning-modules', async (req, res) => {
    try {
      const modules = await storage.getLearningModules();
      res.json(modules);
    } catch (error) {
      console.error('Error fetching learning modules:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get a specific learning module
  app.get('/api/learning-modules/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const module = await storage.getLearningModule(id);
      
      if (!module) {
        return res.status(404).json({ message: 'Learning module not found' });
      }
      
      res.json(module);
    } catch (error) {
      console.error('Error fetching learning module:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Create new learning module (admin only)
  app.post('/api/learning-modules', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const moduleData = insertLearningModuleSchema.parse(req.body);
      const newModule = await storage.createLearningModule(moduleData);
      res.status(201).json(newModule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        console.error('Error creating learning module:', error);
        res.status(500).json({ message: 'Server error' });
      }
    }
  });
  
  // Get lessons for a module
  app.get('/api/learning-modules/:moduleId/lessons', async (req, res) => {
    try {
      const moduleId = parseInt(req.params.moduleId);
      const lessons = await storage.getLessons(moduleId);
      res.json(lessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get a specific lesson
  app.get('/api/lessons/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const lesson = await storage.getLesson(id);
      
      if (!lesson) {
        return res.status(404).json({ message: 'Lesson not found' });
      }
      
      res.json(lesson);
    } catch (error) {
      console.error('Error fetching lesson:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get quizzes for a lesson
  app.get('/api/lessons/:lessonId/quizzes', async (req, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const quizzes = await storage.getQuizzes(lessonId);
      res.json(quizzes);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get a specific quiz with its questions and answers
  app.get('/api/quizzes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quiz = await storage.getQuiz(id);
      
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }
      
      // Get all questions for this quiz
      const questions = await storage.getQuizQuestions(id);
      
      // Get answers for each question
      const questionsWithAnswers = await Promise.all(
        questions.map(async (question) => {
          const answers = await storage.getQuizAnswers(question.id);
          return {
            ...question,
            answers
          };
        })
      );
      
      res.json({
        ...quiz,
        questions: questionsWithAnswers
      });
    } catch (error) {
      console.error('Error fetching quiz:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Submit a quiz answer and track user progress
  app.post('/api/quizzes/:id/submit', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const quizId = parseInt(req.params.id);
      const { answers } = req.body;
      
      if (!Array.isArray(answers)) {
        return res.status(400).json({ message: 'Invalid answers format' });
      }
      
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }
      
      // Get questions and correct answers
      const questions = await storage.getQuizQuestions(quizId);
      
      // Calculate score
      let correctAnswers = 0;
      
      for (const answer of answers) {
        const question = questions.find(q => q.id === answer.questionId);
        if (!question) continue;
        
        const questionAnswers = await storage.getQuizAnswers(question.id);
        const correctAnswer = questionAnswers.find(a => a.isCorrect);
        
        if (correctAnswer && correctAnswer.id === answer.answerId) {
          correctAnswers++;
        }
      }
      
      const score = Math.round((correctAnswers / questions.length) * 100);
      const passed = score >= (quiz.passingScore || 70);
      
      // Check if user already has progress for this quiz
      let userProgress = await storage.getUserProgressForQuiz(req.session.userId, quizId);
      
      if (userProgress) {
        // Update existing progress
        userProgress = await storage.updateUserProgress(userProgress.id, {
          score,
          completed: passed,
          completedAt: passed ? new Date() : null,
          earnedPoints: passed ? quiz.points : 0,
          updatedAt: new Date()
        });
      } else {
        // Create new progress
        userProgress = await storage.trackUserProgress({
          userId: req.session.userId,
          moduleId: quiz.moduleId,
          lessonId: quiz.lessonId,
          quizId: quiz.id,
          score,
          completed: passed,
          completedAt: passed ? new Date() : null,
          earnedPoints: passed ? quiz.points : 0
        });
      }
      
      // Get all available badges
      const badges = await storage.getBadges();
      
      // Check if user should receive any badges
      const userBadges = await storage.getUserBadges(req.session.userId);
      const newBadges = [];
      
      // Example: award badge for perfect score
      if (score === 100) {
        const perfectScoreBadge = badges.find(b => b.name.includes("Perfect Score") || b.requirement.includes("Perfect Score"));
        
        if (perfectScoreBadge && !userBadges.some(ub => ub.badgeId === perfectScoreBadge.id)) {
          await storage.awardBadge(req.session.userId, perfectScoreBadge.id);
          newBadges.push(perfectScoreBadge);
        }
      }
      
      res.json({
        score,
        passed,
        userProgress,
        newBadges
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Mark a lesson as completed
  app.post('/api/lessons/:id/complete', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const lessonId = parseInt(req.params.id);
      const lesson = await storage.getLesson(lessonId);
      
      if (!lesson) {
        return res.status(404).json({ message: 'Lesson not found' });
      }
      
      // Check if user already has progress for this lesson
      let userProgress = await storage.getUserProgressForLesson(req.session.userId, lessonId);
      
      if (userProgress) {
        // Update existing progress
        userProgress = await storage.updateUserProgress(userProgress.id, {
          completed: true,
          completedAt: new Date(),
          earnedPoints: lesson.points,
          updatedAt: new Date()
        });
      } else {
        // Create new progress
        userProgress = await storage.trackUserProgress({
          userId: req.session.userId,
          moduleId: lesson.moduleId,
          lessonId: lesson.id,
          quizId: null,
          completed: true,
          completedAt: new Date(),
          score: null,
          earnedPoints: lesson.points
        });
      }
      
      // Get all the lessons for this module
      const moduleId = lesson.moduleId;
      const allLessons = await storage.getLessons(moduleId);
      
      // Check if user has completed all lessons in the module
      const userProgressItems = await storage.getUserProgressForModule(req.session.userId, moduleId);
      const completedLessonIds = userProgressItems
        .filter(p => p.completed && p.lessonId !== null)
        .map(p => p.lessonId);
      
      const allLessonsCompleted = allLessons.every(l => 
        completedLessonIds.includes(l.id)
      );
      
      // Award module completion badge if all lessons are completed
      let moduleBadge = null;
      if (allLessonsCompleted) {
        const module = await storage.getLearningModule(moduleId);
        if (module) {
          // Find a badge related to completing this module
          const badges = await storage.getBadges();
          const moduleCompletionBadge = badges.find(b => 
            b.name.includes(module.title) || 
            b.requirement.includes(module.title) ||
            b.requirement.includes(`Complete all lessons in`)
          );
          
          if (moduleCompletionBadge) {
            const userBadges = await storage.getUserBadges(req.session.userId);
            if (!userBadges.some(ub => ub.badgeId === moduleCompletionBadge.id)) {
              await storage.awardBadge(req.session.userId, moduleCompletionBadge.id);
              moduleBadge = moduleCompletionBadge;
            }
          }
        }
      }
      
      res.json({
        userProgress,
        allLessonsCompleted,
        earnedBadge: moduleBadge
      });
    } catch (error) {
      console.error('Error completing lesson:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get user progress
  app.get('/api/user-progress', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const progress = await storage.getUserProgress(req.session.userId);
      res.json(progress);
    } catch (error) {
      console.error('Error fetching user progress:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get user badges
  app.get('/api/user-badges', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userBadges = await storage.getUserBadges(req.session.userId);
      
      // Include full badge details
      const badges = await storage.getBadges();
      
      const badgesWithDetails = userBadges.map(userBadge => {
        const badgeDetails = badges.find(b => b.id === userBadge.badgeId);
        return {
          ...userBadge,
          badge: badgeDetails
        };
      });
      
      res.json(badgesWithDetails);
    } catch (error) {
      console.error('Error fetching user badges:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get all badges
  app.get('/api/badges', async (req, res) => {
    try {
      const badges = await storage.getBadges();
      res.json(badges);
    } catch (error) {
      console.error('Error fetching badges:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // User Learning Progress routes
  app.get('/api/learning/progress', async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const userId = req.session.userId;
      const userProgress = await storage.getUserProgress(userId);
      res.json(userProgress);
    } catch (error) {
      console.error('Error fetching user progress:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/learning/badges', async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const userId = req.session.userId;
      const userBadges = await storage.getUserBadges(userId);
      const badges = await storage.getBadges();

      res.json({
        badges,
        userBadges
      });
    } catch (error) {
      console.error('Error fetching badges:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/learning/progress', async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const userId = req.session.userId;
      const { lessonId, moduleId, completed } = req.body;
      
      const progressData = {
        userId,
        lessonId,
        moduleId,
        completed: completed || false,
        lastAccessedAt: new Date()
      };
      
      const updatedProgress = await storage.trackUserProgress(progressData);
      res.json(updatedProgress);
    } catch (error) {
      console.error('Error updating progress:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Debug route to check storage methods
  app.get('/api/debug/storage', async (req, res) => {
    const storageMethodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(storage))
      .filter(name => typeof storage[name] === 'function' && name !== 'constructor');
    
    // Get all actual methods available on storage instance
    const allMethods = [];
    for (const key in storage) {
      if (typeof storage[key] === 'function') {
        allMethods.push(key);
      }
    }
    
    res.json({
      methodsCount: storageMethodNames.length,
      methodNames: storageMethodNames,
      allMethodsCount: allMethods.length,
      allMethods: allMethods,
      hasGetTradingWorkflows: 'getTradingWorkflows' in storage,
      type: typeof storage.getTradingWorkflows
    });
  });

  // Trading Workflow routes
  app.get('/api/workflows', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      // Check if we have workflows for this user, if not create sample ones
      const existingWorkflows = await storage.getTradingWorkflows(req.session.userId);
      
      if (existingWorkflows.length === 0) {
        console.log("Initializing sample trading workflows");
        
        // Create sample workflow 1
        await storage.createTradingWorkflow({
          userId: req.session.userId,
          name: "SMA Crossover Strategy",
          description: "Buy when 50-day SMA crosses above 200-day SMA, sell when it crosses below",
          status: "active",
          isAutomatic: true,
          priority: 1,
          schedule: "0 9 * * 1-5", // Every weekday at 9 AM
        });
        
        // Create sample workflow 2
        await storage.createTradingWorkflow({
          userId: req.session.userId,
          name: "RSI Swing Strategy",
          description: "Buy when RSI is oversold (below 30), sell when overbought (above 70)",
          status: "active",
          isAutomatic: true,
          priority: 2,
          schedule: "0 10 * * 1-5", // Every weekday at 10 AM
        });
      }
      
      // Get the workflows from storage
      const workflows = await storage.getTradingWorkflows(req.session.userId);
      return res.json(workflows);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.get('/api/workflows/:id', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const workflowId = parseInt(req.params.id);
      
      // Get workflow from storage
      const workflow = await storage.getTradingWorkflow(workflowId);
      
      if (!workflow) {
        return res.status(404).json({ message: 'Workflow not found' });
      }
      
      // Check if this workflow belongs to the current user
      if (workflow.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      return res.json(workflow);
    } catch (error) {
      console.error('Error fetching workflow:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.post('/api/workflows', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const workflowData = insertTradingWorkflowSchema.parse(req.body);
      const workflow = await storage.createTradingWorkflow({
        ...workflowData,
        userId: req.session.userId
      });
      
      res.status(201).json(workflow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        console.error('Error creating workflow:', error);
        res.status(500).json({ message: 'Server error' });
      }
    }
  });
  
  app.patch('/api/workflows/:id', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const workflowId = parseInt(req.params.id);
      const workflow = await storage.getTradingWorkflow(workflowId);
      
      if (!workflow) {
        return res.status(404).json({ message: 'Workflow not found' });
      }
      
      if (workflow.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const updatedWorkflow = await storage.updateTradingWorkflow(workflowId, req.body);
      res.json(updatedWorkflow);
    } catch (error) {
      console.error('Error updating workflow:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.delete('/api/workflows/:id', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const workflowId = parseInt(req.params.id);
      const workflow = await storage.getTradingWorkflow(workflowId);
      
      if (!workflow) {
        return res.status(404).json({ message: 'Workflow not found' });
      }
      
      if (workflow.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      await storage.deleteTradingWorkflow(workflowId);
      res.json({ message: 'Workflow deleted' });
    } catch (error) {
      console.error('Error deleting workflow:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.post('/api/workflows/:id/status', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const workflowId = parseInt(req.params.id);
      const workflow = await storage.getTradingWorkflow(workflowId);
      
      if (!workflow) {
        return res.status(404).json({ message: 'Workflow not found' });
      }
      
      if (workflow.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const { status } = req.body;
      
      if (!status || !['active', 'inactive', 'paused', 'archived'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      const updatedWorkflow = await storage.updateWorkflowStatus(workflowId, status);
      res.json(updatedWorkflow);
    } catch (error) {
      console.error('Error updating workflow status:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Workflow Steps routes
  app.get('/api/workflows/:id/steps', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const workflowId = parseInt(req.params.id);
      const workflow = await storage.getTradingWorkflow(workflowId);
      
      if (!workflow) {
        return res.status(404).json({ message: 'Workflow not found' });
      }
      
      if (workflow.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // Get steps from storage
      const steps = await storage.getWorkflowSteps(workflowId);
      
      // If no steps exist yet, create sample steps for this workflow
      if (steps.length === 0) {
        if (workflow.name.includes("SMA Crossover")) {
          // Create sample SMA crossover steps
          await storage.createWorkflowStep({
            workflowId,
            name: "Check 50-day SMA",
            order: 1,
            type: "indicator",
            description: "Calculate and check 50-day SMA",
            config: {
              indicator: "SMA",
              period: 50,
              symbol: "NSE:RELIANCE"
            }
          });
          
          await storage.createWorkflowStep({
            workflowId,
            name: "Check 200-day SMA",
            order: 2,
            type: "indicator",
            description: "Calculate and check 200-day SMA",
            config: {
              indicator: "SMA",
              period: 200,
              symbol: "NSE:RELIANCE"
            }
          });
          
          await storage.createWorkflowStep({
            workflowId,
            name: "Execute Trade",
            order: 3,
            type: "action",
            description: "Execute buy or sell trade",
            config: {
              actionType: "trade",
              tradeSize: "25%"
            }
          });
          
          // Fetch the newly created steps
          return res.json(await storage.getWorkflowSteps(workflowId));
        } else if (workflow.name.includes("RSI")) {
          // Create sample RSI steps
          await storage.createWorkflowStep({
            workflowId,
            name: "Calculate RSI",
            order: 1,
            type: "indicator",
            description: "Calculate 14-period RSI",
            config: {
              indicator: "RSI",
              period: 14,
              symbol: "NSE:HDFCBANK"
            }
          });
          
          await storage.createWorkflowStep({
            workflowId,
            name: "Check Overbought/Oversold",
            order: 2,
            type: "condition",
            description: "Check if RSI is above 70 or below 30",
            config: {
              checkType: "threshold",
              upperThreshold: 70,
              lowerThreshold: 30
            }
          });
          
          await storage.createWorkflowStep({
            workflowId,
            name: "Execute Trade",
            order: 3,
            type: "action",
            description: "Buy if oversold, sell if overbought",
            config: {
              actionType: "trade",
              tradeSize: "15%"
            }
          });
          
          // Fetch the newly created steps
          return res.json(await storage.getWorkflowSteps(workflowId));
        }
      }
      
      return res.json(steps);
    } catch (error) {
      console.error('Error fetching workflow steps:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.post('/api/workflows/:id/steps', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const workflowId = parseInt(req.params.id);
      const workflow = await storage.getTradingWorkflow(workflowId);
      
      if (!workflow) {
        return res.status(404).json({ message: 'Workflow not found' });
      }
      
      if (workflow.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const stepData = insertWorkflowStepSchema.parse(req.body);
      const step = await storage.createWorkflowStep({
        ...stepData,
        workflowId
      });
      
      res.status(201).json(step);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        console.error('Error creating workflow step:', error);
        res.status(500).json({ message: 'Server error' });
      }
    }
  });
  
  // Workflow Conditions routes
  app.get('/api/workflows/:id/conditions', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const workflowId = parseInt(req.params.id);
      const workflow = await storage.getTradingWorkflow(workflowId);
      
      if (!workflow) {
        return res.status(404).json({ message: 'Workflow not found' });
      }
      
      if (workflow.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const conditions = await storage.getWorkflowConditions(workflowId);
      res.json(conditions);
    } catch (error) {
      console.error('Error fetching workflow conditions:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.post('/api/workflows/:id/conditions', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const workflowId = parseInt(req.params.id);
      const workflow = await storage.getTradingWorkflow(workflowId);
      
      if (!workflow) {
        return res.status(404).json({ message: 'Workflow not found' });
      }
      
      if (workflow.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const conditionData = insertWorkflowConditionSchema.parse(req.body);
      const condition = await storage.createWorkflowCondition({
        ...conditionData,
        workflowId
      });
      
      res.status(201).json(condition);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        console.error('Error creating workflow condition:', error);
        res.status(500).json({ message: 'Server error' });
      }
    }
  });
  
  // Workflow Actions routes
  app.get('/api/workflows/:id/actions', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const workflowId = parseInt(req.params.id);
      const workflow = await storage.getTradingWorkflow(workflowId);
      
      if (!workflow) {
        return res.status(404).json({ message: 'Workflow not found' });
      }
      
      if (workflow.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const actions = await storage.getWorkflowActions(workflowId);
      res.json(actions);
    } catch (error) {
      console.error('Error fetching workflow actions:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.post('/api/workflows/:id/actions', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const workflowId = parseInt(req.params.id);
      const workflow = await storage.getTradingWorkflow(workflowId);
      
      if (!workflow) {
        return res.status(404).json({ message: 'Workflow not found' });
      }
      
      if (workflow.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const actionData = insertWorkflowActionSchema.parse(req.body);
      const action = await storage.createWorkflowAction({
        ...actionData,
        workflowId
      });
      
      res.status(201).json(action);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        console.error('Error creating workflow action:', error);
        res.status(500).json({ message: 'Server error' });
      }
    }
  });
  
  // Workflow Execution Logs routes
  app.get('/api/workflows/:id/logs', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const workflowId = parseInt(req.params.id);
      const workflow = await storage.getTradingWorkflow(workflowId);
      
      if (!workflow) {
        return res.status(404).json({ message: 'Workflow not found' });
      }
      
      if (workflow.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const logs = await storage.getWorkflowExecutionLogs(workflowId, limit);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching workflow logs:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Manual workflow execution
  app.post('/api/workflows/:id/execute', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const workflowId = parseInt(req.params.id);
      const workflow = await storage.getTradingWorkflow(workflowId);
      
      if (!workflow) {
        return res.status(404).json({ message: 'Workflow not found' });
      }
      
      if (workflow.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // Create a new execution log for manual execution
      const log = await storage.createWorkflowExecutionLog({
        workflowId,
        status: 'pending',
        message: 'Manual execution started',
        triggeredBy: 'user',
        details: {
          requestedBy: req.session.userId,
          triggeredAt: new Date()
        }
      });
      
      // Update the workflow to reflect the execution
      await storage.updateTradingWorkflow(workflowId, {
        lastExecutedAt: new Date(),
        executionCount: (workflow.executionCount || 0) + 1
      });
      
      // In a real implementation, this would execute the workflow in the background
      // For this demo, we'll just simulate completion with a success message
      setTimeout(async () => {
        await storage.createWorkflowExecutionLog({
          workflowId,
          status: 'success',
          message: 'Manual execution completed',
          triggeredBy: 'user',
          details: {
            requestedBy: req.session.userId,
            completedAt: new Date()
          }
        });
      }, 2000); // Wait 2 seconds to simulate processing
      
      res.json({
        message: 'Workflow execution started',
        log
      });
    } catch (error) {
      console.error('Error executing workflow:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  return httpServer;
}
