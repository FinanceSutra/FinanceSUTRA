package models

import (
    "github.com/google/uuid"
    "time"
)

// Order represents a trading order placed by the algo platform.
type Order struct {
    ID            uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
    OrderID       string     `gorm:"uniqueIndex;not null" json:"orderId"`
    UserID        uuid.UUID  `gorm:"type:uuid;not null;index" json:"userId"`
    Instrument    string     `gorm:"not null;index" json:"instrument"`
    Exchange      string     `gorm:"not null" json:"exchange"`
    Quantity      int        `gorm:"not null" json:"quantity"`
    Price         float64    `gorm:"type:decimal(15,4);not null" json:"price"`
    OrderType     string     `gorm:"not null" json:"orderType"`
    Side          string     `gorm:"not null" json:"side"`
    Status        string     `gorm:"default:'OPEN';index" json:"status"`
    StrategyID    uuid.UUID  `gorm:"type:uuid;index" json:"strategyId"`
    PlacedAt      time.Time  `gorm:"autoCreateTime" json:"placedAt"`
    UpdatedAt     time.Time  `gorm:"autoUpdateTime" json:"updatedAt"`
    IsExitOrder   bool       `gorm:"default:false" json:"isExitOrder"`
    ParentOrderID *uuid.UUID `gorm:"type:uuid;index" json:"parentOrderId,omitempty"`
}

// // TableName specifies the table name for GORM
// func (Order) TableName() string {
//     return "orders"
// }
