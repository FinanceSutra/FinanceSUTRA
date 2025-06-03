
package handlers

import (
    "encoding/json"
    "net/http"
    "time"
	"errors"
    "fmt"

    "github.com/google/uuid"
    "go-backend/models"
    "gorm.io/gorm"
)

type SettingsHandler struct {
    DB *gorm.DB
}

// Request body structure
type NotificationPrefInput struct {
    UserID             uuid.UUID `json:"user_id"`
    EmailNotifications bool      `json:"email_notifications"`
    TradingAlerts      bool      `json:"trading_alerts"`
    MarketUpdates      bool      `json:"market_updates"`
    PerformanceReports bool      `json:"performance_reports"`
}

func (h *SettingsHandler) StoreNotiPref(w http.ResponseWriter, r *http.Request) {
    var input NotificationPrefInput

    // Parse JSON body
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }

    fmt.Println(input)

    // Check if user exists
    var user models.User
    // fmt.Println("I am here")
    if err := h.DB.First(&user, "id = ?", input.UserID).Error; err != nil {
        http.Error(w, "User not found", http.StatusNotFound)
        return
    }

    // Check if preferences already exist for user
    var prefs models.NotificationPreferences
    result := h.DB.Where("user_id = ?", input.UserID).First(&prefs)

    if result.Error == gorm.ErrRecordNotFound {
        // Create new preferences
        prefs = models.NotificationPreferences{
            ID:                 uuid.New(),
            UserID:             input.UserID,
            EmailNotifications: input.EmailNotifications,
            TradingAlerts:      input.TradingAlerts,
            MarketUpdates:      input.MarketUpdates,
            PerformanceReports: input.PerformanceReports,
            CreatedAt:          time.Now(),
            UpdatedAt:          time.Now(),
        }
        if err := h.DB.Create(&prefs).Error; err != nil {
            http.Error(w, "Failed to create preferences", http.StatusInternalServerError)
            return
        }
    } else if result.Error == nil {
        // Update existing preferences
        prefs.EmailNotifications = input.EmailNotifications
        prefs.TradingAlerts = input.TradingAlerts
        prefs.MarketUpdates = input.MarketUpdates
        prefs.PerformanceReports = input.PerformanceReports
        prefs.UpdatedAt = time.Now()

        if err := h.DB.Save(&prefs).Error; err != nil {
            http.Error(w, "Failed to update preferences", http.StatusInternalServerError)
            return
        }
    } else {
        http.Error(w, "Database error", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
    w.Write([]byte("Notification preferences saved successfully"))
}

func (h *SettingsHandler) StoreUserPreferences(w http.ResponseWriter, r *http.Request) {
	var input models.AppPreferences

	// Parse JSON body
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Check if user exists
	var user models.User
	if err := h.DB.First(&user, "id = ?", input.UserID).Error; err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Check if user preferences already exist
	var prefs models.AppPreferences
	result := h.DB.Where("user_id = ?", input.UserID).First(&prefs)

	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		// Create new preferences
		input.ID = uuid.New()
		input.CreatedAt = time.Now()
		input.UpdatedAt = time.Now()

		if err := h.DB.Create(&input).Error; err != nil {
			http.Error(w, "Failed to create user preferences", http.StatusInternalServerError)
			return
		}
	} else if result.Error == nil {
		// Update existing preferences
		prefs.Theme = input.Theme
		prefs.ChartStyle = input.ChartStyle
		prefs.ShowVolume = input.ShowVolume
		prefs.DefaultTimeframe = input.DefaultTimeframe
		prefs.AutoRefresh = input.AutoRefresh
		prefs.CacheHistoricalData = input.CacheHistoricalData
		prefs.DownloadFrequency = input.DownloadFrequency
		prefs.RetentionPeriodDays = input.RetentionPeriodDays
		prefs.UpdatedAt = time.Now()

		if err := h.DB.Save(&prefs).Error; err != nil {
			http.Error(w, "Failed to update user preferences", http.StatusInternalServerError)
			return
		}
	} else {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("User preferences saved successfully"))
}



