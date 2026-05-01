package tools

import (
	"context"
)

// APIClient defines the interface for making API calls
type APIClient interface {
	Call(ctx context.Context, method, endpoint string, body interface{}) (map[string]interface{}, error)
}