package core

import (
	"context"
	"log"
	"time"

	"github.com/google/uuid"
)

// StartRenewalWorker begins a background process to handle subscription renewals.
func (s *Service) StartRenewalWorker(ctx context.Context) {
	log.Println("Starting Corridor Subscription Renewal Worker (Production)...")
	
	ticker := time.NewTicker(4 * time.Hour) // Check every 4 hours
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.processRenewals(ctx)
		}
	}
}

func (s *Service) processRenewals(ctx context.Context) {
	// Atomic check: Ensure only one worker processes at a time (if Distributed)
	// Using Redis lock for production safety (skip if Redis not available)
	lockKey := "renewal_worker_lock"
	if s.redis != nil {
		ok, err := s.redis.SetNX(ctx, lockKey, "locked", 1*time.Hour).Result()
		if err != nil || !ok {
			return // Already running or error
		}
		defer s.redis.Del(ctx, lockKey)
	}
	// 1. Find subscriptions ending in the next 24h
	rows, err := s.db.Pool.Query(ctx, `
		SELECT account_id, plan_id 
		FROM subscriptions 
		WHERE status = 'active' 
		AND current_period_end <= NOW() + INTERVAL '1 day'
	`)
	if err != nil {
		log.Printf("RenewalWorker: Failed to query subscriptions: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var accountID uuid.UUID
		var planID uuid.UUID
		if err := rows.Scan(&accountID, &planID); err != nil {
			continue
		}

		// 2. Resolve plan name
		var planName string
		err := s.db.Pool.QueryRow(ctx, "SELECT name FROM plans WHERE id = $1", planID).Scan(&planName)
		if err != nil {
			continue
		}

		log.Printf("RenewalWorker: Attempting renewal for Account %s (Plan: %s)", accountID, planName)
		
		// 3. Attempt renewal (SubscribeAccount handles debit/fallback)
		if err := s.SubscribeAccount(ctx, accountID, planName); err != nil {
			log.Printf("RenewalWorker: Renewal failed for %s: %v", accountID, err)
			// Todo: Handle dunning/expiry logic here
		}
	}

	ewaRows, err := s.db.Pool.Query(ctx, `
		SELECT DISTINCT account_id
		FROM ewa_settings
		WHERE is_enabled = true
	`)
	if err != nil {
		log.Printf("RenewalWorker: Failed to query EWA billing accounts: %v", err)
		return
	}
	defer ewaRows.Close()

	for ewaRows.Next() {
		var accountID uuid.UUID
		if err := ewaRows.Scan(&accountID); err != nil {
			continue
		}
		if err := s.BillEWAEmployerMonthly(ctx, accountID); err != nil {
			log.Printf("RenewalWorker: EWA monthly billing failed for %s: %v", accountID, err)
		}
	}
}
