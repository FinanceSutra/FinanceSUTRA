
package handlers

import (
    "encoding/json"
    "net/http"
    "time"
	"errors"
    // "fmt"

    "github.com/google/uuid"
    "go-backend/models"
    "gorm.io/gorm"
	"github.com/gorilla/sessions"

)

type SettingsHandler struct {
    DB    *gorm.DB
    Store *sessions.CookieStore // Add this line
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
    session, err := h.Store.Get(r, "Go-session-id")
    if err != nil {
        http.Error(w, "Failed to retrieve session", http.StatusInternalServerError)
        return
    }

    userID, ok := session.Values["user_id"].(string)
    if !ok || userID == "" {
        http.Error(w, "Unauthorized: No user ID in session", http.StatusUnauthorized)
        return
    }

    var input models.NotificationPreferences

    // Parse JSON body
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }

    // Lookup user to confirm existence (optional)
    var user models.User
    if err := h.DB.First(&user, "id = ?", userID).Error; err != nil {
        http.Error(w, "User not found", http.StatusNotFound)
        return
    }

    // Check if preferences already exist
    var prefs models.NotificationPreferences
    result := h.DB.Where("user_id = ?", userID).First(&prefs)

    if result.Error == gorm.ErrRecordNotFound {
        // Create new preferences
        prefs = models.NotificationPreferences{
            ID:                 uuid.New(),
            UserID:             uuid.MustParse(userID),
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

func parseRetentionPeriod(s string) int {
	switch s {
	case "30d":
		return 30
	case "90d":
		return 90
	case "180d":
		return 180
	case "1y":
		return 365
	case "unlimited":
		return -1
	default:
		return 90
	}
}

type AppPreferencesInput struct {
	Theme               string `json:"theme"`
	ChartStyle          string `json:"chartStyle"`
	ShowTradingVolume   bool   `json:"showTradingVolume"`
	DefaultTimeframe    string `json:"defaultTimeframe"`
	AutoRefreshData     bool   `json:"autoRefreshData"`
	CacheHistoricalData bool   `json:"cacheHistoricalData"`
	DownloadFrequency   string `json:"downloadFrequency"`
	DataRetentionPeriod string `json:"dataRetentionPeriod"` // e.g. "90d"
}

func (h *SettingsHandler) StoreUserPreferences(w http.ResponseWriter, r *http.Request) {
	session, err := h.Store.Get(r, "Go-session-id")
	if err != nil {
		http.Error(w, "Failed to retrieve session", http.StatusInternalServerError)
		return
	}

	// Securely extract user ID from session
	userIDStr, ok := session.Values["user_id"].(string)
	if !ok || userIDStr == "" {
		http.Error(w, "Unauthorized: No user ID in session", http.StatusUnauthorized)
		return
	}
	userID := uuid.MustParse(userIDStr)

	var input AppPreferencesInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Optional: Check if user actually exists
	var user models.User
	if err := h.DB.First(&user, "id = ?", userID).Error; err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	retentionDays := parseRetentionPeriod(input.DataRetentionPeriod)

	var prefs models.AppPreferences
	result := h.DB.Where("user_id = ?", userID).First(&prefs)

	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		// Create new preferences
		prefs = models.AppPreferences{
			ID:                  uuid.New(),
			UserID:              userID,
			Theme:               input.Theme,
			ChartStyle:          input.ChartStyle,
			ShowVolume:          input.ShowTradingVolume,
			DefaultTimeframe:    input.DefaultTimeframe,
			AutoRefresh:         input.AutoRefreshData,
			CacheHistoricalData: input.CacheHistoricalData,
			DownloadFrequency:   input.DownloadFrequency,
			RetentionPeriodDays: retentionDays,
			CreatedAt:           time.Now(),
			UpdatedAt:           time.Now(),
		}
		if err := h.DB.Create(&prefs).Error; err != nil {
			http.Error(w, "Failed to create user preferences", http.StatusInternalServerError)
			return
		}
	} else if result.Error == nil {
		// Update existing preferences
		prefs.Theme = input.Theme
		prefs.ChartStyle = input.ChartStyle
		prefs.ShowVolume = input.ShowTradingVolume
		prefs.DefaultTimeframe = input.DefaultTimeframe
		prefs.AutoRefresh = input.AutoRefreshData
		prefs.CacheHistoricalData = input.CacheHistoricalData
		prefs.DownloadFrequency = input.DownloadFrequency
		prefs.RetentionPeriodDays = retentionDays
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



