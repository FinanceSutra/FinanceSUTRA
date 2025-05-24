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
  type StrategyCorrelation, type InsertStrategyCorrelation,
  userPreferences, type UserPreference, type InsertUserPreference,
  strategyRecommendations, type StrategyRecommendation, type InsertStrategyRecommendation,
  // Learning module imports
  learningModules, type LearningModule, type InsertLearningModule,
  lessons, type Lesson, type InsertLesson,
  quizzes, type Quiz, type InsertQuiz,
  quizQuestions, type QuizQuestion, type InsertQuizQuestion,
  quizAnswers, type QuizAnswer, type InsertQuizAnswer,
  userProgress, type UserProgress, type InsertUserProgress,
  badges, type Badge, type InsertBadge,
  userBadges, type UserBadge, type InsertUserBadge,
  // Trading Workflow Automation imports
  tradingWorkflows, type TradingWorkflow, type InsertTradingWorkflow,
  workflowSteps, type WorkflowStep, type InsertWorkflowStep,
  workflowConditions, type WorkflowCondition, type InsertWorkflowCondition,
  workflowActions, type WorkflowAction, type InsertWorkflowAction,
  workflowExecutionLogs, type WorkflowExecutionLog, type InsertWorkflowExecutionLog
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
  
  // User Preferences operations
  getUserPreference(userId: number): Promise<UserPreference | undefined>;
  saveUserPreference(preference: InsertUserPreference): Promise<UserPreference>;
  updateUserPreference(userId: number, preference: Partial<UserPreference>): Promise<UserPreference>;
  
  // Strategy Recommendations operations
  getRecommendations(userId: number): Promise<StrategyRecommendation[]>;
  getRecommendation(id: number): Promise<StrategyRecommendation | undefined>;
  saveRecommendation(recommendation: InsertStrategyRecommendation): Promise<StrategyRecommendation>;
  markRecommendationFavorite(id: number, favorite: boolean): Promise<StrategyRecommendation>;
  markRecommendationApplied(id: number, applied: boolean): Promise<StrategyRecommendation>;
  deleteRecommendation(id: number): Promise<boolean>;
  
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
  
  // Strategy Recommendations
  getRecommendations(userId: number): Promise<StrategyRecommendation[]>;
  getRecommendation(id: number): Promise<StrategyRecommendation | undefined>;
  saveRecommendation(recommendation: InsertStrategyRecommendation): Promise<StrategyRecommendation>;
  updateRecommendation(id: number, updates: Partial<StrategyRecommendation>): Promise<StrategyRecommendation>;
  markRecommendationFavorite(id: number, favorite: boolean): Promise<StrategyRecommendation>;
  markRecommendationApplied(id: number, applied: boolean): Promise<StrategyRecommendation>;
  deleteRecommendation(id: number): Promise<boolean>;

  // User Preferences
  getUserPreference(userId: number): Promise<UserPreference | undefined>;
  saveUserPreference(preference: InsertUserPreference): Promise<UserPreference>;
  updateUserPreference(id: number, preference: Partial<UserPreference>): Promise<UserPreference>;
  
  // Learning Module operations
  getLearningModules(): Promise<LearningModule[]>;
  getLearningModule(id: number): Promise<LearningModule | undefined>;
  createLearningModule(module: InsertLearningModule): Promise<LearningModule>;
  updateLearningModule(id: number, module: Partial<LearningModule>): Promise<LearningModule>;
  deleteLearningModule(id: number): Promise<boolean>;
  
  // Lesson operations
  getLessons(moduleId: number): Promise<Lesson[]>;
  getLesson(id: number): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, lesson: Partial<Lesson>): Promise<Lesson>;
  deleteLesson(id: number): Promise<boolean>;
  
  // Quiz operations
  getQuizzes(lessonId: number): Promise<Quiz[]>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  updateQuiz(id: number, quiz: Partial<Quiz>): Promise<Quiz>;
  deleteQuiz(id: number): Promise<boolean>;
  
  // Quiz Question operations
  getQuizQuestions(quizId: number): Promise<QuizQuestion[]>;
  getQuizQuestion(id: number): Promise<QuizQuestion | undefined>;
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  updateQuizQuestion(id: number, question: Partial<QuizQuestion>): Promise<QuizQuestion>;
  deleteQuizQuestion(id: number): Promise<boolean>;
  
  // Quiz Answer operations
  getQuizAnswers(questionId: number): Promise<QuizAnswer[]>;
  createQuizAnswer(answer: InsertQuizAnswer): Promise<QuizAnswer>;
  updateQuizAnswer(id: number, answer: Partial<QuizAnswer>): Promise<QuizAnswer>;
  deleteQuizAnswer(id: number): Promise<boolean>;
  
  // User Progress operations
  getUserProgress(userId: number): Promise<UserProgress[]>;
  trackUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(id: number, progress: Partial<UserProgress>): Promise<UserProgress>;
  
  // Badge operations
  getBadges(): Promise<Badge[]>;
  getBadge(id: number): Promise<Badge | undefined>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  updateBadge(id: number, badge: Partial<Badge>): Promise<Badge>;
  deleteBadge(id: number): Promise<boolean>;
  
  // User Badge operations
  getUserBadges(userId: number): Promise<UserBadge[]>;
  awardBadge(userId: number, badgeId: number): Promise<UserBadge>;
  
  // Trading Workflow Automation operations
  
  // Trading Workflows
  getTradingWorkflows(userId: number): Promise<TradingWorkflow[]>;
  getTradingWorkflow(id: number): Promise<TradingWorkflow | undefined>;
  createTradingWorkflow(workflow: InsertTradingWorkflow): Promise<TradingWorkflow>;
  updateTradingWorkflow(id: number, workflow: Partial<TradingWorkflow>): Promise<TradingWorkflow>;
  deleteTradingWorkflow(id: number): Promise<boolean>;
  updateWorkflowStatus(id: number, status: string): Promise<TradingWorkflow>;
  
  // Workflow Steps
  getWorkflowSteps(workflowId: number): Promise<WorkflowStep[]>;
  getWorkflowStep(id: number): Promise<WorkflowStep | undefined>;
  createWorkflowStep(step: InsertWorkflowStep): Promise<WorkflowStep>;
  updateWorkflowStep(id: number, step: Partial<WorkflowStep>): Promise<WorkflowStep>;
  deleteWorkflowStep(id: number): Promise<boolean>;
  
  // Workflow Conditions
  getWorkflowConditions(workflowId: number): Promise<WorkflowCondition[]>;
  getWorkflowCondition(id: number): Promise<WorkflowCondition | undefined>;
  createWorkflowCondition(condition: InsertWorkflowCondition): Promise<WorkflowCondition>;
  updateWorkflowCondition(id: number, condition: Partial<WorkflowCondition>): Promise<WorkflowCondition>;
  deleteWorkflowCondition(id: number): Promise<boolean>;
  
  // Workflow Actions
  getWorkflowActions(workflowId: number): Promise<WorkflowAction[]>;
  getWorkflowAction(id: number): Promise<WorkflowAction | undefined>;
  createWorkflowAction(action: InsertWorkflowAction): Promise<WorkflowAction>;
  updateWorkflowAction(id: number, action: Partial<WorkflowAction>): Promise<WorkflowAction>;
  deleteWorkflowAction(id: number): Promise<boolean>;
  
  // Workflow Execution Logs
  getWorkflowExecutionLogs(workflowId: number): Promise<WorkflowExecutionLog[]>;
  createWorkflowExecutionLog(log: InsertWorkflowExecutionLog): Promise<WorkflowExecutionLog>;
  updateWorkflowExecutionLog(id: number, log: Partial<WorkflowExecutionLog>): Promise<WorkflowExecutionLog>;
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
  
  // User preferences & recommendations
  private userPreferences: Map<number, UserPreference>;
  private strategyRecommendations: Map<number, StrategyRecommendation>;
  
  // Learning module data structures
  private learningModules: Map<number, LearningModule>;
  private lessons: Map<number, Lesson>;
  private quizzes: Map<number, Quiz>;
  private quizQuestions: Map<number, QuizQuestion>;
  private quizAnswers: Map<number, QuizAnswer>;
  private userProgress: Map<number, UserProgress>;
  private badges: Map<number, Badge>;
  private userBadges: Map<number, UserBadge>;
  
  // Trading Workflow Automation data structures
  private tradingWorkflows: Map<number, TradingWorkflow>;
  private workflowSteps: Map<number, WorkflowStep>;
  private workflowConditions: Map<number, WorkflowCondition>;
  private workflowActions: Map<number, WorkflowAction>;
  private workflowExecutionLogs: Map<number, WorkflowExecutionLog>;
  
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
  private userPreferenceId = 1;
  private recommendationId = 1;
  
  // Learning module IDs
  private learningModuleId = 1;
  private lessonId = 1;
  private quizId = 1;
  private quizQuestionId = 1;
  private quizAnswerId = 1;
  private userProgressId = 1;
  private badgeId = 1;
  private userBadgeId = 1;
  
  // Trading Workflow Automation IDs
  private tradingWorkflowId = 1;
  private workflowStepId = 1;
  private workflowConditionId = 1;
  private workflowActionId = 1;
  private workflowExecutionLogId = 1;
  
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

    // Initialize user preferences & recommendations
    this.userPreferences = new Map();
    this.strategyRecommendations = new Map();

    // Initialize learning module data structures
    this.learningModules = new Map();
    this.lessons = new Map();
    this.quizzes = new Map();
    this.quizQuestions = new Map();
    this.quizAnswers = new Map();
    this.userProgress = new Map();
    this.badges = new Map();
    this.userBadges = new Map();

    // Initialize Trading Workflow Automation data structures
    this.tradingWorkflows = new Map();
    this.workflowSteps = new Map();
    this.workflowConditions = new Map();
    this.workflowActions = new Map();
    this.workflowExecutionLogs = new Map();
    
    // Add sample data for development
    this.initializeSampleData();
  }
  
  private initializeSampleWorkflows(userId: number) {
    // Workflow 1: Simple Moving Average Crossover
    const workflow1: TradingWorkflow = {
      id: this.tradingWorkflowId++,
      userId: userId,
      name: "SMA Crossover Strategy",
      description: "Buy when 50-day SMA crosses above 200-day SMA, sell when it crosses below",
      status: "active",
      isAutomatic: true,
      priority: 1,
      schedule: "0 9 * * 1-5", // Every weekday at 9 AM
      executionCount: 5,
      lastExecutedAt: new Date(Date.now() - 86400000), // 1 day ago
      createdAt: new Date(Date.now() - 86400000 * 7), // 7 days ago
      updatedAt: new Date(Date.now() - 86400000)
    };
    this.tradingWorkflows.set(workflow1.id, workflow1);
    
    // Workflow 2: RSI Oversold Strategy
    const workflow2: TradingWorkflow = {
      id: this.tradingWorkflowId++,
      userId: userId,
      name: "RSI Oversold Strategy",
      description: "Buy when RSI drops below 30, sell when it rises above 70",
      status: "paused",
      isAutomatic: true,
      priority: 2,
      schedule: "0 10 * * 1-5", // Every weekday at 10 AM
      executionCount: 3,
      lastExecutedAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
      createdAt: new Date(Date.now() - 86400000 * 14), // 14 days ago
      updatedAt: new Date(Date.now() - 86400000 * 3) // 3 days ago
    };
    this.tradingWorkflows.set(workflow2.id, workflow2);
    
    // Workflow 3: Manual Market Open Strategy
    const workflow3: TradingWorkflow = {
      id: this.tradingWorkflowId++,
      userId: userId,
      name: "Market Open Gap Trading",
      description: "Manual strategy for trading gaps at market open",
      status: "active",
      isAutomatic: false,
      priority: 3,
      schedule: null,
      executionCount: 8,
      lastExecutedAt: new Date(Date.now() - 86400000 * 1), // 1 day ago
      createdAt: new Date(Date.now() - 86400000 * 21), // 21 days ago
      updatedAt: new Date(Date.now() - 86400000 * 1) // 1 day ago
    };
    this.tradingWorkflows.set(workflow3.id, workflow3);
    
    // Add workflow steps for SMA Crossover workflow
    // Step 1: Market check
    const step1: WorkflowStep = {
      id: this.workflowStepId++,
      workflowId: workflow1.id,
      name: "Check Market Status",
      stepType: "market_check",
      stepOrder: 1,
      isEnabled: true,
      config: { markets: ["NSE"] },
      description: "Verify that markets are open",
      maxRetries: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.workflowSteps.set(step1.id, step1);
    
    // Step 2: Calculate SMA values
    const step2: WorkflowStep = {
      id: this.workflowStepId++,
      workflowId: workflow1.id,
      name: "Calculate SMAs",
      stepType: "technical_indicator",
      stepOrder: 2,
      isEnabled: true,
      config: { 
        symbols: ["NSE:RELIANCE", "NSE:INFY", "NSE:HDFCBANK"],
        indicators: [
          { type: "sma", params: { period: 50 } },
          { type: "sma", params: { period: 200 } }
        ]
      },
      description: "Calculate 50-day and 200-day SMAs",
      maxRetries: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.workflowSteps.set(step2.id, step2);
    
    // Step 3: Check for crossovers
    const step3: WorkflowStep = {
      id: this.workflowStepId++,
      workflowId: workflow1.id,
      name: "Check for Crossovers",
      stepType: "signal_detection",
      stepOrder: 3,
      isEnabled: true,
      config: { 
        signalType: "crossover",
        line1: "sma_50",
        line2: "sma_200"
      },
      description: "Detect SMA crossover signals",
      maxRetries: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.workflowSteps.set(step3.id, step3);
    
    // Step 4: Generate orders
    const step4: WorkflowStep = {
      id: this.workflowStepId++,
      workflowId: workflow1.id,
      name: "Generate Orders",
      stepType: "order_generation",
      stepOrder: 4,
      isEnabled: true,
      config: { 
        orderType: "market",
        positionSize: "fixed",
        sizeValue: 5000,
        stopLoss: 2,
        takeProfit: 5
      },
      description: "Create orders based on crossover signals",
      maxRetries: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.workflowSteps.set(step4.id, step4);
    
    // Create workflow conditions
    const condition1: WorkflowCondition = {
      id: this.workflowConditionId++,
      workflowId: workflow1.id,
      name: "Market Hours Check",
      conditionType: "time_window",
      parameters: { 
        startTime: "09:15:00", 
        endTime: "15:30:00", 
        timezone: "Asia/Kolkata" 
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.workflowConditions.set(condition1.id, condition1);
    
    // Create workflow actions
    const action1: WorkflowAction = {
      id: this.workflowActionId++,
      workflowId: workflow1.id,
      name: "Send SMS Alert",
      actionType: "notification",
      parameters: { 
        medium: "sms",
        template: "SMA_CROSSOVER_ALERT" 
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.workflowActions.set(action1.id, action1);
    
    // Add execution logs
    const log1: WorkflowExecutionLog = {
      id: this.workflowExecutionLogId++,
      workflowId: workflow1.id,
      status: "success",
      triggeredBy: "schedule",
      executionStartTime: new Date(Date.now() - 86400000 - 3600000), // 1 day and 1 hour ago
      executionEndTime: new Date(Date.now() - 86400000 - 3590000),  // 1 day and 59 minutes and 50 seconds ago
      summary: "Successfully executed all steps",
      details: { steps_completed: 4, signals_generated: 1 },
      createdAt: new Date(Date.now() - 86400000 - 3590000)
    };
    this.workflowExecutionLogs.set(log1.id, log1);
  }
  
  private initializeSampleData() {
    // Test user with simple credentials for development
    console.log("Initializing test user and learning modules");
    const user: User = {
      id: this.userId++,
      username: "test",
      password: "$2a$10$2QlYCcbUyKNKE6JDQ14wieNuZdKc0E6I4OsHmMtF27b2P7fMnHpqi", // "testpassword"
      email: "test@example.com",
      fullName: "Test User",
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
    
    // Sample user preference
    const userPreference: UserPreference = {
      id: this.userPreferenceId++,
      userId: user.id,
      riskTolerance: "moderate",
      tradingFrequency: "daily",
      preferredMarkets: JSON.stringify(["Equities", "Forex"]),
      preferredTimeframes: JSON.stringify(["1h", "4h", "1d"]),
      tradingStyle: "swing",
      preferredIndicators: JSON.stringify(["Moving Averages", "RSI", "MACD"]),
      automationLevel: "semi",
      capitalAvailable: "25000",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.userPreferences.set(userPreference.id, userPreference);
    
    // Sample strategy recommendations
    const recommendation1: StrategyRecommendation = {
      id: this.recommendationId++,
      userId: user.id,
      title: "Momentum Scalping Strategy",
      description: "Short-term momentum trading strategy for intraday opportunities.",
      strategyType: "momentum",
      assetClass: "Equities",
      matchScore: 87.5,
      expectedReturns: "15-20%",
      riskLevel: "moderate",
      timeframe: "5m",
      suitableMarkets: JSON.stringify(["NSE", "BSE"]),
      favorite: false,
      applied: false,
      createdAt: new Date()
    };
    this.strategyRecommendations.set(recommendation1.id, recommendation1);
    
    const recommendation2: StrategyRecommendation = {
      id: this.recommendationId++,
      userId: user.id,
      title: "Mean Reversion ETF Strategy",
      description: "Leverages statistical mean reversion for ETF trading.",
      strategyType: "mean-reversion",
      assetClass: "ETF",
      matchScore: 92.3,
      expectedReturns: "12-15%",
      riskLevel: "low",
      timeframe: "1d",
      suitableMarkets: JSON.stringify(["NSE", "NYSE"]),
      favorite: true,
      applied: false,
      createdAt: new Date()
    };
    this.strategyRecommendations.set(recommendation2.id, recommendation2);
    
    // Sample learning modules
    
    // Module 1: Introduction to Technical Analysis
    const module1: LearningModule = {
      id: this.learningModuleId++,
      title: "Introduction to Technical Analysis",
      description: "Learn the basics of technical analysis and chart patterns for trading",
      imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
      level: "beginner",
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.learningModules.set(module1.id, module1);
    
    // Lessons for Module 1
    const lesson1: Lesson = {
      id: this.lessonId++,
      moduleId: module1.id,
      title: "What is Technical Analysis?",
      description: "Understanding the basics of technical analysis in trading",
      content: `
# What is Technical Analysis?

Technical analysis is a method of evaluating securities by analyzing statistics generated by market activity. 
Technical analysts use charts and other tools to identify patterns that can suggest future market behavior.

## Key Principles

1. **Price Discounts Everything**: All known information is already reflected in the price
2. **Prices Move in Trends**: Prices are more likely to continue a past trend than move randomly
3. **History Tends to Repeat Itself**: Market psychology causes patterns to repeat

## Common Technical Tools

- Price charts (candlestick, bar, line)
- Trend lines
- Support and resistance levels
- Moving averages
- Momentum indicators (RSI, MACD)

Technical analysis can be applied to any security with historical trading data, including stocks, forex, commodities, and cryptocurrencies.
      `,
      order: 1,
      points: 10,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.lessons.set(lesson1.id, lesson1);
    
    const lesson2: Lesson = {
      id: this.lessonId++,
      moduleId: module1.id,
      title: "Chart Types and Patterns",
      description: "Learn about different chart types and basic patterns",
      content: `
# Chart Types and Patterns

Chart patterns are specific formations on price charts that can help traders predict future price movements.

## Common Chart Types

### Candlestick Charts
Candlestick charts show the open, high, low, and close prices for each period. They're particularly useful for identifying short-term patterns.

### Bar Charts
Bar charts also display open, high, low, and close prices but in a different format than candlesticks.

### Line Charts
Line charts simply connect closing prices, providing a clean view of price movements.

## Basic Chart Patterns

### Trend Patterns
- **Uptrend**: Series of higher highs and higher lows
- **Downtrend**: Series of lower highs and lower lows
- **Sideways/Ranging**: Price moves within a horizontal channel

### Reversal Patterns
- **Head and Shoulders**: Indicates a potential trend reversal from bullish to bearish
- **Double Top/Bottom**: Indicates a potential trend reversal
- **Triple Top/Bottom**: Similar to double patterns but with three peaks or troughs

### Continuation Patterns
- **Flags and Pennants**: Brief pauses in strong trends
- **Triangles**: Consolidation patterns that can break in either direction
- **Rectangles**: Trading ranges that eventually break out

Understanding these patterns helps traders make informed decisions about market entry and exit points.
      `,
      order: 2,
      points: 15,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.lessons.set(lesson2.id, lesson2);
    
    // Quiz for Lesson 1
    const quiz1: Quiz = {
      id: this.quizId++,
      lessonId: lesson1.id,
      title: "Technical Analysis Basics Quiz",
      description: "Test your knowledge of technical analysis fundamentals",
      passingScore: 70,
      points: 20,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.quizzes.set(quiz1.id, quiz1);
    
    // Questions for Quiz 1
    const question1: QuizQuestion = {
      id: this.quizQuestionId++,
      quizId: quiz1.id,
      question: "Which of the following is NOT a key principle of technical analysis?",
      explanation: "Technical analysis is based on the principles that price discounts everything, prices move in trends, and history tends to repeat itself. Fundamental value being irrelevant is not a principle of technical analysis - in fact, many technical analysts also consider fundamental factors.",
      type: "multiple_choice",
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.quizQuestions.set(question1.id, question1);
    
    // Answers for Question 1
    const answer1_1: QuizAnswer = {
      id: this.quizAnswerId++,
      questionId: question1.id,
      answer: "Price discounts everything",
      isCorrect: false,
      order: 1
    };
    this.quizAnswers.set(answer1_1.id, answer1_1);
    
    const answer1_2: QuizAnswer = {
      id: this.quizAnswerId++,
      questionId: question1.id,
      answer: "Prices move in trends",
      isCorrect: false,
      order: 2
    };
    this.quizAnswers.set(answer1_2.id, answer1_2);
    
    const answer1_3: QuizAnswer = {
      id: this.quizAnswerId++,
      questionId: question1.id,
      answer: "History tends to repeat itself",
      isCorrect: false,
      order: 3
    };
    this.quizAnswers.set(answer1_3.id, answer1_3);
    
    const answer1_4: QuizAnswer = {
      id: this.quizAnswerId++,
      questionId: question1.id,
      answer: "Fundamental value is irrelevant",
      isCorrect: true,
      order: 4
    };
    this.quizAnswers.set(answer1_4.id, answer1_4);
    
    const question2: QuizQuestion = {
      id: this.quizQuestionId++,
      quizId: quiz1.id,
      question: "Which chart type shows open, high, low, and close prices in a single visual element?",
      explanation: "Candlestick charts display open, high, low, and close prices in a single candle-like formation, making them particularly useful for pattern recognition.",
      type: "multiple_choice",
      order: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.quizQuestions.set(question2.id, question2);
    
    // Answers for Question 2
    const answer2_1: QuizAnswer = {
      id: this.quizAnswerId++,
      questionId: question2.id,
      answer: "Line chart",
      isCorrect: false,
      order: 1
    };
    this.quizAnswers.set(answer2_1.id, answer2_1);
    
    const answer2_2: QuizAnswer = {
      id: this.quizAnswerId++,
      questionId: question2.id,
      answer: "Candlestick chart",
      isCorrect: true,
      order: 2
    };
    this.quizAnswers.set(answer2_2.id, answer2_2);
    
    const answer2_3: QuizAnswer = {
      id: this.quizAnswerId++,
      questionId: question2.id,
      answer: "Point and figure chart",
      isCorrect: false,
      order: 3
    };
    this.quizAnswers.set(answer2_3.id, answer2_3);
    
    const answer2_4: QuizAnswer = {
      id: this.quizAnswerId++,
      questionId: question2.id,
      answer: "Scatter plot",
      isCorrect: false,
      order: 4
    };
    this.quizAnswers.set(answer2_4.id, answer2_4);
    
    // Module 2: Trading Strategies
    const module2: LearningModule = {
      id: this.learningModuleId++,
      title: "Trading Strategies",
      description: "Learn about different trading strategies and how to implement them",
      imageUrl: "https://images.unsplash.com/photo-1535320903710-d993d3d77d29?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
      level: "intermediate",
      order: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.learningModules.set(module2.id, module2);
    
    // Sample user progress
    const userProgress1: UserProgress = {
      id: this.userProgressId++,
      userId: user.id,
      moduleId: module1.id,
      lessonId: lesson1.id,
      quizId: null,
      completed: true,
      score: null,
      earnedPoints: 10,
      completedAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
      createdAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
      updatedAt: new Date(Date.now() - 86400000 * 2) // 2 days ago
    };
    this.userProgress.set(userProgress1.id, userProgress1);
    
    const userProgress2: UserProgress = {
      id: this.userProgressId++,
      userId: user.id,
      moduleId: module1.id,
      lessonId: lesson2.id,
      quizId: null,
      completed: false,
      score: null,
      earnedPoints: 0,
      completedAt: null,
      createdAt: new Date(Date.now() - 86400000 * 1), // 1 day ago
      updatedAt: new Date(Date.now() - 86400000 * 1) // 1 day ago
    };
    this.userProgress.set(userProgress2.id, userProgress2);
    
    // Sample badges
    const badge1: Badge = {
      id: this.badgeId++,
      name: "Technical Analyst Novice",
      description: "Completed the Introduction to Technical Analysis module",
      imageUrl: "https://img.icons8.com/fluency/96/medal.png",
      requirement: "Complete all lessons in the Introduction to Technical Analysis module",
      points: 50,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.badges.set(badge1.id, badge1);
    
    const badge2: Badge = {
      id: this.badgeId++,
      name: "Chart Master",
      description: "Scored 100% on the Chart Types and Patterns quiz",
      imageUrl: "https://img.icons8.com/fluency/96/prize.png",
      requirement: "Score 100% on the Chart Types and Patterns quiz",
      points: 75,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.badges.set(badge2.id, badge2);
    
    // Sample trading workflows
    console.log("Initializing sample trading workflows");
    
    // Workflow 1: Simple Moving Average Crossover
    const workflow1: TradingWorkflow = {
      id: this.tradingWorkflowId++,
      userId: 1, // Test user
      name: "SMA Crossover Strategy",
      description: "Buy when 50-day SMA crosses above 200-day SMA, sell when it crosses below",
      status: "active",
      isAutomatic: true,
      priority: 1,
      schedule: "0 9 * * 1-5", // Every weekday at 9 AM
      executionCount: 5,
      lastExecutedAt: new Date(Date.now() - 86400000), // 1 day ago
      createdAt: new Date(Date.now() - 86400000 * 7), // 7 days ago
      updatedAt: new Date(Date.now() - 86400000),
      logHistory: [
        {
          id: 1,
          status: "success",
          executedAt: new Date(Date.now() - 86400000),
          message: "Buy signal triggered for NSE:RELIANCE"
        },
        {
          id: 2,
          status: "success",
          executedAt: new Date(Date.now() - 86400000 * 2),
          message: "No signals detected"
        }
      ]
    };
    this.tradingWorkflows.set(workflow1.id, workflow1);
    
    // Workflow 2: RSI Oversold Strategy
    const workflow2: TradingWorkflow = {
      id: this.tradingWorkflowId++,
      userId: 1, // Test user
      name: "RSI Oversold Alert",
      description: "Alert when RSI goes below 30 (oversold condition)",
      status: "inactive",
      isAutomatic: false,
      priority: 2,
      schedule: null,
      executionCount: 0,
      lastExecutedAt: null,
      createdAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
      updatedAt: new Date(Date.now() - 86400000 * 3),
      logHistory: []
    };
    this.tradingWorkflows.set(workflow2.id, workflow2);
    
    // Sample workflow steps
    const step1: WorkflowStep = {
      id: this.workflowStepId++,
      workflowId: workflow1.id,
      stepType: "condition",
      stepOrder: 1,
      name: "Check SMA Crossover",
      description: "Verify if 50-day SMA crossed above 200-day SMA",
      config: {
        indicatorType: "sma",
        fastPeriod: 50,
        slowPeriod: 200,
        action: "crossover"
      },
      createdAt: new Date(Date.now() - 86400000 * 7),
      updatedAt: new Date(Date.now() - 86400000 * 7)
    };
    this.workflowSteps.set(step1.id, step1);
    
    const step2: WorkflowStep = {
      id: this.workflowStepId++,
      workflowId: workflow1.id,
      stepType: "action",
      stepOrder: 2,
      name: "Execute Buy Order",
      description: "Place a market buy order when conditions are met",
      config: {
        orderType: "market",
        side: "buy",
        quantity: "10% of portfolio",
        notificationType: "email"
      },
      createdAt: new Date(Date.now() - 86400000 * 7),
      updatedAt: new Date(Date.now() - 86400000 * 7)
    };
    this.workflowSteps.set(step2.id, step2);
    
    // Sample workflow conditions
    const condition1: WorkflowCondition = {
      id: this.workflowConditionId++,
      workflowId: workflow1.id,
      conditionType: "indicator",
      symbol: "NSE:RELIANCE",
      operator: "crosses_above",
      value: "sma_200",
      timeframe: "1d",
      lookbackPeriod: 5,
      isEnabled: true,
      lastEvaluated: new Date(Date.now() - 86400000),
      lastResult: true,
      createdAt: new Date(Date.now() - 86400000 * 7),
      updatedAt: new Date(Date.now() - 86400000)
    };
    this.workflowConditions.set(condition1.id, condition1);
    
    const condition2: WorkflowCondition = {
      id: this.workflowConditionId++,
      workflowId: workflow2.id,
      conditionType: "indicator",
      symbol: "NSE:NIFTYBEES",
      operator: "<",
      value: "30",
      timeframe: "4h",
      lookbackPeriod: 1,
      isEnabled: true,
      lastEvaluated: null,
      lastResult: null,
      createdAt: new Date(Date.now() - 86400000 * 3),
      updatedAt: new Date(Date.now() - 86400000 * 3)
    };
    this.workflowConditions.set(condition2.id, condition2);
    
    // Sample workflow actions
    const action1: WorkflowAction = {
      id: this.workflowActionId++,
      workflowId: workflow1.id,
      stepId: step2.id,
      actionType: "buy",
      symbol: "NSE:RELIANCE",
      quantity: "10",
      price: "market",
      orderType: "market",
      isEnabled: true,
      lastExecuted: new Date(Date.now() - 86400000),
      status: "success",
      createdAt: new Date(Date.now() - 86400000 * 7),
      updatedAt: new Date(Date.now() - 86400000)
    };
    this.workflowActions.set(action1.id, action1);
    
    const action2: WorkflowAction = {
      id: this.workflowActionId++,
      workflowId: workflow2.id,
      stepId: 0, // No associated step
      actionType: "alert",
      symbol: "NSE:NIFTYBEES",
      quantity: null,
      price: null,
      orderType: null,
      isEnabled: true,
      lastExecuted: null,
      status: "pending",
      createdAt: new Date(Date.now() - 86400000 * 3),
      updatedAt: new Date(Date.now() - 86400000 * 3)
    };
    this.workflowActions.set(action2.id, action2);
    
    // Sample workflow execution logs
    const log1: WorkflowExecutionLog = {
      id: this.workflowExecutionLogId++,
      workflowId: workflow1.id,
      executedAt: new Date(Date.now() - 86400000),
      status: "success",
      message: "Buy signal triggered for NSE:RELIANCE",
      details: {
        conditionsSatisfied: [condition1.id],
        actionsExecuted: [action1.id],
        orderIds: ["mock-order-12345"]
      },
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(Date.now() - 86400000)
    };
    this.workflowExecutionLogs.set(log1.id, log1);
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
  
  // Trading Workflow methods
  async getTradingWorkflows(userId: number): Promise<TradingWorkflow[]> {
    const workflows = Array.from(this.tradingWorkflows.values())
      .filter(workflow => workflow.userId === userId);
    
    // Sort by createdAt date (newest first)
    workflows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return workflows;
  }
  
  async getTradingWorkflow(id: number): Promise<TradingWorkflow | undefined> {
    return this.tradingWorkflows.get(id);
  }
  
  async createTradingWorkflow(workflow: InsertTradingWorkflow): Promise<TradingWorkflow> {
    const id = this.tradingWorkflowId++;
    const now = new Date();
    
    const newWorkflow: TradingWorkflow = {
      ...workflow,
      id,
      executionCount: 0,
      lastExecutedAt: null,
      createdAt: now,
      updatedAt: now
    };
    
    this.tradingWorkflows.set(id, newWorkflow);
    return newWorkflow;
  }
  
  async updateTradingWorkflow(id: number, data: Partial<TradingWorkflow>): Promise<TradingWorkflow> {
    const workflow = this.tradingWorkflows.get(id);
    if (!workflow) {
      throw new Error(`Workflow with id ${id} not found`);
    }
    
    const updatedWorkflow: TradingWorkflow = {
      ...workflow,
      ...data,
      updatedAt: new Date()
    };
    
    this.tradingWorkflows.set(id, updatedWorkflow);
    return updatedWorkflow;
  }
  
  async updateWorkflowStatus(id: number, status: string): Promise<TradingWorkflow> {
    return this.updateTradingWorkflow(id, { status });
  }
  
  async deleteTradingWorkflow(id: number): Promise<boolean> {
    return this.tradingWorkflows.delete(id);
  }
  
  // Workflow Steps
  async getWorkflowSteps(workflowId: number): Promise<WorkflowStep[]> {
    const steps = Array.from(this.workflowSteps.values())
      .filter(step => step.workflowId === workflowId);
    
    // Sort by order
    steps.sort((a, b) => a.order - b.order);
    
    return steps;
  }
  
  async getWorkflowStep(id: number): Promise<WorkflowStep | undefined> {
    return this.workflowSteps.get(id);
  }
  
  async createWorkflowStep(step: InsertWorkflowStep): Promise<WorkflowStep> {
    const id = this.workflowStepId++;
    const now = new Date();
    
    const newStep: WorkflowStep = {
      ...step,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.workflowSteps.set(id, newStep);
    return newStep;
  }
  
  async updateWorkflowStep(id: number, data: Partial<WorkflowStep>): Promise<WorkflowStep> {
    const step = this.workflowSteps.get(id);
    if (!step) {
      throw new Error(`Workflow step with id ${id} not found`);
    }
    
    const updatedStep: WorkflowStep = {
      ...step,
      ...data,
      updatedAt: new Date()
    };
    
    this.workflowSteps.set(id, updatedStep);
    return updatedStep;
  }
  
  async deleteWorkflowStep(id: number): Promise<boolean> {
    return this.workflowSteps.delete(id);
  }
  
  // Workflow Conditions
  async getWorkflowConditions(workflowId: number): Promise<WorkflowCondition[]> {
    return Array.from(this.workflowConditions.values())
      .filter(condition => condition.workflowId === workflowId);
  }
  
  async getWorkflowCondition(id: number): Promise<WorkflowCondition | undefined> {
    return this.workflowConditions.get(id);
  }
  
  async createWorkflowCondition(condition: InsertWorkflowCondition): Promise<WorkflowCondition> {
    const id = this.workflowConditionId++;
    const now = new Date();
    
    const newCondition: WorkflowCondition = {
      ...condition,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.workflowConditions.set(id, newCondition);
    return newCondition;
  }
  
  async updateWorkflowCondition(id: number, data: Partial<WorkflowCondition>): Promise<WorkflowCondition> {
    const condition = this.workflowConditions.get(id);
    if (!condition) {
      throw new Error(`Workflow condition with id ${id} not found`);
    }
    
    const updatedCondition: WorkflowCondition = {
      ...condition,
      ...data,
      updatedAt: new Date()
    };
    
    this.workflowConditions.set(id, updatedCondition);
    return updatedCondition;
  }
  
  async deleteWorkflowCondition(id: number): Promise<boolean> {
    return this.workflowConditions.delete(id);
  }
  
  // Workflow Actions
  async getWorkflowActions(workflowId: number): Promise<WorkflowAction[]> {
    return Array.from(this.workflowActions.values())
      .filter(action => action.workflowId === workflowId);
  }
  
  async getWorkflowAction(id: number): Promise<WorkflowAction | undefined> {
    return this.workflowActions.get(id);
  }
  
  async createWorkflowAction(action: InsertWorkflowAction): Promise<WorkflowAction> {
    const id = this.workflowActionId++;
    const now = new Date();
    
    const newAction: WorkflowAction = {
      ...action,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.workflowActions.set(id, newAction);
    return newAction;
  }
  
  async updateWorkflowAction(id: number, data: Partial<WorkflowAction>): Promise<WorkflowAction> {
    const action = this.workflowActions.get(id);
    if (!action) {
      throw new Error(`Workflow action with id ${id} not found`);
    }
    
    const updatedAction: WorkflowAction = {
      ...action,
      ...data,
      updatedAt: new Date()
    };
    
    this.workflowActions.set(id, updatedAction);
    return updatedAction;
  }
  
  async deleteWorkflowAction(id: number): Promise<boolean> {
    return this.workflowActions.delete(id);
  }
  
  // Workflow Execution Logs
  async getWorkflowExecutionLogs(workflowId: number, limit: number = 10): Promise<WorkflowExecutionLog[]> {
    const logs = Array.from(this.workflowExecutionLogs.values())
      .filter(log => log.workflowId === workflowId);
    
    // Sort by createdAt date (newest first)
    logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return logs.slice(0, limit);
  }
  
  async createWorkflowExecutionLog(log: InsertWorkflowExecutionLog): Promise<WorkflowExecutionLog> {
    const id = this.workflowExecutionLogId++;
    const now = new Date();
    
    const newLog: WorkflowExecutionLog = {
      ...log,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.workflowExecutionLogs.set(id, newLog);
    return newLog;
  }
  
  async updateWorkflowExecutionLog(id: number, data: Partial<WorkflowExecutionLog>): Promise<WorkflowExecutionLog> {
    const log = this.workflowExecutionLogs.get(id);
    if (!log) {
      throw new Error(`Workflow execution log with id ${id} not found`);
    }
    
    const updatedLog: WorkflowExecutionLog = {
      ...log,
      ...data,
      updatedAt: new Date()
    };
    
    this.workflowExecutionLogs.set(id, updatedLog);
    return updatedLog;
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
  
  // User Preferences operations
  async getUserPreference(userId: number): Promise<UserPreference | undefined> {
    return Array.from(this.userPreferences.values()).find(pref => pref.userId === userId);
  }
  
  async saveUserPreference(preference: InsertUserPreference): Promise<UserPreference> {
    // Check if preference already exists for this user
    const existingPref = await this.getUserPreference(preference.userId);
    
    if (existingPref) {
      // Update existing preference
      return this.updateUserPreference(preference.userId, preference);
    }
    
    // Create new preference
    const id = this.userPreferenceId++;
    const newPreference: UserPreference = {
      ...preference,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.userPreferences.set(id, newPreference);
    return newPreference;
  }
  
  async updateUserPreference(userId: number, preference: Partial<UserPreference>): Promise<UserPreference> {
    const existingPref = await this.getUserPreference(userId);
    
    if (!existingPref) {
      throw new Error(`User preference for user ${userId} not found`);
    }
    
    const updatedPreference: UserPreference = {
      ...existingPref,
      ...preference,
      updatedAt: new Date()
    };
    
    this.userPreferences.set(existingPref.id, updatedPreference);
    return updatedPreference;
  }
  
  // Strategy Recommendations operations
  async getRecommendations(userId: number): Promise<StrategyRecommendation[]> {
    return Array.from(this.strategyRecommendations.values())
      .filter(rec => rec.userId === userId)
      .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score descending
  }
  
  async getRecommendation(id: number): Promise<StrategyRecommendation | undefined> {
    return this.strategyRecommendations.get(id);
  }
  
  async saveRecommendation(recommendation: InsertStrategyRecommendation): Promise<StrategyRecommendation> {
    const id = this.recommendationId++;
    const newRecommendation: StrategyRecommendation = {
      ...recommendation,
      id,
      createdAt: new Date()
    };
    
    this.strategyRecommendations.set(id, newRecommendation);
    return newRecommendation;
  }
  
  async updateRecommendation(id: number, updates: Partial<StrategyRecommendation>): Promise<StrategyRecommendation> {
    const recommendation = this.strategyRecommendations.get(id);
    
    if (!recommendation) {
      throw new Error(`Recommendation with id ${id} not found`);
    }
    
    const updatedRecommendation: StrategyRecommendation = {
      ...recommendation,
      ...updates
    };
    
    this.strategyRecommendations.set(id, updatedRecommendation);
    return updatedRecommendation;
  }
  
  async deleteRecommendation(id: number): Promise<boolean> {
    return this.strategyRecommendations.delete(id);
  }
  
  async markRecommendationFavorite(id: number, favorite: boolean): Promise<StrategyRecommendation> {
    return this.updateRecommendation(id, { favorite });
  }
  
  async markRecommendationApplied(id: number, applied: boolean): Promise<StrategyRecommendation> {
    return this.updateRecommendation(id, { applied });
  }

  // Learning Module operations
  async getLearningModules(): Promise<LearningModule[]> {
    const modules = Array.from(this.learningModules.values());
    modules.sort((a, b) => a.order - b.order); // Sort by order
    return modules;
  }
  
  async getLearningModule(id: number): Promise<LearningModule | undefined> {
    return this.learningModules.get(id);
  }
  
  async createLearningModule(module: InsertLearningModule): Promise<LearningModule> {
    const id = this.learningModuleId++;
    const newModule: LearningModule = {
      ...module,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.learningModules.set(id, newModule);
    return newModule;
  }
  
  async updateLearningModule(id: number, module: Partial<LearningModule>): Promise<LearningModule> {
    const existingModule = this.learningModules.get(id);
    if (!existingModule) {
      throw new Error(`Learning module with id ${id} not found`);
    }
    
    const updatedModule = { 
      ...existingModule, 
      ...module,
      updatedAt: new Date()
    };
    this.learningModules.set(id, updatedModule);
    return updatedModule;
  }
  
  async deleteLearningModule(id: number): Promise<boolean> {
    return this.learningModules.delete(id);
  }
  
  // Lesson operations
  async getLessons(moduleId: number): Promise<Lesson[]> {
    const lessons = Array.from(this.lessons.values())
      .filter(lesson => lesson.moduleId === moduleId)
      .sort((a, b) => a.order - b.order); // Sort by order
    return lessons;
  }
  
  async getLesson(id: number): Promise<Lesson | undefined> {
    return this.lessons.get(id);
  }
  
  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const id = this.lessonId++;
    const newLesson: Lesson = {
      ...lesson,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.lessons.set(id, newLesson);
    return newLesson;
  }
  
  async updateLesson(id: number, lesson: Partial<Lesson>): Promise<Lesson> {
    const existingLesson = this.lessons.get(id);
    if (!existingLesson) {
      throw new Error(`Lesson with id ${id} not found`);
    }
    
    const updatedLesson = { 
      ...existingLesson, 
      ...lesson,
      updatedAt: new Date()
    };
    this.lessons.set(id, updatedLesson);
    return updatedLesson;
  }
  
  async deleteLesson(id: number): Promise<boolean> {
    return this.lessons.delete(id);
  }
  
  // Quiz operations
  async getQuizzes(lessonId: number): Promise<Quiz[]> {
    const quizzes = Array.from(this.quizzes.values())
      .filter(quiz => quiz.lessonId === lessonId);
    return quizzes;
  }
  
  async getQuiz(id: number): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }
  
  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const id = this.quizId++;
    const newQuiz: Quiz = {
      ...quiz,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.quizzes.set(id, newQuiz);
    return newQuiz;
  }
  
  async updateQuiz(id: number, quiz: Partial<Quiz>): Promise<Quiz> {
    const existingQuiz = this.quizzes.get(id);
    if (!existingQuiz) {
      throw new Error(`Quiz with id ${id} not found`);
    }
    
    const updatedQuiz = { 
      ...existingQuiz, 
      ...quiz,
      updatedAt: new Date()
    };
    this.quizzes.set(id, updatedQuiz);
    return updatedQuiz;
  }
  
  async deleteQuiz(id: number): Promise<boolean> {
    return this.quizzes.delete(id);
  }
  
  // Quiz Question operations
  async getQuizQuestions(quizId: number): Promise<QuizQuestion[]> {
    const questions = Array.from(this.quizQuestions.values())
      .filter(question => question.quizId === quizId)
      .sort((a, b) => a.order - b.order); // Sort by order
    return questions;
  }
  
  async getQuizQuestion(id: number): Promise<QuizQuestion | undefined> {
    return this.quizQuestions.get(id);
  }
  
  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    const id = this.quizQuestionId++;
    const newQuestion: QuizQuestion = {
      ...question,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.quizQuestions.set(id, newQuestion);
    return newQuestion;
  }
  
  async updateQuizQuestion(id: number, question: Partial<QuizQuestion>): Promise<QuizQuestion> {
    const existingQuestion = this.quizQuestions.get(id);
    if (!existingQuestion) {
      throw new Error(`Quiz question with id ${id} not found`);
    }
    
    const updatedQuestion = { 
      ...existingQuestion, 
      ...question,
      updatedAt: new Date()
    };
    this.quizQuestions.set(id, updatedQuestion);
    return updatedQuestion;
  }
  
  async deleteQuizQuestion(id: number): Promise<boolean> {
    return this.quizQuestions.delete(id);
  }
  
  // Quiz Answer operations
  async getQuizAnswers(questionId: number): Promise<QuizAnswer[]> {
    const answers = Array.from(this.quizAnswers.values())
      .filter(answer => answer.questionId === questionId)
      .sort((a, b) => a.order - b.order); // Sort by order
    return answers;
  }
  
  async createQuizAnswer(answer: InsertQuizAnswer): Promise<QuizAnswer> {
    const id = this.quizAnswerId++;
    const newAnswer: QuizAnswer = {
      ...answer,
      id
    };
    this.quizAnswers.set(id, newAnswer);
    return newAnswer;
  }
  
  async updateQuizAnswer(id: number, answer: Partial<QuizAnswer>): Promise<QuizAnswer> {
    const existingAnswer = this.quizAnswers.get(id);
    if (!existingAnswer) {
      throw new Error(`Quiz answer with id ${id} not found`);
    }
    
    const updatedAnswer = { 
      ...existingAnswer, 
      ...answer
    };
    this.quizAnswers.set(id, updatedAnswer);
    return updatedAnswer;
  }
  
  async deleteQuizAnswer(id: number): Promise<boolean> {
    return this.quizAnswers.delete(id);
  }
  
  // User Progress operations
  async getUserProgress(userId: number): Promise<UserProgress[]> {
    const progress = Array.from(this.userProgress.values())
      .filter(p => p.userId === userId)
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0)); // Sort by most recent
    return progress;
  }
  
  async getUserProgressForModule(userId: number, moduleId: number): Promise<UserProgress[]> {
    const progress = Array.from(this.userProgress.values())
      .filter(p => p.userId === userId && p.moduleId === moduleId);
    return progress;
  }
  
  async getUserProgressForLesson(userId: number, lessonId: number): Promise<UserProgress | undefined> {
    return Array.from(this.userProgress.values())
      .find(p => p.userId === userId && p.lessonId === lessonId);
  }
  
  async getUserProgressForQuiz(userId: number, quizId: number): Promise<UserProgress | undefined> {
    return Array.from(this.userProgress.values())
      .find(p => p.userId === userId && p.quizId === quizId);
  }
  
  async trackUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const id = this.userProgressId++;
    const newProgress: UserProgress = {
      ...progress,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.userProgress.set(id, newProgress);
    return newProgress;
  }
  
  async updateUserProgress(id: number, progress: Partial<UserProgress>): Promise<UserProgress> {
    const existingProgress = this.userProgress.get(id);
    if (!existingProgress) {
      throw new Error(`User progress with id ${id} not found`);
    }
    
    const updatedProgress = { 
      ...existingProgress, 
      ...progress,
      updatedAt: new Date()
    };
    this.userProgress.set(id, updatedProgress);
    return updatedProgress;
  }
  
  // Badge operations
  async getBadges(): Promise<Badge[]> {
    return Array.from(this.badges.values());
  }
  
  async getBadge(id: number): Promise<Badge | undefined> {
    return this.badges.get(id);
  }
  
  async createBadge(badge: InsertBadge): Promise<Badge> {
    const id = this.badgeId++;
    const newBadge: Badge = {
      ...badge,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.badges.set(id, newBadge);
    return newBadge;
  }
  
  async updateBadge(id: number, badge: Partial<Badge>): Promise<Badge> {
    const existingBadge = this.badges.get(id);
    if (!existingBadge) {
      throw new Error(`Badge with id ${id} not found`);
    }
    
    const updatedBadge = { 
      ...existingBadge, 
      ...badge,
      updatedAt: new Date()
    };
    this.badges.set(id, updatedBadge);
    return updatedBadge;
  }
  
  async deleteBadge(id: number): Promise<boolean> {
    return this.badges.delete(id);
  }
  
  // User Badge operations
  async getUserBadges(userId: number): Promise<UserBadge[]> {
    const userBadges = Array.from(this.userBadges.values())
      .filter(ub => ub.userId === userId);
    return userBadges;
  }
  
  async awardBadge(userId: number, badgeId: number): Promise<UserBadge> {
    const id = this.userBadgeId++;
    const badge = this.badges.get(badgeId);
    if (!badge) {
      throw new Error(`Badge with id ${badgeId} not found`);
    }
    
    const userBadge: UserBadge = {
      id,
      userId,
      badgeId,
      awardedAt: new Date()
    };
    this.userBadges.set(id, userBadge);
    return userBadge;
  }
  
  // Trading Workflow operations
  async getTradingWorkflows(userId: number): Promise<TradingWorkflow[]> {
    const workflows = Array.from(this.tradingWorkflows.values())
      .filter(workflow => workflow.userId === userId);
    
    // Sort by createdAt date (newest first)
    workflows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return workflows;
  }

  async getTradingWorkflow(id: number): Promise<TradingWorkflow | undefined> {
    return this.tradingWorkflows.get(id);
  }

  async createTradingWorkflow(workflow: InsertTradingWorkflow): Promise<TradingWorkflow> {
    const id = this.tradingWorkflowId++;
    const now = new Date();
    
    const newWorkflow: TradingWorkflow = {
      id,
      ...workflow,
      executionCount: 0,
      createdAt: now,
      updatedAt: now,
      logHistory: []
    };
    
    this.tradingWorkflows.set(id, newWorkflow);
    return newWorkflow;
  }

  async updateTradingWorkflow(id: number, workflow: Partial<TradingWorkflow>): Promise<TradingWorkflow> {
    const existingWorkflow = this.tradingWorkflows.get(id);
    
    if (!existingWorkflow) {
      throw new Error(`Trading workflow with id ${id} not found`);
    }
    
    const updatedWorkflow = {
      ...existingWorkflow,
      ...workflow,
      updatedAt: new Date()
    };
    
    this.tradingWorkflows.set(id, updatedWorkflow);
    return updatedWorkflow;
  }

  async updateWorkflowStatus(id: number, status: string): Promise<TradingWorkflow> {
    return this.updateTradingWorkflow(id, { status });
  }

  async deleteTradingWorkflow(id: number): Promise<boolean> {
    return this.tradingWorkflows.delete(id);
  }

  // Workflow Step operations
  async getWorkflowSteps(workflowId: number): Promise<WorkflowStep[]> {
    const steps = Array.from(this.workflowSteps.values())
      .filter(step => step.workflowId === workflowId);
    
    // Sort by step order
    steps.sort((a, b) => a.stepOrder - b.stepOrder);
    
    return steps;
  }

  async getWorkflowStep(id: number): Promise<WorkflowStep | undefined> {
    return this.workflowSteps.get(id);
  }

  async createWorkflowStep(step: InsertWorkflowStep): Promise<WorkflowStep> {
    const id = this.workflowStepId++;
    const now = new Date();
    
    const newStep: WorkflowStep = {
      id,
      ...step,
      createdAt: now,
      updatedAt: now
    };
    
    this.workflowSteps.set(id, newStep);
    return newStep;
  }

  async updateWorkflowStep(id: number, step: Partial<WorkflowStep>): Promise<WorkflowStep> {
    const existingStep = this.workflowSteps.get(id);
    
    if (!existingStep) {
      throw new Error(`Workflow step with id ${id} not found`);
    }
    
    const updatedStep = {
      ...existingStep,
      ...step,
      updatedAt: new Date()
    };
    
    this.workflowSteps.set(id, updatedStep);
    return updatedStep;
  }

  async deleteWorkflowStep(id: number): Promise<boolean> {
    return this.workflowSteps.delete(id);
  }
  
  // Workflow Condition operations
  async getWorkflowConditions(workflowId: number): Promise<WorkflowCondition[]> {
    return Array.from(this.workflowConditions.values())
      .filter(condition => condition.workflowId === workflowId);
  }

  async getWorkflowCondition(id: number): Promise<WorkflowCondition | undefined> {
    return this.workflowConditions.get(id);
  }

  async createWorkflowCondition(condition: InsertWorkflowCondition): Promise<WorkflowCondition> {
    const id = this.workflowConditionId++;
    const now = new Date();
    
    const newCondition: WorkflowCondition = {
      id,
      ...condition,
      lastEvaluated: null,
      lastResult: null,
      createdAt: now,
      updatedAt: now
    };
    
    this.workflowConditions.set(id, newCondition);
    return newCondition;
  }

  async updateWorkflowCondition(id: number, condition: Partial<WorkflowCondition>): Promise<WorkflowCondition> {
    const existingCondition = this.workflowConditions.get(id);
    
    if (!existingCondition) {
      throw new Error(`Workflow condition with id ${id} not found`);
    }
    
    const updatedCondition = {
      ...existingCondition,
      ...condition,
      updatedAt: new Date()
    };
    
    this.workflowConditions.set(id, updatedCondition);
    return updatedCondition;
  }

  async deleteWorkflowCondition(id: number): Promise<boolean> {
    return this.workflowConditions.delete(id);
  }

  // Workflow Action operations
  async getWorkflowActions(workflowId: number): Promise<WorkflowAction[]> {
    return Array.from(this.workflowActions.values())
      .filter(action => action.workflowId === workflowId);
  }

  async getWorkflowAction(id: number): Promise<WorkflowAction | undefined> {
    return this.workflowActions.get(id);
  }

  async createWorkflowAction(action: InsertWorkflowAction): Promise<WorkflowAction> {
    const id = this.workflowActionId++;
    const now = new Date();
    
    const newAction: WorkflowAction = {
      id,
      ...action,
      lastExecuted: null,
      isEnabled: action.isEnabled ?? true,
      createdAt: now,
      updatedAt: now
    };
    
    this.workflowActions.set(id, newAction);
    return newAction;
  }

  async updateWorkflowAction(id: number, action: Partial<WorkflowAction>): Promise<WorkflowAction> {
    const existingAction = this.workflowActions.get(id);
    
    if (!existingAction) {
      throw new Error(`Workflow action with id ${id} not found`);
    }
    
    const updatedAction = {
      ...existingAction,
      ...action,
      updatedAt: new Date()
    };
    
    this.workflowActions.set(id, updatedAction);
    return updatedAction;
  }

  async deleteWorkflowAction(id: number): Promise<boolean> {
    return this.workflowActions.delete(id);
  }
  
  // Workflow Execution Log operations
  async getWorkflowExecutionLogs(workflowId: number, limit: number = 10): Promise<WorkflowExecutionLog[]> {
    const logs = Array.from(this.workflowExecutionLogs.values())
      .filter(log => log.workflowId === workflowId);
    
    // Sort by executedAt date (newest first) and limit the results
    logs.sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());
    
    return logs.slice(0, limit);
  }

  async createWorkflowExecutionLog(log: InsertWorkflowExecutionLog): Promise<WorkflowExecutionLog> {
    const id = this.workflowExecutionLogId++;
    const now = new Date();
    
    const newLog: WorkflowExecutionLog = {
      id,
      ...log,
      executedAt: log.executedAt || now,
      createdAt: now,
      updatedAt: now
    };
    
    this.workflowExecutionLogs.set(id, newLog);
    
    // Update the workflow's execution count and last executed time
    const workflow = this.tradingWorkflows.get(log.workflowId);
    if (workflow) {
      workflow.executionCount = (workflow.executionCount || 0) + 1;
      workflow.lastExecutedAt = now;
      workflow.logHistory = [...(workflow.logHistory || []), {
        id: newLog.id,
        status: newLog.status,
        executedAt: newLog.executedAt,
        message: newLog.message
      }].slice(-10); // Keep only the 10 most recent logs in the workflow
      
      this.tradingWorkflows.set(workflow.id, workflow);
    }
    
    return newLog;
  }
}

// Use MemStorage for development
export const storage = new MemStorage();
