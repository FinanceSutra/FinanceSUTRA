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

type TransactionHandler struct {
    DB    *gorm.DB
    Store sessions.Store
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// GET /transactions - list all transactions for the user
func (h *TransactionHandler) GetTransactions(w http.ResponseWriter, r *http.Request) {
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

    var transactions []models.Transaction
    query := h.DB.Joins("JOIN orders ON orders.id = transactions.order_id").
        Where("orders.user_id = ?", userID).
        Find(&transactions)
    
    if err := query.Error; err != nil {
        http.Error(w, "Failed to fetch transactions", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(transactions)
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GET /transactions/{id} - get a single transaction
func (h *TransactionHandler) GetTransaction(w http.ResponseWriter, r *http.Request) {
    idStr := strings.TrimPrefix(r.URL.Path, "/transaction/")
    id, err := uuid.Parse(idStr)
    if err != nil {
        http.Error(w, "Invalid ID", http.StatusBadRequest)
        return
    }

    var transaction models.Transaction
    if err := h.DB.First(&transaction, "id = ?", id).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            http.NotFound(w, r)
        } else {
            http.Error(w, err.Error(), http.StatusInternalServerError)
        }
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(transaction)
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
type TransactionRequest struct {
    TxID        string    `json:"txId"`
    OrderID     uuid.UUID `json:"orderId"`
    FillPrice   float64   `json:"fillPrice"`
    Quantity    int       `json:"quantity"`
    Brokerage   float64   `json:"brokerage"`
    Taxes       float64   `json:"taxes"`
    StrategyID  uuid.UUID `json:"strategyId"`
    Instrument  string    `json:"instrument"`
    IsEntry     bool      `json:"isEntry"`
    RealizedPnL *float64  `json:"realizedPnL,omitempty"`
    CostOfTrade *float64  `json:"costOfTrade,omitempty"`
}

// POST /transactions - create a new transaction
func (h *TransactionHandler) CreateTransaction(w http.ResponseWriter, r *http.Request) {
    var req TransactionRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    transaction := models.Transaction{
        ID:          uuid.New(),
        TxID:        req.TxID,
        OrderID:     req.OrderID,
        FillPrice:   req.FillPrice,
        Quantity:    req.Quantity,
        Brokerage:   req.Brokerage,
        Taxes:       req.Taxes,
        StrategyID:  req.StrategyID,
        Instrument:  req.Instrument,
        IsEntry:     req.IsEntry,
        RealizedPnL: req.RealizedPnL,
        CostOfTrade: req.CostOfTrade,
    }

    if err := h.DB.Create(&transaction).Error; err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(transaction)
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PUT /transactions/{id} - update an existing transaction
func (h *TransactionHandler) UpdateTransaction(w http.ResponseWriter, r *http.Request) {
    idStr := strings.TrimPrefix(r.URL.Path, "/transaction/")
    id, err := uuid.Parse(idStr)
    if err != nil {
        http.Error(w, "Invalid ID", http.StatusBadRequest)
        return
    }

    var existing models.Transaction
    if err := h.DB.First(&existing, "id = ?", id).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            http.NotFound(w, r)
        } else {
            http.Error(w, err.Error(), http.StatusInternalServerError)
        }
        return
    }

    var updated models.Transaction
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

// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// // DELETE /transactions/{id} - delete a transaction
// func (h *TransactionHandler) DeleteTransaction(w http.ResponseWriter, r *http.Request) {
//     idStr := strings.TrimPrefix(r.URL.Path, "/transaction/")
//     id, err := uuid.Parse(idStr)
//     if err != nil {
//         http.Error(w, "Invalid ID", http.StatusBadRequest)
//         return
//     }

//     var transaction models.Transaction
//     if err := h.DB.First(&transaction, "id = ?", id).Error; err != nil {
//         if err == gorm.ErrRecordNotFound {
//             http.NotFound(w, r)
//         } else {
//             http.Error(w, err.Error(), http.StatusInternalServerError)
//         }
//         return
//     }

//     if err := h.DB.Delete(&transaction).Error; err != nil {
//         http.Error(w, err.Error(), http.StatusInternalServerError)
//         return
//     }

//     w.WriteHeader(http.StatusNoContent)
// }
