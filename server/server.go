package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

type Payload struct {
	HTML string `json:"html"`
}

func collectHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST suppored", http.StatusMethodNotAllowed)
		return
	}

	var payload Payload
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		http.Error(w, "Error in JSON", http.StatusBadRequest)
		return
	}

	fmt.Println("Got HTML:", payload.HTML) // output
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func main() {
	http.HandleFunc("/collect", collectHandler)

	fmt.Println("Server is working on port 8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
