package core

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// GetEWASettings returns the EWA configuration for an account
func (s *Service) GetEWASettings(ctx context.Context, accountID uuid.UUID) (*EWASettings, error) {
	settings := &EWASettings{AccountID: accountID}
	err := s.db.Pool.QueryRow(ctx, `
		SELECT id, is_enabled, percentage_accessible, max_withdrawal_per_period, transaction_fee, cooldown_period_days
		FROM ewa_settings WHERE account_id = $1
	`, accountID).Scan(
		&settings.ID, &settings.IsEnabled, &settings.PercentageAccessible,
		&settings.MaxWithdrawalPerPeriod, &settings.TransactionFee, &settings.CooldownPeriodDays,
	)

	if err != nil {
		// If not found, return default settings (not enabled)
		return settings, nil
	}

	return settings, nil
}

// UpdateEWASettings creates or updates EWA configuration
func (s *Service) UpdateEWASettings(ctx context.Context, accountID uuid.UUID, settings EWASettings) (*EWASettings, error) {
	var id uuid.UUID
	err := s.db.Pool.QueryRow(ctx, `
		INSERT INTO ewa_settings (account_id, is_enabled, percentage_accessible, max_withdrawal_per_period, transaction_fee, cooldown_period_days)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (account_id) DO UPDATE SET
			is_enabled = EXCLUDED.is_enabled,
			percentage_accessible = EXCLUDED.percentage_accessible,
			max_withdrawal_per_period = EXCLUDED.max_withdrawal_per_period,
			transaction_fee = EXCLUDED.transaction_fee,
			cooldown_period_days = EXCLUDED.cooldown_period_days,
			updated_at = CURRENT_TIMESTAMP
		RETURNING id
	`, accountID, settings.IsEnabled, settings.PercentageAccessible, settings.MaxWithdrawalPerPeriod, settings.TransactionFee, settings.CooldownPeriodDays).Scan(&id)

	if err != nil {
		return nil, fmt.Errorf("failed to update EWA settings: %w", err)
	}

	settings.ID = id
	settings.AccountID = accountID
	return &settings, nil
}

// CreateEWAEmployee adds a new employee for EWA tracking
func (s *Service) CreateEWAEmployee(ctx context.Context, accountID uuid.UUID, emp EWAEmployee) (*EWAEmployee, error) {
	err := s.db.Pool.QueryRow(ctx, `
		INSERT INTO ewa_employees (account_id, external_employee_id, full_name, email, gross_salary, currency, pay_day_of_month)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`, accountID, emp.ExternalEmployeeID, emp.FullName, emp.Email, emp.GrossSalary, emp.Currency, emp.CorridorOfMonth).Scan(&emp.ID)

	if err != nil {
		return nil, fmt.Errorf("failed to create employee: %w", err)
	}

	emp.AccountID = accountID
	emp.IsActive = true
	return &emp, nil
}

// GetEWAEmployees returns all active employees for an account
func (s *Service) GetEWAEmployees(ctx context.Context, accountID uuid.UUID) ([]EWAEmployee, error) {
	rows, err := s.db.Pool.Query(ctx, `
		SELECT id, external_employee_id, full_name, email, gross_salary, currency, pay_day_of_month, is_active
		FROM ewa_employees WHERE account_id = $1 AND is_active = true
	`, accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var employees []EWAEmployee
	for rows.Next() {
		var e EWAEmployee
		e.AccountID = accountID
		if err := rows.Scan(&e.ID, &e.ExternalEmployeeID, &e.FullName, &e.Email, &e.GrossSalary, &e.Currency, &e.CorridorOfMonth, &e.IsActive); err != nil {
			return nil, err
		}
		employees = append(employees, e)
	}
	return employees, nil
}

// CalculateEWABalance calculates the pro-rated available balance for an employee
func (s *Service) CalculateEWABalance(ctx context.Context, accountID, employeeID uuid.UUID) (float64, error) {
	var emp EWAEmployee
	var settings EWASettings

	// 1. Fetch Employee and Settings (with ownership check)
	err := s.db.Pool.QueryRow(ctx, `
		SELECT e.gross_salary, s.percentage_accessible, s.is_enabled
		FROM ewa_employees e
		JOIN ewa_settings s ON e.account_id = s.account_id
		WHERE e.id = $1 AND e.account_id = $2
	`, employeeID, accountID).Scan(&emp.GrossSalary, &settings.PercentageAccessible, &settings.IsEnabled)

	if err != nil {
		return 0, fmt.Errorf("failed to fetch employee data: %w", err)
	}

	if !settings.IsEnabled {
		return 0, nil
	}

	// 2. Pro-rate based on current day of month
	now := time.Now()
	daysInMonth := time.Date(now.Year(), now.Month()+1, 0, 0, 0, 0, 0, time.UTC).Day()
	dayOfMonth := now.Day()

	earnedWages := (emp.GrossSalary / float64(daysInMonth)) * float64(dayOfMonth)
	availableBalance := earnedWages * settings.PercentageAccessible

	// 3. Subtract already withdrawn amount in this period
	var withdrawn float64
	err = s.db.Pool.QueryRow(ctx, `
		SELECT COALESCE(SUM(amount_requested), 0)
		FROM ewa_requests
		WHERE employee_id = $1 AND status IN ('approved', 'disbursed')
		AND created_at >= date_trunc('month', now())
	`, employeeID).Scan(&withdrawn)

	if err != nil {
		return 0, fmt.Errorf("failed to fetch withdrawal history: %w", err)
	}

	available := availableBalance - withdrawn
	if available < 0 {
		return 0, nil
	}

	return available, nil
}

// RequestEWA creates a new withdrawal request
func (s *Service) RequestEWA(ctx context.Context, accountID, employeeID uuid.UUID, amountRequested float64) (*EWARequest, error) {
	// 1. Verify Balance
	available, err := s.CalculateEWABalance(ctx, accountID, employeeID)
	if err != nil {
		return nil, err
	}

	if amountRequested > available {
		return nil, fmt.Errorf("requested amount exceeds available balance ($%.2f)", available)
	}

	// 2. Fetch Fee
	var fee float64
	var employeeCurrency string
	err = s.db.Pool.QueryRow(ctx, `
		SELECT s.transaction_fee, COALESCE(e.currency, 'KES')
		FROM ewa_employees e
		JOIN ewa_settings s ON e.account_id = s.account_id
		WHERE e.id = $1 AND e.account_id = $2
	`, employeeID, accountID).Scan(&fee, &employeeCurrency)
	if err != nil {
		return nil, err
	}
	fee = s.CalculateEWAWithdrawalFee(amountRequested, fee)
	feeCurrency := NormalizeCurrencyCode(employeeCurrency)
	if feeCurrency == CurrencyUSD || feeCurrency == CurrencyUSDC {
		feeCurrency = CurrencyUSDC
	} else if feeCurrency != CurrencyKES {
		convertedFee, err := s.ConvertCurrency(ctx, fee, string(CurrencyKES), string(feeCurrency))
		if err != nil {
			return nil, fmt.Errorf("failed to convert EWA fee currency: %w", err)
		}
		fee = roundMoney(convertedFee)
	}
	if amountRequested <= fee {
		return nil, fmt.Errorf("requested amount must be greater than the withdrawal fee of %.2f", fee)
	}

	if err := s.ChargeAccountForService(ctx, accountID, fee, string(feeCurrency), "EWA advance fee"); err != nil {
		return nil, fmt.Errorf("failed to charge EWA fee: %w", err)
	}
	if err := s.DistributeRevenue(ctx, fee, string(feeCurrency)); err != nil {
		return nil, fmt.Errorf("failed to record EWA fee revenue: %w", err)
	}

	// 3. Create Request
	req := &EWARequest{
		EmployeeID:      employeeID,
		AmountRequested: amountRequested,
		AmountDisbursed: amountRequested - fee,
		FeeCharged:      fee,
		Status:          "pending",
	}

	err = s.db.Pool.QueryRow(ctx, `
		INSERT INTO ewa_requests (employee_id, amount_requested, amount_disbursed, fee_charged, status)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`, req.EmployeeID, req.AmountRequested, req.AmountDisbursed, req.FeeCharged, req.Status).Scan(&req.ID, &req.CreatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create EWA request: %w", err)
	}

	return req, nil
}

func (s *Service) BillEWAEmployerMonthly(ctx context.Context, accountID uuid.UUID) error {
	var activeEmployees int
	if err := s.db.Pool.QueryRow(ctx, `
		SELECT COUNT(*)
		FROM ewa_employees
		WHERE account_id = $1 AND is_active = true
	`, accountID).Scan(&activeEmployees); err != nil {
		return err
	}
	if activeEmployees <= 0 {
		return nil
	}

	periodStart := time.Now().UTC().Truncate(24 * time.Hour)
	periodStart = time.Date(periodStart.Year(), periodStart.Month(), 1, 0, 0, 0, 0, time.UTC)
	periodEnd := periodStart.AddDate(0, 1, 0)

	var exists bool
	_ = s.db.Pool.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM ewa_billing_cycles
			WHERE account_id = $1 AND period_start = date_trunc('month', CURRENT_DATE)::date
		)
	`, accountID).Scan(&exists)
	if exists {
		return nil
	}

	fee := roundMoney(float64(activeEmployees) * 2.0)
	if err := s.ChargeAccountForService(ctx, accountID, fee, string(CurrencyUSD), fmt.Sprintf("EWA monthly SaaS (%d employees)", activeEmployees)); err != nil {
		return err
	}
	if err := s.DistributeRevenue(ctx, fee, string(CurrencyUSDC)); err != nil {
		return err
	}

	_, err := s.db.Pool.Exec(ctx, `
		INSERT INTO ewa_billing_cycles (account_id, period_start, period_end, employee_count, fee_amount, currency, status, charged_at)
		VALUES ($1, date_trunc('month', CURRENT_DATE)::date, $2, $3, $4, $5, 'CHARGED', NOW())
		ON CONFLICT (account_id, period_start) DO UPDATE SET
			period_end = EXCLUDED.period_end,
			employee_count = EXCLUDED.employee_count,
			fee_amount = EXCLUDED.fee_amount,
			currency = EXCLUDED.currency,
			status = EXCLUDED.status,
			charged_at = EXCLUDED.charged_at
	`, accountID, periodEnd, activeEmployees, fee, string(CurrencyUSD))
	return err
}

// GetEWARequests returns all EWA requests for an account
func (s *Service) GetEWARequests(ctx context.Context, accountID uuid.UUID) ([]EWARequest, error) {
	rows, err := s.db.Pool.Query(ctx, `
		SELECT r.id, r.employee_id, r.amount_requested, r.amount_disbursed, r.fee_charged, r.status, r.created_at
		FROM ewa_requests r
		JOIN ewa_employees e ON r.employee_id = e.id
		WHERE e.account_id = $1
		ORDER BY r.created_at DESC
	`, accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []EWARequest
	for rows.Next() {
		var r EWARequest
		if err := rows.Scan(&r.ID, &r.EmployeeID, &r.AmountRequested, &r.AmountDisbursed, &r.FeeCharged, &r.Status, &r.CreatedAt); err != nil {
			return nil, err
		}
		requests = append(requests, r)
	}
	// Return empty slice instead of nil for JSON
	if requests == nil {
		requests = []EWARequest{}
	}
	return requests, nil
}
