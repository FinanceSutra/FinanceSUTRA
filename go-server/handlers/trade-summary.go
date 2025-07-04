package handlers

import (
    "encoding/json"
    "net/http"
    "strings"
    "time"

    "go-backend/models"
    "github.com/google/uuid"
    "github.com/gorilla/sessions"
    "gorm.io/gorm"
)

type TradeSummaryHandler struct {
    DB    *gorm.DB
    Store sessions.Store
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// GET /trade-summaries - list all trade summaries for the user
func (h *TradeSummaryHandler) GetTradeSummaries(w http.ResponseWriter, r *http.Request) {
    session, err := h.Store.Get(r, "Go-session-id")
    if err != nil {
        http.Error(w, "Failed to get session", http.StatusInternalServerError)
        return
    }

    var userID uuid.UUID

    switch v := session.Values["user_id"].(type) {
    case string:
        userID, err = uuid.Parse(v)
        if err != nil {
            http.Error(w, "Invalid user ID in session", http.StatusInternalServerError)
            return
        }
    case uuid.UUID:
        userID = v
    default:
        http.Error(w, "User not authenticated", http.StatusUnauthorized)
        return
    }

    var tradeSummaries []models.TradeSummary
    if err := h.DB.Where("user_id = ?", userID).Find(&tradeSummaries).Error; err != nil {
        http.Error(w, "Failed to fetch trade summaries", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(tradeSummaries)
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GET /trade-summaries/{id} - get a single trade summary
func (h *TradeSummaryHandler) GetTradeSummary(w http.ResponseWriter, r *http.Request) {
    idStr := strings.TrimPrefix(r.URL.Path, "/trade-summary/")
    id, err := uuid.Parse(idStr)
    if err != nil {
        http.Error(w, "Invalid ID", http.StatusBadRequest)
        return
    }

    var tradeSummary models.TradeSummary
    if err := h.DB.First(&tradeSummary, "id = ?", id).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            http.NotFound(w, r)
        } else {
            http.Error(w, err.Error(), http.StatusInternalServerError)
        }
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(tradeSummary)
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
type TradeSummaryRequest struct {
    StrategyID  uuid.UUID `json:"strategyId"`
    Instrument  string    `json:"instrument"`
    EntryTime   time.Time `json:"entryTime"`
    ExitTime    time.Time `json:"exitTime"`
    NetPnL      float64   `json:"netPnL"`
    TotalFees   float64   `json:"totalFees"`
    TotalTrades int       `json:"totalTrades"`
}

// POST /trade-summaries - create a new trade summary
func (h *TradeSummaryHandler) CreateTradeSummary(w http.ResponseWriter, r *http.Request) {
    session, err := h.Store.Get(r, "Go-session-id")
    if err != nil {
        http.Error(w, "Failed to get session", http.StatusInternalServerError)
        return
    }

    var userID uuid.UUID
    switch v := session.Values["user_id"].(type) {
    case string:
        userID, err = uuid.Parse(v)
        if err != nil {
            http.Error(w, "Invalid user ID in session", http.StatusInternalServerError)
            return
        }
    case uuid.UUID:
        userID = v
    default:
        http.Error(w, "User not authenticated", http.StatusUnauthorized)
        return
    }

    var req TradeSummaryRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    tradeSummary := models.TradeSummary{
        ID:          uuid.New(),
        UserID:      userID,
        StrategyID:  req.StrategyID,
        Instrument:  req.Instrument,
        EntryTime:   req.EntryTime,
        ExitTime:    req.ExitTime,
        NetPnL:      req.NetPnL,
        TotalFees:   req.TotalFees,
        TotalTrades: req.TotalTrades,
    }

    if err := h.DB.Create(&tradeSummary).Error; err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(tradeSummary)
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PUT /trade-summaries/{id} - update an existing trade summary
func (h *TradeSummaryHandler) UpdateTradeSummary(w http.ResponseWriter, r *http.Request) {
    idStr := strings.TrimPrefix(r.URL.Path, "/trade-summary/")
    id, err := uuid.Parse(idStr)
    if err != nil {
        http.Error(w, "Invalid ID", http.StatusBadRequest)
        return
    }

    var existing models.TradeSummary
    if err := h.DB.First(&existing, "id = ?", id).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            http.NotFound(w, r)
        } else {
            http.Error(w, err.Error(), http.StatusInternalServerError)
        }
        return
    }

    var updated models.TradeSummary
    if err := json.NewDecoder(r.Body).Decode(&updated); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    updated.ID = existing.ID
    if err := h.DB.Save(&updated).Error; err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(updated)
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DELETE /trade-summaries/{id} - delete a trade summary
// func (h *TradeSummaryHandler) DeleteTradeSummary(w http.ResponseWriter, r *http.Request) {
//     idStr := strings.TrimPrefix(r.URL.Path, "/trade-summary/")
//     id, err := uuid.Parse(idStr)
//     if err != nil {
//         http.Error(w, "Invalid ID", http.StatusBadRequest)
//         return
//     }

//     var tradeSummary models.TradeSummary
//     if err := h.DB.First(&tradeSummary, "id = ?", id).Error; err != nil {
//         if err == gorm.ErrRecordNotFound {
//             http.NotFound(w, r)
//         } else {
//             http.Error(w, err.Error(), http.StatusInternalServerError)
//         }
//         return
//     }

//     if err := h.DB.Delete(&tradeSummary).Error; err != nil {
//         http.Error(w, err.Error(), http.StatusInternalServerError)
//         return
//     }

//     w.WriteHeader(http.StatusNoContent)
// }
