package main

import (
	"log"
	"net/http"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"go-backend/handlers"
	"go-backend/models"
	"github.com/rs/cors"
	"github.com/gorilla/sessions"
    "encoding/gob"
    "github.com/google/uuid"
	// "os"
	// "fmt"
	// "time"
)

// func connectWithRetry(dsn string, maxRetries int, delaySec int) (*gorm.DB, error) {
// 	var db *gorm.DB
// 	var err error

// 	for i := 1; i <= maxRetries; i++ {
// 		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
// 		if err == nil {
// 			sqlDB, err := db.DB()
// 			if err == nil {
// 				err = sqlDB.Ping()
// 				if err == nil {
// 					log.Println("✅ Successfully connected to database.")
// 					return db, nil
// 				}
// 			}
// 		}

// 		log.Printf("Failed to connect to database (attempt %d/%d): %v", i, maxRetries, err)
// 		time.Sleep(time.Duration(delaySec) * time.Second)
// 	}

// 	return nil, fmt.Errorf("Could not connect to database after %d attempts: %w", maxRetries, err)
// }


func main() {
// 	dbHost := os.Getenv("DB_HOST")
//     dbPort := os.Getenv("DB_PORT")
//     dbUser := os.Getenv("DB_USER")
//     dbPassword := os.Getenv("DB_PASSWORD")
//     dbName := os.Getenv("DB_NAME")

//     dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
//     dbHost, dbPort, dbUser, dbPassword, dbName)

	gob.Register(uuid.UUID{})
    store := sessions.NewCookieStore([]byte("your-very-secret-key"))
        store.Options = &sessions.Options{
	    Path:     "/",
	    MaxAge:   86400 * 7, // 1 week
	    HttpOnly: true,
	    SameSite: http.SameSiteLaxMode,
        Secure: false,

    }

	dsn := "host=localhost user=postgres password='Daksh@2706' dbname=Leo1 port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	// db, err := connectWithRetry(dsn, 10, 2)
	// if err != nil {
	// 	log.Fatal(err)
	// }

	mux := http.NewServeMux()

	// Auto-migrate User model
	db.AutoMigrate(&models.User{})

	h := handlers.Handler{
        DB: db,
        Store: store,
    }
    
    h0 := handlers.SettingsHandler{
   		 DB:    db,
   		 Store: store, // pass the session store
    }

	mux.HandleFunc("/api/user", h.GetCurrentUser)

    mux.HandleFunc("/register", func(w http.ResponseWriter, r *http.Request) {
        switch r.Method {
        case "POST":
            h.Register(w, r)
        case "GET":
            h.GetUsers(w, r)
        default:
            http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        }
    })

    mux.HandleFunc("/login", h.LoginUser);
	
	mux.HandleFunc("/user/settings", func(w http.ResponseWriter, r *http.Request){
        if r.Method == http.MethodPut{
            h0.StoreNotiPref(w,r)
        }
    } )

	mux.HandleFunc("/user/preferences", func(w http.ResponseWriter, r *http.Request){
		if r.Method == http.MethodOptions {
        w.WriteHeader(http.StatusOK)
        return
    }
        if r.Method == http.MethodPut{
            h0.StoreUserPreferences(w,r)
        }
    } )

	// Automigrate strategies model

    db.AutoMigrate(&models.Strategy{})

	h1 := &handlers.StrategyHandler{DB: db,
	 Store: store,}

	mux.HandleFunc("/strategies", func(w http.ResponseWriter, r *http.Request) {

		session, _ := store.Get(r, "Go-session-id")
	   _, ok := session.Values["user_id"]
	   if !ok {
	    	http.Error(w, "Unauthorized", http.StatusUnauthorized)
	    	return
	   }

		if r.Method == http.MethodGet {
			h1.GetStrategies(w, r)
		} else if r.Method == http.MethodPost {
			h1.CreateStrategy(w, r)
		} else {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	// Handle /strategies/{id} crud operations
	mux.HandleFunc("/strategies/", func(w http.ResponseWriter, r *http.Request) {
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
	// Auto-migrate DeployStrategy model
	db.AutoMigrate(&models.DeployedStrategy{})

	h2 := &handlers.DeployStrategyHandler{DB: db}

	mux.HandleFunc("/deploy-strategy", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h2.GetDeployedStrategies(w, r)
		case http.MethodPost:
			h2.CreateDeployedStrategy(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})
	// Auto-migrate StrategyRecommendation model
	db.AutoMigrate(&models.StrategyRecommendation{})

	h3 := &handlers.StrategyRecommendationHandler{DB: db}

	// Handle GET and POST /strategy-recommendations
	mux.HandleFunc("/strategy-recommendations", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h3.GetAllRecommendations(w, r)
		case http.MethodPost:
			h3.CreateRecommendation(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	// Handle GET and PUT /strategy-recommendations/{id}
	mux.HandleFunc("/strategy-recommendations/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h3.GetRecommendationByID(w, r)
		case http.MethodPut:
			h3.UpdateRecommendation(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	// Auto-migrate TradingWorkflow model
	db.AutoMigrate(&models.TradingWorkflow{})

	h4 := &handlers.TradingWorkflowHandler{DB: db}

	mux.HandleFunc("/trading-workflows", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h4.GetAll(w, r)
		case http.MethodPost:
			h4.Create(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/trading-workflows/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h4.GetByID(w, r)
		case http.MethodPut:
			h4.Update(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	// Auto-migrate WorkflowStep model
	db.AutoMigrate(&models.WorkflowStep{})

	h5 := &handlers.WorkflowStepHandler{DB: db}

	mux.HandleFunc("/workflow-steps", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h5.GetAll(w, r)
		case http.MethodPost:
			h5.Create(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/workflow-steps/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h5.GetByID(w, r)
		case http.MethodPut:
			h5.Update(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	// Auto-migrate WorkflowCondition model
	db.AutoMigrate(&models.WorkflowCondition{})

	h6 := &handlers.WorkflowConditionHandler{DB: db}

	mux.HandleFunc("/workflow-conditions", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h6.GetAll(w, r)
		case http.MethodPost:
			h6.Create(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/workflow-conditions/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h6.GetByID(w, r)
		case http.MethodPut:
			h6.Update(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	// Auto-migrate WorkflowAction model
	db.AutoMigrate(&models.WorkflowAction{})

	h7 := &handlers.WorkflowActionHandler{DB: db}

	mux.HandleFunc("/workflow-actions", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h7.GetWorkflowActions(w, r)
		case http.MethodPost:
			h7.CreateWorkflowAction(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/workflow-actions/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h7.GetWorkflowAction(w, r)
		case http.MethodPut:
			h7.UpdateWorkflowAction(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	db.AutoMigrate(&models.WorkflowExecutionLog{})

	h8 := &handlers.WorkflowExecutionLogHandler{DB: db}

	mux.HandleFunc("/workflow-execution-logs", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h8.GetLogs(w, r)
		case http.MethodPost:
			h8.CreateLog(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/workflow-execution-logs/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h8.GetLog(w, r)
		case http.MethodPut:
			h8.UpdateLog(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	handler := cors.New(cors.Options{
        AllowedOrigins:   []string{"http://localhost:5003"},
        AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowedHeaders:   []string{"Content-Type"},
        AllowCredentials: true,
    }).Handler(mux)

	log.Println("Server started on :8080")
	log.Fatal(http.ListenAndServe(":8080", handler))

}