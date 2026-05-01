package circle

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
)

// Client is a lightweight client for the Circle API.
type Client struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
}

func (c *Client) GetBaseURL() string {
	return c.baseURL
}

// NewClient creates a new Circle API client.
func NewClient(apiKey, baseURL string) *Client {
	return &Client{
		apiKey:  apiKey,
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// ErrorResponse represents an error returned from the Circle API.
type ErrorResponse struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Errors  []struct {
		Attribute string `json:"attribute"`
		Message   string `json:"message"`
	} `json:"errors,omitempty"`
}

func (e ErrorResponse) Error() string {
	msg := fmt.Sprintf("Circle API Error %d: %s", e.Code, e.Message)
	for _, ve := range e.Errors {
		msg += fmt.Sprintf("\n - %s: %s", ve.Attribute, ve.Message)
	}
	return msg
}

// --- Payment Creation ---

type Amount struct {
	Amount   string `json:"amount"`
	Currency string `json:"currency"`
}

type Source struct {
	ID   string `json:"id"`
	Type string `json:"type"`
}

type Verification struct {
	AVS string `json:"avs"`
	CVV string `json:"cvv"`
}

// CreatePaymentRequest represents the request to create a payment.
type CreatePaymentRequest struct {
	IdempotencyKey string          `json:"idempotencyKey"`
	Amount         Amount          `json:"amount"`
	Source         Source          `json:"source"`
	Description    string          `json:"description"`
	Verification   *Verification   `json:"verification"`
	Metadata       PaymentMetadata `json:"metadata"`
}

type PaymentMetadata struct {
	Email       string `json:"email"`
	PhoneNumber string `json:"phoneNumber,omitempty"`
	IPAddress   string `json:"ipAddress"`
	SessionID   string `json:"sessionId"`
}

// CreatePaymentResponse represents the response from creating a payment.
type CreatePaymentResponse struct {
	Data Payment `json:"data"`
}

type Payment struct {
	ID          string    `json:"id"`
	Amount      Amount    `json:"amount"`
	Status      string    `json:"status"`
	Description string    `json:"description"`
	Source      Source    `json:"source"`
	CreateDate  time.Time `json:"createDate"`
	UpdateDate  time.Time `json:"updateDate"`
}

// CreatePayment creates a new payment intent with Circle.
func (c *Client) CreatePayment(ctx context.Context, req *CreatePaymentRequest) (*CreatePaymentResponse, error) {
	var resp CreatePaymentResponse
	err := c.sendRequest(ctx, http.MethodPost, "v1/payments", req, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// --- Encryption and Card Creation ---

type PublicKeyResponse struct {
	Data struct {
		KeyID     string `json:"keyId"`
		PublicKey string `json:"publicKey"`
	} `json:"data"`
}

// GetPublicKey fetches the encryption public key from Circle
func (c *Client) GetPublicKey(ctx context.Context) (*PublicKeyResponse, error) {
	var resp PublicKeyResponse
	err := c.sendRequest(ctx, http.MethodGet, "v1/encryption/public", nil, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

type BillingDetails struct {
	Name     string `json:"name"`
	City     string `json:"city"`
	Country  string `json:"country"`
	Line1    string `json:"line1"`
	Line2    string `json:"line2,omitempty"`
	District string `json:"district,omitempty"`
	Postal   string `json:"postalCode"`
}

type CreateCardRequest struct {
	IdempotencyKey string          `json:"idempotencyKey"`
	KeyID          string          `json:"keyId"`
	EncryptedData  string          `json:"encryptedData"`
	BillingDetails BillingDetails  `json:"billingDetails"`
	ExpMonth       int             `json:"expMonth"`
	ExpYear        int             `json:"expYear"`
	Metadata       PaymentMetadata `json:"metadata"`
}

type CreateCardResponse struct {
	Data struct {
		ID string `json:"id"`
	} `json:"data"`
}

// CreateCard creates a saved card in Circle using PGP encrypted data
func (c *Client) CreateCard(ctx context.Context, req *CreateCardRequest) (*CreateCardResponse, error) {
	var resp CreateCardResponse
	err := c.sendRequest(ctx, http.MethodPost, "v1/cards", req, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// idempotencyKey generates a new UUID for idempotency.
func idempotencyKey() string {
	return uuid.New().String()
}

// sendRequest is a helper function to send HTTP requests to the Circle API.
func (c *Client) sendRequest(ctx context.Context, method, endpoint string, body interface{}, response interface{}) error {
	var reqBody io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonBody)
	}

	url := fmt.Sprintf("%s/%s", c.baseURL, endpoint)
	req, err := http.NewRequestWithContext(ctx, method, url, reqBody)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// For debugging 422 errors
	if body != nil {
		jsonBody, _ := json.Marshal(body)
		log.Printf("DEBUG: Circle Request [%s %s]: %s", method, url, string(jsonBody))
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("X-Request-Id", idempotencyKey()) // For idempotency

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("DEBUG: Circle error response (status %d): %s", resp.StatusCode, string(bodyBytes))

		var errResp ErrorResponse
		if err := json.Unmarshal(bodyBytes, &errResp); err != nil {
			return fmt.Errorf("failed to decode error response (status %d): %s", resp.StatusCode, string(bodyBytes))
		}
		return errResp
	}

	if response != nil {
		if err := json.NewDecoder(resp.Body).Decode(response); err != nil {
			return fmt.Errorf("failed to decode successful response: %w", err)
		}
	}

	return nil
}
