package handlers

import (
    "encoding/json"
    "net/http"
    "strconv"

    "go-backend/models"
    "github.com/google/uuid"
    "github.com/gorilla/sessions"
    "gorm.io/gorm"
)

type TradingWorkflowHandler struct {
    DB    *gorm.DB
    Store sessions.Store
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// GET /trading-workflows - list all trading workflows for the user
func (h *TradingWorkflowHandler) GetTradingWorkflows(w http.ResponseWriter, r *http.Request) {
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

    var tradingWorkflows []models.TradingWorkflow
    if err := h.DB.Where("user_id = ?", userID).Find(&tradingWorkflows).Error; err != nil {
        http.Error(w, "Failed to fetch trading workflows", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(tradingWorkflows)
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GET /trading-workflows/{id} - get a single trading workflow
func (h *TradingWorkflowHandler) GetTradingWorkflow(w http.ResponseWriter, r *http.Request) {
    idStr := r.URL.Path[len("/trading-workflow/"):]
    id, err := strconv.Atoi(idStr)
    if err != nil {
        http.Error(w, "Invalid ID", http.StatusBadRequest)
        return
    }

    var workflow models.TradingWorkflow
    if err := h.DB.First(&workflow, id).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            http.NotFound(w, r)
        } else {
            http.Error(w, err.Error(), http.StatusInternalServerError)
        }
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(workflow)
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
type TradingWorkflowRequest struct {
    Name           string  `json:"name"`
    Description    *string `json:"description"`
    Status         string  `json:"status"`
    Schedule       *string `json:"schedule"`
    IsAutomatic    bool    `json:"isAutomatic"`
    Priority       int     `json:"priority"`
}

// POST /trading-workflows - create a new trading workflow
func (h *TradingWorkflowHandler) CreateTradingWorkflow(w http.ResponseWriter, r *http.Request) {
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

    // Step 1: Read and decode into the request struct
    var req TradingWorkflowRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    // Step 2: Create the trading workflow object using your existing model
    tradingWorkflow := models.TradingWorkflow{
        ID:             uuid.New(),
        UserID:         userID,
        Name:           req.Name,
        Description:    req.Description,
        Status:         req.Status,
        Schedule:       req.Schedule,
        IsAutomatic:    req.IsAutomatic,
        Priority:       req.Priority,
        ExecutionCount: 0, // Default value
        // CreatedAt and UpdatedAt will be set automatically by GORM
        // LastExecutedAt starts as nil
        // LogHistory starts as nil
    }

    // Set default status if not provided
    if tradingWorkflow.Status == "" {
        tradingWorkflow.Status = "inactive" // matches your model default
    }

    if err := h.DB.Create(&tradingWorkflow).Error; err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(tradingWorkflow)
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PUT /trading-workflows/{id} - update an existing trading workflow
func (h *TradingWorkflowHandler) UpdateTradingWorkflow(w http.ResponseWriter, r *http.Request) {
    idStr := r.URL.Path[len("/trading-workflow/"):]
    id, err := strconv.Atoi(idStr)
    if err != nil {
        http.Error(w, "Invalid ID", http.StatusBadRequest)
        return
    }

    var existing models.TradingWorkflow
    if err := h.DB.First(&existing, id).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            http.NotFound(w, r)
        } else {
            http.Error(w, err.Error(), http.StatusInternalServerError)
        }
        return
    }

    var updated models.TradingWorkflow
    if err := json.NewDecoder(r.Body).Decode(&updated); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    updated.ID = existing.ID // maintain same ID
    if err := h.DB.Save(&updated).Error; err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(updated)
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DELETE /trading-workflows/{id} - delete a trading workflow (optional addition)
func (h *TradingWorkflowHandler) DeleteTradingWorkflow(w http.ResponseWriter, r *http.Request) {
    idStr := r.URL.Path[len("/trading-workflow/"):]
    id, err := strconv.Atoi(idStr)
    if err != nil {
        http.Error(w, "Invalid ID", http.StatusBadRequest)
        return
    }

    var workflow models.TradingWorkflow
    if err := h.DB.First(&workflow, id).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            http.NotFound(w, r)
        } else {
            http.Error(w, err.Error(), http.StatusInternalServerError)
        }
        return
    }

    if err := h.DB.Delete(&workflow).Error; err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusNoContent)
}
