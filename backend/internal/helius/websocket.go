package helius

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type Subscriber struct {
	wsURL   string
	apiKey  string
	onEvent func(signature string)
	mu      sync.Mutex
	conn    *websocket.Conn
}

func NewSubscriber(wsURL, apiKey string, onEvent func(string)) *Subscriber {
	return &Subscriber{
		wsURL:   wsURL,
		apiKey:  apiKey,
		onEvent: onEvent,
	}
}

type rpcRequest struct {
	JSONRPC string        `json:"jsonrpc"`
	ID      int           `json:"id"`
	Method  string        `json:"method"`
	Params  []interface{} `json:"params"`
}

type rpcNotification struct {
	Method string `json:"method"`
	Params struct {
		Result struct {
			Value struct {
				Signature string `json:"signature"`
				Err       any    `json:"err"`
			} `json:"value"`
		} `json:"result"`
	} `json:"params"`
}

func (s *Subscriber) Start(ctx context.Context, masterWallet string) {
	go s.run(ctx, masterWallet)
}

func (s *Subscriber) run(ctx context.Context, masterWallet string) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
			if err := s.connectAndListen(ctx, masterWallet); err != nil {
				log.Printf("WebSocket error, reconnecting in 5s: %v", err)
				time.Sleep(5 * time.Second)
			}
		}
	}
}

func (s *Subscriber) connectAndListen(ctx context.Context, masterWallet string) error {
	dialer := websocket.DefaultDialer
	wsURL := fmt.Sprintf("%s?api-key=%s", s.wsURL, s.apiKey)
	
	conn, _, err := dialer.DialContext(ctx, wsURL, nil)
	if err != nil {
		return fmt.Errorf("failed to dial: %w", err)
	}
	defer conn.Close()

	s.mu.Lock()
	s.conn = conn
	s.mu.Unlock()

	// Subscribe to logs for the master wallet
	subReq := rpcRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "logsSubscribe",
		Params: []interface{}{
			map[string]interface{}{"mentions": []string{masterWallet}},
			map[string]interface{}{"commitment": "confirmed"},
		},
	}

	if err := conn.WriteJSON(subReq); err != nil {
		return fmt.Errorf("failed to send subscribe request: %w", err)
	}

	log.Printf("Subscribed to Solana logs for %s via Helius WebSocket", masterWallet)

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			return fmt.Errorf("read error: %w", err)
		}

		var note rpcNotification
		if err := json.Unmarshal(message, &note); err != nil {
			continue // Not a notification we care about
		}

		if note.Method == "logsNotification" && note.Params.Result.Value.Signature != "" && note.Params.Result.Value.Err == nil {
			go s.onEvent(note.Params.Result.Value.Signature)
		}
	}
}
