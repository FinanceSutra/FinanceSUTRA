package models

import (
	"encoding/json"
	"github.com/google/uuid"
	"time"
)

type TradingWorkflow struct {
	ID             uuid.UUID       `gorm:"type:uuid;primaryKey" json:"id"`
	UserID         uuid.UUID       `gorm:"type:uuid;not null" json:"userId"`
	Name           string          `gorm:"not null" json:"name"`
	Description    *string         `gorm:"type:text" json:"description"`
	Status         string          `gorm:"default:'inactive'" json:"status"` // active, inactive, paused, archived
	CreatedAt      time.Time       `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt      time.Time       `gorm:"autoUpdateTime" json:"updatedAt"`
	ExecutionCount int             `gorm:"default:0" json:"executionCount"`
	LastExecutedAt *time.Time      `json:"lastExecutedAt"`
	Schedule       *string         `json:"schedule"`
	IsAutomatic    bool            `gorm:"default:false" json:"isAutomatic"`
	Priority       int             `gorm:"default:0" json:"priority"`
	LogHistory     json.RawMessage `gorm:"type:json" json:"logHistory"`
}
