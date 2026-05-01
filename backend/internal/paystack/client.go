package paystack

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type Client struct {
	apiKey  string
	baseURL string
	client  *http.Client
}

type InitializePaymentRequest struct {
	Email    string `json:"email"`
	Amount   int64  `json:"amount"` // in kobo
	Currency string `json:"currency"`
	Callback string `json:"callback_url"`
	Metadata map[string]interface{} `json:"metadata"`
	Plan     string                 `json:"plan,omitempty"`
}

type InitializePaymentResponse struct {
	Status bool `json:"status"`
	Data   struct {
		AuthorizationURL string `json:"authorization_url"`
		AccessCode       string `json:"access_code"`
		Reference        string `json:"reference"`
	} `json:"data"`
}

type TransferRequest struct {
	Source    string `json:"source"`
	Amount    int64  `json:"amount"`
	Recipient string `json:"recipient"`
	Reason    string `json:"reason"`
}

type WebhookEvent struct {
	Event string                 `json:"event"`
	Data  map[string]interface{} `json:"data"`
}

func NewClient(apiKey string) *Client {
	return &Client{
		apiKey:  apiKey,
		baseURL: "https://api.paystack.co",
		client:  &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *Client) InitializePayment(ctx context.Context, req InitializePaymentRequest) (*InitializePaymentResponse, error) {
	body, _ := json.Marshal(req)
	httpReq, _ := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/transaction/initialize", bytes.NewBuffer(body))
	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result InitializePaymentResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	if !result.Status {
		return nil, fmt.Errorf("paystack initialization failed")
	}

	return &result, nil
}

func (c *Client) InitiateTransfer(ctx context.Context, req TransferRequest) error {
	body, _ := json.Marshal(req)
	httpReq, _ := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/transfer", bytes.NewBuffer(body))
	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("transfer failed with status %d", resp.StatusCode)
	}

	return nil
}

func (c *Client) VerifyTransaction(ctx context.Context, reference string) (map[string]interface{}, error) {
	httpReq, _ := http.NewRequestWithContext(ctx, "GET", c.baseURL+"/transaction/verify/"+reference, nil)
	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	return result, nil
}

func (c *Client) InitializeSubscription(ctx context.Context, email string, planCode string) (*InitializePaymentResponse, error) {
	req := InitializePaymentRequest{
		Email:    email,
		Amount:   0, // Amount is determined by the plan in Paystack
		Plan:     planCode,
		Currency: "USD",
	}
	return c.InitializePayment(ctx, req)
}