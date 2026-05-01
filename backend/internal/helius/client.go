package helius

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/corridrlabs/corridor/backend/pkg/config"
)

const (
	USDCMint      = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
	USDCDecimals  = 6
)

type Client struct {
	cfg        *config.HeliusConfig
	httpClient *http.Client
}

func NewClient(cfg *config.HeliusConfig) *Client {
	return &Client{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

type TokenTransfer struct {
	FromUserAccount string  `json:"fromUserAccount"`
	ToUserAccount   string  `json:"toUserAccount"`
	TokenAmount     float64 `json:"tokenAmount"`
	Mint            string  `json:"mint"`
}

type NativeTransfer struct {
	FromUserAccount string `json:"fromUserAccount"`
	ToUserAccount   string `json:"toUserAccount"`
	Amount          int64  `json:"amount"`
}

type AccountData struct {
	Account string `json:"account"`
	Data    string `json:"data"`
}

type EnrichedTransaction struct {
	Description     string           `json:"description"`
	Type            string           `json:"type"` // TRANSFER, SWAP, etc.
	Fee             int64            `json:"fee"`
	FeePayer        string           `json:"feePayer"`
	Signature       string           `json:"signature"`
	Slot            int64            `json:"slot"`
	Timestamp       int64            `json:"timestamp"`
	NativeTransfers []NativeTransfer `json:"nativeTransfers"`
	TokenTransfers  []TokenTransfer  `json:"tokenTransfers"`
	AccountData     []AccountData    `json:"accountData"`
	Source          string           `json:"source"`
}

type QueryOpts struct {
	Type      string `json:"type,omitempty"`
	Before    string `json:"before,omitempty"`
	Until     string `json:"until,omitempty"`
	Limit     int    `json:"limit,omitempty"`
}

func (c *Client) ParseTransactions(ctx context.Context, signatures []string) ([]EnrichedTransaction, error) {
	if len(signatures) == 0 {
		return nil, nil
	}

	url := fmt.Sprintf("%s/transactions/?api-key=%s", c.cfg.BaseURL, c.cfg.APIKey)
	
	reqBody := map[string]interface{}{
		"transactions": signatures,
	}
	
	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("helius api returned status %d: %s", resp.StatusCode, string(body))
	}

	var txs []EnrichedTransaction
	if err := json.NewDecoder(resp.Body).Decode(&txs); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return txs, nil
}

func (c *Client) GetAddressTransactions(ctx context.Context, address string, opts QueryOpts) ([]EnrichedTransaction, error) {
	url := fmt.Sprintf("%s/addresses/%s/transactions/?api-key=%s", c.cfg.BaseURL, address, c.cfg.APIKey)
	
	if opts.Type != "" {
		url += "&type=" + opts.Type
	}
	if opts.Before != "" {
		url += "&before=" + opts.Before
	}
	if opts.Until != "" {
		url += "&until=" + opts.Until
	}
	if opts.Limit > 0 {
		url += fmt.Sprintf("&limit=%d", opts.Limit)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("helius api returned status %d: %s", resp.StatusCode, string(body))
	}

	var txs []EnrichedTransaction
	if err := json.NewDecoder(resp.Body).Decode(&txs); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return txs, nil
}
