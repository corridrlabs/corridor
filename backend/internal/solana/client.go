package solana

import (
	"fmt"

	"github.com/gagliardetto/solana-go"
	"github.com/gagliardetto/solana-go/rpc"
	"github.com/corridrlabs/corridor/backend/pkg/config"
)

type Client struct {
	cfg    *config.SolanaConfig
	rpc    *rpc.Client
	master solana.PublicKey
}

func NewClient(cfg *config.SolanaConfig) (*Client, error) {
	masterKey, err := solana.PublicKeyFromBase58(cfg.MasterWallet)
	if err != nil {
		return nil, fmt.Errorf("invalid master wallet address: %w", err)
	}

	return &Client{
		cfg:    cfg,
		rpc:    rpc.New(cfg.RPCURL),
		master: masterKey,
	}, nil
}
