package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type StrategyRecommendation struct {
	ID                  uint            `gorm:"primaryKey;autoIncrement"`
	UserID              uuid.UUID       `gorm:"type:uuid;not null"`
	TemplateID          uuid.UUID       `gorm:"type:uuid;not null"`
	Name                string          `gorm:"not null"`
	Description         string
	MatchScore          int
	RiskLevel           int
	ExpectedReturn      string
	TimeFrame           string
	SuitableMarkets     json.RawMessage `gorm:"type:json"`
	KeyIndicators       json.RawMessage `gorm:"type:json"`
	TradeFrequency      string
	BacktestPerformance json.RawMessage `gorm:"type:json"`
	Complexity          int
	Code                string
	Favorite            bool      `gorm:"default:false"`
	Applied             bool      `gorm:"default:false"`
	CreatedAt           time.Time `gorm:"autoCreateTime"`
}
