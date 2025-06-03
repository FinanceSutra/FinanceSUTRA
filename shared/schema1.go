package shared

import (
	"time"
	"database/sql"
    "encoding/json"
	"github.com/shopspring/decimal"
)

// User table
type User struct {
    ID                  int64     `db:"id"`
    Username            string    `db:"username"`
    Password            string    `db:"password"`
    Email               string    `db:"email"`
    FullName            string    `db:"full_name"`
    CreatedAt           time.Time `db:"created_at"`
    StripeCustomerID    string    `db:"stripe_customer_id"`
    StripeSubscriptionID string   `db:"stripe_subscription_id"`
    SubscriptionStatus  string    `db:"subscription_status"`
    Plan                string    `db:"plan"`
}

type InsertUser struct {
    Username string `json:"username"`
    Password string `json:"password"`
    Email    string `json:"email"`
    FullName string `json:"full_name"`
}

// Trading Strategy table
type Strategy struct {
    ID          int64     `db:"id"`
    UserID      int64     `db:"user_id"`
    Name        string    `db:"name"`
    Description string    `db:"description"`
    Code        string    `db:"code"`
    Symbol      string    `db:"symbol"`
    Timeframe   string    `db:"timeframe"`
    IsActive    bool      `db:"is_active"`
    CreatedAt   time.Time `db:"created_at"`
    UpdatedAt   time.Time `db:"updated_at"`
}

type InsertStrategy struct {
    UserID      int64  `json:"user_id"`
    Name        string `json:"name"`
    Description string `json:"description"`
    Code        string `json:"code"`
    Symbol      string `json:"symbol"`
    Timeframe   string `json:"timeframe"`
    IsActive    bool   `json:"is_active"`
}

// Backtest results table
type Backtest struct {
    ID                    int64         `db:"id"`
    StrategyID            int           `db:"strategy_id"`
    StartDate             time.Time     `db:"start_date"`
    EndDate               time.Time     `db:"end_date"`
    InitialCapital        float64       `db:"initial_capital"`
    FinalCapital          float64       `db:"final_capital"`
    TotalPnl              float64       `db:"total_pnl"`
    PercentReturn         float64       `db:"percent_return"`
    SharpeRatio           sql.NullFloat64 `db:"sharpe_ratio"`
    MaxDrawdown           sql.NullFloat64 `db:"max_drawdown"`
    WinRate               sql.NullFloat64 `db:"win_rate"`
    ProfitFactor          sql.NullFloat64 `db:"profit_factor"`
    AverageProfit         sql.NullFloat64 `db:"average_profit"`
    AverageLoss           sql.NullFloat64 `db:"average_loss"`
    MaxConsecutiveWins    sql.NullInt64  `db:"max_consecutive_wins"`
    MaxConsecutiveLosses  sql.NullInt64  `db:"max_consecutive_losses"`
    Expectancy            sql.NullFloat64 `db:"expectancy"`
    AnnualizedReturn      sql.NullFloat64 `db:"annualized_return"`
    SortinoRatio          sql.NullFloat64 `db:"sortino_ratio"`
    CalmarRatio           sql.NullFloat64 `db:"calmar_ratio"`
    Trades                int           `db:"trades"`
    Equity                []byte        `db:"equity"`
    TradesData            []byte        `db:"trades_data"`
    CommissionPercent     sql.NullFloat64 `db:"commission_percent"`
    SlippagePercent       sql.NullFloat64 `db:"slippage_percent"`
    PositionSizing        sql.NullFloat64 `db:"position_sizing"`
    StopLossPercent       sql.NullFloat64 `db:"stop_loss_percent"`
    TakeProfitPercent     sql.NullFloat64 `db:"take_profit_percent"`
    RiskRewardRatio       sql.NullFloat64 `db:"risk_reward_ratio"`
    MaxOpenPositions      sql.NullInt64  `db:"max_open_positions"`
    TimeInForceExitDays   sql.NullInt64  `db:"time_in_force_exit_days"`
    MarketConditions      sql.NullString `db:"market_conditions"`
    DataFrequency         sql.NullString `db:"data_frequency"`
    OptimizationTarget    sql.NullString `db:"optimization_target"`
    CreatedAt             time.Time     `db:"created_at"`
}

type InsertBacktest struct {
    StrategyID            int           `json:"strategyId"`
    StartDate             time.Time     `json:"startDate"`
    EndDate               time.Time     `json:"endDate"`
    InitialCapital        float64       `json:"initialCapital"`
    FinalCapital          float64       `json:"finalCapital"`
    TotalPnl              float64       `json:"totalPnl"`
    PercentReturn         float64       `json:"percentReturn"`
    SharpeRatio           *float64      `json:"sharpeRatio"`
    MaxDrawdown           *float64      `json:"maxDrawdown"`
    WinRate               *float64      `json:"winRate"`
    ProfitFactor          *float64      `json:"profitFactor"`
    AverageProfit         *float64      `json:"averageProfit"`
    AverageLoss           *float64      `json:"averageLoss"`
    MaxConsecutiveWins    *int64        `json:"maxConsecutiveWins"`
    MaxConsecutiveLosses  *int64        `json:"maxConsecutiveLosses"`
    Expectancy            *float64      `json:"expectancy"`
    AnnualizedReturn      *float64      `json:"annualizedReturn"`
    SortinoRatio          *float64      `json:"sortinoRatio"`
    CalmarRatio           *float64      `json:"calmarRatio"`
    Trades                int           `json:"trades"`
    Equity                []byte        `json:"equity"`
    TradesData            []byte        `json:"tradesData"`
    CommissionPercent     *float64      `json:"commissionPercent"`
    SlippagePercent       *float64      `json:"slippagePercent"`
    PositionSizing        *float64      `json:"positionSizing"`
    StopLossPercent       *float64      `json:"stopLossPercent"`
    TakeProfitPercent     *float64      `json:"takeProfitPercent"`
    RiskRewardRatio       *float64      `json:"riskRewardRatio"`
    MaxOpenPositions      *int64        `json:"maxOpenPositions"`
    TimeInForceExitDays   *int64        `json:"timeInForceExitDays"`
    MarketConditions      *string       `json:"marketConditions"`
    DataFrequency         *string       `json:"dataFrequency"`
    OptimizationTarget    *string       `json:"optimizationTarget"`
}

// Mock trades table
type Trade struct {
    ID          int64     `db:"id"`
    StrategyID  int64     `db:"strategy_id"`
    UserID      int64     `db:"user_id"`
    Symbol      string    `db:"symbol"`
    Type        string    `db:"type"`
    Price       float64   `db:"price"`
    Quantity    float64   `db:"quantity"`
    PnL         float64   `db:"pnl"`
    PercentPnL  float64   `db:"percent_pnl"`
    IsOpen      bool      `db:"is_open"`
    OpenedAt    time.Time `db:"opened_at"`
    ClosedAt    time.Time `db:"closed_at"`
}

type InsertTrade struct {
    StrategyID  int64     `json:"strategy_id"`
    UserID      int64     `json:"user_id"`
    Symbol      string    `json:"symbol"`
    Type        string    `json:"type"`
    Price       float64   `json:"price"`
    Quantity    float64   `json:"quantity"`
    PnL         float64   `json:"pnl"`
    PercentPnL  float64   `json:"percent_pnl"`
    IsOpen      bool      `json:"is_open"`
    OpenedAt    time.Time `json:"opened_at"`
    ClosedAt    time.Time `json:"closed_at"`
}

// Broker connections table
type BrokerConnection struct {
    ID             int64     `db:"id"`
    UserID         int64     `db:"user_id"`
    Broker         string    `db:"broker"`
    APIKey         string    `db:"api_key"`
    APISecret      string    `db:"api_secret"`
    APIPassphrase  string    `db:"api_passphrase"`
    APIToken       string    `db:"api_token"`
    BaseURL        string    `db:"base_url"`
    Environment    string    `db:"environment"`
    IsActive       bool      `db:"is_active"`
    AccountID      string    `db:"account_id"`
    AccountName    string    `db:"account_name"`
    Status         string    `db:"status"`
    LastConnected  time.Time `db:"last_connected"`
    Metadata       []byte    `db:"metadata"`
    CreatedAt      time.Time `db:"created_at"`
    UpdatedAt      time.Time `db:"updated_at"`
}

type InsertBrokerConnection struct {
    UserID         int64     `json:"user_id"`
    Broker         string    `json:"broker"`
    APIKey         string    `json:"api_key"`
    APISecret      string    `json:"api_secret"`
    APIPassphrase  string    `json:"api_passphrase"`
    APIToken       string    `json:"api_token"`
    BaseURL        string    `json:"base_url"`
    Environment    string    `json:"environment"`
    IsActive       bool      `json:"is_active"`
    AccountID      string    `json:"account_id"`
    AccountName    string    `json:"account_name"`
    Metadata       []byte    `json:"metadata"`
}

// MarketData represents the market_data table
type MarketData struct {
	ID        int64     `db:"id"`
	Symbol    string    `db:"symbol"`
	Timeframe string    `db:"timeframe"`
	Timestamp time.Time `db:"timestamp"`
	Open      float64   `db:"open"`
	High      float64   `db:"high"`
	Low       float64   `db:"low"`
	Close     float64   `db:"close"`
	Volume    float64   `db:"volume"`
}

// InsertMarketData represents the insert schema for market_data table
type InsertMarketData struct {
	Symbol    string    `db:"symbol"`
	Timeframe string    `db:"timeframe"`
	Timestamp time.Time `db:"timestamp"`
	Open      float64   `db:"open"`
	High      float64   `db:"high"`
	Low       float64   `db:"low"`
	Close     float64   `db:"close"`
	Volume    float64   `db:"volume"`
}

// DeployedStrategy represents the deployed_strategies table
type DeployedStrategy struct {
	ID             int64     `db:"id"`
	StrategyID     int64     `db:"strategy_id"`
	UserID         int64     `db:"user_id"`
	BrokerID       int64     `db:"broker_id"`
	Name          string    `db:"name"`
	LotMultiplier  float64   `db:"lot_multiplier"`
	CapitalDeployed float64   `db:"capital_deployed"`
	TradingType    string    `db:"trading_type"`
	Status         string    `db:"status"`
	CurrentPnl     float64   `db:"current_pnl"`
	PercentPnl     float64   `db:"percent_pnl"`
	DeployedAt     time.Time `db:"deployed_at"`
	LastUpdated    time.Time `db:"last_updated"`
	Metadata       json.RawMessage `gorm:"type:json"` // accepts raw JSON objects or arrays
}

// InsertDeployedStrategy represents the insert schema for deployed_strategies table
type InsertDeployedStrategy struct {
	StrategyID     int64     `db:"strategy_id"`
	UserID         int64     `db:"user_id"`
	BrokerID       int64     `db:"broker_id"`
	Name          string    `db:"name"`
	LotMultiplier  float64   `db:"lot_multiplier"`
	CapitalDeployed float64   `db:"capital_deployed"`
	TradingType    string    `db:"trading_type"`
	Status         string    `db:"status"`
	CurrentPnl     float64   `db:"current_pnl"`
	PercentPnl     float64   `db:"percent_pnl"`
	DeployedAt     time.Time `db:"deployed_at"`
	Metadata       []byte    `db:"metadata"`
}

// PortfolioRisk represents the portfolio_risks table
type PortfolioRisk struct {
	ID             int64     `db:"id"`
	UserID         int64     `db:"user_id"`
	TotalValue     float64   `db:"total_value"`
	DailyValue     float64   `db:"daily_value"`
	DailyChange    float64   `db:"daily_change"`
	WeeklyChange   float64   `db:"weekly_change"`
	MonthlyChange  float64   `db:"monthly_change"`
	CurrentDrawdown float64   `db:"current_drawdown"`
	MaxDrawdown    float64   `db:"max_drawdown"`
	Volatility     float64   `db:"volatility"`
	SharpeRatio    float64   `db:"sharpe_ratio"`
	Beta           float64   `db:"beta"`
	Strategies     int64     `db:"strategies"`
	ActiveTrades   int64     `db:"active_trades"`
	UpdatedAt      time.Time `db:"updated_at"`
}

// InsertPortfolioRisk represents the insert schema for portfolio_risks table
type InsertPortfolioRisk struct {
	UserID         int64     `db:"user_id"`
	TotalValue     float64   `db:"total_value"`
	DailyValue     float64   `db:"daily_value"`
	DailyChange    float64   `db:"daily_change"`
	WeeklyChange   float64   `db:"weekly_change"`
	MonthlyChange  float64   `db:"monthly_change"`
	CurrentDrawdown float64   `db:"current_drawdown"`
	MaxDrawdown    float64   `db:"max_drawdown"`
	Volatility     float64   `db:"volatility"`
	SharpeRatio    float64   `db:"sharpe_ratio"`
	Beta           float64   `db:"beta"`
	Strategies     int64     `db:"strategies"`
	ActiveTrades   int64     `db:"active_trades"`
}

// RiskLimits table
type RiskLimits struct {
	ID           int64     `db:"id"`
	UserID       int64     `db:"user_id"`
	Name         string    `db:"name"`
	Description  sql.NullString `db:"description"`
	Type         string    `db:"type"`
	Metric       string    `db:"metric"`
	Threshold    float64   `db:"threshold"`
	CurrentValue sql.NullFloat64 `db:"current_value"`
	Status       string    `db:"status"`
	Action       string    `db:"action"`
	IsActive     bool      `db:"is_active"`
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
}

// InsertRiskLimitSchema is the schema for inserting risk limits
type InsertRiskLimitSchema struct {
	UserID       int64     `db:"user_id"`
	Name         string    `db:"name"`
	Description  sql.NullString `db:"description"`
	Type         string    `db:"type"`
	Metric       string    `db:"metric"`
	Threshold    float64   `db:"threshold"`
	CurrentValue sql.NullFloat64 `db:"current_value"`
	Status       string    `db:"status"`
	Action       string    `db:"action"`
	IsActive     bool      `db:"is_active"`
}

// PositionSizingRules table
type PositionSizingRules struct {
	ID              int64     `db:"id"`
	UserID          int64     `db:"user_id"`
	Name            string    `db:"name"`
	Description     sql.NullString `db:"description"`
	Strategy        string    `db:"strategy"`
	Method          string    `db:"method"`
	RiskPerTrade    float64   `db:"risk_per_trade"`
	MaxPositionSize float64   `db:"max_position_size"`
	IsActive        bool      `db:"is_active"`
	CreatedAt       time.Time `db:"created_at"`
	UpdatedAt       time.Time `db:"updated_at"`
}

// InsertPositionSizingRuleSchema is the schema for inserting position sizing rules
type InsertPositionSizingRuleSchema struct {
	UserID          int64     `db:"user_id"`
	Name            string    `db:"name"`
	Description     sql.NullString `db:"description"`
	Strategy        string    `db:"strategy"`
	Method          string    `db:"method"`
	RiskPerTrade    float64   `db:"risk_per_trade"`
	MaxPositionSize float64   `db:"max_position_size"`
	IsActive        bool      `db:"is_active"`
}

// MarketExposures table
type MarketExposures struct {
	ID        int64     `db:"id"`
	UserID    int64     `db:"user_id"`
	Market    string    `db:"market"`
	Percentage float64   `db:"percentage"`
	UpdatedAt time.Time `db:"updated_at"`
}

// InsertMarketExposureSchema is the schema for inserting market exposures
type InsertMarketExposureSchema struct {
	UserID    int64     `db:"user_id"`
	Market    string    `db:"market"`
	Percentage float64   `db:"percentage"`
}

// SectorExposures table
type SectorExposures struct {
	ID        int64     `db:"id"`
	UserID    int64     `db:"user_id"`
	Sector    string    `db:"sector"`
	Percentage float64   `db:"percentage"`
	UpdatedAt time.Time `db:"updated_at"`
}

// InsertSectorExposureSchema is the schema for inserting sector exposures
type InsertSectorExposureSchema struct {
	UserID    int64     `db:"user_id"`
	Sector    string    `db:"sector"`
	Percentage float64   `db:"percentage"`
}

// StrategyCorrelations table
type StrategyCorrelations struct {
	ID             int64     `db:"id"`
	UserID         int64     `db:"user_id"`
	StrategyID     int64     `db:"strategy_id"`
	StrategyName   string    `db:"strategy_name"`
	CorrelationData string    `db:"correlation_data"`
	UpdatedAt      time.Time `db:"updated_at"`
}

// InsertStrategyCorrelationSchema is the schema for inserting strategy correlations
type InsertStrategyCorrelationSchema struct {
	UserID         int64     `db:"user_id"`
	StrategyID     int64     `db:"strategy_id"`
	StrategyName   string    `db:"strategy_name"`
	CorrelationData string    `db:"correlation_data"`
}

type LearningModule struct {
	ID          int       `db:"id" json:"id"`
	Title       string    `db:"title" json:"title"`
	Description string    `db:"description" json:"description"`
	ImageUrl    string    `db:"image_url" json:"image_url"`
	Level       string    `db:"level" json:"level"`
	Order       int       `db:"order" json:"order"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time `db:"updated_at" json:"updated_at"`
}

type Lesson struct {
	ID          int       `db:"id" json:"id"`
	ModuleId    int       `db:"module_id" json:"module_id"`
	Title       string    `db:"title" json:"title"`
	Description string    `db:"description" json:"description"`
	Content     string    `db:"content" json:"content"`
	Order       int       `db:"order" json:"order"`
	Points      int       `db:"points" json:"points"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time `db:"updated_at" json:"updated_at"`
}

type Quiz struct {
	ID          int       `db:"id" json:"id"`
	LessonId    int       `db:"lesson_id" json:"lesson_id"`
	Title       string    `db:"title" json:"title"`
	Description string    `db:"description" json:"description"`
	PassingScore int      `db:"passing_score" json:"passing_score"`
	Points      int       `db:"points" json:"points"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time `db:"updated_at" json:"updated_at"`
}

type QuizQuestion struct {
	ID          int       `db:"id" json:"id"`
	QuizId      int       `db:"quiz_id" json:"quiz_id"`
	Question    string    `db:"question" json:"question"`
	Explanation string    `db:"explanation" json:"explanation"`
	Type        string    `db:"type" json:"type"`
	Order       int       `db:"order" json:"order"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time `db:"updated_at" json:"updated_at"`
}

type QuizAnswer struct {
	ID        int    `db:"id" json:"id"`
	QuestionId int   `db:"question_id" json:"question_id"`
	Answer    string `db:"answer" json:"answer"`
	IsCorrect bool   `db:"is_correct" json:"is_correct"`
	Order     int    `db:"order" json:"order"`
}

type UserProgress struct {
	ID          int       `db:"id" json:"id"`
	UserId      int       `db:"user_id" json:"user_id"`
	ModuleId    int       `db:"module_id" json:"module_id"`
	LessonId    *int      `db:"lesson_id" json:"lesson_id,omitempty"`
	QuizId      *int      `db:"quiz_id" json:"quiz_id,omitempty"`
	Completed    bool      `db:"completed" json:"completed"`
	Score       *int      `db:"score" json:"score,omitempty"`
	EarnedPoints int       `db:"earned_points" json:"earned_points"`
	CompletedAt *time.Time `db:"completed_at" json:"completed_at,omitempty"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time `db:"updated_at" json:"updated_at"`
}

type Badge struct {
	ID          int       `db:"id" json:"id"`
	Name        string    `db:"name" json:"name"`
	Description string    `db:"description" json:"description"`
	ImageUrl    string    `db:"image_url" json:"image_url"`
	Requirement string    `db:"requirement" json:"requirement"`
	Points      int       `db:"points" json:"points"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time `db:"updated_at" json:"updated_at"`
}

type UserBadge struct {
	ID      int       `db:"id" json:"id"`
	UserId  int       `db:"user_id" json:"user_id"`
	BadgeId int       `db:"badge_id" json:"badge_id"`
	EarnedAt time.Time `db:"earned_at" json:"earned_at"`
}

// User Trading Preferences table
// Corresponds to TypeScript const userPreferences = pgTable("user_preferences", { ... });
type UserPreference struct {
	ID                int             `db:"id"`
	UserID            int             `db:"user_id"`
	RiskTolerance     int             `db:"risk_tolerance"`     // 1-5 scale
	InvestmentHorizon string          `db:"investment_horizon"` // short, medium, long
	PreferredMarkets  json.RawMessage `db:"preferred_markets"`  // stored as JSON string ["stocks", "etfs", etc]
	TradingFrequency  string          `db:"trading_frequency"`  // day, swing, position
	CapitalAvailable  decimal.Decimal `db:"capital_available"`
	AutomationLevel   string          `db:"automation_level"` // fully-automated, semi-automated, manual
	PreferredIndicators json.RawMessage `db:"preferred_indicators"` // stored as JSON string ["MA", "RSI", etc]
	CreatedAt         time.Time       `db:"created_at"`
	UpdatedAt         time.Time       `db:"updated_at"`
}

// Corresponds to TypeScript const insertUserPreferenceSchema = createInsertSchema(userPreferences).pick({ ... });
type InsertUserPreference struct {
	UserID            int             `db:"user_id"`
	RiskTolerance     int             `db:"risk_tolerance"`     // 1-5 scale
	InvestmentHorizon string          `db:"investment_horizon"` // short, medium, long
	PreferredMarkets  json.RawMessage `db:"preferred_markets"`  // stored as JSON string ["stocks", "etfs", etc]
	TradingFrequency  string          `db:"trading_frequency"`  // day, swing, position
	CapitalAvailable  decimal.Decimal `db:"capital_available"`
	AutomationLevel   string          `db:"automation_level"` // fully-automated, semi-automated, manual
	PreferredIndicators json.RawMessage `db:"preferred_indicators"` // stored as JSON string ["MA", "RSI", etc]
}

// Strategy Recommendation table (to store recommendation results)
// Corresponds to TypeScript const strategyRecommendations = pgTable("strategy_recommendations", { ... });
type StrategyRecommendation struct {
	ID                  int             `db:"id"`
	UserID              int             `db:"user_id"`
	TemplateID          string          `db:"template_id"`
	Name                string          `db:"name"`
	Description         string          `db:"description"`
	MatchScore          int             `db:"match_score"`
	RiskLevel           int             `db:"risk_level"`
	ExpectedReturn      string          `db:"expected_return"`
	TimeFrame           string          `db:"time_frame"`
	SuitableMarkets     json.RawMessage `db:"suitable_markets"`     // JSON string
	KeyIndicators       json.RawMessage `db:"key_indicators"`       // JSON string
	TradeFrequency      string          `db:"trade_frequency"`
	BacktestPerformance json.RawMessage `db:"backtest_performance"`
	Complexity          int             `db:"complexity"`
	Code                string          `db:"code"`
	Favorite            bool            `db:"favorite"` // default(false)
	Applied             bool            `db:"applied"`  // default(false)
	CreatedAt           time.Time       `db:"created_at"`
}

// Corresponds to TypeScript const insertStrategyRecommendationSchema = createInsertSchema(strategyRecommendations).pick({ ... });
type InsertStrategyRecommendation struct {
	UserID              int             `db:"user_id"`
	TemplateID          string          `db:"template_id"`
	Name                string          `db:"name"`
	Description         string          `db:"description"`
	MatchScore          int             `db:"match_score"`
	RiskLevel           int             `db:"risk_level"`
	ExpectedReturn      string          `db:"expected_return"`
	TimeFrame           string          `db:"time_frame"`
	SuitableMarkets     json.RawMessage `db:"suitable_markets"`     // JSON string
	KeyIndicators       json.RawMessage `db:"key_indicators"`       // JSON string
	TradeFrequency      string          `db:"trade_frequency"`
	BacktestPerformance json.RawMessage `db:"backtest_performance"`
	Complexity          int             `db:"complexity"`
	Code                string          `db:"code"`
	Favorite            bool            `db:"favorite"` // default(false)
	Applied             bool            `db:"applied"`  // default(false)
}

// Trading Workflow Automation Tables

// Trading Workflows table
// Corresponds to TypeScript const tradingWorkflows = pgTable("trading_workflows", { ... });
type TradingWorkflow struct {
	ID              int             `db:"id"`
	UserID          int             `db:"user_id"`
	Name            string          `db:"name"`
	Description     *string         `db:"description"` // nullable
	Status          string          `db:"status"`      // default("inactive") // active, inactive, paused, archived
	CreatedAt       time.Time       `db:"created_at"`
	UpdatedAt       time.Time       `db:"updated_at"`
	ExecutionCount  int             `db:"execution_count"` // default(0)
	LastExecutedAt  *time.Time      `db:"last_executed_at"` // nullable
	Schedule        *string         `db:"schedule"`         // nullable // CRON expression for scheduled execution
	IsAutomatic     bool            `db:"is_automatic"`     // default(false) // whether it runs on a schedule or manually
	Priority        int             `db:"priority"`         // default(0) // execution priority for multiple workflows
	LogHistory      json.RawMessage `db:"log_history"`      // nullable // JSON array of execution logs
}

// Corresponds to TypeScript const insertTradingWorkflowSchema = createInsertSchema(tradingWorkflows).pick({ ... });
type InsertTradingWorkflow struct {
	UserID      int     `db:"user_id"`
	Name        string  `db:"name"`
	Description *string `db:"description"` // nullable
	Status      string  `db:"status"`      // default("inactive") // active, inactive, paused, archived
	Schedule    *string `db:"schedule"`    // nullable // CRON expression for scheduled execution
	IsAutomatic bool    `db:"is_automatic"` // default(false) // whether it runs on a schedule or manually
	Priority    int     `db:"priority"`     // default(0) // execution priority for multiple workflows
}

// Workflow Steps table
// Corresponds to TypeScript const workflowSteps = pgTable("workflow_steps", { ... });
type WorkflowStep struct {
	ID            int             `db:"id"`
	WorkflowID    int             `db:"workflow_id"`
	StepType      string          `db:"step_type"` // condition, action, notification, delay
	StepOrder     int             `db:"step_order"`
	Name          string          `db:"name"`
	Description   *string         `db:"description"` // nullable
	Config        json.RawMessage `db:"config"`      // JSON with step configuration
	CreatedAt     time.Time       `db:"created_at"`
	UpdatedAt     time.Time       `db:"updated_at"`
	IsEnabled     bool            `db:"is_enabled"`     // default(true)
	ExecutionTime int             `db:"execution_time"` // default(0) // ms it took to execute
	LastResult    *string         `db:"last_result"`    // nullable // success, failure, skipped
	ErrorMessage  *string         `db:"error_message"`  // nullable
	RetryCount    int             `db:"retry_count"`    // default(0)
	MaxRetries    int             `db:"max_retries"`    // default(0)
}

// Corresponds to TypeScript const insertWorkflowStepSchema = createInsertSchema(workflowSteps).pick({ ... });
type InsertWorkflowStep struct {
	WorkflowID  int             `db:"workflow_id"`
	StepType    string          `db:"step_type"` // condition, action, notification, delay
	StepOrder   int             `db:"step_order"`
	Name        string          `db:"name"`
	Description *string         `db:"description"` // nullable
	Config      json.RawMessage `db:"config"`      // JSON with step configuration
	IsEnabled   bool            `db:"is_enabled"`     // default(true)
	MaxRetries  int             `db:"max_retries"`    // default(0)
}

// Workflow Conditions table - conditions that trigger workflows
// Corresponds to TypeScript const workflowConditions = pgTable("workflow_conditions", { ... });
type WorkflowCondition struct {
	ID             int         `db:"id"`
	WorkflowID     int         `db:"workflow_id"`
	ConditionType  string      `db:"condition_type"` // price, indicator, time, volume, pattern, custom
	Symbol         string      `db:"symbol"`
	Operator       string      `db:"operator"` // >, <, ==, >=, <=, between, crosses_above, crosses_below
	Value          string      `db:"value"`    // could be a number or JSON for complex conditions
	Timeframe      *string     `db:"timeframe"` // nullable // 1m, 5m, 15m, 1h, 4h, 1d
	LookbackPeriod *int        `db:"lookback_period"` // nullable // number of bars/candles to look back
	IsEnabled      bool        `db:"is_enabled"`     // default(true)
	LastEvaluated  *time.Time  `db:"last_evaluated"` // nullable
	LastResult     *bool       `db:"last_result"`    // nullable
	CreatedAt      time.Time   `db:"created_at"`
	UpdatedAt      time.Time   `db:"updated_at"`
}

// Corresponds to TypeScript const insertWorkflowConditionSchema = createInsertSchema(workflowConditions).pick({ ... });
type InsertWorkflowCondition struct {
	WorkflowID     int     `db:"workflow_id"`
	ConditionType  string  `db:"condition_type"` // price, indicator, time, volume, pattern, custom
	Symbol         string  `db:"symbol"`
	Operator       string  `db:"operator"` // >, <, ==, >=, <=, between, crosses_above, crosses_below
	Value          string  `db:"value"`    // could be a number or JSON for complex conditions
	Timeframe      *string `db:"timeframe"` // nullable // 1m, 5m, 15m, 1h, 4h, 1d
	LookbackPeriod *int    `db:"lookback_period"` // nullable // number of bars/candles to look back
	IsEnabled      bool    `db:"is_enabled"`     // default(true)
}

// Workflow Actions table - actions to take when conditions are met
// Corresponds to TypeScript const workflowActions = pgTable("workflow_actions", { ... });
type WorkflowAction struct {
	ID               int             `db:"id"`
	WorkflowID       int             `db:"workflow_id"`
	StepID           int             `db:"step_id"`
	ActionType       string          `db:"action_type"` // buy, sell, alert, webhook, email, sms, custom
	Symbol           *string         `db:"symbol"` // nullable // optional, might be derived from condition
	Quantity         *string         `db:"quantity"` // nullable // can be fixed number or formula like "10% of portfolio"
	Price            *string         `db:"price"` // nullable // market, limit, or formula
	OrderType        *string         `db:"order_type"` // nullable // market, limit, stop, stop-limit
	Duration         *string         `db:"duration"` // nullable // day, gtc, gtd
	AdditionalParams json.RawMessage `db:"additional_params"` // nullable // JSON with action-specific parameters
	IsEnabled        bool            `db:"is_enabled"`     // default(true)
	LastExecuted     *time.Time      `db:"last_executed"` // nullable
	ExecutionStatus  *string         `db:"execution_status"` // nullable // pending, success, failure
	ErrorMessage     *string         `db:"error_message"`  // nullable
	CreatedAt        time.Time       `db:"created_at"`
	UpdatedAt        time.Time       `db:"updated_at"`
}

// Corresponds to TypeScript const insertWorkflowActionSchema = createInsertSchema(workflowActions).pick({ ... });
type InsertWorkflowAction struct {
	WorkflowID       int             `db:"workflow_id"`
	StepID           int             `db:"step_id"`
	ActionType       string          `db:"action_type"` // buy, sell, alert, webhook, email, sms, custom
	Symbol           *string         `db:"symbol"` // nullable // optional, might be derived from condition
	Quantity         *string         `db:"quantity"` // nullable // can be fixed number or formula like "10% of portfolio"
	Price            *string         `db:"price"` // nullable // market, limit, or formula
	OrderType        *string         `db:"order_type"` // nullable // market, limit, stop, stop-limit
	Duration         *string         `db:"duration"` // nullable // day, gtc, gtd
	AdditionalParams json.RawMessage `db:"additional_params"` // nullable // JSON with action-specific parameters
	IsEnabled        bool            `db:"is_enabled"`     // default(true)
}

// Workflow Execution Logs table - tracks execution history
// Corresponds to TypeScript const workflowExecutionLogs = pgTable("workflow_execution_logs", { ... });
type WorkflowExecutionLog struct {
	ID                 int             `db:"id"`
	WorkflowID         int             `db:"workflow_id"`
	ExecutionStartTime time.Time       `db:"execution_start_time"` // defaultNow().notNull()
	ExecutionEndTime   *time.Time      `db:"execution_end_time"`   // nullable
	Status             string          `db:"status"`               // notNull() // pending, running, completed, failed
	TriggeredBy        string          `db:"triggered_by"`         // notNull() // schedule, manual, event, condition
	Summary            *string         `db:"summary"`              // nullable
	Details            json.RawMessage `db:"details"`              // nullable // JSON with execution details
	ErrorMessage       *string         `db:"error_message"`        // nullable
}

// Corresponds to TypeScript const insertWorkflowExecutionLogSchema = createInsertSchema(workflowExecutionLogs).pick({ ... });
type InsertWorkflowExecutionLog struct {
	WorkflowID         int             `db:"workflow_id"`
	ExecutionStartTime time.Time       `db:"execution_start_time"` // defaultNow().notNull()
	ExecutionEndTime   *time.Time      `db:"execution_end_time"`   // nullable
	Status             string          `db:"status"`               // notNull() // pending, running, completed, failed
	TriggeredBy        string          `db:"triggered_by"`         // notNull() // schedule, manual, event, condition
	Summary            *string         `db:"summary"`              // nullable
	Details            json.RawMessage `db:"details"`              // nullable // JSON with execution details
	ErrorMessage       *string         `db:"error_message"`        // nullable
}
