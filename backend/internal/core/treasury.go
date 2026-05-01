package core

import (
	"context"
	"fmt"

	"github.com/google/uuid"
)

// GetTreasuryConfig returns the treasury settings for an account
func (s *Service) GetTreasuryConfig(ctx context.Context, accountID uuid.UUID) ([]TreasuryConfig, error) {
	rows, err := s.db.Pool.Query(ctx, `
		SELECT id, source_wallet_id, target_wallet_id, sweep_threshold, keep_buffer, is_active
		FROM treasury_configs WHERE account_id = $1
	`, accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []TreasuryConfig
	for rows.Next() {
		var c TreasuryConfig
		c.AccountID = accountID
		if err := rows.Scan(&c.ID, &c.SourceWalletID, &c.TargetWalletID, &c.SweepThreshold, &c.KeepBuffer, &c.IsActive); err != nil {
			return nil, err
		}
		configs = append(configs, c)
	}
	return configs, nil
}

// UpdateTreasuryConfig creates or updates treasury settings
func (s *Service) UpdateTreasuryConfig(ctx context.Context, accountID uuid.UUID, config TreasuryConfig) (*TreasuryConfig, error) {
	var id uuid.UUID
	err := s.db.Pool.QueryRow(ctx, `
		INSERT INTO treasury_configs (account_id, source_wallet_id, target_wallet_id, sweep_threshold, keep_buffer, is_active)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (account_id, source_wallet_id) DO UPDATE SET
			target_wallet_id = EXCLUDED.target_wallet_id,
			sweep_threshold = EXCLUDED.sweep_threshold,
			keep_buffer = EXCLUDED.keep_buffer,
			is_active = EXCLUDED.is_active
		RETURNING id
	`, accountID, config.SourceWalletID, config.TargetWalletID, config.SweepThreshold, config.KeepBuffer, config.IsActive).Scan(&id)

	if err != nil {
		return nil, fmt.Errorf("failed to update treasury config: %w", err)
	}

	config.ID = id
	config.AccountID = accountID
	return &config, nil
}

// RunRevenueSweep executes the sweep logic based on configuration
func (s *Service) RunRevenueSweep(ctx context.Context, accountID uuid.UUID) (int, error) {
	configs, err := s.GetTreasuryConfig(ctx, accountID)
	if err != nil {
		return 0, err
	}

	sweepsCount := 0
	for _, config := range configs {
		if !config.IsActive {
			continue
		}

		// Check Source Balance
		var balance float64
		err := s.db.Pool.QueryRow(ctx, `SELECT balance FROM wallets WHERE id = $1`, config.SourceWalletID).Scan(&balance)
		if err != nil {
			continue
		}

		if balance > config.SweepThreshold {
			sweepAmount := balance - config.KeepBuffer
			if sweepAmount <= 0 {
				continue
			}

			// Execute Internal Transfer
			_, err = s.InternalTransfer(ctx, config.SourceWalletID, config.TargetWalletID, sweepAmount, "Automated Treasury Revenue Sweep")
			if err == nil {
				sweepsCount++
			}
		}
	}

	return sweepsCount, nil
}

// GetLiquidityStats returns high-level liquidity metrics for the dashboard
type LiquidityStats struct {
	TotalUSDC      float64 `json:"total_usdc"`
	TotalKES       float64 `json:"total_kes"`
	ActiveSweeps   int     `json:"active_sweeps"`
	ActiveWorkflows int     `json:"active_workflows"`
}

func (s *Service) GetLiquidityStats(ctx context.Context, accountID uuid.UUID) (*LiquidityStats, error) {
	stats := &LiquidityStats{}

	// 1. Sum USDC Balance
	err := s.db.Pool.QueryRow(ctx, `
		SELECT COALESCE(SUM(balance), 0) FROM wallets 
		WHERE account_id = $1 AND currency = 'USDC'
	`, accountID).Scan(&stats.TotalUSDC)
	if err != nil {
		return nil, err
	}

	// 2. Sum KES Balance
	err = s.db.Pool.QueryRow(ctx, `
		SELECT COALESCE(SUM(balance), 0) FROM wallets 
		WHERE account_id = $1 AND currency = 'KES'
	`, accountID).Scan(&stats.TotalKES)
	if err != nil {
		return nil, err
	}

	// 3. Count Active Internal Sweeps (optional table in some environments)
	var hasTreasuryConfigs bool
	if err := s.db.Pool.QueryRow(ctx, `SELECT to_regclass('public.treasury_configs') IS NOT NULL`).Scan(&hasTreasuryConfigs); err == nil && hasTreasuryConfigs {
		_ = s.db.Pool.QueryRow(ctx, `
			SELECT COUNT(*) FROM treasury_configs 
			WHERE account_id = $1 AND is_active = true
		`, accountID).Scan(&stats.ActiveSweeps)
	}

	// 4. Count Running Workflows (optional table in some environments)
	var hasWorkflowExecutions bool
	if err := s.db.Pool.QueryRow(ctx, `SELECT to_regclass('public.workflow_executions') IS NOT NULL`).Scan(&hasWorkflowExecutions); err == nil && hasWorkflowExecutions {
		_ = s.db.Pool.QueryRow(ctx, `
			SELECT COUNT(*) FROM workflow_executions 
			WHERE trigger_account_id = $1 AND status = 'RUNNING'
		`, accountID).Scan(&stats.ActiveWorkflows)
	}

	return stats, nil
}
