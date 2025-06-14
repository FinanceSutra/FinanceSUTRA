package models

import (
	"time"
	"github.com/google/uuid"
)

// type Strategy struct {
// 	ID uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
// 	UserID      uuid.UUID `gorm:"type:uuid;not null"`   // Foreign key to User
//     Name        string    `gorm:"not null"`
//     Description string
//     Code        string    `gorm:"type:text"`            // Store strategy logic/code
//     Symbol      string    `gorm:"not null"`
//     Timeframe   string    `gorm:"not null"`
//     IsActive    bool      `gorm:"default:true"`
//     CreatedAt   time.Time `gorm:"autoCreateTime"`
//     UpdatedAt   time.Time `gorm:"autoUpdateTime"`

//     // User User `gorm:"foreignKey:UserID"` // Optional: preload user if needed
// }

type Strategy struct {
    ID          uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
    UserID      uuid.UUID `json:"userId" gorm:"type:uuid;not null"`
    Name        string    `json:"name" gorm:"not null"`
    Description string    `json:"description"`
    Code        string    `json:"code" gorm:"type:text"`
    Symbol      string    `json:"symbol" gorm:"not null"`
    Timeframe   string    `json:"timeframe" gorm:"not null"`
    IsActive    bool      `json:"isActive" gorm:"default:true"`
    CreatedAt   time.Time `json:"createdAt" gorm:"autoCreateTime"`
    UpdatedAt   time.Time `json:"updatedAt" gorm:"autoUpdateTime"`

    // User User `gorm:"foreignKey:UserID"` // Optional: preload user if needed
}
