import { pgTable, text, serial, integer, boolean, timestamp, json, decimal, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive"),
  plan: text("plan").default("free"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
});

// Trading Strategy table
export const strategies = pgTable("strategies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  code: text("code").notNull(),
  symbol: text("symbol").notNull(),
  timeframe: text("timeframe").notNull(),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertStrategySchema = createInsertSchema(strategies).pick({
  userId: true,
  name: true,
  description: true,
  code: true,
  symbol: true,
  timeframe: true,
  isActive: true,
});

// Backtest results table
export const backtests = pgTable("backtests", {
  id: serial("id").primaryKey(),
  strategyId: integer("strategy_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  initialCapital: decimal("initial_capital").notNull(),
  finalCapital: decimal("final_capital").notNull(),
  totalPnl: decimal("total_pnl").notNull(),
  percentReturn: decimal("percent_return").notNull(),
  sharpeRatio: decimal("sharpe_ratio"),
  maxDrawdown: decimal("max_drawdown"),
  winRate: decimal("win_rate"),
  profitFactor: decimal("profit_factor"), // Ratio of gross profits to gross losses
  averageProfit: decimal("average_profit"), // Average profit per winning trade
  averageLoss: decimal("average_loss"), // Average loss per losing trade
  maxConsecutiveWins: integer("max_consecutive_wins"), // Maximum consecutive winning trades
  maxConsecutiveLosses: integer("max_consecutive_losses"), // Maximum consecutive losing trades
  expectancy: decimal("expectancy"), // Expected return per trade
  annualizedReturn: decimal("annualized_return"), // Annualized return percentage
  sortinoRatio: decimal("sortino_ratio"), // Like Sharpe but only downside deviation
  calmarRatio: decimal("calmar_ratio"), // Annualized return divided by max drawdown
  trades: integer("trades").notNull(),
  equity: json("equity"),
  trades_data: json("trades_data"),
  // Advanced parameters used for backtesting
  commissionPercent: decimal("commission_percent"),
  slippagePercent: decimal("slippage_percent"),
  positionSizing: decimal("position_sizing"), // 0-1, percentage of capital to use per trade
  stopLossPercent: decimal("stop_loss_percent"), // Stop loss percentage if used
  takeProfitPercent: decimal("take_profit_percent"), // Take profit percentage if used
  riskRewardRatio: decimal("risk_reward_ratio"), // Risk/reward ratio target
  maxOpenPositions: integer("max_open_positions"), // Maximum number of concurrent positions
  timeInForceExitDays: integer("time_in_force_exit_days"), // Auto-exit after N days
  marketConditions: text("market_conditions"), // e.g., 'bull', 'bear', 'sideways'
  dataFrequency: text("data_frequency"), // e.g., '1m', '5m', '1h', '1d'
  optimizationTarget: text("optimization_target"), // e.g., 'sharpe', 'returns', 'drawdown'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBacktestSchema = createInsertSchema(backtests).pick({
  strategyId: true,
  startDate: true,
  endDate: true,
  initialCapital: true,
  finalCapital: true,
  totalPnl: true,
  percentReturn: true,
  sharpeRatio: true,
  maxDrawdown: true,
  winRate: true,
  profitFactor: true,
  averageProfit: true,
  averageLoss: true,
  maxConsecutiveWins: true,
  maxConsecutiveLosses: true,
  expectancy: true,
  annualizedReturn: true,
  sortinoRatio: true,
  calmarRatio: true,
  trades: true,
  equity: true,
  trades_data: true,
  commissionPercent: true,
  slippagePercent: true,
  positionSizing: true,
  stopLossPercent: true,
  takeProfitPercent: true,
  riskRewardRatio: true,
  maxOpenPositions: true,
  timeInForceExitDays: true,
  marketConditions: true,
  dataFrequency: true,
  optimizationTarget: true,
});

// Mock trades table
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  strategyId: integer("strategy_id").notNull(),
  userId: integer("user_id").notNull(),
  symbol: text("symbol").notNull(),
  type: text("type").notNull(), // BUY or SELL
  price: decimal("price").notNull(),
  quantity: decimal("quantity").notNull(),
  pnl: decimal("pnl"),
  percentPnl: decimal("percent_pnl"),
  isOpen: boolean("is_open").default(true),
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
});

export const insertTradeSchema = createInsertSchema(trades).pick({
  strategyId: true,
  userId: true,
  symbol: true,
  type: true,
  price: true,
  quantity: true,
  pnl: true,
  percentPnl: true,
  isOpen: true,
  openedAt: true,
  closedAt: true,
});

// Broker connections table
export const brokerConnections = pgTable("broker_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  broker: text("broker").notNull(),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  apiPassphrase: text("api_passphrase"),
  apiToken: text("api_token"),
  baseUrl: text("base_url"),
  environment: text("environment"),  // 'paper', 'live', 'demo', etc.
  isActive: boolean("is_active").default(false),
  accountId: text("account_id"),
  accountName: text("account_name"),
  status: text("status").default('pending'), // 'pending', 'connected', 'failed', etc.
  lastConnected: timestamp("last_connected"),
  metadata: json("metadata"),  // Additional broker-specific settings as JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    userBrokerUnique: unique().on(table.userId, table.broker)
  };
});

export const insertBrokerConnectionSchema = createInsertSchema(brokerConnections).pick({
  userId: true,
  broker: true,
  apiKey: true,
  apiSecret: true,
  apiPassphrase: true,
  apiToken: true,
  baseUrl: true,
  environment: true,
  isActive: true,
  accountId: true,
  accountName: true,
  metadata: true,
});

// Market data table (for historical price data cache)
export const marketData = pgTable("market_data", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  timeframe: text("timeframe").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  open: decimal("open").notNull(),
  high: decimal("high").notNull(),
  low: decimal("low").notNull(),
  close: decimal("close").notNull(),
  volume: decimal("volume"),
}, (table) => {
  return {
    symbolTimeframeTimestampUnique: unique().on(table.symbol, table.timeframe, table.timestamp)
  };
});

export const insertMarketDataSchema = createInsertSchema(marketData).pick({
  symbol: true,
  timeframe: true,
  timestamp: true,
  open: true,
  high: true,
  low: true,
  close: true,
  volume: true,
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = z.infer<typeof insertStrategySchema>;

export type Backtest = typeof backtests.$inferSelect;
export type InsertBacktest = z.infer<typeof insertBacktestSchema>;

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;

export type BrokerConnection = typeof brokerConnections.$inferSelect;
export type InsertBrokerConnection = z.infer<typeof insertBrokerConnectionSchema>;

export type MarketData = typeof marketData.$inferSelect;
export type InsertMarketData = z.infer<typeof insertMarketDataSchema>;

// Deployed strategies table
export const deployedStrategies = pgTable("deployed_strategies", {
  id: serial("id").primaryKey(),
  strategyId: integer("strategy_id").notNull(),
  userId: integer("user_id").notNull(),
  brokerId: integer("broker_id").notNull(),
  name: text("name").notNull(),
  lotMultiplier: decimal("lot_multiplier").default("1").notNull(),
  capitalDeployed: decimal("capital_deployed").notNull(),
  tradingType: text("trading_type").notNull(), // 'paper', 'live'
  status: text("status").notNull(), // 'running', 'paused', 'archived', 'exited'
  currentPnl: decimal("current_pnl").default("0"),
  percentPnl: decimal("percent_pnl").default("0"),
  deployedAt: timestamp("deployed_at").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  metadata: json("metadata"), // Additional settings or info
});

export const insertDeployedStrategySchema = createInsertSchema(deployedStrategies).pick({
  strategyId: true,
  userId: true,
  brokerId: true,
  name: true,
  lotMultiplier: true,
  capitalDeployed: true,
  tradingType: true,
  status: true,
  currentPnl: true,
  percentPnl: true,
  deployedAt: true,
  metadata: true,
});

export type DeployedStrategy = typeof deployedStrategies.$inferSelect;
export type InsertDeployedStrategy = z.infer<typeof insertDeployedStrategySchema>;

// Risk Management Tables

// Portfolio Risk table
export const portfolioRisks = pgTable("portfolio_risks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  totalValue: decimal("total_value").notNull(),
  dailyValue: decimal("daily_value").notNull(),
  dailyChange: decimal("daily_change").notNull(),
  weeklyChange: decimal("weekly_change").notNull(),
  monthlyChange: decimal("monthly_change").notNull(),
  currentDrawdown: decimal("current_drawdown").notNull(),
  maxDrawdown: decimal("max_drawdown").notNull(),
  volatility: decimal("volatility").notNull(),
  sharpeRatio: decimal("sharpe_ratio").notNull(),
  beta: decimal("beta").notNull(),
  strategies: integer("strategies").notNull(),
  activeTrades: integer("active_trades").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPortfolioRiskSchema = createInsertSchema(portfolioRisks).pick({
  userId: true,
  totalValue: true,
  dailyValue: true,
  dailyChange: true,
  weeklyChange: true,
  monthlyChange: true,
  currentDrawdown: true,
  maxDrawdown: true,
  volatility: true,
  sharpeRatio: true,
  beta: true,
  strategies: true,
  activeTrades: true,
});

// Risk Limits table
export const riskLimits = pgTable("risk_limits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'account', 'strategy', 'position'
  metric: text("metric").notNull(),
  threshold: decimal("threshold").notNull(),
  currentValue: decimal("current_value"),
  status: text("status").default("safe").notNull(), // 'safe', 'warning', 'breach'
  action: text("action").notNull(), // 'notify', 'reduce', 'exit'
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRiskLimitSchema = createInsertSchema(riskLimits).pick({
  userId: true,
  name: true,
  description: true,
  type: true,
  metric: true,
  threshold: true,
  currentValue: true,
  status: true,
  action: true,
  isActive: true,
});

// Position Sizing Rules table
export const positionSizingRules = pgTable("position_sizing_rules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  strategy: text("strategy").notNull(),
  method: text("method").notNull(), // 'fixed', 'volatility', 'risk-based', 'kelly'
  riskPerTrade: decimal("risk_per_trade").notNull(),
  maxPositionSize: decimal("max_position_size").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPositionSizingRuleSchema = createInsertSchema(positionSizingRules).pick({
  userId: true,
  name: true,
  description: true,
  strategy: true,
  method: true,
  riskPerTrade: true,
  maxPositionSize: true,
  isActive: true,
});

// Market Exposure table
export const marketExposures = pgTable("market_exposures", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  market: text("market").notNull(),
  percentage: decimal("percentage").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    userMarketUnique: unique().on(table.userId, table.market)
  };
});

export const insertMarketExposureSchema = createInsertSchema(marketExposures).pick({
  userId: true,
  market: true,
  percentage: true,
});

// Sector Exposure table
export const sectorExposures = pgTable("sector_exposures", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sector: text("sector").notNull(),
  percentage: decimal("percentage").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    userSectorUnique: unique().on(table.userId, table.sector)
  };
});

export const insertSectorExposureSchema = createInsertSchema(sectorExposures).pick({
  userId: true,
  sector: true,
  percentage: true,
});

// Strategy Correlation table
export const strategyCorrelations = pgTable("strategy_correlations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  strategyId: integer("strategy_id").notNull(),
  strategyName: text("strategy_name").notNull(),
  correlationData: text("correlation_data").notNull(), // JSON string of correlation values
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    userStrategyUnique: unique().on(table.userId, table.strategyId)
  };
});

export const insertStrategyCorrelationSchema = createInsertSchema(strategyCorrelations).pick({
  userId: true,
  strategyId: true,
  strategyName: true,
  correlationData: true,
});

// Type definitions for all tables
export type PortfolioRisk = typeof portfolioRisks.$inferSelect;
export type InsertPortfolioRisk = z.infer<typeof insertPortfolioRiskSchema>;

export type RiskLimit = typeof riskLimits.$inferSelect;
export type InsertRiskLimit = z.infer<typeof insertRiskLimitSchema>;

export type PositionSizingRule = typeof positionSizingRules.$inferSelect;
export type InsertPositionSizingRule = z.infer<typeof insertPositionSizingRuleSchema>;

export type MarketExposure = typeof marketExposures.$inferSelect;
export type InsertMarketExposure = z.infer<typeof insertMarketExposureSchema>;

export type SectorExposure = typeof sectorExposures.$inferSelect;
export type InsertSectorExposure = z.infer<typeof insertSectorExposureSchema>;

export type StrategyCorrelation = typeof strategyCorrelations.$inferSelect;
export type InsertStrategyCorrelation = z.infer<typeof insertStrategyCorrelationSchema>;

// Gamified Learning Module Tables
export const learningModules = pgTable("learning_modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  level: text("level").notNull().default("beginner"), // beginner, intermediate, advanced
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => learningModules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  order: integer("order").notNull().default(0),
  points: integer("points").notNull().default(10),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  passingScore: integer("passing_score").notNull().default(70),
  points: integer("points").notNull().default(20),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  explanation: text("explanation"),
  type: text("type").notNull().default("multiple_choice"), // multiple_choice, true_false
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quizAnswers = pgTable("quiz_answers", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => quizQuestions.id, { onDelete: "cascade" }),
  answer: text("answer").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
  order: integer("order").notNull().default(0),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  moduleId: integer("module_id").notNull().references(() => learningModules.id, { onDelete: "cascade" }),
  lessonId: integer("lesson_id").references(() => lessons.id, { onDelete: "cascade" }),
  quizId: integer("quiz_id").references(() => quizzes.id, { onDelete: "cascade" }),
  completed: boolean("completed").notNull().default(false),
  score: integer("score"),
  earnedPoints: integer("earned_points").notNull().default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  requirement: text("requirement").notNull(),
  points: integer("points").notNull().default(50),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badgeId: integer("badge_id").notNull().references(() => badges.id, { onDelete: "cascade" }),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
});

// Insert schemas for learning module tables
export const insertLearningModuleSchema = createInsertSchema(learningModules);
export const insertLessonSchema = createInsertSchema(lessons);
export const insertQuizSchema = createInsertSchema(quizzes);
export const insertQuizQuestionSchema = createInsertSchema(quizQuestions);
export const insertQuizAnswerSchema = createInsertSchema(quizAnswers);
export const insertUserProgressSchema = createInsertSchema(userProgress);
export const insertBadgeSchema = createInsertSchema(badges);
export const insertUserBadgeSchema = createInsertSchema(userBadges);

// Types for learning module tables
export type LearningModule = typeof learningModules.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;

export type InsertLearningModule = z.infer<typeof insertLearningModuleSchema>;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type InsertQuizAnswer = z.infer<typeof insertQuizAnswerSchema>;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;

// User Trading Preferences table
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  riskTolerance: integer("risk_tolerance").notNull(), // 1-5 scale
  investmentHorizon: text("investment_horizon").notNull(), // short, medium, long
  preferredMarkets: text("preferred_markets").notNull(), // stored as JSON string ["stocks", "etfs", etc]
  tradingFrequency: text("trading_frequency").notNull(), // day, swing, position
  capitalAvailable: decimal("capital_available").notNull(),
  automationLevel: text("automation_level").notNull(), // fully-automated, semi-automated, manual
  preferredIndicators: text("preferred_indicators").notNull(), // stored as JSON string ["MA", "RSI", etc]
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserPreferenceSchema = createInsertSchema(userPreferences).pick({
  userId: true,
  riskTolerance: true,
  investmentHorizon: true,
  preferredMarkets: true,
  tradingFrequency: true,
  capitalAvailable: true,
  automationLevel: true,
  preferredIndicators: true,
});

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = z.infer<typeof insertUserPreferenceSchema>;

// Strategy Recommendation table (to store recommendation results)
export const strategyRecommendations = pgTable("strategy_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  templateId: text("template_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  matchScore: integer("match_score").notNull(),
  riskLevel: integer("risk_level").notNull(),
  expectedReturn: text("expected_return").notNull(),
  timeFrame: text("time_frame").notNull(),
  suitableMarkets: text("suitable_markets").notNull(), // JSON string
  keyIndicators: text("key_indicators").notNull(), // JSON string
  tradeFrequency: text("trade_frequency").notNull(),
  backtestPerformance: json("backtest_performance").notNull(),
  complexity: integer("complexity").notNull(),
  code: text("code").notNull(),
  favorite: boolean("favorite").default(false),
  applied: boolean("applied").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStrategyRecommendationSchema = createInsertSchema(strategyRecommendations).pick({
  userId: true,
  templateId: true,
  name: true,
  description: true,
  matchScore: true,
  riskLevel: true,
  expectedReturn: true,
  timeFrame: true,
  suitableMarkets: true,
  keyIndicators: true,
  tradeFrequency: true,
  backtestPerformance: true,
  complexity: true,
  code: true,
  favorite: true,
  applied: true,
});

export type StrategyRecommendation = typeof strategyRecommendations.$inferSelect;
export type InsertStrategyRecommendation = z.infer<typeof insertStrategyRecommendationSchema>;

// Trading Workflow Automation Tables

// Trading Workflows table
export const tradingWorkflows = pgTable("trading_workflows", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("inactive"), // active, inactive, paused, archived
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  executionCount: integer("execution_count").default(0),
  lastExecutedAt: timestamp("last_executed_at"),
  schedule: text("schedule"), // CRON expression for scheduled execution
  isAutomatic: boolean("is_automatic").default(false), // whether it runs on a schedule or manually
  priority: integer("priority").default(0), // execution priority for multiple workflows
  logHistory: json("log_history"), // JSON array of execution logs
});

export const insertTradingWorkflowSchema = createInsertSchema(tradingWorkflows).pick({
  userId: true,
  name: true,
  description: true,
  status: true,
  schedule: true,
  isAutomatic: true,
  priority: true,
});

// Workflow Steps table
export const workflowSteps = pgTable("workflow_steps", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull(),
  stepType: text("step_type").notNull(), // condition, action, notification, delay
  stepOrder: integer("step_order").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  config: json("config").notNull(), // JSON with step configuration
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isEnabled: boolean("is_enabled").default(true),
  executionTime: integer("execution_time").default(0), // ms it took to execute
  lastResult: text("last_result"), // success, failure, skipped
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(0),
});

export const insertWorkflowStepSchema = createInsertSchema(workflowSteps).pick({
  workflowId: true,
  stepType: true,
  stepOrder: true,
  name: true,
  description: true,
  config: true,
  isEnabled: true,
  maxRetries: true,
});

// Workflow Conditions table - conditions that trigger workflows
export const workflowConditions = pgTable("workflow_conditions", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull(),
  conditionType: text("condition_type").notNull(), // price, indicator, time, volume, pattern, custom
  symbol: text("symbol").notNull(),
  operator: text("operator").notNull(), // >, <, ==, >=, <=, between, crosses_above, crosses_below
  value: text("value").notNull(), // could be a number or JSON for complex conditions
  timeframe: text("timeframe"), // 1m, 5m, 15m, 1h, 4h, 1d
  lookbackPeriod: integer("lookback_period"), // number of bars/candles to look back
  isEnabled: boolean("is_enabled").default(true),
  lastEvaluated: timestamp("last_evaluated"),
  lastResult: boolean("last_result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertWorkflowConditionSchema = createInsertSchema(workflowConditions).pick({
  workflowId: true,
  conditionType: true,
  symbol: true,
  operator: true,
  value: true,
  timeframe: true,
  lookbackPeriod: true,
  isEnabled: true,
});

// Workflow Actions table - actions to take when conditions are met
export const workflowActions = pgTable("workflow_actions", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull(),
  stepId: integer("step_id").notNull(),
  actionType: text("action_type").notNull(), // buy, sell, alert, webhook, email, sms, custom
  symbol: text("symbol"), // optional, might be derived from condition
  quantity: text("quantity"), // can be fixed number or formula like "10% of portfolio"
  price: text("price"), // market, limit, or formula
  orderType: text("order_type"), // market, limit, stop, stop-limit
  duration: text("duration"), // day, gtc, gtd
  additionalParams: json("additional_params"), // JSON with action-specific parameters
  isEnabled: boolean("is_enabled").default(true),
  lastExecuted: timestamp("last_executed"),
  executionStatus: text("execution_status"), // pending, success, failure
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertWorkflowActionSchema = createInsertSchema(workflowActions).pick({
  workflowId: true,
  stepId: true,
  actionType: true,
  symbol: true,
  quantity: true,
  price: true,
  orderType: true,
  duration: true,
  additionalParams: true,
  isEnabled: true,
});

// Workflow Execution Logs table - tracks execution history
export const workflowExecutionLogs = pgTable("workflow_execution_logs", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull(),
  executionStartTime: timestamp("execution_start_time").defaultNow().notNull(),
  executionEndTime: timestamp("execution_end_time"),
  status: text("status").notNull(), // pending, running, completed, failed
  triggeredBy: text("triggered_by").notNull(), // schedule, manual, event, condition
  summary: text("summary"),
  details: json("details"), // JSON with execution details
  errorMessage: text("error_message"),
});

export const insertWorkflowExecutionLogSchema = createInsertSchema(workflowExecutionLogs).pick({
  workflowId: true,
  executionStartTime: true,
  executionEndTime: true,
  status: true,
  triggeredBy: true,
  summary: true,
  details: true,
  errorMessage: true,
});

// Type definitions for workflow automation
export type TradingWorkflow = typeof tradingWorkflows.$inferSelect;
export type InsertTradingWorkflow = z.infer<typeof insertTradingWorkflowSchema>;

export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type InsertWorkflowStep = z.infer<typeof insertWorkflowStepSchema>;

export type WorkflowCondition = typeof workflowConditions.$inferSelect;
export type InsertWorkflowCondition = z.infer<typeof insertWorkflowConditionSchema>;

export type WorkflowAction = typeof workflowActions.$inferSelect;
export type InsertWorkflowAction = z.infer<typeof insertWorkflowActionSchema>;

export type WorkflowExecutionLog = typeof workflowExecutionLogs.$inferSelect;
export type InsertWorkflowExecutionLog = z.infer<typeof insertWorkflowExecutionLogSchema>;
