package models

import (
    "github.com/google/uuid"
    "time"
)

// TradeSummary groups a set of transactions for analytics.
type TradeSummary struct {
    ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
    UserID      uuid.UUID `gorm:"type:uuid;not null;index" json:"userId"`
    StrategyID  uuid.UUID `gorm:"type:uuid;not null;index" json:"strategyId"`
    Instrument  string    `gorm:"not null;index" json:"instrument"`
    EntryTime   time.Time `gorm:"not null;index" json:"entryTime"`
    ExitTime    time.Time `gorm:"not null;index" json:"exitTime"`
    NetPnL      float64   `gorm:"type:decimal(15,4);not null" json:"netPnL"`
    TotalFees   float64   `gorm:"type:decimal(10,4);default:0" json:"totalFees"`
    TotalTrades int       `gorm:"default:0" json:"totalTrades"`
    CreatedAt   time.Time `gorm:"autoCreateTime" json:"createdAt"`
    UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

// // TableName specifies the table name for GORM
// func (TradeSummary) TableName() string {
//     return "trade_summaries"
// }
