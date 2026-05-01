package main

import (
	"context"
	"encoding/json"
	"github.com/google/uuid"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/corridrlabs/corridor/backend/internal/adapters/db"
	"github.com/corridrlabs/corridor/backend/internal/circle"
	"github.com/corridrlabs/corridor/backend/internal/core"
	"github.com/corridrlabs/corridor/backend/internal/email"
	"github.com/corridrlabs/corridor/backend/internal/helius"
	"github.com/corridrlabs/corridor/backend/internal/middleware"
	"github.com/corridrlabs/corridor/backend/internal/notifications"
	"github.com/corridrlabs/corridor/backend/internal/solana"
	"github.com/corridrlabs/corridor/backend/pkg/config"
	"github.com/go-redis/redis/v8"
	"github.com/stripe/stripe-go/v74"
)

type Handler struct {
	svc    *core.Service
	circle *circle.Client
	config *config.Config
}

func handleMethod(getHandler, postHandler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			getHandler(w, r)
		case http.MethodPost:
			if postHandler != nil {
				postHandler(w, r)
			} else {
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}
}

func main() {
	cfg := config.MustLoad()
	stripe.Key = cfg.Stripe.SecretKey

	database, err := db.NewPostgres(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	if err := core.EnsureAuthSchema(context.Background(), database); err != nil {
		log.Printf("WARNING: auth schema guard failed: %v", err)
	}

	// Initialize Redis (optional - can run without it)
	var redisClient *redis.Client
	redisURL := cfg.RedisURL
	if redisURL != "" && redisURL != "redis://localhost:6379/0" {
		redisOpt, err := redis.ParseURL(redisURL)
		if err != nil {
			log.Printf("WARNING: Failed to parse Redis URL: %v. Running without Redis cache.", err)
		} else {
			redisClient = redis.NewClient(redisOpt)
			defer redisClient.Close()
		}
	} else {
		log.Printf("Running without Redis cache (not configured)")
	}

	if len(os.Args) > 1 && os.Args[1] == "migrate" {
		log.Println("Running database migrations...")
		return
	}

	circleClient := circle.NewClient(cfg.Circle.APIKey, cfg.Circle.BaseURL)

	// Solana setup is now optional to ensure startup resilience
	var solClient *solana.Client
	var solanaMonitor *solana.Monitor
	if cfg.Solana.MasterWallet != "" {
		var err error
		solClient, err = solana.NewClient(&cfg.Solana)
		if err != nil {
			log.Printf("CRITICAL WARNING: Failed to create Solana client: %v. Crypto deposits will be disabled.", err)
		}
	} else {
		log.Println("WARNING: SOLANA_MASTER_WALLET not set. Crypto features will be restricted.")
	}

	// Initialize email service with AWS SES (Optional fallback)
	emailConfig := &email.Config{
		AccessKeyID:     cfg.SES.AccessKeyID,
		SecretAccessKey: cfg.SES.SecretAccessKey,
		Region:          cfg.SES.Region,
		From:            cfg.SES.From,
	}
	emailService, err := email.NewService(emailConfig)
	if err != nil {
		log.Printf("WARNING: Failed to create AWS SES email service: %v. Falling back to internal mailer.", err)
	}

	notifyService := notifications.NewService(emailService)

	// Helius & Circle Integration
	heliusClient := helius.NewClient(&cfg.Helius)

	service := core.NewService(database, redisClient, circleClient, solClient, cfg.Solana, cfg.Mpesa, cfg.Intersend, cfg.OpenAI, emailService, notifyService, cfg.JWTSecret, cfg.WalletEncryptionKey, cfg.ExchangeRateURL, cfg.CoinGeckoURL)

	if solClient != nil {
		solanaMonitor, err = solana.NewMonitor(&cfg.Solana, heliusClient, service)
		if err != nil {
			log.Printf("CRITICAL WARNING: Failed to create Solana monitor: %v", err)
		} else {
			// Start WebSocket subscriber for real-time deposits
			wsub := helius.NewSubscriber(cfg.Solana.WSURL, cfg.Helius.APIKey, func(sig string) {
				solanaMonitor.ProcessSignature(context.Background(), sig)
			})
			wsub.Start(context.Background(), cfg.Solana.MasterWallet)
		}
	}

	h := &Handler{
		svc:    service,
		circle: circleClient,
		config: cfg,
	}

	router := http.NewServeMux()
	router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		status := "ok"
		checks := map[string]string{"database": "unknown"}
		if err := database.Pool.Ping(ctx); err != nil {
			status = "degraded"
			checks["database"] = "down"
		} else {
			checks["database"] = "up"
		}
		if redisClient != nil {
			if err := redisClient.Ping(ctx).Err(); err != nil {
				status = "degraded"
				checks["redis"] = "down"
			} else {
				checks["redis"] = "up"
			}
		}

		writeJSON(w, http.StatusOK, map[string]any{
			"status":  status,
			"checks":  checks,
			"service": "corridor-api",
		})
	})

	// Auth & Generic (rate limited: 10 req/min)
	router.HandleFunc("/api/auth/register", middleware.AuthLimiter.RateLimitHandler(h.registerUser))
	router.HandleFunc("/api/auth/login", middleware.AuthLimiter.RateLimitHandler(h.login))
	router.HandleFunc("/api/auth/me", h.authMiddleware(h.getMe))
	router.HandleFunc("/api/auth/check", middleware.AuthLimiter.RateLimitHandler(h.checkUserExists))
	router.HandleFunc("/api/auth/verify/send", middleware.AuthLimiter.RateLimitHandler(h.sendVerificationCode))
	router.HandleFunc("/api/auth/verify/confirm", middleware.AuthLimiter.RateLimitHandler(h.verifyCode))
	router.HandleFunc("/api/auth/google", middleware.AuthLimiter.RateLimitHandler(h.googleLogin))
	router.HandleFunc("/api/currencies", h.getSupportedCurrencies)

	// Invoices (From handlers_v3.go)
	router.HandleFunc("/api/invoices", h.authMiddleware(handleMethod(h.getInvoices, h.createInvoice)))
	router.HandleFunc("/api/invoices/detail", h.authMiddleware(h.getInvoice))
	router.HandleFunc("/api/invoices/update", h.authMiddleware(h.updateInvoice))
	router.HandleFunc("/api/invoices/pay", h.authMiddleware(h.generatePaymentLink))
	router.HandleFunc("/api/invoices/send", h.authMiddleware(h.sendInvoice))
	router.HandleFunc("/api/invoices/remind", h.authMiddleware(h.sendInvoiceReminder))
	router.HandleFunc("/api/invoices/delete", h.authMiddleware(h.deleteInvoice))
	router.HandleFunc("/api/invoices/public", h.getPublicInvoice)

	// Customers
	router.HandleFunc("/api/customers", h.authMiddleware(handleMethod(h.getCustomers, h.createCustomer)))
	router.HandleFunc("/api/customers/detail", h.authMiddleware(h.getCustomer))

	// KYC
	router.HandleFunc("/api/kyc/submit", h.authMiddleware(h.submitKYC))
	router.HandleFunc("/api/kyc/list", h.authMiddleware(h.listKYCSubmissions))
	router.HandleFunc("/api/kyc/documents", h.authMiddleware(h.getKYCDocument))
	router.HandleFunc("/api/kyc/review", h.authMiddleware(h.reviewKYC))

	// API Keys
	router.HandleFunc("/api/api-keys", h.authMiddleware(h.requireFeature("api_access", handleMethod(h.listAPIKeys, h.createAPIKey))))
	router.HandleFunc("/api/api-keys/revoke", h.authMiddleware(h.requireFeature("api_access", h.revokeAPIKey)))
	// Backward-compatible account-scoped aliases
	router.HandleFunc("/api/account/api-keys", h.authMiddleware(h.requireFeature("api_access", handleMethod(h.listAPIKeys, h.createAPIKey))))
	router.HandleFunc("/api/account/api-keys/revoke", h.authMiddleware(h.requireFeature("api_access", h.revokeAPIKey)))

	// Webhooks
	router.HandleFunc("/api/webhooks", h.authMiddleware(h.requireFeature("webhooks", handleMethod(h.listWebhooks, h.createWebhook))))
	router.HandleFunc("/api/webhooks/delete", h.authMiddleware(h.requireFeature("webhooks", h.deleteWebhook)))
	// Backward-compatible account-scoped aliases
	router.HandleFunc("/api/account/webhooks", h.authMiddleware(h.requireFeature("webhooks", handleMethod(h.listWebhooks, h.createWebhook))))
	router.HandleFunc("/api/account/webhooks/delete", h.authMiddleware(h.requireFeature("webhooks", h.deleteWebhook)))

	// Social & Goals
	router.HandleFunc("/api/social/goals", h.authMiddleware(handleMethod(h.getSocialGoals, h.createSocialGoal)))
	router.HandleFunc("/api/social/goals/", h.authMiddleware(h.handleSocialGoalSubroutes))
	router.HandleFunc("/api/social/goals/link", h.getSocialGoalByLink)
	router.HandleFunc("/api/social/goals/contribute", h.contributeToGoal)
	router.HandleFunc("/api/social/goals/eject", h.authMiddleware(h.ejectGoalFunds))
	router.HandleFunc("/api/social/goals/contributions", h.getGoalContributions)
	router.HandleFunc("/api/social/feed", h.authMiddleware(h.getFeed))
	router.HandleFunc("/api/social/network", h.authMiddleware(h.getSocialNetwork))
	router.HandleFunc("/api/social/network/follow", h.authMiddleware(h.followSocialAccount))
	router.HandleFunc("/api/social/network/unfollow", h.authMiddleware(h.unfollowSocialAccount))
	router.HandleFunc("/api/social/group-payment", h.authMiddleware(h.createGroupPayment))
	router.HandleFunc("/api/social/pay", h.createSocialRequest)
	router.HandleFunc("/api/social/exchange-rate", h.getExchangeRate)

	// Funding & On-Ramp (rate limited: 100 req/min)
	router.HandleFunc("/api/funding-sources", h.authMiddleware(h.complianceMiddleware(middleware.PaymentLimiter.RateLimitHandler(handleMethod(h.getFundingSources, h.addFundingSource)))))
	router.HandleFunc("/api/fund-wallet", h.authMiddleware(h.complianceMiddleware(middleware.PaymentLimiter.RateLimitHandler(h.fundWallet))))
	router.HandleFunc("/api/onramp/circle", h.authMiddleware(h.complianceMiddleware(middleware.PaymentLimiter.RateLimitHandler(h.createCirclePayment))))
	router.HandleFunc("/api/onramp/solana", h.authMiddleware(h.complianceMiddleware(middleware.PaymentLimiter.RateLimitHandler(h.getSolanaDepositInfo))))

	// Payouts / Withdrawals (rate limited: 100 req/min)
	router.HandleFunc("/api/payouts", h.authMiddleware(h.complianceMiddleware(h.requireFeature("payouts", middleware.PaymentLimiter.RateLimitHandler(handleMethod(h.getPayouts, h.requestPayout))))))

	// Payment Links
	router.HandleFunc("/api/payment-links", h.authMiddleware(h.complianceMiddleware(handleMethod(h.listPaymentLinks, h.createPaymentLink))))
	router.HandleFunc("/api/payment-links/update", h.authMiddleware(h.complianceMiddleware(h.updatePaymentLink)))
	router.HandleFunc("/api/payment-links/delete", h.authMiddleware(h.complianceMiddleware(h.deletePaymentLink)))
	router.HandleFunc("/api/payment-links/resolve", h.getPaymentLinkBySlug)
	router.HandleFunc("/api/payment-links/pay", h.handlePayPaymentLink)
	router.HandleFunc("/api/payment-links/status", h.handlePaymentLinkStatus)

	// Legacy Deposits (handlers_deposits.go)
	router.HandleFunc("/api/v1/deposits/card/key", h.handleGetCircleKey)
	router.HandleFunc("/api/v1/deposits/card/initialize", h.initializeCardDeposit)
	router.HandleFunc("/api/v1/webhooks/circle", h.handleCircleWebhook)
	router.HandleFunc("/api/v1/deposits/crypto/address", h.getCryptoDepositAddress)

	// Wallets & Onboarding
	router.HandleFunc("/api/wallets", h.authMiddleware(h.complianceMiddleware(handleMethod(h.getWallets, h.createWallet))))
	router.HandleFunc("/api/wallets/managed", h.authMiddleware(h.complianceMiddleware(h.createManagedWallet)))
	router.HandleFunc("/api/wallets/delete", h.authMiddleware(h.complianceMiddleware(h.deleteWallet)))
	router.HandleFunc("/api/onboarding/preferences", h.authMiddleware(h.saveOnboardingPreferences))
	router.HandleFunc("/api/onboarding/status", h.authMiddleware(h.getOnboardingStatus))
	router.HandleFunc("/api/onboarding/ai/recommendations", h.authMiddleware(h.getOnboardingAIRecommendations))
	router.HandleFunc("/api/wallet/address", h.authMiddleware(h.complianceMiddleware(h.updateWalletAddress)))

	// Settings
	router.HandleFunc("/api/accounts/settings", h.authMiddleware(handleMethod(h.getAccountSettings, h.updateAccountSettings)))
	router.HandleFunc("/api/account/feature-access", h.authMiddleware(h.getAccountFeatureAccess))

	// Compliance & Privacy (GDPR, Kenya DPA)
	router.HandleFunc("/api/compliance/dsar", h.authMiddleware(handleMethod(h.handleGetDSAR, h.handleCreateDSAR)))
	router.HandleFunc("/api/compliance/dsars", h.authMiddleware(h.handleListDSARs))
	router.HandleFunc("/api/compliance/export-my-data", h.authMiddleware(h.handleExportMyData))
	router.HandleFunc("/api/compliance/delete-my-data", h.authMiddleware(h.handleDeleteMyData))
	router.HandleFunc("/api/compliance/consents", h.authMiddleware(handleMethod(h.handleGetConsents, h.handleGrantConsent)))
	router.HandleFunc("/api/compliance/verify-kyc", h.authMiddleware(h.handleVerifyKYC))
	router.HandleFunc("/api/compliance/screen-sanctions", h.authMiddleware(h.handleScreenUserSanctions))
	router.HandleFunc("/api/compliance/retention-policies", h.authMiddleware(h.handleGetRetentionPolicies))
	router.HandleFunc("/api/v1/admin/compliance/pci-check", h.authMiddleware(h.AdminMiddleware(h.handleCheckPCICompliance)))
	router.HandleFunc("/api/v1/admin/compliance/retention-cleanup", h.authMiddleware(h.AdminMiddleware(h.handleRunRetentionCleanup)))

	router.HandleFunc("/api/notifications", h.authMiddleware(h.getNotifications))
	router.HandleFunc("/api/account/liquidity", h.authMiddleware(h.getLiquidityStats))
	router.HandleFunc("/api/treasury/sweep", h.authMiddleware(h.complianceMiddleware(h.requireFeature("treasury", middleware.PaymentLimiter.RateLimitHandler(h.runRevenueSweep)))))
	router.HandleFunc("/api/treasury/convert", h.authMiddleware(h.complianceMiddleware(middleware.PaymentLimiter.RateLimitHandler(h.convertTreasuryAssets))))
	// EWA
	router.HandleFunc("/api/account/ewa/settings", h.authMiddleware(h.requireFeature("ewa", handleMethod(h.getEWASettings, h.updateEWASettings))))
	router.HandleFunc("/api/account/ewa/requests", h.authMiddleware(h.complianceMiddleware(h.requireFeature("ewa", handleMethod(h.getEWARequests, h.requestEWA)))))

	// Split Payments
	router.HandleFunc("/api/split", h.authMiddleware(h.complianceMiddleware(h.handleSplitAction)))
	router.HandleFunc("/api/split/detail", h.authMiddleware(h.complianceMiddleware(h.handleSplitDetail)))
	router.HandleFunc("/api/split/pay", h.authMiddleware(h.complianceMiddleware(h.handlePaySplit)))

	// Chama (Group Savings)
	router.HandleFunc("/api/chamas", h.authMiddleware(h.complianceMiddleware(handleMethod(h.handleGetChamas, h.requireFeature("social_goals", h.handleCreateChama)))))
	router.HandleFunc("/api/chamas/join", h.authMiddleware(h.complianceMiddleware(h.handleJoinChama)))

	// EWA Employee (earnings, advance, history)
	router.HandleFunc("/api/employees/me/ewa/earnings", h.authMiddleware(h.handleEWAEmployeeEarnings))
	router.HandleFunc("/api/employees/me/ewa/advance", h.authMiddleware(h.handleEWARequestAdvance))
	router.HandleFunc("/api/employees/me/ewa/history", h.authMiddleware(h.handleEWAEmployeeHistory))
	router.HandleFunc("/api/employees/me/ewa/repayment", h.authMiddleware(h.handleEWARepaymentSchedule))
	router.HandleFunc("/api/employees/me/ewa/verify-bank", h.authMiddleware(h.handleEWAVerifyBank))

	// EWA Admin (employee upload, limits, dashboard)
	router.HandleFunc("/api/employees", h.authMiddleware(h.requireFeature("ewa", handleMethod(h.getEWAEmployees, h.createEWAEmployee))))
	router.HandleFunc("/api/employees/delete", h.authMiddleware(h.deleteEWAEmployee))
	router.HandleFunc("/api/employees/upload", h.authMiddleware(h.handleEWAEmployeeUpload))
	router.HandleFunc("/api/employees/ewa/limit", h.authMiddleware(h.handleEWASetAdvanceLimit))
	router.HandleFunc("/api/employees/ewa/history", h.authMiddleware(h.handleEWAAdvanceHistory))
	router.HandleFunc("/api/employees/ewa/export", h.authMiddleware(h.handleEWAExportReport))
	router.HandleFunc("/api/employees/ewa/dashboard", h.authMiddleware(h.handleEWADashboard))
	router.HandleFunc("/api/payroll/run", h.authMiddleware(h.runPayroll))

	// Organization / Staff
	router.HandleFunc("/api/organization", h.authMiddleware(h.getMyOrganization))
	router.HandleFunc("/api/organization/members", h.authMiddleware(h.handleOrgMembersAction))
	router.HandleFunc("/api/organization/members/remove", h.authMiddleware(h.removeOrgMember))

	// M-Pesa
	router.HandleFunc("/api/mpesa/callback", h.handleMpesaCallback)
	router.HandleFunc("/api/mpesa/stkpush", h.authMiddleware(h.complianceMiddleware(h.handleMpesaSTKPush)))
	router.HandleFunc("/api/mpesa/b2c", h.authMiddleware(h.complianceMiddleware(h.handleMpesaB2C)))

	// Contributions (Goals payment)
	router.HandleFunc("/api/contributions/pay", h.handleContributionPayment)
	router.HandleFunc("/api/contributions/webhook", h.handleStripeContributionWebhook)
	router.HandleFunc("/api/waitlist", h.handleCreateWaitlistEntry)
	router.HandleFunc("/api/waitlist/", h.handleCreateWaitlistEntry)

	// Billing (Corridor Internal)
	router.HandleFunc("/api/v1/billing/upgrade", h.authMiddleware(h.complianceMiddleware(h.handleUpgrade)))
	router.HandleFunc("/api/v1/billing/portal", h.authMiddleware(h.complianceMiddleware(h.handleCustomerPortal)))

	// Vouchers (Secure Out-ramp)
	router.HandleFunc("/api/v1/vouchers/create", h.authMiddleware(h.complianceMiddleware(h.handleCreateVoucher)))
	router.HandleFunc("/api/v1/vouchers/redeem", h.handleRedeemVoucher)

	// Revenue & Admin (Weekly Sweeps)
	router.HandleFunc("/api/v1/admin/overview", h.authMiddleware(h.AdminMiddleware(h.handleGetAdminOverview)))
	router.HandleFunc("/api/v1/admin/revenue/stats", h.authMiddleware(h.AdminMiddleware(h.handleGetAdminRevenueStats)))
	router.HandleFunc("/api/v1/admin/revenue/sweeps", h.authMiddleware(h.AdminMiddleware(h.handleListAdminRevenueSweeps)))
	router.HandleFunc("/api/v1/admin/revenue/sweeps/execute", h.authMiddleware(h.AdminMiddleware(h.handleAdminExecuteSweep)))
	router.HandleFunc("/api/v1/admin/revenue/accounts", h.authMiddleware(h.AdminMiddleware(h.handleGetRevenueAccounts)))
	router.HandleFunc("/api/v1/admin/revenue/sweep", h.authMiddleware(h.AdminMiddleware(h.handleCreateRevenueSweep)))
	router.HandleFunc("/api/v1/admin/users/search", h.authMiddleware(h.AdminMiddleware(h.handleSearchAdminUsers)))
	router.HandleFunc("/api/v1/admin/users/{id}", h.authMiddleware(h.AdminMiddleware(h.handleGetAdminUserDetail)))
	router.HandleFunc("/api/v1/admin/users/{id}/tier", h.authMiddleware(h.AdminMiddleware(h.handleUpdateAdminUserTier)))
	router.HandleFunc("/api/v1/admin/users/{id}/status", h.authMiddleware(h.AdminMiddleware(h.handleUpdateAdminUserStatus)))
	router.HandleFunc("/api/v1/admin/transactions/search", h.authMiddleware(h.AdminMiddleware(h.handleSearchAdminTransactions)))
	router.HandleFunc("/api/v1/admin/transactions/{id}", h.authMiddleware(h.AdminMiddleware(h.handleGetAdminTransactionDetail)))
	router.HandleFunc("/api/v1/admin/wallets", h.authMiddleware(h.AdminMiddleware(h.handleListAdminWallets)))
	router.HandleFunc("/api/v1/admin/wallets/adjust", h.authMiddleware(h.AdminMiddleware(h.handleAdjustAdminWalletBalance)))
	router.HandleFunc("/api/v1/admin/audit-logs", h.authMiddleware(h.AdminMiddleware(h.handleListAdminAuditLogs)))
	router.HandleFunc("/api/v1/admin/approvals", h.authMiddleware(h.AdminMiddleware(h.handleListAdminApprovals)))
	router.HandleFunc("/api/v1/admin/approvals/{id}/approve", h.authMiddleware(h.AdminMiddleware(h.handleApproveAdminApproval)))
	router.HandleFunc("/api/v1/admin/approvals/{id}/reject", h.authMiddleware(h.AdminMiddleware(h.handleRejectAdminApproval)))
	router.HandleFunc("/api/v1/admin/feature-flags", h.authMiddleware(h.AdminMiddleware(handleMethod(h.handleListAdminFeatureFlags, h.handleUpdateAdminFeatureFlag))))
	router.HandleFunc("/api/v1/admin/fx-overrides", h.authMiddleware(h.AdminMiddleware(handleMethod(h.handleListAdminFXOverrides, h.handleUpdateAdminFXOverride))))
	router.HandleFunc("/api/v1/admin/system/health", h.authMiddleware(h.AdminMiddleware(h.handleGetAdminSystemHealth)))
	router.HandleFunc("/api/v1/admin/export/users", h.authMiddleware(h.AdminMiddleware(h.handleExportAdminUsers)))
	router.HandleFunc("/api/v1/admin/export/transactions", h.authMiddleware(h.AdminMiddleware(h.handleExportAdminTransactions)))
	router.HandleFunc("/api/v1/admin/export/audit-logs", h.authMiddleware(h.AdminMiddleware(h.handleExportAdminAuditLogs)))
	router.HandleFunc("/api/v1/admin/waitlist", h.authMiddleware(h.AdminMiddleware(h.handleListWaitlistEntries)))
	router.HandleFunc("/api/v1/admin/waitlist/{id}/status", h.authMiddleware(h.AdminMiddleware(h.handleUpdateWaitlistEntryStatus)))
	router.HandleFunc("/api/v1/admin/waitlist/campaigns/send", h.authMiddleware(h.AdminMiddleware(h.handleSendWaitlistCampaign)))

	// Billing & Subscriptions
	router.HandleFunc("/api/billing/upgrade", h.authMiddleware(h.complianceMiddleware(h.handleUpgrade)))
	router.HandleFunc("/api/billing/verify", h.authMiddleware(h.complianceMiddleware(h.verifyCheckout)))
	router.HandleFunc("/api/billing/customer-portal", h.authMiddleware(h.complianceMiddleware(h.handleCustomerPortal)))
	router.HandleFunc("/api/billing/fees", h.getBillingFees)
	router.HandleFunc("/api/billing/plans", h.getSubscriptionPlans)
	router.HandleFunc("/api/billing/usage", h.authMiddleware(h.getUsage))
	router.HandleFunc("/api/billing/usage/track", h.authMiddleware(h.requireFeature("api_access", h.trackBillingUsage)))

	// External Payments (Public)
	router.HandleFunc("/api/invoices/public/pay", h.processPublicInvoicePayment)

	// Webhooks
	router.HandleFunc("/api/webhooks/paystack", h.handlePaystackWebhook)

	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: withCORS(router),
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	if solanaMonitor != nil {
		solanaMonitor.Start(ctx)
	}
	notifyService.Start(ctx)
	go h.svc.StartRenewalWorker(ctx)
	renderServiceID := os.Getenv("RENDER_SERVICE_ID")
	if renderServiceID != "" {
		go notifyService.MonitorRender(ctx, renderServiceID)
	}

	go func() {
		log.Printf("Starting Corridor API on port %s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	<-ctx.Done()
	log.Println("Shutting down server...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	server.Shutdown(shutdownCtx)
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		allowedOrigins := os.Getenv("CORS_ORIGINS")
		if allowedOrigins == "" {
			allowedOrigins = os.Getenv("ALLOWED_ORIGINS")
		}
		origin := r.Header.Get("Origin")
		originAllowed := func(o string) bool {
			o = strings.TrimSpace(o)
			if o == "" {
				return false
			}
			switch o {
			case "http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173", "https://corridor-flax.vercel.app":
				return true
			}
			return strings.HasSuffix(o, ".vercel.app")
		}

		// If the origin is empty (e.g. same origin or non-browser request),
		// we still want to allow standard non-credentialed access but
		// browsers will only set 'Origin' for cross-origin requests.
		if origin != "" {
			isAllowed := false
			if allowedOrigins == "*" || allowedOrigins == "" {
				isAllowed = originAllowed(origin)
			} else {
				for _, o := range strings.Split(allowedOrigins, ",") {
					if strings.TrimSpace(o) == origin {
						isAllowed = true
						break
					}
				}
				if !isAllowed && originAllowed(origin) {
					isAllowed = true
				}
			}

			if isAllowed {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Credentials", "true")
			}
		} else if allowedOrigins == "*" || allowedOrigins == "" {
			w.Header().Set("Access-Control-Allow-Origin", "*")
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key, Accept, X-Requested-With, Origin, X-Corridor-Ref")
		w.Header().Set("Access-Control-Expose-Headers", "Content-Length, Content-Range, X-Corridor-Ref")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (h *Handler) authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		accountID, err := getAccountIDFromRequest(r, h.svc)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
			return
		}
		ctx := context.WithValue(r.Context(), "accountID", accountID)
		ctx = context.WithValue(ctx, core.AccountContextKey, accountID)

		if !isConsentExemptPath(r.URL.Path) {
			consented, consentErr := h.svc.HasRequiredConsents(r.Context(), accountID)
			if consentErr != nil {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]string{"error": "failed to verify legal consent"})
				return
			}
			if !consented {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusForbidden)
				json.NewEncoder(w).Encode(map[string]string{
					"error":            "legal consent required",
					"actionable_error": "Accept the Terms of Service and Privacy Policy to continue.",
				})
				return
			}
		}
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

func isConsentExemptPath(path string) bool {
	switch path {
	case "/api/auth/me",
		"/api/compliance/consents":
		return true
	default:
		return false
	}
}

func (h *Handler) complianceMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		accountID := getAccountID(r.Context())
		if accountID == uuid.Nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
			return
		}

		acc, err := h.svc.GetAccountByID(r.Context(), accountID)
		if err != nil || acc == nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
			return
		}

		if acc.IsAdmin() {
			// Audit log admin access to sensitive endpoints
			_ = h.svc.RecordAuditLog(r.Context(), accountID, "admin_access", "endpoint", r.URL.Path, map[string]any{
				"method": r.Method,
				"reason": "admin_bypass_compliance",
			}, getIPAddress(r), r.UserAgent())
			next(w, r)
			return
		}

		profileCompleted := strings.TrimSpace(acc.FullName) != "" && strings.TrimSpace(acc.WhatsappPhone) != ""
		kycStatus := strings.ToUpper(strings.TrimSpace(acc.KYCStatus))
		kycCompleted := kycStatus == "APPROVED" || kycStatus == "VERIFIED" || kycStatus == "COMPLETED"

		if !profileCompleted || !kycCompleted {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]string{
				"error":            "profile_or_kyc_incomplete",
				"actionable_error": "Complete profile details and KYC in Settings before accessing this endpoint.",
			})
			return
		}

		next(w, r)
	}
}

func getIPAddress(r *http.Request) string {
	if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
		return strings.Split(forwarded, ",")[0]
	}
	if realIP := r.Header.Get("X-Real-IP"); realIP != "" {
		return realIP
	}
	return r.RemoteAddr
}

func (h *Handler) requireFeature(feature string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		accountID := getAccountID(r.Context())
		if accountID == uuid.Nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
			return
		}

		// Check if user is Admin - Admins have universal access
		acc, err := h.svc.GetAccountByID(r.Context(), accountID)
		if err == nil && acc != nil && acc.IsAdmin() {
			next(w, r)
			return
		}

		allowed, reason, err := h.svc.HasFeatureAccess(r.Context(), accountID, feature)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to verify account plan"})
			return
		}
		if !allowed {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusPaymentRequired)
			json.NewEncoder(w).Encode(map[string]string{
				"error":            "plan upgrade required",
				"actionable_error": reason,
			})
			return
		}

		next(w, r)
	}
}

func getAccountID(ctx context.Context) uuid.UUID {
	id, ok := ctx.Value("accountID").(uuid.UUID)
	if !ok {
		return uuid.Nil
	}
	return id
}
