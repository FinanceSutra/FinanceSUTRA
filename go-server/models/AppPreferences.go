package models

import (
    "time"

    "github.com/google/uuid"
)

type AppPreferences struct {
    ID     uuid.UUID `gorm:"type:uuid;primaryKey"`
    UserID uuid.UUID `gorm:"type:uuid;not null;unique"` // FK to users

    // Display Settings
    Theme           string `gorm:"type:varchar(20);default:'Light'"`          // e.g., "Light" or "Dark"
    ChartStyle      string `gorm:"type:varchar(20);default:'Candlesticks'"`   // e.g., "Candlesticks", "Bars", etc.
    ShowVolume      bool   `gorm:"default:true"`                              // Show trading volume on charts

    // Trading Settings
    DefaultTimeframe string `gorm:"type:varchar(20);default:'1 Day'"`         // e.g., "1 Day", "1 Hour"
    AutoRefresh      bool   `gorm:"default:true"`                             // Auto-refresh market data

    // Data Management
    CacheHistoricalData bool   `gorm:"default:true"`                          // Cache local historical data
    DownloadFrequency   string `gorm:"type:varchar(20);default:'Daily'"`      // e.g., "Daily", "Hourly"
    RetentionPeriodDays int    `gorm:"default:90"`                            // Data retention in days

    CreatedAt time.Time
    UpdatedAt time.Time
}
