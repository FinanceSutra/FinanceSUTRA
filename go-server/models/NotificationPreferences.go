package models

import(
	"time"
    "github.com/google/uuid"
)
type NotificationPreferences struct {

    ID                  uuid.UUID `gorm:"type:uuid;primaryKey"`
    UserID              uuid.UUID `gorm:"type:uuid;not null;unique"` // FK to users

    EmailNotifications  bool
    TradingAlerts       bool
    MarketUpdates       bool
    PerformanceReports  bool

    CreatedAt time.Time
    UpdatedAt time.Time
}
