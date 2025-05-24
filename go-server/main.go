package main

import (
    "log"
    "net/http"

    "gorm.io/driver/postgres"
    "gorm.io/gorm"

    "go-backend/models"
    "go-backend/handlers"
)

func main() {
    dsn := "host=localhost user=postgres password='Daksh@2706' dbname=FinanceSutra port=5432 sslmode=disable"
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }

    // Auto-migrate User model
    db.AutoMigrate(&models.User{})

    h := handlers.Handler{DB: db}

    http.HandleFunc("/users", func(w http.ResponseWriter, r *http.Request) {
        switch r.Method {
        case "POST":
            h.CreateUser(w, r)
        case "GET":
            h.GetUsers(w, r)
        default:
            http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        }
    })

    http.HandleFunc("/users/username/", h.GetUserByUsername)


    

    // Automigrate strategies model
    db.AutoMigrate(&models.Strategy{})

    h1 := &handlers.StrategyHandler{DB: db}

    http.HandleFunc("/strategies", func(w http.ResponseWriter, r *http.Request) {
        if r.Method == http.MethodGet {
            h1.GetStrategies(w, r)
        } else if r.Method == http.MethodPost {
            h1.CreateStrategy(w, r)
        } else {
            http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
        }
    })

    // Handle /strategies/{id} crud operations
    http.HandleFunc("/strategies/", func(w http.ResponseWriter, r *http.Request) {
        // crude way to get method and id
        switch r.Method {
        case http.MethodGet:
            h1.GetStrategy(w, r)
        case http.MethodPut:
            h1.UpdateStrategy(w, r)
        default:
            http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
        }
    })

    log.Println("Server started on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))

}

