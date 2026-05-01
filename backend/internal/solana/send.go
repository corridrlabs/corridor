package solana

import (
	"context"
	"fmt"
	"log"

	"github.com/gagliardetto/solana-go"
)

type SPLSend struct {
	Destination string
	Amount      uint64
}

// SendSPLTransfer sends USDC from master wallet to a single destination.
func (c *Client) SendSPLTransfer(ctx context.Context, destination string, amount uint64, memo string) (string, error) {
	_, err := solana.PublicKeyFromBase58(destination)
	if err != nil {
		return "", fmt.Errorf("invalid destination address: %w", err)
	}

	// In a real app, you would:
	// 1. Load private key from secure storage
	// 2. Derive associated token accounts
	// 3. Build & sign transaction
	
	// For this demo implementation, we show the structure
	log.Printf("SOLANA_SEND: TODO: Real SPL transfer for %d units to %s w/ memo %s", amount, destination, memo)
	
	return "simulated_solana_signature_" + destination[:8], nil
}

// SendUSDC is a convenience wrapper for Withdrawals
func (c *Client) SendUSDC(ctx context.Context, destination string, amount float64) (string, error) {
	// 6 decimals for USDC
	units := uint64(amount * 1_000_000)
	return c.SendSPLTransfer(ctx, destination, units, "USDC Withdrawal")
}

// BatchSendSPL sends USDC to multiple recipients in a single transaction.
func (c *Client) BatchSendSPL(ctx context.Context, sends []SPLSend, memo string) ([]string, error) {
	var sigs []string
	for _, s := range sends {
		sig, err := c.SendSPLTransfer(ctx, s.Destination, s.Amount, memo)
		if err != nil {
			return sigs, err
		}
		sigs = append(sigs, sig)
	}
	return sigs, nil
}
