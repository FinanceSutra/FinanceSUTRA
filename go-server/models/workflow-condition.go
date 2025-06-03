package models

import (
	"time"
)

type WorkflowCondition struct {
	ID             uint       `gorm:"primaryKey;autoIncrement"`
	WorkflowID     uint       `gorm:"not null"`
	ConditionType  string     `gorm:"not null"`                     // price, indicator, time, volume, pattern, custom
	Symbol         string     `gorm:"not null"`
	Operator       string     `gorm:"not null"`                     // >, <, ==, >=, <=, between, crosses_above, crosses_below
	Value          string     `gorm:"not null"`                     // could be numeric or JSON string
	Timeframe      *string
	LookbackPeriod *int
	IsEnabled      bool       `gorm:"default:true"`
	LastEvaluated  *time.Time
	LastResult     *bool
	CreatedAt      time.Time  `gorm:"autoCreateTime"`
	UpdatedAt      time.Time  `gorm:"autoUpdateTime"`
}
