package handlers

import (
    "encoding/json"
    "net/http" 
    "strconv"
	"go-backend/models"
    "gorm.io/gorm"
    // "fmt"
	"github.com/gorilla/sessions"
    "github.com/google/uuid"
    

)

type StrategyHandler struct {
    DB *gorm.DB
    Store sessions.Store
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

// func (h *StrategyHandler) GetStrategies(w http.ResponseWriter, r *http.Request) {
//     session, err := h.Store.Get(r, "Go-session-id")
//     if err != nil {
//         http.Error(w, "Failed to get session", http.StatusInternalServerError)
//         return
//     }

//     var userID uuid.UUID

//     switch v := session.Values["user_id"].(type) {
//     case string:
//         userID, err = uuid.Parse(v)
//         if err != nil {
//             http.Error(w, "Invalid user ID in session", http.StatusInternalServerError)
//             return
//         }
//     case uuid.UUID:
//         userID = v
//     default:
//         http.Error(w, "User not authenticated", http.StatusUnauthorized)
//         return
//     }

//     var strategies []models.Strategy
//     if err := h.DB.Where("user_id = ?", userID).Find(&strategies).Error; err != nil {
//         http.Error(w, "Failed to fetch strategies", http.StatusInternalServerError)
//         return
//     }

//     w.Header().Set("Content-Type", "application/json")
//     json.NewEncoder(w).Encode(strategies)
// }

// POST /strategies - create a new strategy

// func (h *StrategyHandler) CreateStrategy(w http.ResponseWriter, r *http.Request) {
//     fmt.Println("Method:", r.Method)
//     fmt.Println("URL:", r.URL.String())
//     var strategy models.Strategy
//     if err := json.NewDecoder(r.Body).Decode(&strategy); err != nil {
//         http.Error(w, err.Error(), http.StatusBadRequest)
//         return
//     }

//     if err := h.DB.Create(&strategy).Error; err != nil {
//         http.Error(w, err.Error(), http.StatusInternalServerError)
//         return
//     }

//     w.Header().Set("Content-Type", "application/json")
//     w.WriteHeader(http.StatusCreated)
//     json.NewEncoder(w).Encode(strategy)
// }
// func (h *StrategyHandler) CreateStrategy(w http.ResponseWriter, r *http.Request) {
//     fmt.Println("Method:", r.Method)
//     fmt.Println("URL:", r.URL.String())

//     // Step 1: Retrieve session
//     session, err := h.Store.Get(r, "Go-session-id")
//     if err != nil {
//         http.Error(w, "Failed to get session", http.StatusInternalServerError)
//         return
//     }

//     // Step 2: Get user_id from session
//     userIDStr, ok := session.Values["user_id"].(string)
//     if !ok {
//         http.Error(w, "Not authenticated", http.StatusUnauthorized)
//         return
//     }

//     // Step 3: Parse UUID from string (if your model uses uuid.UUID type)
//     userID, err := uuid.Parse(userIDStr)
//     if err != nil {
//         http.Error(w, "Invalid user ID", http.StatusInternalServerError)
//         return
//     }

//     // Step 4: Decode request body
//     var strategy models.Strategy
//     if err := json.NewDecoder(r.Body).Decode(&strategy); err != nil {
//         http.Error(w, err.Error(), http.StatusBadRequest)
//         return
//     }

//     // Step 5: Attach user ID to strategy
//     strategy.UserID = userID

//     // Step 6: Save strategy
//     if err := h.DB.Create(&strategy).Error; err != nil {
//         http.Error(w, err.Error(), http.StatusInternalServerError)
//         return
//     }

//     // Step 7: Return created strategy
//     w.Header().Set("Content-Type", "application/json")
//     w.WriteHeader(http.StatusCreated)
//     json.NewEncoder(w).Encode(strategy)
// }

func (h *StrategyHandler) CreateStrategy(w http.ResponseWriter, r *http.Request) {
    session, err := h.Store.Get(r, "Go-session-id")
    if err != nil {
        http.Error(w, "Failed to get session", http.StatusInternalServerError)
        return
    }

    // Use type switch or assert based on expected format (uuid.UUID or string)
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

    var strategy models.Strategy
    if err := json.NewDecoder(r.Body).Decode(&strategy); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    strategy.ID = uuid.New() 
    strategy.UserID = userID

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
