package models

import (
	"time"
)

type Strategy struct {
	ID          uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Name        string    `json:"name"`
	Symbol      string    `json:"symbol"`
	Timeframe   string    `json:"timeframe"`
	Description string    `json:"description,omitempty"`
	IsActive    bool      `json:"isActive"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}
