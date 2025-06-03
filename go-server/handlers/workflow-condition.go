package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"go-backend/models"
	"gorm.io/gorm"
)

type WorkflowConditionHandler struct {
	DB *gorm.DB
}

// GET /workflow-conditions
func (h *WorkflowConditionHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	var conditions []models.WorkflowCondition
	if err := h.DB.Find(&conditions).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(conditions)
}

// GET /workflow-conditions/{id}
func (h *WorkflowConditionHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/workflow-conditions/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var cond models.WorkflowCondition
	if err := h.DB.First(&cond, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.NotFound(w, r)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}
	json.NewEncoder(w).Encode(cond)
}

// POST /workflow-conditions
func (h *WorkflowConditionHandler) Create(w http.ResponseWriter, r *http.Request) {
	var cond models.WorkflowCondition
	if err := json.NewDecoder(r.Body).Decode(&cond); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := h.DB.Create(&cond).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(cond)
}

// PUT /workflow-conditions/{id}
func (h *WorkflowConditionHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/workflow-conditions/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var existing models.WorkflowCondition
	if err := h.DB.First(&existing, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.NotFound(w, r)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	var updated models.WorkflowCondition
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
