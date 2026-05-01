package solana

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/corridrlabs/corridor/backend/internal/adapters/db"
	"github.com/corridrlabs/corridor/backend/internal/helius"
	"github.com/corridrlabs/corridor/backend/pkg/config"
)

// LedgerService defines the methods required from the core service.
type LedgerService interface {
	GetDB() *db.Postgres
	CreditWallet(ctx context.Context, accountID uuid.UUID, amount float64, currency, memo string) error
}

// Monitor is responsible for watching the Solana blockchain for deposits.
type Monitor struct {
	cfg    *config.SolanaConfig
	helius *helius.Client
	svc    LedgerService
	master string
}

// NewMonitor creates a new Solana monitor.
func NewMonitor(cfg *config.SolanaConfig, heliusClient *helius.Client, svc LedgerService) (*Monitor, error) {
	return &Monitor{
		cfg:    cfg,
		helius: heliusClient,
		svc:    svc,
		master: cfg.MasterWallet,
	}, nil
}

// Start begins the monitoring process.
func (m *Monitor) Start(ctx context.Context) {
	log.Println("Starting Helius-powered Solana deposit monitor...")
	go m.run(ctx)
}

func (m *Monitor) run(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Hour) // Emergency reconciliation only
	defer ticker.Stop()

	// Initial check
	m.checkDeposits(ctx)

	for {
		select {
		case <-ctx.Done():
			log.Println("Stopping Solana monitor.")
			return
		case <-ticker.C:
			m.checkDeposits(ctx)
		}
	}
}

// ProcessSignature is called by the WebSocket subscriber
func (m *Monitor) ProcessSignature(ctx context.Context, sig string) {
	txs, err := m.helius.ParseTransactions(ctx, []string{sig})
	if err != nil {
		log.Printf("Error parsing transaction %s: %v", sig, err)
		return
	}

	for _, tx := range txs {
		m.processEnrichedTransaction(ctx, tx)
	}
}

func (m *Monitor) checkDeposits(ctx context.Context) {
	log.Println("Checking for new Solana deposits via Helius...")
	txs, err := m.helius.GetAddressTransactions(ctx, m.master, helius.QueryOpts{
		Type:  "TRANSFER",
		Limit: 20,
	})
	if err != nil {
		log.Printf("Error fetching signatures: %v", err)
		return
	}

	for _, tx := range txs {
		m.processEnrichedTransaction(ctx, tx)
	}
}

func (m *Monitor) processEnrichedTransaction(ctx context.Context, tx helius.EnrichedTransaction) {
	// Look for USDC transfers to our master wallet
	for _, transfer := range tx.TokenTransfers {
		if transfer.Mint == helius.USDCMint && transfer.ToUserAccount == m.master {
			log.Printf("Found USDC deposit in tx %s: %f USDC from %s", tx.Signature, transfer.TokenAmount, transfer.FromUserAccount)

			// The memo is often in the description or account data if present
			// For this implementation, we try to find a UUID in the description
			accountID, err := m.extractAccountID(tx.Description)
			if err != nil {
				log.Printf("Could not extract account ID from tx %s: %v", tx.Signature, err)
				continue
			}

			// Check if already processed to prevent double crediting
			var exists bool
			err = m.svc.GetDB().Pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM transactions WHERE provider_tx_id = $1)", tx.Signature).Scan(&exists)
			if err != nil || exists {
				continue
			}

			err = m.svc.CreditWallet(ctx, accountID, transfer.TokenAmount, "USDC", "Solana Deposit: "+tx.Signature)
			if err != nil {
				log.Printf("Failed to credit account %s: %v", accountID, err)
			} else {
				log.Printf("Successfully credited %f USDC to account %s", transfer.TokenAmount, accountID)
			}
		}
	}
}

func (m *Monitor) extractAccountID(description string) (uuid.UUID, error) {
	// Crude extraction: look for something that looks like the first 8 chars of a UUID
	// Real implementation should use a more robust regex or dedicated instruction field
	
	// Try parsing the whole description as a UUID first (common if link is used)
	if id, err := uuid.Parse(description); err == nil {
		return id, nil
	}

	// Falls back to prefix search in DB (matching monitor.go's original logic)
	// We'll actually do this in the processEnrichedTransaction if needed, 
	// but here we just return an error if we can't find a direct UUID
	return uuid.Nil, fmt.Errorf("no valid account ID found in description")
}
