package models

import (
	"time"
	"github.com/google/uuid"
	"encoding/json"
)

type DeployedStrategy struct {
    ID              uint      `gorm:"primaryKey;autoIncrement"`
    StrategyID      uuid.UUID `gorm:"type:uuid;not null"`
    UserID          uuid.UUID `gorm:"type:uuid;not null"`
    BrokerID        uint      `gorm:"not null"`
    Name            string    `gorm:"not null"`
    LotMultiplier   string
    CapitalDeployed string
    TradingType     string
    Status          string
    CurrentPnl      float64
    PercentPnl      float64
    DeployedAt      time.Time `gorm:"autoCreateTime"`
    LastUpdated     time.Time `gorm:"autoUpdateTime"`
    Metadata json.RawMessage `gorm:"type:json"`
}
