package handlers

import (
    "encoding/json"
    "net/http"


    "strings"
    "gorm.io/gorm"
    "go-backend/models"
    // "github.com/google/uuid"


)

type Handler struct {
    DB *gorm.DB
}

func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
    var user models.User
    if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    if err := h.DB.Create(&user).Error; err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(user)
}

func (h *Handler) GetUsers(w http.ResponseWriter, r *http.Request) {
    var users []models.User
    if err := h.DB.Find(&users).Error; err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    json.NewEncoder(w).Encode(users)
}

func (h *Handler) GetUserByUsername(w http.ResponseWriter, r *http.Request) {
    // Extract username from URL
    segments := strings.Split(r.URL.Path, "/")
    if len(segments) < 3 {
        http.Error(w, "Username not provided", http.StatusBadRequest)
        return
    }
    username := segments[3]

    var user models.User
    if err := h.DB.Where("username = ?", username).First(&user).Error; err != nil {
        http.Error(w, "User not found", http.StatusNotFound)
        return
    }

    json.NewEncoder(w).Encode(user)
}
