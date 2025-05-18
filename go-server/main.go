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
    dsn := "host=localhost user=postgres password=PASS dbname=TrialAPI port=5432 sslmode=disable"
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


    log.Println("Server started on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
