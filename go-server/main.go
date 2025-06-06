package main

import (
	"log"
	"net/http"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"go-backend/handlers"
	"go-backend/models"
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
	// Auto-migrate DeployStrategy model
	db.AutoMigrate(&models.DeployedStrategy{})

	h2 := &handlers.DeployStrategyHandler{DB: db}

	http.HandleFunc("/deploy-strategy", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h2.GetDeployedStrategies(w, r)
		case http.MethodPost:
			h2.CreateDeployedStrategy(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/deploy-strategy/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h2.GetDeployedStrategy(w, r)
		case http.MethodPut:
			h2.UpdateDeployedStrategy(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	// Auto-migrate StrategyRecommendation model
	db.AutoMigrate(&models.StrategyRecommendation{})

	h3 := &handlers.StrategyRecommendationHandler{DB: db}

	// Handle GET and POST /strategy-recommendations
	http.HandleFunc("/strategy-recommendations", func(w http.ResponseWriter, r *http.Request) {
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
	http.HandleFunc("/strategy-recommendations/", func(w http.ResponseWriter, r *http.Request) {
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

	http.HandleFunc("/trading-workflows", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h4.GetAll(w, r)
		case http.MethodPost:
			h4.Create(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/trading-workflows/", func(w http.ResponseWriter, r *http.Request) {
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

	http.HandleFunc("/workflow-steps", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h5.GetAll(w, r)
		case http.MethodPost:
			h5.Create(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/workflow-steps/", func(w http.ResponseWriter, r *http.Request) {
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

	http.HandleFunc("/workflow-conditions", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h6.GetAll(w, r)
		case http.MethodPost:
			h6.Create(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/workflow-conditions/", func(w http.ResponseWriter, r *http.Request) {
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

	http.HandleFunc("/workflow-actions", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h7.GetWorkflowActions(w, r)
		case http.MethodPost:
			h7.CreateWorkflowAction(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/workflow-actions/", func(w http.ResponseWriter, r *http.Request) {
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

	http.HandleFunc("/workflow-execution-logs", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h8.GetLogs(w, r)
		case http.MethodPost:
			h8.CreateLog(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/workflow-execution-logs/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h8.GetLog(w, r)
		case http.MethodPut:
			h8.UpdateLog(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	log.Println("Server started on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))

}
