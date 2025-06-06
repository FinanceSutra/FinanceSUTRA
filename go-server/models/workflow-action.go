package models

import (
	"encoding/json"
	"time"
)

type WorkflowAction struct {
	ID               uint            `gorm:"primaryKey;autoIncrement"`
	WorkflowID       uint            `gorm:"not null"`
	StepID           uint            `gorm:"not null"`
	ActionType       string          `gorm:"not null"`
	Symbol           *string
	Quantity         *string
	Price            *string
	OrderType        *string
	Duration         *string
	AdditionalParams json.RawMessage `gorm:"type:json"`
	IsEnabled        bool            `gorm:"default:true"`
	LastExecuted     *time.Time
	ExecutionStatus  *string
	ErrorMessage     *string
	CreatedAt        time.Time `gorm:"autoCreateTime"`
	UpdatedAt        time.Time `gorm:"autoUpdateTime"`
}
