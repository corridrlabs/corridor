// Corridor MCP Server - CLI entry point
// Usage: PAYDAY_API_KEY=your_key PAYDAY_API_URL=https://api.corridormoney.net ./corridor-mcp
package main

import (
	"log"
	"os"

	mcp "github.com/corridrlabs/corridor/mcp"
)

func main() {
	apiKey := os.Getenv("PAYDAY_API_KEY")
	if apiKey == "" {
		log.Fatal("PAYDAY_API_KEY environment variable is required")
	}

	apiURL := os.Getenv("PAYDAY_API_URL")
	if apiURL == "" {
		log.Fatal("PAYDAY_API_URL environment variable is required")
	}

	server := mcp.NewMCPServer(apiURL, apiKey)

	if err := server.Run(); err != nil {
		log.Fatalf("MCP server error: %v", err)
	}
}
