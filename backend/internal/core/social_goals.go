package core

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/google/uuid"
)

// CreateSocialGoal initializes a new crowdfunding goal
func (s *Service) CreateSocialGoal(ctx context.Context, accountID uuid.UUID, title, description string, targetAmount float64, currency, productLink string, isPublic bool) (*SocialGoal, error) {
	title = strings.TrimSpace(title)
	currencyCode := NormalizeCurrencyCode(currency)
	if title == "" {
		return nil, fmt.Errorf("title is required")
	}
	if targetAmount <= 0 {
		return nil, fmt.Errorf("target amount must be greater than zero")
	}
	if currencyCode == "" {
		currencyCode = CurrencyUSDC
	}

	// Generate a shareable link from environment-configured public app URL.
	baseURL := strings.TrimRight(strings.TrimSpace(os.Getenv("PUBLIC_APP_URL")), "/")
	if baseURL == "" {
		baseURL = strings.TrimRight(strings.TrimSpace(os.Getenv("VITE_APP_URL")), "/")
	}
	
	goalSlug := uuid.New().String()[:8]
	shareLink := fmt.Sprintf("/goals/%s", goalSlug)
	if baseURL != "" {
		shareLink = fmt.Sprintf("%s/goals/%s", baseURL, goalSlug)
	}

	var goal SocialGoal
	err := s.db.Pool.QueryRow(ctx, `
		INSERT INTO social_goals (account_id, title, description, target_amount, currency, product_link, share_link, is_public)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, account_id, title, description, target_amount, current_amount, currency, product_link, share_link, status, is_public, created_at, updated_at
	`, accountID, title, description, targetAmount, string(currencyCode), productLink, shareLink, isPublic).Scan(
		&goal.ID, &goal.AccountID, &goal.Title, &goal.Description, &goal.TargetAmount, &goal.CurrentAmount,
		&goal.Currency, &goal.ProductLink, &goal.ShareLink, &goal.Status, &goal.IsPublic, &goal.CreatedAt, &goal.UpdatedAt,
	)

	if err != nil {
		// Backward compatibility for environments where `is_public` column isn't migrated yet.
		if strings.Contains(err.Error(), "is_public") {
			err = s.db.Pool.QueryRow(ctx, `
				INSERT INTO social_goals (account_id, title, description, target_amount, currency, product_link, share_link)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
				RETURNING id, account_id, title, description, target_amount, current_amount, currency, product_link, share_link, status, created_at, updated_at
				`, accountID, title, description, targetAmount, string(currencyCode), productLink, shareLink).Scan(
				&goal.ID, &goal.AccountID, &goal.Title, &goal.Description, &goal.TargetAmount, &goal.CurrentAmount,
				&goal.Currency, &goal.ProductLink, &goal.ShareLink, &goal.Status, &goal.CreatedAt, &goal.UpdatedAt,
			)
			if err == nil {
				goal.IsPublic = true
				return &goal, nil
			}
		}
		return nil, fmt.Errorf("failed to create social goal: %w", err)
	}

	return &goal, nil
}

// ContributeToGoal records a payment towards a specific goal
func (s *Service) ContributeToGoal(ctx context.Context, goalID uuid.UUID, contributorName string, amount float64, currency string) (*GoalContribution, error) {
	currencyCode := string(NormalizeCurrencyCode(currency))
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// 1. Get Goal Owner Storage Wallet (Internal Ledger)
	var ownerAccountID uuid.UUID
	err = tx.QueryRow(ctx, "SELECT account_id FROM social_goals WHERE id = $1 FOR UPDATE", goalID).Scan(&ownerAccountID)
	if err != nil {
		return nil, fmt.Errorf("goal not found: %w", err)
	}

	// Find the owner's wallet for this currency
	var ownerWalletID uuid.UUID
	err = tx.QueryRow(ctx, "SELECT id FROM wallets WHERE account_id = $1 AND currency = $2", ownerAccountID, currencyCode).Scan(&ownerWalletID)
	if err != nil {
		return nil, fmt.Errorf("owner wallet not found for currency %s: %w", currencyCode, err)
	}

	platformFee := s.CalculateSocialContributionFee(amount)
	netAmount := amount - platformFee
	if netAmount < 0 {
		netAmount = 0
	}

	// 2. Create Internal Transaction (Mock anonymous sender for simplicity)
	// In a real app, if the contributor is logged in, use their wallet.
	// For "anyone with a link", we assume they pay via an external gateway which then credits the goal.

	// Record the transaction
	var txID uuid.UUID
	err = tx.QueryRow(ctx, `
		INSERT INTO transactions (recipient_wallet_id, amount, fee, total_amount, currency, status, message, context)
		VALUES ($1, $2, $3, $4, $5, 'COMPLETED', $6, $7)
		RETURNING id
	`, ownerWalletID, amount, platformFee, amount, currencyCode, fmt.Sprintf("Contribution to goal: %v", goalID), map[string]any{
		"goal_id":           goalID.String(),
		"platform_fee_rate": 0.01,
		"platform_fee":      platformFee,
		"net_amount":        netAmount,
	}).Scan(&txID)

	if err != nil {
		return nil, err
	}

	// 3. Update Goal Balance
	_, err = tx.Exec(ctx, `
		UPDATE social_goals 
		SET current_amount = current_amount + $1, updated_at = NOW()
		WHERE id = $2
	`, amount, goalID)
	if err != nil {
		return nil, err
	}

	// 4. Update Wallet Balance (Balanced Entry)
	// Note: In production, this should be accompanied by a debit from a System/Gateway wallet
	var balanceAfter float64
	err = tx.QueryRow(ctx, `
		UPDATE wallets SET balance = balance + $1 WHERE id = $2
		RETURNING balance
	`, netAmount, ownerWalletID).Scan(&balanceAfter)
	if err != nil {
		return nil, fmt.Errorf("failed to update and verify balance: %w", err)
	}

	// 4b. Record Ledger Entry for Audit Trail

	_, err = tx.Exec(ctx, `
		INSERT INTO ledger_entries (wallet_id, amount, balance_after, description)
		VALUES ($1, $2, $3, $4)
	`, ownerWalletID, netAmount, balanceAfter, fmt.Sprintf("Contribution to goal: %v (platform fee: %.2f)", goalID, platformFee))
	if err != nil {
		return nil, fmt.Errorf("failed to create ledger entry: %w", err)
	}

	// 5. Record Contribution
	var contribution GoalContribution
	err = tx.QueryRow(ctx, `
		INSERT INTO goal_contributions (goal_id, contributor_name, amount, currency, transaction_id)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, goal_id, contributor_name, amount, currency, transaction_id, created_at
	`, goalID, contributorName, amount, currencyCode, txID).Scan(
		&contribution.ID, &contribution.GoalID, &contribution.ContributorName,
		&contribution.Amount, &contribution.Currency, &contribution.TransactionID, &contribution.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	// 6. Distribute Revenue
	if platformFee > 0 {
		if err := s.DistributeRevenue(ctx, platformFee, currency); err != nil {
			// Log but don't fail the contribution
			fmt.Printf("failed to distribute revenue for goal contribution: %v\n", err)
		}
	}

	return &contribution, nil
}

// GetGoalsByAccount fetches all goals for a user
func (s *Service) GetGoalsByAccount(ctx context.Context, accountID uuid.UUID) ([]SocialGoal, error) {
	rows, err := s.db.Pool.Query(ctx, `
		SELECT id, account_id, title, description, target_amount, current_amount, currency, product_link, share_link, status, created_at, updated_at
		FROM social_goals
		WHERE account_id = $1
		ORDER BY created_at DESC
	`, accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var goals []SocialGoal
	for rows.Next() {
		var g SocialGoal
		err := rows.Scan(
			&g.ID, &g.AccountID, &g.Title, &g.Description, &g.TargetAmount, &g.CurrentAmount,
			&g.Currency, &g.ProductLink, &g.ShareLink, &g.Status, &g.CreatedAt, &g.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		goals = append(goals, g)
	}
	return goals, nil
}

// GetGoalByShareLink fetches a goal by its unique link
func (s *Service) GetGoalByShareLink(ctx context.Context, shareLink string) (*SocialGoal, error) {
	var goal SocialGoal
	err := s.db.Pool.QueryRow(ctx, `
		SELECT id, account_id, title, description, target_amount, current_amount, currency, product_link, share_link, status, created_at, updated_at
		FROM social_goals
		WHERE share_link = $1
	`, shareLink).Scan(
		&goal.ID, &goal.AccountID, &goal.Title, &goal.Description, &goal.TargetAmount, &goal.CurrentAmount,
		&goal.Currency, &goal.ProductLink, &goal.ShareLink, &goal.Status, &goal.CreatedAt, &goal.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}
	return &goal, nil
}

// GetGoalContributions fetches all contributions for a goal
func (s *Service) GetGoalContributions(ctx context.Context, goalID uuid.UUID) ([]GoalContribution, error) {
	rows, err := s.db.Pool.Query(ctx, `
		SELECT id, goal_id, contributor_name, amount, currency, created_at
		FROM goal_contributions
		WHERE goal_id = $1
		ORDER BY created_at DESC
	`, goalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var contributions []GoalContribution
	for rows.Next() {
		var c GoalContribution
		err := rows.Scan(&c.ID, &c.GoalID, &c.ContributorName, &c.Amount, &c.Currency, &c.CreatedAt)
		if err != nil {
			return nil, err
		}
		contributions = append(contributions, c)
	}
	return contributions, nil
}

// EjectGoalFunds (Withdrawal Protocol)
// This transfers funds from the goal's internal wallet to the owner's connected SOL wallet.
func (s *Service) EjectGoalFunds(ctx context.Context, accountID uuid.UUID, goalID uuid.UUID) (string, error) {
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(ctx)

	// 1. Verify Ownership and Get Goal Details
	var currentAmount float64
	var currency string
	err = tx.QueryRow(ctx, `
		SELECT current_amount, currency FROM social_goals 
		WHERE id = $1 AND account_id = $2 FOR UPDATE
	`, goalID, accountID).Scan(&currentAmount, &currency)
	if err != nil {
		return "", fmt.Errorf("goal not found or unauthorized: %w", err)
	}

	if currentAmount <= 0 {
		return "", fmt.Errorf("no funds to eject")
	}

	// 2. Get Owner's connected external wallet address
	var walletAddress string
	err = tx.QueryRow(ctx, "SELECT wallet_address FROM accounts WHERE id = $1", accountID).Scan(&walletAddress)
	if err != nil || walletAddress == "" {
		return "", fmt.Errorf("no connected wallet address found for withdrawal")
	}

	// 3. Find Internal Wallet
	var ownerWalletID uuid.UUID
	err = tx.QueryRow(ctx, "SELECT id FROM wallets WHERE account_id = $1 AND currency = $2", accountID, currency).Scan(&ownerWalletID)
	if err != nil {
		return "", fmt.Errorf("internal wallet not found")
	}

	// 4. Record Withdrawal Transaction
	var txID uuid.UUID
	err = tx.QueryRow(ctx, `
		INSERT INTO transactions (sender_wallet_id, amount, currency, status, message)
		VALUES ($1, $2, $3, 'COMPLETED', $4)
		RETURNING id
	`, ownerWalletID, currentAmount, currency, s.BrandedMessage(ctx, fmt.Sprintf("Ejection Protocol withdrawal for goal: %v to %s", goalID, walletAddress))).Scan(&txID)

	if err != nil {
		return "", err
	}

	// 5. Reset Goal Balance
	_, err = tx.Exec(ctx, `UPDATE social_goals SET current_amount = 0, status = 'COMPLETED', updated_at = NOW() WHERE id = $1`, goalID)
	if err != nil {
		return "", err
	}

	// 6. Deduct from internal wallet balance
	var balanceAfterEject float64
	err = tx.QueryRow(ctx, `
		UPDATE wallets SET balance = balance - $1 WHERE id = $2
		RETURNING balance
	`, currentAmount, ownerWalletID).Scan(&balanceAfterEject)
	if err != nil {
		return "", fmt.Errorf("failed to update and verify balance after ejection: %w", err)
	}

	// 6b. Record Ledger Entry for Audit Trail

	_, err = tx.Exec(ctx, `
		INSERT INTO ledger_entries (wallet_id, amount, balance_after, description)
		VALUES ($1, $2, $3, $4)
	`, ownerWalletID, -currentAmount, balanceAfterEject, fmt.Sprintf("Ejection from goal: %v", goalID))
	if err != nil {
		return "", fmt.Errorf("failed to create ledger entry: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return "", err
	}

	return fmt.Sprintf("Successfully ejected %v %s to external wallet %s", currentAmount, currency, walletAddress), nil
}
func (s *Service) GetPublicGoals(ctx context.Context, publicOnly bool) ([]SocialGoal, error) {
	query := `SELECT id, account_id, title, description, target_amount, current_amount, currency, product_link, share_link, status, is_public, created_at, updated_at
			  FROM social_goals`
	if publicOnly {
		query += " WHERE is_public = true"
	}
	query += " ORDER BY created_at DESC"

	rows, err := s.db.Pool.Query(ctx, query)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "column \"is_public\" does not exist") {
			legacyQuery := `SELECT id, account_id, title, description, target_amount, current_amount, currency, product_link, share_link, status, created_at, updated_at
					  FROM social_goals`
			if publicOnly {
				legacyQuery += " WHERE TRUE"
			}
			legacyQuery += " ORDER BY created_at DESC"
			rows, err = s.db.Pool.Query(ctx, legacyQuery)
			if err != nil {
				return nil, err
			}
			defer rows.Close()

			var goals []SocialGoal
			for rows.Next() {
				var g SocialGoal
				err := rows.Scan(
					&g.ID, &g.AccountID, &g.Title, &g.Description, &g.TargetAmount, &g.CurrentAmount,
					&g.Currency, &g.ProductLink, &g.ShareLink, &g.Status, &g.CreatedAt, &g.UpdatedAt,
				)
				if err != nil {
					return nil, err
				}
				g.IsPublic = true
				goals = append(goals, g)
			}
			return goals, nil
		}
		return nil, err
	}
	defer rows.Close()

	var goals []SocialGoal
	for rows.Next() {
		var g SocialGoal
		err := rows.Scan(
			&g.ID, &g.AccountID, &g.Title, &g.Description, &g.TargetAmount, &g.CurrentAmount,
			&g.Currency, &g.ProductLink, &g.ShareLink, &g.Status, &g.IsPublic, &g.CreatedAt, &g.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		goals = append(goals, g)
	}
	return goals, nil
}

func (s *Service) GetGoalByID(ctx context.Context, id uuid.UUID) (*SocialGoal, error) {
	var goal SocialGoal
	err := s.db.Pool.QueryRow(ctx, `
		SELECT id, account_id, title, description, target_amount, current_amount, currency, product_link, share_link, status, is_public, created_at, updated_at
		FROM social_goals
		WHERE id = $1
	`, id).Scan(
		&goal.ID, &goal.AccountID, &goal.Title, &goal.Description, &goal.TargetAmount, &goal.CurrentAmount,
		&goal.Currency, &goal.ProductLink, &goal.ShareLink, &goal.Status, &goal.IsPublic, &goal.CreatedAt, &goal.UpdatedAt,
	)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "column \"is_public\" does not exist") {
			err = s.db.Pool.QueryRow(ctx, `
				SELECT id, account_id, title, description, target_amount, current_amount, currency, product_link, share_link, status, created_at, updated_at
				FROM social_goals
				WHERE id = $1
			`, id).Scan(
				&goal.ID, &goal.AccountID, &goal.Title, &goal.Description, &goal.TargetAmount, &goal.CurrentAmount,
				&goal.Currency, &goal.ProductLink, &goal.ShareLink, &goal.Status, &goal.CreatedAt, &goal.UpdatedAt,
			)
			if err != nil {
				return nil, err
			}
			goal.IsPublic = true
			return &goal, nil
		}
		return nil, err
	}
	return &goal, nil
}

func (s *Service) TriggerGoalWebhook(goalID uuid.UUID, eventType string, data interface{}) {
	// Placeholder for real-time update logic (e.g. NATS, WebSocket, etc)
}
