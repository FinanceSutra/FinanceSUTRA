import {
  users, type User, type InsertUser,
  strategies, type Strategy, type InsertStrategy,
  backtests, type Backtest, type InsertBacktest,
  trades, type Trade, type InsertTrade,
  brokerConnections, type BrokerConnection, type InsertBrokerConnection,
  marketData, type MarketData, type InsertMarketData,
  deployedStrategies, type DeployedStrategy, type InsertDeployedStrategy,
  type RiskLimit, type InsertRiskLimit,
  type PositionSizingRule, type InsertPositionSizingRule,
  type MarketExposure, type InsertMarketExposure,
  type SectorExposure, type InsertSectorExposure,
  type PortfolioRisk, type InsertPortfolioRisk,
  type StrategyCorrelation, type InsertStrategyCorrelation
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User>;
  updateSubscriptionStatus(userId: number, status: string): Promise<User>;
  updateUserPlan(userId: number, plan: string): Promise<User>;
  
  // Strategy operations
  getStrategies(userId: number): Promise<Strategy[]>;
  getStrategy(id: number): Promise<Strategy | undefined>;
  createStrategy(strategy: InsertStrategy): Promise<Strategy>;
  updateStrategy(id: number, strategy: Partial<Strategy>): Promise<Strategy>;
  deleteStrategy(id: number): Promise<boolean>;
  
  // Backtest operations
  getBacktests(strategyId: number): Promise<Backtest[]>;
  getBacktest(id: number): Promise<Backtest | undefined>;
  createBacktest(backtest: InsertBacktest): Promise<Backtest>;
  
  // Trade operations
  getTrades(userId: number, limit?: number): Promise<Trade[]>;
  getTradesByStrategy(strategyId: number): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  updateTrade(id: number, trade: Partial<Trade>): Promise<Trade>;
  
  // Broker operations
  getBrokerConnections(userId: number): Promise<BrokerConnection[]>;
  getBrokerConnection(id: number): Promise<BrokerConnection | undefined>;
  createBrokerConnection(connection: InsertBrokerConnection): Promise<BrokerConnection>;
  updateBrokerConnection(id: number, connection: Partial<BrokerConnection>): Promise<BrokerConnection>;
  deleteBrokerConnection(id: number): Promise<boolean>;
  
  // Market data operations
  getMarketData(symbol: string, timeframe: string, start: Date, end: Date): Promise<MarketData[]>;
  saveMarketData(data: InsertMarketData[]): Promise<MarketData[]>;
  
  // Deployed strategies operations
  getDeployedStrategies(userId: number): Promise<DeployedStrategy[]>;
  getDeployedStrategy(id: number): Promise<DeployedStrategy | undefined>;
  createDeployedStrategy(deployedStrategy: InsertDeployedStrategy): Promise<DeployedStrategy>;
  updateDeployedStrategy(id: number, deployedStrategy: Partial<DeployedStrategy>): Promise<DeployedStrategy>;
  updateDeployedStrategyStatus(id: number, status: string): Promise<DeployedStrategy>;
  deleteDeployedStrategy(id: number): Promise<boolean>;
  
  // Risk Management operations
  // Portfolio Risk
  getPortfolioRisk(userId: number): Promise<PortfolioRisk | undefined>;
  updatePortfolioRisk(userId: number, data: Partial<PortfolioRisk>): Promise<PortfolioRisk>;
  
  // Risk Limits
  getRiskLimits(userId: number): Promise<RiskLimit[]>;
  getRiskLimit(id: number): Promise<RiskLimit | undefined>;
  createRiskLimit(riskLimit: InsertRiskLimit): Promise<RiskLimit>;
  updateRiskLimit(id: number, data: Partial<RiskLimit>): Promise<RiskLimit>;
  deleteRiskLimit(id: number): Promise<boolean>;
  
  // Position Sizing Rules
  getPositionSizingRules(userId: number): Promise<PositionSizingRule[]>;
  getPositionSizingRule(id: number): Promise<PositionSizingRule | undefined>;
  createPositionSizingRule(rule: InsertPositionSizingRule): Promise<PositionSizingRule>;
  updatePositionSizingRule(id: number, data: Partial<PositionSizingRule>): Promise<PositionSizingRule>;
  deletePositionSizingRule(id: number): Promise<boolean>;
  
  // Market Exposure
  getMarketExposures(userId: number): Promise<MarketExposure[]>;
  updateMarketExposures(userId: number, exposures: InsertMarketExposure[]): Promise<MarketExposure[]>;
  
  // Sector Exposure
  getSectorExposures(userId: number): Promise<SectorExposure[]>;
  updateSectorExposures(userId: number, exposures: InsertSectorExposure[]): Promise<SectorExposure[]>;
  
  // Strategy Correlation
  getStrategyCorrelations(userId: number): Promise<StrategyCorrelation[]>;
  updateStrategyCorrelations(userId: number, correlations: InsertStrategyCorrelation[]): Promise<StrategyCorrelation[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private strategies: Map<number, Strategy>;
  private backtests: Map<number, Backtest>;
  private trades: Map<number, Trade>;
  private brokerConnections: Map<number, BrokerConnection>;
  private marketData: Map<string, MarketData>;
  private deployedStrategies: Map<number, DeployedStrategy>;
  
  // Risk Management data structures
  private portfolioRisks: Map<number, PortfolioRisk>;
  private riskLimits: Map<number, RiskLimit>;
  private positionSizingRules: Map<number, PositionSizingRule>;
  private marketExposures: Map<string, MarketExposure>;
  private sectorExposures: Map<string, SectorExposure>;
  private strategyCorrelations: Map<number, StrategyCorrelation>;
  
  private userId = 1;
  private strategyId = 1;
  private backtestId = 1;
  private tradeId = 1;
  private brokerConnectionId = 1;
  private marketDataId = 1;
  private deployedStrategyId = 1;
  private riskLimitId = 1;
  private positionRuleId = 1;
  private marketExposureId = 1;
  private sectorExposureId = 1;
  private portfolioRiskId = 1;
  private strategyCorrelationId = 1;
  
  constructor() {
    this.users = new Map();
    this.strategies = new Map();
    this.backtests = new Map();
    this.trades = new Map();
    this.brokerConnections = new Map();
    this.marketData = new Map();
    this.deployedStrategies = new Map();
    
    // Initialize risk management data structures
    this.portfolioRisks = new Map();
    this.riskLimits = new Map();
    this.positionSizingRules = new Map();
    this.marketExposures = new Map();
    this.sectorExposures = new Map();
    this.strategyCorrelations = new Map();
    
    // Add sample data for development
    this.initializeSampleData();
  }
  
  private initializeSampleData() {
    // Sample user
    const user: User = {
      id: this.userId++,
      username: "demo",
      password: "$2a$10$demopasswordhash",
      email: "demo@example.com",
      fullName: "Demo User",
      createdAt: new Date(),
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: "inactive",
      plan: "free"
    };
    this.users.set(user.id, user);
    
    // Sample strategies
    const strategy1: Strategy = {
      id: this.strategyId++,
      userId: user.id,
      name: "MA Crossover ETF",
      description: "Moving average crossover strategy for ETFs",
      code: `
class MACrossoverStrategy:
    def __init__(self, fast_period=12, slow_period=26):
        self.fast_period = fast_period
        self.slow_period = slow_period
        
    def generate_signals(self, data):
        """Generate trading signals based on moving average crossover."""
        
        data['fast_ma'] = data['close'].rolling(self.fast_period).mean()
        data['slow_ma'] = data['close'].rolling(self.slow_period).mean()
        
        data['signal'] = 0
        data.loc[data['fast_ma'] > data['slow_ma'], 'signal'] = 1    # Buy signal
        data.loc[data['fast_ma'] < data['slow_ma'], 'signal'] = -1   # Sell signal
        
        return data
    
    def backtest(self, data, initial_capital=10000):
        """Run backtest and calculate performance metrics."""
        
        signals = self.generate_signals(data)
        return self._calculate_returns(signals, initial_capital)
      `,
      symbol: "NASDAQ:QQQ",
      timeframe: "1d",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.strategies.set(strategy1.id, strategy1);
    
    const strategy2: Strategy = {
      id: this.strategyId++,
      userId: user.id,
      name: "RSI Divergence",
      description: "RSI divergence detection strategy",
      code: `
class RSIDivergenceStrategy:
    def __init__(self, rsi_period=14, overbought=70, oversold=30):
        self.rsi_period = rsi_period
        self.overbought = overbought
        self.oversold = oversold
        
    def generate_signals(self, data):
        """Generate trading signals based on RSI divergence."""
        
        data['rsi'] = talib.RSI(data['close'], timeperiod=self.rsi_period)
        data['signal'] = 0
        
        # Simplified divergence logic
        for i in range(1, len(data)):
            if data['rsi'].iloc[i] < self.oversold and data['rsi'].iloc[i-1] > self.oversold:
                data.loc[data.index[i], 'signal'] = 1  # Buy signal
            elif data['rsi'].iloc[i] > self.overbought and data['rsi'].iloc[i-1] < self.overbought:
                data.loc[data.index[i], 'signal'] = -1  # Sell signal
        
        return data
    
    def backtest(self, data, initial_capital=10000):
        """Run backtest and calculate performance metrics."""
        
        signals = self.generate_signals(data)
        return self._calculate_returns(signals, initial_capital)
      `,
      symbol: "FOREX:EURUSD",
      timeframe: "1h",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.strategies.set(strategy2.id, strategy2);
    
    // Add sample backtest results
    const backtest1: Backtest = {
      id: this.backtestId++,
      strategyId: strategy1.id,
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-06-30'),
      initialCapital: 10000,
      finalCapital: 12346.52,
      totalPnl: 2346.52,
      percentReturn: 23.47,
      sharpeRatio: 1.8,
      maxDrawdown: 5.2,
      winRate: 68,
      trades: 42,
      equity: [{ date: '2023-01-01', value: 10000 }, { date: '2023-06-30', value: 12346.52 }],
      trades_data: [
        { date: '2023-01-15', type: 'BUY', price: 350.25, quantity: 10, pnl: 520.30 },
        { date: '2023-02-22', type: 'SELL', price: 358.45, quantity: 10, pnl: 82.00 }
      ],
      createdAt: new Date()
    };
    this.backtests.set(backtest1.id, backtest1);
    
    // Add sample trades
    const trade1: Trade = {
      id: this.tradeId++,
      strategyId: strategy1.id,
      userId: user.id,
      symbol: "AAPL",
      type: "BUY",
      price: 182.50,
      quantity: 10,
      pnl: 142.50,
      percentPnl: 7.8,
      isOpen: false,
      openedAt: new Date(Date.now() - 86400000 * 2),
      closedAt: new Date()
    };
    this.trades.set(trade1.id, trade1);
    
    const trade2: Trade = {
      id: this.tradeId++,
      strategyId: strategy2.id,
      userId: user.id,
      symbol: "EURUSD",
      type: "SELL",
      price: 1.08654,
      quantity: 10000,
      pnl: 87.25,
      percentPnl: 0.8,
      isOpen: false,
      openedAt: new Date(Date.now() - 86400000 * 3),
      closedAt: new Date(Date.now() - 86400000)
    };
    this.trades.set(trade2.id, trade2);
    
    // Add sample broker connection
    const brokerConnection: BrokerConnection = {
      id: this.brokerConnectionId++,
      userId: user.id,
      broker: "Alpaca",
      apiKey: "demo_api_key",
      apiSecret: "demo_api_secret",
      apiPassphrase: null,
      apiToken: null,
      baseUrl: null,
      environment: "paper",
      isActive: true,
      accountId: "demo_account",
      accountName: "Demo Trading Account",
      status: "connected",
      lastConnected: new Date(),
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.brokerConnections.set(brokerConnection.id, brokerConnection);
    
    // Add sample deployed strategies
    const deployedStrategy1: DeployedStrategy = {
      id: this.deployedStrategyId++,
      strategyId: strategy1.id,
      userId: user.id,
      brokerId: brokerConnection.id,
      name: "QQQ MA Crossover",
      lotMultiplier: "2",
      capitalDeployed: "25000",
      tradingType: "paper",
      status: "running",
      currentPnl: "750.25",
      percentPnl: "3",
      deployedAt: new Date(Date.now() - 86400000 * 15), // 15 days ago
      lastUpdated: new Date(),
      metadata: null
    };
    this.deployedStrategies.set(deployedStrategy1.id, deployedStrategy1);
    
    const deployedStrategy2: DeployedStrategy = {
      id: this.deployedStrategyId++,
      strategyId: strategy2.id,
      userId: user.id,
      brokerId: brokerConnection.id,
      name: "EUR/USD RSI Strategy",
      lotMultiplier: "1",
      capitalDeployed: "10000",
      tradingType: "paper",
      status: "paused",
      currentPnl: "-120.50",
      percentPnl: "-1.2",
      deployedAt: new Date(Date.now() - 86400000 * 5), // 5 days ago
      lastUpdated: new Date(Date.now() - 86400000 * 1), // 1 day ago
      metadata: null
    };
    this.deployedStrategies.set(deployedStrategy2.id, deployedStrategy2);
    
    // Add sample risk management data
    // Portfolio Risk
    const portfolioRisk: PortfolioRisk = {
      id: this.portfolioRiskId++,
      userId: user.id,
      totalValue: 35000,
      dailyValue: 34750,
      dailyChange: -0.7,
      weeklyChange: 2.3,
      monthlyChange: 5.8,
      currentDrawdown: 1.2,
      maxDrawdown: 4.5,
      volatility: 12.4,
      sharpeRatio: 1.3,
      beta: 0.85,
      strategies: 2,
      activeTrades: 1,
      updatedAt: new Date()
    };
    this.portfolioRisks.set(user.id, portfolioRisk);
    
    // Risk Limits
    const riskLimit1: RiskLimit = {
      id: this.riskLimitId++,
      userId: user.id,
      name: "Daily Loss Limit",
      description: "Maximum daily loss across all strategies",
      type: "account",
      metric: "dailyLoss",
      threshold: 5,
      currentValue: 0.7,
      status: "safe",
      action: "notify",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.riskLimits.set(riskLimit1.id, riskLimit1);
    
    const riskLimit2: RiskLimit = {
      id: this.riskLimitId++,
      userId: user.id,
      name: "Single Strategy Maximum Exposure",
      description: "Maximum capital allocated to a single strategy",
      type: "strategy",
      metric: "exposure",
      threshold: 30,
      currentValue: 25,
      status: "safe",
      action: "notify",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.riskLimits.set(riskLimit2.id, riskLimit2);
    
    // Position Sizing Rule
    const positionRule: PositionSizingRule = {
      id: this.positionRuleId++,
      userId: user.id,
      name: "Fixed Risk Per Trade",
      description: "Risk 1% of account per trade",
      strategy: "All",
      method: "risk-based",
      riskPerTrade: 1,
      maxPositionSize: 5,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.positionSizingRules.set(positionRule.id, positionRule);
    
    // Market Exposure
    const marketExposure1: MarketExposure = {
      id: this.marketExposureId++,
      userId: user.id,
      market: "Equities",
      percentage: 70,
      updatedAt: new Date()
    };
    const marketExposure2: MarketExposure = {
      id: this.marketExposureId++,
      userId: user.id,
      market: "Forex",
      percentage: 20,
      updatedAt: new Date()
    };
    const marketExposure3: MarketExposure = {
      id: this.marketExposureId++,
      userId: user.id,
      market: "Crypto",
      percentage: 10,
      updatedAt: new Date()
    };
    this.marketExposures.set(`${user.id}_Equities`, marketExposure1);
    this.marketExposures.set(`${user.id}_Forex`, marketExposure2);
    this.marketExposures.set(`${user.id}_Crypto`, marketExposure3);
    
    // Sector Exposure
    const sectorExposure1: SectorExposure = {
      id: this.sectorExposureId++,
      userId: user.id,
      sector: "Technology",
      percentage: 40,
      updatedAt: new Date()
    };
    const sectorExposure2: SectorExposure = {
      id: this.sectorExposureId++,
      userId: user.id,
      sector: "Healthcare",
      percentage: 15,
      updatedAt: new Date()
    };
    const sectorExposure3: SectorExposure = {
      id: this.sectorExposureId++,
      userId: user.id,
      sector: "Financial",
      percentage: 15,
      updatedAt: new Date()
    };
    this.sectorExposures.set(`${user.id}_Technology`, sectorExposure1);
    this.sectorExposures.set(`${user.id}_Healthcare`, sectorExposure2);
    this.sectorExposures.set(`${user.id}_Financial`, sectorExposure3);
    
    // Strategy Correlation
    const strategyCorrelation: StrategyCorrelation = {
      id: this.strategyCorrelationId++,
      userId: user.id,
      strategyId: strategy1.id,
      strategyName: strategy1.name,
      correlationData: JSON.stringify({
        [strategy2.id]: 0.25 // Low correlation with strategy 2
      }),
      updatedAt: new Date()
    };
    this.strategyCorrelations.set(strategyCorrelation.id, strategyCorrelation);
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date(),
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: "inactive",
      plan: "free"
    };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    
    const updatedUser: User = {
      ...user,
      stripeCustomerId: stripeInfo.stripeCustomerId,
      stripeSubscriptionId: stripeInfo.stripeSubscriptionId,
      subscriptionStatus: "active",
      plan: "pro"
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateSubscriptionStatus(userId: number, status: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    
    const updatedUser: User = {
      ...user,
      subscriptionStatus: status,
      plan: status === "active" ? "pro" : "free"
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserPlan(userId: number, plan: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    
    const updatedUser: User = {
      ...user,
      plan
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  // Strategy operations
  async getStrategies(userId: number): Promise<Strategy[]> {
    return Array.from(this.strategies.values()).filter(strategy => strategy.userId === userId);
  }
  
  async getStrategy(id: number): Promise<Strategy | undefined> {
    return this.strategies.get(id);
  }
  
  async createStrategy(strategy: InsertStrategy): Promise<Strategy> {
    const id = this.strategyId++;
    const newStrategy: Strategy = {
      ...strategy,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.strategies.set(id, newStrategy);
    return newStrategy;
  }
  
  async updateStrategy(id: number, strategyUpdate: Partial<Strategy>): Promise<Strategy> {
    const strategy = await this.getStrategy(id);
    if (!strategy) {
      throw new Error(`Strategy with id ${id} not found`);
    }
    
    const updatedStrategy: Strategy = {
      ...strategy,
      ...strategyUpdate,
      updatedAt: new Date()
    };
    
    this.strategies.set(id, updatedStrategy);
    return updatedStrategy;
  }
  
  async deleteStrategy(id: number): Promise<boolean> {
    return this.strategies.delete(id);
  }
  
  // Backtest operations
  async getBacktests(strategyId: number): Promise<Backtest[]> {
    return Array.from(this.backtests.values())
      .filter(backtest => backtest.strategyId === strategyId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getBacktest(id: number): Promise<Backtest | undefined> {
    return this.backtests.get(id);
  }
  
  async createBacktest(backtest: InsertBacktest): Promise<Backtest> {
    const id = this.backtestId++;
    const newBacktest: Backtest = {
      ...backtest,
      id,
      createdAt: new Date()
    };
    this.backtests.set(id, newBacktest);
    return newBacktest;
  }
  
  // Trade operations
  async getTrades(userId: number, limit = 50): Promise<Trade[]> {
    return Array.from(this.trades.values())
      .filter(trade => trade.userId === userId)
      .sort((a, b) => b.openedAt.getTime() - a.openedAt.getTime())
      .slice(0, limit);
  }
  
  async getTradesByStrategy(strategyId: number): Promise<Trade[]> {
    return Array.from(this.trades.values())
      .filter(trade => trade.strategyId === strategyId)
      .sort((a, b) => b.openedAt.getTime() - a.openedAt.getTime());
  }
  
  async createTrade(trade: InsertTrade): Promise<Trade> {
    const id = this.tradeId++;
    const newTrade: Trade = {
      ...trade,
      id
    };
    this.trades.set(id, newTrade);
    return newTrade;
  }
  
  async updateTrade(id: number, tradeUpdate: Partial<Trade>): Promise<Trade> {
    const trade = this.trades.get(id);
    if (!trade) {
      throw new Error(`Trade with id ${id} not found`);
    }
    
    const updatedTrade: Trade = {
      ...trade,
      ...tradeUpdate
    };
    
    this.trades.set(id, updatedTrade);
    return updatedTrade;
  }
  
  // Broker operations
  async getBrokerConnections(userId: number): Promise<BrokerConnection[]> {
    return Array.from(this.brokerConnections.values())
      .filter(connection => connection.userId === userId);
  }
  
  async getBrokerConnection(id: number): Promise<BrokerConnection | undefined> {
    return this.brokerConnections.get(id);
  }
  
  async createBrokerConnection(connection: InsertBrokerConnection): Promise<BrokerConnection> {
    // Check if connection for this broker already exists
    const existingConnection = Array.from(this.brokerConnections.values())
      .find(conn => conn.userId === connection.userId && conn.broker === connection.broker);
      
    if (existingConnection) {
      throw new Error(`Connection for ${connection.broker} already exists for this user`);
    }
    
    const id = this.brokerConnectionId++;
    const newConnection: BrokerConnection = {
      ...connection,
      id,
      apiKey: connection.apiKey || null,
      apiSecret: connection.apiSecret || null,
      apiPassphrase: connection.apiPassphrase || null,
      apiToken: connection.apiToken || null,
      baseUrl: connection.baseUrl || null,
      environment: connection.environment || "live",
      accountId: connection.accountId || null,
      accountName: connection.accountName || null,
      status: "pending", // Default to 'pending' until tested
      lastConnected: null,
      metadata: connection.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.brokerConnections.set(id, newConnection);
    return newConnection;
  }
  
  async updateBrokerConnection(id: number, connectionUpdate: Partial<BrokerConnection>): Promise<BrokerConnection> {
    const connection = await this.getBrokerConnection(id);
    if (!connection) {
      throw new Error(`Broker connection with id ${id} not found`);
    }
    
    const updatedConnection: BrokerConnection = {
      ...connection,
      ...connectionUpdate,
      updatedAt: new Date()
    };
    
    this.brokerConnections.set(id, updatedConnection);
    return updatedConnection;
  }
  
  async deleteBrokerConnection(id: number): Promise<boolean> {
    return this.brokerConnections.delete(id);
  }
  
  // Market data operations
  async getMarketData(symbol: string, timeframe: string, start: Date, end: Date): Promise<MarketData[]> {
    return Array.from(this.marketData.values())
      .filter(data => 
        data.symbol === symbol && 
        data.timeframe === timeframe &&
        data.timestamp >= start &&
        data.timestamp <= end
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
  
  async saveMarketData(dataItems: InsertMarketData[]): Promise<MarketData[]> {
    const savedItems: MarketData[] = [];
    
    for (const item of dataItems) {
      const id = this.marketDataId++;
      const key = `${item.symbol}_${item.timeframe}_${item.timestamp.toISOString()}`;
      
      const newData: MarketData = {
        ...item,
        id
      };
      
      this.marketData.set(key, newData);
      savedItems.push(newData);
    }
    
    return savedItems;
  }
  
  // Deployed strategies operations
  async getDeployedStrategies(userId: number): Promise<DeployedStrategy[]> {
    return Array.from(this.deployedStrategies.values())
      .filter(strategy => strategy.userId === userId)
      .sort((a, b) => b.deployedAt.getTime() - a.deployedAt.getTime());
  }
  
  async getDeployedStrategy(id: number): Promise<DeployedStrategy | undefined> {
    return this.deployedStrategies.get(id);
  }
  
  async createDeployedStrategy(deployedStrategy: InsertDeployedStrategy): Promise<DeployedStrategy> {
    const id = this.deployedStrategyId++;
    
    // Verify that strategy and broker exist
    const strategy = await this.getStrategy(deployedStrategy.strategyId);
    if (!strategy) {
      throw new Error(`Strategy with id ${deployedStrategy.strategyId} not found`);
    }
    
    const broker = await this.getBrokerConnection(deployedStrategy.brokerId);
    if (!broker) {
      throw new Error(`Broker connection with id ${deployedStrategy.brokerId} not found`);
    }
    
    const newDeployedStrategy: DeployedStrategy = {
      ...deployedStrategy,
      id,
      deployedAt: new Date(),
      lastUpdated: new Date(),
      currentPnl: "0",
      percentPnl: "0"
    };
    
    this.deployedStrategies.set(id, newDeployedStrategy);
    return newDeployedStrategy;
  }
  
  async updateDeployedStrategy(id: number, update: Partial<DeployedStrategy>): Promise<DeployedStrategy> {
    const deployedStrategy = await this.getDeployedStrategy(id);
    if (!deployedStrategy) {
      throw new Error(`Deployed strategy with id ${id} not found`);
    }
    
    const updatedStrategy: DeployedStrategy = {
      ...deployedStrategy,
      ...update,
      lastUpdated: new Date()
    };
    
    this.deployedStrategies.set(id, updatedStrategy);
    return updatedStrategy;
  }
  
  async updateDeployedStrategyStatus(id: number, status: string): Promise<DeployedStrategy> {
    return this.updateDeployedStrategy(id, { status });
  }
  
  async deleteDeployedStrategy(id: number): Promise<boolean> {
    return this.deployedStrategies.delete(id);
  }

  // Risk Management operations
  // Portfolio Risk
  async getPortfolioRisk(userId: number): Promise<PortfolioRisk | undefined> {
    return this.portfolioRisks.get(userId);
  }

  async updatePortfolioRisk(userId: number, data: Partial<PortfolioRisk>): Promise<PortfolioRisk> {
    const existingRisk = this.portfolioRisks.get(userId);
    
    if (existingRisk) {
      // Update existing portfolio risk
      const updatedRisk: PortfolioRisk = {
        ...existingRisk,
        ...data,
        updatedAt: new Date()
      };
      this.portfolioRisks.set(userId, updatedRisk);
      return updatedRisk;
    } else {
      // Create new portfolio risk
      const newRisk: PortfolioRisk = {
        id: this.portfolioRiskId++,
        userId,
        totalValue: data.totalValue || 0,
        dailyValue: data.dailyValue || 0,
        dailyChange: data.dailyChange || 0,
        weeklyChange: data.weeklyChange || 0,
        monthlyChange: data.monthlyChange || 0,
        currentDrawdown: data.currentDrawdown || 0,
        maxDrawdown: data.maxDrawdown || 0,
        volatility: data.volatility || 0,
        sharpeRatio: data.sharpeRatio || 0,
        beta: data.beta || 0,
        strategies: data.strategies || 0,
        activeTrades: data.activeTrades || 0,
        updatedAt: new Date()
      };
      this.portfolioRisks.set(userId, newRisk);
      return newRisk;
    }
  }

  // Risk Limits
  async getRiskLimits(userId: number): Promise<RiskLimit[]> {
    return Array.from(this.riskLimits.values())
      .filter(limit => limit.userId === userId);
  }

  async getRiskLimit(id: number): Promise<RiskLimit | undefined> {
    return this.riskLimits.get(id);
  }

  async createRiskLimit(riskLimit: InsertRiskLimit): Promise<RiskLimit> {
    const id = this.riskLimitId++;
    const newRiskLimit: RiskLimit = {
      ...riskLimit,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.riskLimits.set(id, newRiskLimit);
    return newRiskLimit;
  }

  async updateRiskLimit(id: number, data: Partial<RiskLimit>): Promise<RiskLimit> {
    const riskLimit = this.riskLimits.get(id);
    if (!riskLimit) {
      throw new Error(`Risk limit with id ${id} not found`);
    }

    const updatedRiskLimit: RiskLimit = {
      ...riskLimit,
      ...data,
      updatedAt: new Date()
    };
    this.riskLimits.set(id, updatedRiskLimit);
    return updatedRiskLimit;
  }

  async deleteRiskLimit(id: number): Promise<boolean> {
    return this.riskLimits.delete(id);
  }

  // Position Sizing Rules
  async getPositionSizingRules(userId: number): Promise<PositionSizingRule[]> {
    return Array.from(this.positionSizingRules.values())
      .filter(rule => rule.userId === userId);
  }

  async getPositionSizingRule(id: number): Promise<PositionSizingRule | undefined> {
    return this.positionSizingRules.get(id);
  }

  async createPositionSizingRule(rule: InsertPositionSizingRule): Promise<PositionSizingRule> {
    const id = this.positionRuleId++;
    const newRule: PositionSizingRule = {
      ...rule,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.positionSizingRules.set(id, newRule);
    return newRule;
  }

  async updatePositionSizingRule(id: number, data: Partial<PositionSizingRule>): Promise<PositionSizingRule> {
    const rule = this.positionSizingRules.get(id);
    if (!rule) {
      throw new Error(`Position sizing rule with id ${id} not found`);
    }

    const updatedRule: PositionSizingRule = {
      ...rule,
      ...data,
      updatedAt: new Date()
    };
    this.positionSizingRules.set(id, updatedRule);
    return updatedRule;
  }

  async deletePositionSizingRule(id: number): Promise<boolean> {
    return this.positionSizingRules.delete(id);
  }

  // Market Exposure
  async getMarketExposures(userId: number): Promise<MarketExposure[]> {
    return Array.from(this.marketExposures.values())
      .filter(exposure => exposure.userId === userId);
  }

  async updateMarketExposures(userId: number, exposures: InsertMarketExposure[]): Promise<MarketExposure[]> {
    // Delete existing exposures for this user
    Array.from(this.marketExposures.entries())
      .filter(([_, exposure]) => exposure.userId === userId)
      .forEach(([key, _]) => this.marketExposures.delete(key));
    
    // Add new exposures
    const updatedExposures: MarketExposure[] = [];
    for (const exposure of exposures) {
      const id = this.marketExposureId++;
      const newExposure: MarketExposure = {
        ...exposure,
        id,
        userId,
        updatedAt: new Date()
      };
      this.marketExposures.set(`${userId}_${exposure.market}`, newExposure);
      updatedExposures.push(newExposure);
    }
    
    return updatedExposures;
  }

  // Sector Exposure
  async getSectorExposures(userId: number): Promise<SectorExposure[]> {
    return Array.from(this.sectorExposures.values())
      .filter(exposure => exposure.userId === userId);
  }

  async updateSectorExposures(userId: number, exposures: InsertSectorExposure[]): Promise<SectorExposure[]> {
    // Delete existing exposures for this user
    Array.from(this.sectorExposures.entries())
      .filter(([_, exposure]) => exposure.userId === userId)
      .forEach(([key, _]) => this.sectorExposures.delete(key));
    
    // Add new exposures
    const updatedExposures: SectorExposure[] = [];
    for (const exposure of exposures) {
      const id = this.sectorExposureId++;
      const newExposure: SectorExposure = {
        ...exposure,
        id,
        userId,
        updatedAt: new Date()
      };
      this.sectorExposures.set(`${userId}_${exposure.sector}`, newExposure);
      updatedExposures.push(newExposure);
    }
    
    return updatedExposures;
  }

  // Strategy Correlation
  async getStrategyCorrelations(userId: number): Promise<StrategyCorrelation[]> {
    return Array.from(this.strategyCorrelations.values())
      .filter(correlation => correlation.userId === userId);
  }

  async updateStrategyCorrelations(userId: number, correlations: InsertStrategyCorrelation[]): Promise<StrategyCorrelation[]> {
    // Delete existing correlations for this user
    Array.from(this.strategyCorrelations.entries())
      .filter(([_, correlation]) => correlation.userId === userId)
      .forEach(([key, _]) => this.strategyCorrelations.delete(Number(key)));
    
    // Add new correlations
    const updatedCorrelations: StrategyCorrelation[] = [];
    for (const correlation of correlations) {
      const id = this.strategyCorrelationId++;
      const newCorrelation: StrategyCorrelation = {
        ...correlation,
        id,
        userId,
        updatedAt: new Date()
      };
      this.strategyCorrelations.set(id, newCorrelation);
      updatedCorrelations.push(newCorrelation);
    }
    
    return updatedCorrelations;
  }
}

import { db } from "./db";
import { and, eq, between, gte, lte, desc, sql } from "drizzle-orm";

// Database storage implementation

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        stripeCustomerId: stripeInfo.stripeCustomerId,
        stripeSubscriptionId: stripeInfo.stripeSubscriptionId
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async updateSubscriptionStatus(userId: number, status: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ subscriptionStatus: status })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async updateUserPlan(userId: number, plan: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ plan })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Strategy operations
  async getStrategies(userId: number): Promise<Strategy[]> {
    return db.select().from(strategies).where(eq(strategies.userId, userId));
  }

  async getStrategy(id: number): Promise<Strategy | undefined> {
    const [strategy] = await db.select().from(strategies).where(eq(strategies.id, id));
    return strategy;
  }

  async createStrategy(strategy: InsertStrategy): Promise<Strategy> {
    const [newStrategy] = await db.insert(strategies).values(strategy).returning();
    return newStrategy;
  }

  async updateStrategy(id: number, strategyUpdate: Partial<Strategy>): Promise<Strategy> {
    const [updatedStrategy] = await db
      .update(strategies)
      .set({ ...strategyUpdate, updatedAt: new Date() })
      .where(eq(strategies.id, id))
      .returning();
    return updatedStrategy;
  }

  async deleteStrategy(id: number): Promise<boolean> {
    await db.delete(strategies).where(eq(strategies.id, id));
    return true;
  }

  // Backtest operations
  async getBacktests(strategyId: number): Promise<Backtest[]> {
    return db
      .select()
      .from(backtests)
      .where(eq(backtests.strategyId, strategyId))
      .orderBy(desc(backtests.createdAt));
  }

  async getBacktest(id: number): Promise<Backtest | undefined> {
    const [backtest] = await db.select().from(backtests).where(eq(backtests.id, id));
    return backtest;
  }

  async createBacktest(backtest: InsertBacktest): Promise<Backtest> {
    const [newBacktest] = await db.insert(backtests).values(backtest).returning();
    return newBacktest;
  }

  // Trade operations
  async getTrades(userId: number, limit = 50): Promise<Trade[]> {
    return db
      .select()
      .from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.openedAt))
      .limit(limit);
  }

  async getTradesByStrategy(strategyId: number): Promise<Trade[]> {
    return db
      .select()
      .from(trades)
      .where(eq(trades.strategyId, strategyId))
      .orderBy(desc(trades.openedAt));
  }

  async createTrade(trade: InsertTrade): Promise<Trade> {
    const [newTrade] = await db.insert(trades).values(trade).returning();
    return newTrade;
  }

  async updateTrade(id: number, tradeUpdate: Partial<Trade>): Promise<Trade> {
    const [updatedTrade] = await db
      .update(trades)
      .set(tradeUpdate)
      .where(eq(trades.id, id))
      .returning();
    return updatedTrade;
  }

  // Broker operations
  async getBrokerConnections(userId: number): Promise<BrokerConnection[]> {
    return db
      .select()
      .from(brokerConnections)
      .where(eq(brokerConnections.userId, userId));
  }

  async getBrokerConnection(id: number): Promise<BrokerConnection | undefined> {
    const [connection] = await db
      .select()
      .from(brokerConnections)
      .where(eq(brokerConnections.id, id));
    return connection;
  }

  async createBrokerConnection(connection: InsertBrokerConnection): Promise<BrokerConnection> {
    const [newConnection] = await db
      .insert(brokerConnections)
      .values(connection)
      .returning();
    return newConnection;
  }

  async updateBrokerConnection(id: number, connectionUpdate: Partial<BrokerConnection>): Promise<BrokerConnection> {
    const [updatedConnection] = await db
      .update(brokerConnections)
      .set({ ...connectionUpdate, updatedAt: new Date() })
      .where(eq(brokerConnections.id, id))
      .returning();
    return updatedConnection;
  }

  async deleteBrokerConnection(id: number): Promise<boolean> {
    await db.delete(brokerConnections).where(eq(brokerConnections.id, id));
    return true;
  }

  // Market data operations
  async getMarketData(symbol: string, timeframe: string, start: Date, end: Date): Promise<MarketData[]> {
    return db
      .select()
      .from(marketData)
      .where(
        and(
          eq(marketData.symbol, symbol),
          eq(marketData.timeframe, timeframe),
          gte(marketData.timestamp, start),
          lte(marketData.timestamp, end)
        )
      )
      .orderBy(marketData.timestamp);
  }

  async saveMarketData(dataItems: InsertMarketData[]): Promise<MarketData[]> {
    if (dataItems.length === 0) return [];
    
    const result = await db
      .insert(marketData)
      .values(dataItems)
      .onConflictDoUpdate({
        target: [marketData.symbol, marketData.timeframe, marketData.timestamp],
        set: {
          open: sql`excluded.open`,
          high: sql`excluded.high`,
          low: sql`excluded.low`,
          close: sql`excluded.close`,
          volume: sql`excluded.volume`
        }
      })
      .returning();
      
    return result;
  }

  // Deployed strategies operations
  async getDeployedStrategies(userId: number): Promise<DeployedStrategy[]> {
    return db
      .select()
      .from(deployedStrategies)
      .where(eq(deployedStrategies.userId, userId))
      .orderBy(desc(deployedStrategies.deployedAt));
  }

  async getDeployedStrategy(id: number): Promise<DeployedStrategy | undefined> {
    const [strategy] = await db
      .select()
      .from(deployedStrategies)
      .where(eq(deployedStrategies.id, id));
    return strategy;
  }

  async createDeployedStrategy(deployedStrategy: InsertDeployedStrategy): Promise<DeployedStrategy> {
    const [newStrategy] = await db
      .insert(deployedStrategies)
      .values(deployedStrategy)
      .returning();
    return newStrategy;
  }

  async updateDeployedStrategy(id: number, update: Partial<DeployedStrategy>): Promise<DeployedStrategy> {
    const [updatedStrategy] = await db
      .update(deployedStrategies)
      .set({ ...update, lastUpdated: new Date() })
      .where(eq(deployedStrategies.id, id))
      .returning();
    return updatedStrategy;
  }

  async updateDeployedStrategyStatus(id: number, status: string): Promise<DeployedStrategy> {
    return this.updateDeployedStrategy(id, { status });
  }

  async deleteDeployedStrategy(id: number): Promise<boolean> {
    await db.delete(deployedStrategies).where(eq(deployedStrategies.id, id));
    return true;
  }

  // Risk Management operations
  // Portfolio Risk
  async getPortfolioRisk(userId: number): Promise<PortfolioRisk | undefined> {
    const [risk] = await db
      .select()
      .from(portfolioRisks)
      .where(eq(portfolioRisks.userId, userId));
    return risk;
  }

  async updatePortfolioRisk(userId: number, data: Partial<PortfolioRisk>): Promise<PortfolioRisk> {
    // Check if portfolio risk exists for this user
    const existing = await this.getPortfolioRisk(userId);
    
    if (existing) {
      // Update existing record
      const [updatedRisk] = await db
        .update(portfolioRisks)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(portfolioRisks.userId, userId))
        .returning();
      return updatedRisk;
    } else {
      // Create new record with complete data
      if (!('totalValue' in data) || !('dailyValue' in data) || 
          !('dailyChange' in data) || !('weeklyChange' in data) || 
          !('monthlyChange' in data) || !('currentDrawdown' in data) || 
          !('maxDrawdown' in data) || !('volatility' in data) || 
          !('sharpeRatio' in data) || !('beta' in data) || 
          !('strategies' in data) || !('activeTrades' in data)) {
        throw new Error('Missing required fields for portfolio risk creation');
      }
      
      const [newRisk] = await db
        .insert(portfolioRisks)
        .values({ 
          userId,
          totalValue: data.totalValue!,
          dailyValue: data.dailyValue!,
          dailyChange: data.dailyChange!,
          weeklyChange: data.weeklyChange!,
          monthlyChange: data.monthlyChange!,
          currentDrawdown: data.currentDrawdown!,
          maxDrawdown: data.maxDrawdown!,
          volatility: data.volatility!,
          sharpeRatio: data.sharpeRatio!,
          beta: data.beta!,
          strategies: data.strategies!,
          activeTrades: data.activeTrades!
        })
        .returning();
      return newRisk;
    }
  }

  // Risk Limits
  async getRiskLimits(userId: number): Promise<RiskLimit[]> {
    return db
      .select()
      .from(riskLimits)
      .where(eq(riskLimits.userId, userId))
      .orderBy(riskLimits.name);
  }

  async getRiskLimit(id: number): Promise<RiskLimit | undefined> {
    const [limit] = await db
      .select()
      .from(riskLimits)
      .where(eq(riskLimits.id, id));
    return limit;
  }

  async createRiskLimit(riskLimit: InsertRiskLimit): Promise<RiskLimit> {
    const [newLimit] = await db
      .insert(riskLimits)
      .values(riskLimit)
      .returning();
    return newLimit;
  }

  async updateRiskLimit(id: number, data: Partial<RiskLimit>): Promise<RiskLimit> {
    const [updatedLimit] = await db
      .update(riskLimits)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(riskLimits.id, id))
      .returning();
    return updatedLimit;
  }

  async deleteRiskLimit(id: number): Promise<boolean> {
    await db.delete(riskLimits).where(eq(riskLimits.id, id));
    return true;
  }

  // Position Sizing Rules
  async getPositionSizingRules(userId: number): Promise<PositionSizingRule[]> {
    return db
      .select()
      .from(positionSizingRules)
      .where(eq(positionSizingRules.userId, userId))
      .orderBy(positionSizingRules.name);
  }

  async getPositionSizingRule(id: number): Promise<PositionSizingRule | undefined> {
    const [rule] = await db
      .select()
      .from(positionSizingRules)
      .where(eq(positionSizingRules.id, id));
    return rule;
  }

  async createPositionSizingRule(rule: InsertPositionSizingRule): Promise<PositionSizingRule> {
    const [newRule] = await db
      .insert(positionSizingRules)
      .values(rule)
      .returning();
    return newRule;
  }

  async updatePositionSizingRule(id: number, data: Partial<PositionSizingRule>): Promise<PositionSizingRule> {
    const [updatedRule] = await db
      .update(positionSizingRules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(positionSizingRules.id, id))
      .returning();
    return updatedRule;
  }

  async deletePositionSizingRule(id: number): Promise<boolean> {
    await db.delete(positionSizingRules).where(eq(positionSizingRules.id, id));
    return true;
  }

  // Market Exposure
  async getMarketExposures(userId: number): Promise<MarketExposure[]> {
    return db
      .select()
      .from(marketExposures)
      .where(eq(marketExposures.userId, userId))
      .orderBy(marketExposures.market);
  }

  async updateMarketExposures(userId: number, exposures: InsertMarketExposure[]): Promise<MarketExposure[]> {
    if (exposures.length === 0) return [];
    
    // Delete existing exposures for this user
    await db.delete(marketExposures).where(eq(marketExposures.userId, userId));
    
    // Insert new exposures
    const newExposures = await db
      .insert(marketExposures)
      .values(exposures.map(e => ({ userId, market: e.market, percentage: e.percentage })))
      .returning();
      
    return newExposures;
  }

  // Sector Exposure
  async getSectorExposures(userId: number): Promise<SectorExposure[]> {
    return db
      .select()
      .from(sectorExposures)
      .where(eq(sectorExposures.userId, userId))
      .orderBy(sectorExposures.sector);
  }

  async updateSectorExposures(userId: number, exposures: InsertSectorExposure[]): Promise<SectorExposure[]> {
    if (exposures.length === 0) return [];
    
    // Delete existing exposures for this user
    await db.delete(sectorExposures).where(eq(sectorExposures.userId, userId));
    
    // Insert new exposures
    const newExposures = await db
      .insert(sectorExposures)
      .values(exposures.map(e => ({ userId, sector: e.sector, percentage: e.percentage })))
      .returning();
      
    return newExposures;
  }

  // Strategy Correlation
  async getStrategyCorrelations(userId: number): Promise<StrategyCorrelation[]> {
    return db
      .select()
      .from(strategyCorrelations)
      .where(eq(strategyCorrelations.userId, userId));
  }

  async updateStrategyCorrelations(userId: number, correlations: InsertStrategyCorrelation[]): Promise<StrategyCorrelation[]> {
    if (correlations.length === 0) return [];
    
    // Delete existing correlations for this user
    await db.delete(strategyCorrelations).where(eq(strategyCorrelations.userId, userId));
    
    // Insert new correlations
    const newCorrelations = await db
      .insert(strategyCorrelations)
      .values(correlations.map(c => ({ 
        userId, 
        strategyId: c.strategyId,
        strategyName: c.strategyName,
        correlationData: c.correlationData 
      })))
      .returning();
      
    return newCorrelations;
  }
}

export const storage = new DatabaseStorage();
