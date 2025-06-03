package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"go-backend/models"
	"gorm.io/gorm"
)

type WorkflowStepHandler struct {
	DB *gorm.DB
}

// GET /workflow-steps
func (h *WorkflowStepHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	var steps []models.WorkflowStep
	if err := h.DB.Find(&steps).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(steps)
}

// GET /workflow-steps/{id}
func (h *WorkflowStepHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/workflow-steps/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var step models.WorkflowStep
	if err := h.DB.First(&step, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.NotFound(w, r)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}
	json.NewEncoder(w).Encode(step)
}

// POST /workflow-steps
func (h *WorkflowStepHandler) Create(w http.ResponseWriter, r *http.Request) {
	var step models.WorkflowStep
	if err := json.NewDecoder(r.Body).Decode(&step); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := h.DB.Create(&step).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(step)
}

// PUT /workflow-steps/{id}
func (h *WorkflowStepHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/workflow-steps/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var existing models.WorkflowStep
	if err := h.DB.First(&existing, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.NotFound(w, r)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	var updated models.WorkflowStep
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
