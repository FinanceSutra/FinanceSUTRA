package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"go-backend/models"
	"gorm.io/gorm"
)

type WorkflowExecutionLogHandler struct {
	DB *gorm.DB
}

// GET /workflow-execution-logs
func (h *WorkflowExecutionLogHandler) GetLogs(w http.ResponseWriter, r *http.Request) {
	var logs []models.WorkflowExecutionLog
	if err := h.DB.Find(&logs).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(logs)
}

// GET /workflow-execution-logs/{id}
func (h *WorkflowExecutionLogHandler) GetLog(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/workflow-execution-logs/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	var log models.WorkflowExecutionLog
	if err := h.DB.First(&log, id).Error; err != nil {
		http.Error(w, "Log not found", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(log)
}

// POST /workflow-execution-logs
func (h *WorkflowExecutionLogHandler) CreateLog(w http.ResponseWriter, r *http.Request) {
	var log models.WorkflowExecutionLog
	if err := json.NewDecoder(r.Body).Decode(&log); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := h.DB.Create(&log).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(log)
}

// PUT /workflow-execution-logs/{id}
func (h *WorkflowExecutionLogHandler) UpdateLog(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/workflow-execution-logs/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	var existing models.WorkflowExecutionLog
	if err := h.DB.First(&existing, id).Error; err != nil {
		http.Error(w, "Log not found", http.StatusNotFound)
		return
	}
	var updated models.WorkflowExecutionLog
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
