package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
)

// User represents the user model stored in the database
type User struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

// Simple email validation regex (not perfect but solid)
var emailRegex = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)

func main() {
	// Read DATABASE_URL from environment variables
	dsn := os.Getenv("DATABASE_URL")
	if strings.TrimSpace(dsn) == "" {
		log.Fatal("DATABASE_URL environment variable is not set or is empty")
	}

	// Connect to PostgreSQL using the DATABASE_URL environment variable
	// Example: postgres://user:password@localhost:5432/dbname?sslmode=disable
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("Error opening database connection:", err)
	}
	defer db.Close()

	// Verify the database connection is actually reachable
	if err := db.Ping(); err != nil {
		log.Fatal("Error pinging database:", err)
	}

	// Create the users table if it does not exist
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			name TEXT NOT NULL,
			email TEXT NOT NULL
		)
	`)
	if err != nil {
		log.Fatal("Error creating users table:", err)
	}

	// Create the main router
	router := mux.NewRouter()

	// Enable CORS for development
	// NOTE: Using "*" is fine for local development, but should be restricted in production.
	router.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Allow any origin (development only)
			// For production, replace "*" with a specific origin like "http://localhost:3000"
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

			// Handle CORS preflight requests (OPTIONS)
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			// Continue to the next handler
			next.ServeHTTP(w, r)
		})
	})

	// CRUD routes for users
	router.HandleFunc("/users", getUsers(db)).Methods(http.MethodGet)
	router.HandleFunc("/users/{id}", getUser(db)).Methods(http.MethodGet)
	router.HandleFunc("/users", createUser(db)).Methods(http.MethodPost)
	router.HandleFunc("/users/{id}", updateUser(db)).Methods(http.MethodPut)
	router.HandleFunc("/users/{id}", deleteUser(db)).Methods(http.MethodDelete)

	// Explicit OPTIONS routes to avoid 405 Method Not Allowed on preflight
	router.HandleFunc("/users", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}).Methods(http.MethodOptions)

	router.HandleFunc("/users/{id}", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}).Methods(http.MethodOptions)

	// Start the HTTP server with a JSON content-type middleware
	log.Println("Server listening on :8000")
	log.Fatal(http.ListenAndServe(":8000", jsonContentTypeMiddleware(router)))
}

// jsonContentTypeMiddleware forces "Content-Type: application/json" for all responses
func jsonContentTypeMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		next.ServeHTTP(w, r)
	})
}

// isValidEmail validates the email string against the regex
func isValidEmail(email string) bool {
	return emailRegex.MatchString(email)
}

// getUsers returns all users from the database
func getUsers(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := db.Query("SELECT id, name, email FROM users")
		if err != nil {
			log.Printf("Error querying users: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Error querying users"})
			return
		}
		defer rows.Close()

		users := []User{}
		for rows.Next() {
			var u User
			if err := rows.Scan(&u.ID, &u.Name, &u.Email); err != nil {
				log.Printf("Error scanning user: %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]string{"error": "Error reading users"})
				return
			}
			users = append(users, u)
		}
		if err := rows.Err(); err != nil {
			log.Printf("Error iterating over users: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Error iterating users"})
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(users)
	}
}

// getUser returns a single user by ID
func getUser(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get the "id" URL parameter
		vars := mux.Vars(r)
		idStr := vars["id"]

		id, err := strconv.Atoi(idStr)
		if err != nil || id <= 0 {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid user ID"})
			return
		}

		var u User
		err = db.QueryRow("SELECT id, name, email FROM users WHERE id = $1", id).
			Scan(&u.ID, &u.Name, &u.Email)

		if err != nil {
			if err == sql.ErrNoRows {
				// User not found
				w.WriteHeader(http.StatusNotFound)
				json.NewEncoder(w).Encode(map[string]string{"error": "User not found"})
			} else {
				// Unexpected database error
				log.Printf("Error querying user: %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]string{"error": "Internal server error"})
			}
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(u)
	}
}

// createUser inserts a new user into the database
func createUser(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var u User

		// Decode JSON body
		if err := json.NewDecoder(r.Body).Decode(&u); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON body"})
			return
		}

		// Validate name
		if len(strings.TrimSpace(u.Name)) == 0 {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Name cannot be empty"})
			return
		}

		// Validate email format
		if !isValidEmail(strings.TrimSpace(u.Email)) {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid email format"})
			return
		}

		// Insert user
		err := db.QueryRow(
			"INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
			u.Name, u.Email,
		).Scan(&u.ID)

		if err != nil {
			log.Printf("Error inserting user: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Database insert error"})
			return
		}

		// Success
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(u)
	}
}

// updateUser updates an existing user by ID with validation
func updateUser(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var u User

		// Decode JSON body into User struct
		if err := json.NewDecoder(r.Body).Decode(&u); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON body"})
			return
		}

		// Basic validation: name cannot be empty
		if strings.TrimSpace(u.Name) == "" {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Name cannot be empty"})
			return
		}

		// Email format validation
		if !isValidEmail(strings.TrimSpace(u.Email)) {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid email format"})
			return
		}

		vars := mux.Vars(r)
		idStr := vars["id"]

		id, err := strconv.Atoi(idStr)
		if err != nil || id <= 0 {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid user ID"})
			return
		}

		// Execute the update statement
		result, err := db.Exec(
			"UPDATE users SET name = $1, email = $2 WHERE id = $3",
			u.Name, u.Email, id,
		)
		if err != nil {
			log.Printf("Error updating user: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Error updating user"})
			return
		}

		// Check if any row was actually updated
		rowsAffected, err := result.RowsAffected()
		if err != nil {
			log.Printf("Error checking rows affected: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Error updating user"})
			return
		}
		if rowsAffected == 0 {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "User not found"})
			return
		}

		// If everything is OK, return the updated user payload
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(u)
	}
}

// deleteUser removes a user by ID from the database
func deleteUser(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		idStr := vars["id"]

		id, err := strconv.Atoi(idStr)
		if err != nil || id <= 0 {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid user ID"})
			return
		}

		// First, check if the user exists
		var u User
		err = db.QueryRow("SELECT id, name, email FROM users WHERE id = $1", id).
			Scan(&u.ID, &u.Name, &u.Email)

		if err != nil {
			if err == sql.ErrNoRows {
				// User not found
				w.WriteHeader(http.StatusNotFound)
				json.NewEncoder(w).Encode(map[string]string{"error": "User not found"})
				return
			}
			// Some other database error
			log.Printf("Error querying user before delete: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Internal server error"})
			return
		}

		// User exists, proceed with delete
		_, err = db.Exec("DELETE FROM users WHERE id = $1", id)
		if err != nil {
			log.Printf("Error deleting user: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Error deleting user"})
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "User deleted successfully"})
	}
}
