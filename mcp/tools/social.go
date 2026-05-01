package tools

import (
	"context"
)

// SocialTool handles crowdfunding and social payment operations
type SocialTool struct {
	apiClient APIClient
}

// NewSocialTool creates a new social tool instance
func NewSocialTool(client APIClient) *SocialTool {
	return &SocialTool{apiClient: client}
}

// CreateGoal creates a new crowdfunding goal
func (t *SocialTool) CreateGoal(ctx context.Context, args map[string]interface{}) (interface{}, error) {
	return t.apiClient.Call(ctx, "POST", "/api/social/goals", args)
}

// GetGoal retrieves details of a crowdfunding goal by share link
func (t *SocialTool) GetGoal(ctx context.Context, shareLink string) (interface{}, error) {
	endpoint := "/api/social/goals/link?link=" + shareLink
	return t.apiClient.Call(ctx, "GET", endpoint, nil)
}

// ContributeToGoal contributes money to a crowdfunding goal
func (t *SocialTool) ContributeToGoal(ctx context.Context, args map[string]interface{}) (interface{}, error) {
	return t.apiClient.Call(ctx, "POST", "/api/social/goals/contribute", args)
}

// ListGoals lists all crowdfunding goals for the authenticated account
func (t *SocialTool) ListGoals(ctx context.Context) (interface{}, error) {
	return t.apiClient.Call(ctx, "GET", "/api/social/goals", nil)
}