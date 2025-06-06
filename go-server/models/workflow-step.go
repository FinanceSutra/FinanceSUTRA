package models

import (
	"encoding/json"
	"time"
)

type WorkflowStep struct {
	ID            uint            `gorm:"primaryKey;autoIncrement"`
	WorkflowID    uint            `gorm:"not null"`
	StepType      string          `gorm:"not null"`                         // condition, action, notification, delay
	StepOrder     int             `gorm:"not null"`
	Name          string          `gorm:"not null"`
	Description   *string         `gorm:"type:text"`
	Config        json.RawMessage `gorm:"type:json"`                        // JSON with step configuration
	CreatedAt     time.Time       `gorm:"autoCreateTime"`
	UpdatedAt     time.Time       `gorm:"autoUpdateTime"`
	IsEnabled     bool            `gorm:"default:true"`
	ExecutionTime int             `gorm:"default:0"`                        // in milliseconds
	LastResult    *string
	ErrorMessage  *string         `gorm:"type:text"`
	RetryCount    int             `gorm:"default:0"`
	MaxRetries    int             `gorm:"default:0"`
}
