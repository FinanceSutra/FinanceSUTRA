package handlers

import (
    "encoding/json"
    "net/http" 
    "strconv"
	"go-backend/models"
    "gorm.io/gorm"
    "fmt"
)

type StrategyHandler struct {
    DB *gorm.DB
}

// GET /strategies - list all strategies
func (h *StrategyHandler) GetStrategies(w http.ResponseWriter, r *http.Request) {
    var strategies []models.Strategy
    if err := h.DB.Find(&strategies).Error; err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(strategies)
}

// GET /strategies/{id} - get a single strategy
func (h *StrategyHandler) GetStrategy(w http.ResponseWriter, r *http.Request) {
    idStr := r.URL.Path[len("/strategies/"):] // crude way without mux
    id, err := strconv.Atoi(idStr)
    if err != nil {
        http.Error(w, "Invalid ID", http.StatusBadRequest)
        return
    }

    var strategy models.Strategy
    if err := h.DB.First(&strategy, id).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            http.NotFound(w, r)
        } else {
            http.Error(w, err.Error(), http.StatusInternalServerError)
        }
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(strategy)
}

// POST /strategies - create a new strategy

func (h *StrategyHandler) CreateStrategy(w http.ResponseWriter, r *http.Request) {
    fmt.Println("Method:", r.Method)
    fmt.Println("URL:", r.URL.String())
    var strategy models.Strategy
    if err := json.NewDecoder(r.Body).Decode(&strategy); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    if err := h.DB.Create(&strategy).Error; err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(strategy)
}

// PUT /strategies/{id} - update an existing strategy
func (h *StrategyHandler) UpdateStrategy(w http.ResponseWriter, r *http.Request) {
    idStr := r.URL.Path[len("/strategies/"):]
    id, err := strconv.Atoi(idStr)
    if err != nil {
        http.Error(w, "Invalid ID", http.StatusBadRequest)
        return
    }

    var existing models.Strategy
    if err := h.DB.First(&existing, id).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            http.NotFound(w, r)
        } else {
            http.Error(w, err.Error(), http.StatusInternalServerError)
        }
        return
    }

    var updated models.Strategy
    if err := json.NewDecoder(r.Body).Decode(&updated); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    updated.ID = existing.ID // ensure ID stays same
    if err := h.DB.Save(&updated).Error; err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(updated)
}
