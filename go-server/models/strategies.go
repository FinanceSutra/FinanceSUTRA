package models

import (
	"time"
	"github.com/google/uuid"
)

type Strategy struct {
	ID          uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID      uuid.UUID `gorm:"type:uuid;not null"`   // Foreign key to User
    Name        string    `gorm:"not null"`
    Description string
    Code        string    `gorm:"type:text"`            // Store strategy logic/code
    Symbol      string    `gorm:"not null"`
    Timeframe   string    `gorm:"not null"`
    IsActive    bool      `gorm:"default:true"`
    CreatedAt   time.Time `gorm:"autoCreateTime"`
    UpdatedAt   time.Time `gorm:"autoUpdateTime"`

    // User User `gorm:"foreignKey:UserID"` // Optional: preload user if needed
}
