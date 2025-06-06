package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"go-backend/models"
	"gorm.io/gorm"
)

type StrategyRecommendationHandler struct {
	DB *gorm.DB
}

// GET /strategy-recommendations - list all recommendations
func (h *StrategyRecommendationHandler) GetAllRecommendations(w http.ResponseWriter, r *http.Request) {
	var strategies []models.StrategyRecommendation
	if err := h.DB.Find(&strategies).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(strategies)
}

// GET /strategy-recommendations/{id} - get recommendation by ID
func (h *StrategyRecommendationHandler) GetRecommendationByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/strategy-recommendations/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var strategy models.StrategyRecommendation
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

// POST /strategy-recommendations - create a new recommendation
func (h *StrategyRecommendationHandler) CreateRecommendation(w http.ResponseWriter, r *http.Request) {
	var strategy models.StrategyRecommendation
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

// PUT /strategy-recommendations/{id} - update recommendation by ID
func (h *StrategyRecommendationHandler) UpdateRecommendation(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/strategy-recommendations/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var existing models.StrategyRecommendation
	if err := h.DB.First(&existing, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.NotFound(w, r)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	var updated models.StrategyRecommendation
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
