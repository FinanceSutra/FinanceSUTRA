package models

import (
	"encoding/json"
	"time"
)

type TradingWorkflow struct {
	ID             uint            `gorm:"primaryKey;autoIncrement"`
	UserID         uint            `gorm:"not null"`
	Name           string          `gorm:"not null"`
	Description    *string         `gorm:"type:text"`
	Status         string          `gorm:"default:'inactive'"` // active, inactive, paused, archived
	CreatedAt      time.Time       `gorm:"autoCreateTime"`
	UpdatedAt      time.Time       `gorm:"autoUpdateTime"`
	ExecutionCount int             `gorm:"default:0"`
	LastExecutedAt *time.Time
	Schedule       *string
	IsAutomatic    bool            `gorm:"default:false"`
	Priority       int             `gorm:"default:0"`
	LogHistory     json.RawMessage `gorm:"type:json"`
}
