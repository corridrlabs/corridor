package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"time"

	mcp "github.com/corridrlabs/corridor/mcp"
)

// MCPSSEServer wraps the MCP server with HTTP/SSE transport for remote access.
type MCPSSEServer struct {
	mcpServer *mcp.MCPServer
}

func main() {
	apiKey := os.Getenv("PAYDAY_API_KEY")
	if apiKey == "" {
		log.Fatal("PAYDAY_API_KEY environment variable is required")
	}

	apiURL := os.Getenv("PAYDAY_API_URL")
	if apiURL == "" {
		log.Fatal("PAYDAY_API_URL environment variable is required")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	server := mcp.NewMCPServer(apiURL, apiKey)
	sse := &MCPSSEServer{mcpServer: server}

	mux := http.NewServeMux()
	mux.HandleFunc("/", sse.handleHome)
	mux.HandleFunc("/mcp/sse", sse.handleSSE)
	mux.HandleFunc("/mcp/messages", sse.handleMessages)
	mux.HandleFunc("/health", sse.handleHealth)

	log.Printf("Corridor MCP HTTP server starting on port %s", port)
	log.Printf("API URL: %s", apiURL)
	log.Printf("Connect to http://localhost:%s/mcp/sse for SSE stream", port)
	if err := http.ListenAndServe(":"+port, withCORS(mux)); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func (s *MCPSSEServer) handleHome(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"name":        "Corridor MCP Server",
		"version":     "1.0.0",
		"description": "Model Context Protocol server for Corridor fintech platform",
		"endpoints":   "/mcp/sse (SSE stream), /mcp/messages (JSON-RPC messages), /health (health check)",
	})
}

func (s *MCPSSEServer) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"status":    "ok",
		"timestamp": time.Now().UTC(),
	})
}

func (s *MCPSSEServer) handleSSE(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	// Send initial endpoint ID
	endpointID := generateEndpointID()
	_, _ = fmt.Fprintf(w, "event: endpoint\ndata: /mcp/messages?session=%s\n\n", endpointID)
	flusher.Flush()

	// Keep connection alive
	for {
		select {
		case <-r.Context().Done():
			return
		case <-time.After(30 * time.Second):
			_, _ = fmt.Fprintf(w, ":heartbeat\n\n")
			flusher.Flush()
		}
	}
}

func (s *MCPSSEServer) handleMessages(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req mcp.JSONRPCRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	resp := s.mcpServer.ExecuteJSONRPC(&req)
	w.WriteHeader(http.StatusOK)
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	_ = enc.Encode(resp)
}

func generateEndpointID() string {
	b := make([]byte, 8)
	for i := range b {
		b[i] = "abcdefghijklmnopqrstuvwxyz0123456789"[rand.Intn(len("abcdefghijklmnopqrstuvwxyz0123456789"))]
	}
	return string(b)
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
