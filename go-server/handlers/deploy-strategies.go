package handlers

import (
    "encoding/json"
    "net/http"
    "strconv"

    "go-backend/models"
    "gorm.io/gorm"
)

type DeployStrategyHandler struct {
    DB *gorm.DB
}

// GET /deploy-strategy - list all deployed strategies
func (h *DeployStrategyHandler) GetDeployedStrategies(w http.ResponseWriter, r *http.Request) {
    var deployed []models.DeployedStrategy
    if err := h.DB.Find(&deployed).Error; err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(deployed)
}

// GET /deploy-strategy/{id} - get a deployed strategy by ID
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

// POST /deploy-strategy - deploy a new strategy
func (h *DeployStrategyHandler) CreateDeployedStrategy(w http.ResponseWriter, r *http.Request) {
    var deployed models.DeployedStrategy
    if err := json.NewDecoder(r.Body).Decode(&deployed); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    if err := h.DB.Create(&deployed).Error; err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(deployed)
}

// PUT /deploy-strategy/{id} - update an existing deployed strategy
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
