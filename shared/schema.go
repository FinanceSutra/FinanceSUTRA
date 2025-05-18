// package shared

// import (
// 	"time"
// 	"database/sql"
// 	"context"
// 	"gorm.io/datatypes"
     
// )

// // User represents the users table
// // User table
// type User struct {
//     ID                 uint     `bun:"id,pk,autoincrement"`
//     Username           string    `bun:"username,unique,notnull"`
//     Password           string    `bun:"password,notnull"`
//     Email              string    `bun:"email,unique,notnull"`
//     FullName           string    `bun:"full_name"`
//     CreatedAt          time.Time `bun:"created_at,notnull,default:now()"`
//     StripeCustomerID   string    `bun:"stripe_customer_id,unique"`
//     StripeSubscriptionID string  `bun:"stripe_subscription_id"`
//     SubscriptionStatus string    `bun:"subscription_status,default:'inactive'"`
//     Plan               string    `bun:"plan,default:'free'"`
// }

// // Trading Strategy table
// type Strategy struct {
//     ID          int64     `bun:"id,pk,autoincrement"`
//     UserID      int64     `bun:"user_id,notnull"`
//     Name        string    `bun:"name,notnull"`
//     Description string    `bun:"description"`
//     Code        string    `bun:"code,notnull"`
//     Symbol      string    `bun:"symbol,notnull"`
//     Timeframe   string    `bun:"timeframe,notnull"`
//     IsActive    bool      `bun:"is_active,default:false"`
//     CreatedAt   time.Time `bun:"created_at,notnull,default:now()"`
//     UpdatedAt   time.Time `bun:"updated_at,notnull,default:now()"`
// }

// // Backtest results table
// type Backtest struct {
//     ID            int64     `bun:"id,pk,autoincrement"`
//     StrategyID    int64     `bun:"strategy_id,notnull"`
//     StartDate     time.Time `bun:"start_date,notnull"`
//     EndDate       time.Time `bun:"end_date,notnull"`
//     InitialCapital float64   `bun:"initial_capital,notnull"`
//     FinalCapital   float64   `bun:"final_capital,notnull"`
//     TotalPnl       float64   `bun:"total_pnl,notnull"`
//     PercentReturn  float64   `bun:"percent_return,notnull"`
//     SharpeRatio    float64   `bun:"sharpe_ratio"`
//     MaxDrawdown    float64   `bun:"max_drawdown"`
//     WinRate        float64   `bun:"win_rate"`
//     Trades        int64     `bun:"trades,notnull"`
//     Equity        []byte    `bun:"equity,type:jsonb"`
//     TradesData    []byte    `bun:"trades_data,type:jsonb"`
//     CreatedAt     time.Time `bun:"created_at,notnull,default:now()"`
// }

// func (u *User) TableName() string {
//     return "users"
// }

// func (s *Strategy) TableName() string {
//     return "strategies"
// }

// func (b *Backtest) TableName() string {
//     return "backtests"
// }

// func (b *Backtest) BeforeInsert(ctx context.Context) error {
//     b.CreatedAt = time.Now()
//     return nil
// }

// func (s *Strategy) BeforeInsert(ctx context.Context) error {
//     s.CreatedAt = time.Now()
//     s.UpdatedAt = time.Now()
//     return nil
// }

// type InsertUser struct {
//     Username string
//     Password string
//     Email    string
//     FullName string
// }

// type InsertStrategy struct {
//     UserID      int64
//     Name        string
//     Description string
//     Code        string
//     Symbol      string
//     Timeframe   string
//     IsActive    bool
// }

// type InsertBacktest struct {
//     StrategyID    int64
//     StartDate     time.Time
//     EndDate       time.Time
//     InitialCapital float64
//     FinalCapital   float64
//     TotalPnl       float64
//     PercentReturn  float64
//     SharpeRatio    float64
//     MaxDrawdown    float64
//     WinRate        float64
//     Trades        int64
//     Equity        []byte
//     TradesData    []byte
// }

// // Trade represents the trades table
// type Trade struct {
//     ID          int64     `db:"id"`
//     StrategyID  int64     `db:"strategy_id"`
//     UserID      int64     `db:"user_id"`
//     Symbol      string    `db:"symbol"`
//     Type        string    `db:"type"`
//     Price       float64   `db:"price"`
//     Quantity    float64   `db:"quantity"`
//     PnL         float64   `db:"pnl"`
//     PercentPnL  float64   `db:"percent_pnl"`
//     IsOpen      bool      `db:"is_open"`
//     OpenedAt    time.Time `db:"opened_at"`
//     ClosedAt    *time.Time `db:"closed_at"`
// }

// func InsertTrade(db *sql.DB, trade *Trade) error {
//     _, err := db.Exec(
//         "INSERT INTO trades (strategy_id, user_id, symbol, type, price, quantity, pnl, percent_pnl, is_open, opened_at, closed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
//         trade.StrategyID, trade.UserID, trade.Symbol, trade.Type, trade.Price, trade.Quantity, trade.PnL, trade.PercentPnL, trade.IsOpen, trade.OpenedAt, trade.ClosedAt,
//     )
//     return err
// }

// type BrokerConnection struct {
//     ID            int64     `db:"id"`
//     UserID        int64     `db:"user_id"`
//     Broker        string    `db:"broker"`
//     APIKey        *string   `db:"api_key"`
//     APISecret     *string   `db:"api_secret"`
//     APIPassphrase *string   `db:"api_passphrase"`
//     APIToken      *string   `db:"api_token"`
//     BaseURL       *string   `db:"base_url"`
//     Environment   *string   `db:"environment"`
//     IsActive      bool      `db:"is_active"`
//     AccountID     *string   `db:"account_id"`
//     AccountName   *string   `db:"account_name"`
//     Status        string    `db:"status"`
//     LastConnected *time.Time `db:"last_connected"`
//     Metadata      []byte    `db:"metadata"`
//     CreatedAt     time.Time `db:"created_at"`
//     UpdatedAt     time.Time `db:"updated_at"`
// }

// func InsertBrokerConnection(db *sql.DB, conn *BrokerConnection) error {
//     _, err := db.Exec(
//         "INSERT INTO broker_connections (user_id, broker, api_key, api_secret, api_passphrase, api_token, base_url, environment, is_active, account_id, account_name, status, last_connected, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
//         conn.UserID, conn.Broker, conn.APIKey, conn.APISecret, conn.APIPassphrase, conn.APIToken, conn.BaseURL, conn.Environment, conn.IsActive, conn.AccountID, conn.AccountName, conn.Status, conn.LastConnected, conn.Metadata, conn.CreatedAt, conn.UpdatedAt,
//     )
//     return err
// }

// type MarketData struct {
//     ID        int64     `db:"id"`
//     Symbol    string    `db:"symbol"`
//     Timeframe string    `db:"timeframe"`
//     Timestamp time.Time `db:"timestamp"`
//     Open      float64   `db:"open"`
//     High      float64   `db:"high"`
//     Low       float64   `db:"low"`
//     Close     float64   `db:"close"`
//     Volume    *float64  `db:"volume"`
// }

// func InsertMarketData(db *sql.DB, data *MarketData) error {
//     _, err := db.Exec(
//         "INSERT INTO market_data (symbol, timeframe, timestamp, open, high, low, close, volume) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
//         data.Symbol, data.Timeframe, data.Timestamp, data.Open, data.High, data.Low, data.Close, data.Volume,
//     )
//     return err
// }



// // DeployedStrategy represents a deployed strategy
// // DeployedStrategies table
// type DeployedStrategy struct {
// 	ID             int         `db:"id"`
// 	StrategyID     int         `db:"strategy_id"`
// 	UserID         int         `db:"user_id"`
// 	BrokerID       int         `db:"broker_id"`
// 	Name          string      `db:"name"`
// 	LotMultiplier  float64     `db:"lot_multiplier"`
// 	CapitalDeployed float64   `db:"capital_deployed"`
// 	TradingType    string      `db:"trading_type"`
// 	Status         string      `db:"status"`
// 	CurrentPnl     float64     `db:"current_pnl"`
// 	PercentPnl     float64     `db:"percent_pnl"`
// 	DeployedAt     time.Time   `db:"deployed_at"`
// 	LastUpdated    time.Time   `db:"last_updated"`
// 	Metadata       datatypes.JSON   `db:"metadata"`
// }

// type InsertDeployedStrategy struct {
// 	StrategyID     int         `db:"strategy_id"`
// 	UserID         int         `db:"user_id"`
// 	BrokerID       int         `db:"broker_id"`
// 	Name          string      `db:"name"`
// 	LotMultiplier  float64     `db:"lot_multiplier"`
// 	CapitalDeployed float64   `db:"capital_deployed"`
// 	TradingType    string      `db:"trading_type"`
// 	Status         string      `db:"status"`
// 	CurrentPnl     float64     `db:"current_pnl"`
// 	PercentPnl     float64     `db:"percent_pnl"`
// 	DeployedAt     time.Time   `db:"deployed_at"`
// 	Metadata       datatypes.JSON    `db:"metadata"`
// }

// // PortfolioRisks table
// type PortfolioRisk struct {
// 	ID              int         `db:"id"`
// 	UserID          int         `db:"user_id"`
// 	TotalValue      float64     `db:"total_value"`
// 	DailyValue      float64     `db:"daily_value"`
// 	DailyChange     float64     `db:"daily_change"`
// 	WeeklyChange    float64     `db:"weekly_change"`
// 	MonthlyChange   float64     `db:"monthly_change"`
// 	CurrentDrawdown float64     `db:"current_drawdown"`
// 	MaxDrawdown     float64     `db:"max_drawdown"`
// 	Volatility      float64     `db:"volatility"`
// 	SharpeRatio     float64     `db:"sharpe_ratio"`
// 	Beta            float64     `db:"beta"`
// 	Strategies      int         `db:"strategies"`
// 	ActiveTrades    int         `db:"active_trades"`
// 	UpdatedAt       time.Time   `db:"updated_at"`
// }

// type InsertPortfolioRisk struct {
// 	UserID          int         `db:"user_id"`
// 	TotalValue      float64     `db:"total_value"`
// 	DailyValue      float64     `db:"daily_value"`
// 	DailyChange     float64     `db:"daily_change"`
// 	WeeklyChange    float64     `db:"weekly_change"`
// 	MonthlyChange   float64     `db:"monthly_change"`
// 	CurrentDrawdown float64     `db:"current_drawdown"`
// 	MaxDrawdown     float64     `db:"max_drawdown"`
// 	Volatility      float64     `db:"volatility"`
// 	SharpeRatio     float64     `db:"sharpe_ratio"`
// 	Beta            float64     `db:"beta"`
// 	Strategies      int         `db:"strategies"`
// 	ActiveTrades    int         `db:"active_trades"`
// }

// // RiskLimits table
// type RiskLimit struct {
// 	ID          int         `db:"id"`
// 	UserID      int         `db:"user_id"`
// 	Name        string      `db:"name"`
// 	Description sql.NullString `db:"description"`
// 	Type        string      `db:"type"`
// 	Metric      string      `db:"metric"`
// 	Threshold   float64     `db:"threshold"`
// 	CurrentValue sql.NullFloat64 `db:"current_value"`
// 	Status      string      `db:"status"`
// 	Action      string      `db:"action"`
// 	IsActive    bool        `db:"is_active"`
// 	CreatedAt   time.Time   `db:"created_at"`
// 	UpdatedAt   time.Time   `db:"updated_at"`
// }

// type InsertRiskLimit struct {
// 	UserID      int         `db:"user_id"`
// 	Name        string      `db:"name"`
// 	Description sql.NullString `db:"description"`
// 	Type        string      `db:"type"`
// 	Metric      string      `db:"metric"`
// 	Threshold   float64     `db:"threshold"`
// 	CurrentValue sql.NullFloat64 `db:"current_value"`
// 	Status      string      `db:"status"`
// 	Action      string      `db:"action"`
// 	IsActive    bool        `db:"is_active"`
// }

// type PositionSizingRule struct {
//     ID             uint            `gorm:"primaryKey"`
//     UserID         uint            `gorm:"not null"`
//     Name           string          `gorm:"not null"`
//     Description    string
//     Strategy       string          `gorm:"not null"`
//     Method         string          `gorm:"not null"` // 'fixed', 'volatility', 'risk-based', 'kelly'
//     RiskPerTrade   float64         `gorm:"not null"`
//     MaxPositionSize float64        `gorm:"not null"`
//     IsActive       bool            `gorm:"default:true;not null"`
//     CreatedAt      time.Time       `gorm:"not null;default:CURRENT_TIMESTAMP"`
//     UpdatedAt      time.Time       `gorm:"not null;default:CURRENT_TIMESTAMP"`
// }

// type InsertPositionSizingRule struct {
//     UserID         uint
//     Name           string
//     Description    string
//     Strategy       string
//     Method         string
//     RiskPerTrade   float64
//     MaxPositionSize float64
//     IsActive       bool
// }

// type MarketExposure struct {
//     ID             uint            `gorm:"primaryKey"`
//     UserID         uint            `gorm:"not null"`
//     Market         string          `gorm:"not null"`
//     Percentage     float64         `gorm:"not null"`
//     UpdatedAt      time.Time       `gorm:"not null;default:CURRENT_TIMESTAMP"`
// }

// type InsertMarketExposure struct {
//     UserID         uint
//     Market         string
//     Percentage     float64
// }

// type SectorExposure struct {
//     ID             uint            `gorm:"primaryKey"`
//     UserID         uint            `gorm:"not null"`
//     Sector         string          `gorm:"not null"`
//     Percentage     float64         `gorm:"not null"`
//     UpdatedAt      time.Time       `gorm:"not null;default:CURRENT_TIMESTAMP"`
// }

// type InsertSectorExposure struct {
//     UserID         uint
//     Sector         string
//     Percentage     float64
// }

// type StrategyCorrelation struct {
//     ID             uint            `gorm:"primaryKey"`
//     UserID         uint            `gorm:"not null"`
//     StrategyID     uint            `gorm:"not null"`
//     StrategyName   string          `gorm:"not null"`
//     CorrelationData string         `gorm:"not null"` // JSON string of correlation values
//     UpdatedAt      time.Time       `gorm:"not null;default:CURRENT_TIMESTAMP"`
// }

// type InsertStrategyCorrelation struct {
//     UserID         uint
//     StrategyID     uint
//     StrategyName   string
//     CorrelationData string
// }
