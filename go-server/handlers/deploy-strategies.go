package handlers

import (
	"encoding/json"
	"go-backend/models"
	"net/http"
	"strconv"

	"gorm.io/gorm"

	// "fmt"
	"github.com/google/uuid"
	"github.com/gorilla/sessions"
)

type DeployStrategyHandler struct {
	DB    *gorm.DB
	Store sessions.Store
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// GET /deploy-strategies - list all deployed strategies for the user
func (h *DeployStrategyHandler) GetDeployedStrategies(w http.ResponseWriter, r *http.Request) {
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

	var deployedStrategies []models.DeployedStrategy
	if err := h.DB.Where("user_id = ?", userID).Find(&deployedStrategies).Error; err != nil {
		http.Error(w, "Failed to fetch deployed strategies", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(deployedStrategies)
}
 ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GET /deploy-strategies/{id} - get a single deployed strategy
func (h *DeployStrategyHandler) GetDeployedStrategy(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/deploy-strategy/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var deployed models.DeployedStrategy
	if err := h.DB.First(&deployed, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.NotFound(w, r)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(deployed)
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
type DeployStrategyRequest struct {
    StrategyID      string `json:"strategyId"`
    BrokerID        string `json:"brokerId"`
    Name            string `json:"name"`
    LotMultiplier   string `json:"lotMultiplier"`
    CapitalDeployed string `json:"capitalDeployed"`
    TradingType     string `json:"tradingType"`
}


func (h *DeployStrategyHandler) CreateDeployedStrategy(w http.ResponseWriter, r *http.Request) {
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
    var req DeployStrategyRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    // Step 2: Convert fields as needed
    strategyUUID, err := uuid.Parse(req.StrategyID)
    if err != nil {
        http.Error(w, "Invalid strategyId", http.StatusBadRequest)
        return
    }

    brokerID, err := strconv.ParseUint(req.BrokerID, 10, 64)
    if err != nil {
        http.Error(w, "Invalid brokerId", http.StatusBadRequest)
        return
    }

    // Step 3: Create the deployed strategy object
    deployedStrategy := models.DeployedStrategy{
        StrategyID:      strategyUUID,
        UserID:          userID,
        BrokerID:        uint(brokerID),
        Name:            req.Name,
        LotMultiplier:   req.LotMultiplier,
        CapitalDeployed: req.CapitalDeployed,
        TradingType:     req.TradingType,
        Status:          "active",
        CurrentPnl:      0,
        PercentPnl:      0,
    }

    if err := h.DB.Create(&deployedStrategy).Error; err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(deployedStrategy)
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PUT /deploy-strategies/{id} - update an existing deployed strategy
func (h *DeployStrategyHandler) UpdateDeployedStrategy(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/deploy-strategy/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var existing models.DeployedStrategy
	if err := h.DB.First(&existing, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.NotFound(w, r)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	var updated models.DeployedStrategy
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
