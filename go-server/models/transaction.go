package models

import (
    "github.com/google/uuid"
    "time"
)

// Transaction captures actual fill data linked to an Order.
type Transaction struct {
    ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
    TxID        string    `gorm:"uniqueIndex;not null" json:"txId"`
    OrderID     uuid.UUID `gorm:"type:uuid;not null;index" json:"orderId"`
    FillPrice   float64   `gorm:"type:decimal(15,4);not null" json:"fillPrice"`
    Quantity    int       `gorm:"not null" json:"quantity"`
    ExecutedAt  time.Time `gorm:"not null;index" json:"executedAt"`
    Brokerage   float64   `gorm:"type:decimal(10,4);default:0" json:"brokerage"`
    Taxes       float64   `gorm:"type:decimal(10,4);default:0" json:"taxes"`
    StrategyID  uuid.UUID `gorm:"type:uuid;index" json:"strategyId"`
    Instrument  string    `gorm:"not null;index" json:"instrument"`
    IsEntry     bool      `gorm:"default:false" json:"isEntry"`
    RealizedPnL *float64  `gorm:"type:decimal(15,4)" json:"realizedPnL,omitempty"`
    CostOfTrade *float64  `gorm:"type:decimal(15,4)" json:"costOfTrade,omitempty"`
    CreatedAt   time.Time `gorm:"autoCreateTime" json:"createdAt"`
    UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

// // TableName specifies the table name for GORM
// func (Transaction) TableName() string {
//     return "transactions"
// }
