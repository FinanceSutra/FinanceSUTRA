package handlers

import (
    "encoding/json"
    "net/http"
    "strings"

    "go-backend/models"
    "github.com/google/uuid"
    "github.com/gorilla/sessions"
    "gorm.io/gorm"
)

type OrderHandler struct {
    DB    *gorm.DB
    Store sessions.Store
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// GET /orders - list all orders for the user
func (h *OrderHandler) GetOrders(w http.ResponseWriter, r *http.Request) {
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

    var orders []models.Order
    if err := h.DB.Where("user_id = ?", userID).Find(&orders).Error; err != nil {
        http.Error(w, "Failed to fetch orders", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(orders)
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GET /orders/{id} - get a single order
func (h *OrderHandler) GetOrder(w http.ResponseWriter, r *http.Request) {
    idStr := strings.TrimPrefix(r.URL.Path, "/order/")
    id, err := uuid.Parse(idStr)
    if err != nil {
        http.Error(w, "Invalid ID", http.StatusBadRequest)
        return
    }

    var order models.Order
    if err := h.DB.First(&order, "id = ?", id).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            http.NotFound(w, r)
        } else {
            http.Error(w, err.Error(), http.StatusInternalServerError)
        }
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(order)
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
type OrderRequest struct {
    OrderID       string     `json:"orderId"`
    UserID       string     `json:"userId"`
    Instrument    string     `json:"instrument"`
    Exchange      string     `json:"exchange"`
    Quantity      int        `json:"quantity"`
    Price         float64    `json:"price"`
    OrderType     string     `json:"orderType"`
    Side          string     `json:"side"`
    Status        string     `json:"status"`
    StrategyID    uuid.UUID  `json:"strategyId"`
    IsExitOrder   bool       `json:"isExitOrder"`
    ParentOrderID *uuid.UUID `json:"parentOrderId,omitempty"`
}

// POST /orders - create a new order
func (h *OrderHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
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

    var req OrderRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    order := models.Order{
        ID:            uuid.New(),
        OrderID:       req.OrderID,
        UserID:        userID,
        Instrument:    req.Instrument,
        Exchange:      req.Exchange,
        Quantity:      req.Quantity,
        Price:         req.Price,
        OrderType:     req.OrderType,
        Side:          req.Side,
        Status:        req.Status,
        StrategyID:    req.StrategyID,
        IsExitOrder:   req.IsExitOrder,
        ParentOrderID: req.ParentOrderID,
    }

    if order.Status == "" {
        order.Status = "OPEN"
    }

    if err := h.DB.Create(&order).Error; err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(order)
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PUT /orders/{id} - update an existing order
func (h *OrderHandler) UpdateOrder(w http.ResponseWriter, r *http.Request) {
    idStr := strings.TrimPrefix(r.URL.Path, "/order/")
    id, err := uuid.Parse(idStr)
    if err != nil {
        http.Error(w, "Invalid ID", http.StatusBadRequest)
        return
    }

    var existing models.Order
    if err := h.DB.First(&existing, "id = ?", id).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            http.NotFound(w, r)
        } else {
            http.Error(w, err.Error(), http.StatusInternalServerError)
        }
        return
    }

    var updated models.Order
    if err := json.NewDecoder(r.Body).Decode(&updated); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    updated.ID = existing.ID
    if err := h.DB.Save(&updated).Error; err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(updated)
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DELETE /orders/{id} - delete an order
// func (h *OrderHandler) DeleteOrder(w http.ResponseWriter, r *http.Request) {
//     idStr := strings.TrimPrefix(r.URL.Path, "/order/")
//     id, err := uuid.Parse(idStr)
//     if err != nil {
//         http.Error(w, "Invalid ID", http.StatusBadRequest)
//         return
//     }

//     var order models.Order
//     if err := h.DB.First(&order, "id = ?", id).Error; err != nil {
//         if err == gorm.ErrRecordNotFound {
//             http.NotFound(w, r)
//         } else {
//             http.Error(w, err.Error(), http.StatusInternalServerError)
//         }
//         return
//     }

//     if err := h.DB.Delete(&order).Error; err != nil {
//         http.Error(w, err.Error(), http.StatusInternalServerError)
//         return
//     }

//     w.WriteHeader(http.StatusNoContent)
// }
