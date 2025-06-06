package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"go-backend/models"
	"gorm.io/gorm"
)

type TradingWorkflowHandler struct {
	DB *gorm.DB
}

func (h *TradingWorkflowHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	var workflows []models.TradingWorkflow
	if err := h.DB.Find(&workflows).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(workflows)
}

func (h *TradingWorkflowHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/trading-workflows/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var wf models.TradingWorkflow
	if err := h.DB.First(&wf, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.NotFound(w, r)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}
	json.NewEncoder(w).Encode(wf)
}

func (h *TradingWorkflowHandler) Create(w http.ResponseWriter, r *http.Request) {
	var wf models.TradingWorkflow
	if err := json.NewDecoder(r.Body).Decode(&wf); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := h.DB.Create(&wf).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(wf)
}

func (h *TradingWorkflowHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/trading-workflows/"):]
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

	updated.ID = existing.ID
	if err := h.DB.Save(&updated).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(updated)
}
