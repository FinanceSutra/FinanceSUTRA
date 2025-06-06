package models

import (
	"encoding/json"
	"time"
)

type WorkflowExecutionLog struct {
	ID                 uint            `gorm:"primaryKey;autoIncrement"`
	WorkflowID         uint            `gorm:"not null"`
	ExecutionStartTime time.Time       `gorm:"autoCreateTime"`
	ExecutionEndTime   *time.Time
	Status             string          `gorm:"not null"` // pending, running, completed, failed
	TriggeredBy        string          `gorm:"not null"` // schedule, manual, event, condition
	Summary            *string
	Details            json.RawMessage `gorm:"type:json"`
	ErrorMessage       *string
}
