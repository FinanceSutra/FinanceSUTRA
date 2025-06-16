
package handlers

import (
    "encoding/json"
    "net/http"


    "strings"
    "gorm.io/gorm"
    "go-backend/models"
    "github.com/google/uuid"
    "golang.org/x/crypto/bcrypt"
    "time"
    "github.com/gorilla/sessions"
    "fmt"
    "bytes"
    "io"

)

type Handler struct {
    DB *gorm.DB
    Store *sessions.CookieStore
}


type RegisterInput struct {
    Username string `json:"username"`
    Email    string `json:"email"`
    FullName string `json:"fullName"`
    Password string `json:"password"`
}

func (h *Handler) LoginUser(w http.ResponseWriter, r *http.Request) {
    
    fmt.Println("Method:", r.Method)
    fmt.Println("URL:", r.URL.String())
    // fmt.Println("Header:", r.Header)

    body, err := io.ReadAll(r.Body)
    if err != nil {
        fmt.Println("Error reading body:", err)
    } else {
        fmt.Println("Body:", string(body))
        r.Body = io.NopCloser(bytes.NewBuffer(body)) // reassign body
    }

    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    var creds struct {
        Username string `json:"username"`
        Password string `json:"password"`
    }

    err2 := json.NewDecoder(r.Body).Decode(&creds)
    if err2 != nil {
        http.Error(w, "Invalid request", http.StatusBadRequest)
        return
    }

    var user models.User
    result := h.DB.Where("username = ?", creds.Username).First(&user)
    if result.Error != nil {
        fmt.Println("User not found:", creds.Username)
        http.Error(w, "Username not found", http.StatusUnauthorized)
        return
    }
    fmt.Println("Decoded creds: ", creds.Username, creds.Password)

    // Compare the stored hash with the given password'
    fmt.Println("Entered password:", creds.Password)
    fmt.Println("Stored hash from DB:", user.Password)

    err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(creds.Password))
    if err != nil {
        fmt.Println("Password mismatch")
        http.Error(w, "Invalid username or password", http.StatusUnauthorized)
        return
    }
    // Create session
    session, _ := h.Store.Get(r, "Go-session-id")
    session.Values["user_id"] = user.ID.String()
    err = session.Save(r, w)
    if err != nil {
    fmt.Println("Error saving session:", err)
    http.Error(w, "Failed to create session", http.StatusInternalServerError)
    return
}


    // Send user (without password) as JSON
    user.Password = ""
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(user)
}


func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {

    fmt.Println("Method:", r.Method)
    fmt.Println("URL:", r.URL.String())
    // fmt.Println("Header:", r.Header)

    body, err := io.ReadAll(r.Body)
    if err != nil {
        fmt.Println("Error reading body:", err)
    } else {
        fmt.Println("Body:", string(body))
        r.Body = io.NopCloser(bytes.NewBuffer(body)) // reassign body
    }

    var input RegisterInput
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        http.Error(w, "Invalid input", http.StatusBadRequest)
        return
    }

    // Check if username exists
    var existing models.User
    if err := h.DB.Where("username = ?", input.Username).First(&existing).Error; err == nil {
        http.Error(w, "Username already exists", http.StatusBadRequest)
        return
    }

    // Check if email exists
    if err := h.DB.Where("email = ?", input.Email).First(&existing).Error; err == nil {
        http.Error(w, "Email already exists", http.StatusBadRequest)
        return
    }
     
    fmt.Println(input.Password);
    // Hash password
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
    fmt.Println(string(hashedPassword));
    if err != nil {
        http.Error(w, "Failed to hash password", http.StatusInternalServerError)
        return
    }

    // Create new user
    newUser := models.User{
        ID:        uuid.New(),
        Username:  input.Username,
        Email:     input.Email,
        FullName:  input.FullName,
        Password:  string(hashedPassword),
        CreatedAt: time.Now(),
    }

    if err := h.DB.Create(&newUser).Error; err != nil {
        http.Error(w, "Failed to create user", http.StatusInternalServerError)
        return
    }

    // Set session
    session, _ := h.Store.Get(r, "Go-session-id")
    session.Values["user_id"] = newUser.ID.String()
    session.Save(r, w)

    // Respond without password
    newUser.Password = ""
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(newUser)
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

func (h *Handler) GetCurrentUser(w http.ResponseWriter, r *http.Request) {

    fmt.Println("Method:", r.Method)
    fmt.Println("URL:", r.URL.String())
	session, _ := h.Store.Get(r, "Go-session-id")

	// Validate if session contains the user_id
	userIDStr, ok := session.Values["user_id"].(string)
	if !ok {
		http.Error(w, "Not authenticated", http.StatusUnauthorized)
		return
	}

	var user models.User
	if err := h.DB.First(&user, "id = ?", userIDStr).Error; err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	user.Password = "" // Sanitize sensitive data
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

