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
  trades: integer("trades").notNull(),
  equity: json("equity"),
  trades_data: json("trades_data"),
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
  trades: true,
  equity: true,
  trades_data: true,
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
