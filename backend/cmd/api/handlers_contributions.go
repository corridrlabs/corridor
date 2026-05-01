package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/google/uuid"
	"github.com/stripe/stripe-go/v74"
	"github.com/stripe/stripe-go/v74/checkout/session"
	"github.com/stripe/stripe-go/v74/paymentintent"
)

// ContributionPaymentRequest represents a request to pay for a contribution
type ContributionPaymentRequest struct {
	GoalID          string  `json:"goal_id"`
	Amount          float64 `json:"amount"`
	Currency        string  `json:"currency"`
	ContributorName string  `json:"contributor_name"`
	PaymentMethod   string  `json:"payment_method"` // "card", "crypto", "mpesa"
	SuccessURL      string  `json:"success_url"`
	CancelURL       string  `json:"cancel_url"`
}

// ContributionPaymentResponse contains the payment session/intent details
type ContributionPaymentResponse struct {
	SessionID      string `json:"session_id,omitempty"`
	ClientSecret   string `json:"client_secret,omitempty"`
	PaymentURL     string `json:"payment_url,omitempty"`
	ContributionID string `json:"contribution_id"`
}

// handleContributionPayment creates a payment session for goal contributions
func (h *Handler) handleContributionPayment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ContributionPaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "invalid request body"}`, http.StatusBadRequest)
		return
	}

	// Validate goal exists
	goalID, err := uuid.Parse(req.GoalID)
	if err != nil {
		http.Error(w, `{"error": "invalid goal ID"}`, http.StatusBadRequest)
		return
	}

	ctx := r.Context()

	// Verify goal exists and is active
	var goalStatus string
	var goalCurrency string
	err = h.svc.GetDB().Pool.QueryRow(ctx,
		"SELECT status, currency FROM social_goals WHERE id = $1",
		goalID).Scan(&goalStatus, &goalCurrency)
	if err != nil {
		http.Error(w, `{"error": "goal not found"}`, http.StatusNotFound)
		return
	}
	if goalStatus != "ACTIVE" {
		http.Error(w, `{"error": "goal is not active"}`, http.StatusBadRequest)
		return
	}

	// Set default contributor name
	contributorName := req.ContributorName
	if contributorName == "" {
		contributorName = "Anonymous"
	}

	// Create pending contribution record
	contributionID := uuid.New()
	_, err = h.svc.GetDB().Pool.Exec(ctx, `
		INSERT INTO pending_contributions (id, goal_id, contributor_name, amount, currency, status, payment_method)
		VALUES ($1, $2, $3, $4, $5, 'PENDING', $6)
	`, contributionID, goalID, contributorName, req.Amount, req.Currency, req.PaymentMethod)
	if err != nil {
		log.Printf("Error creating pending contribution: %v", err)
		http.Error(w, `{"error": "failed to create contribution"}`, http.StatusInternalServerError)
		return
	}

	var resp ContributionPaymentResponse
	resp.ContributionID = contributionID.String()

	switch req.PaymentMethod {
	case "card":
		// Create Stripe Checkout Session
		checkoutResp, err := createStripeCheckoutSession(req, contributionID.String())
		if err != nil {
			log.Printf("Error creating Stripe session: %v", err)
			http.Error(w, `{"error": "failed to create payment session"}`, http.StatusInternalServerError)
			return
		}
		resp.SessionID = checkoutResp.ID
		resp.PaymentURL = checkoutResp.URL

	case "card_intent":
		// Create Stripe PaymentIntent for embedded checkout
		intentResp, err := createStripePaymentIntent(req, contributionID.String())
		if err != nil {
			log.Printf("Error creating Stripe intent: %v", err)
			http.Error(w, `{"error": "failed to create payment intent"}`, http.StatusInternalServerError)
			return
		}
		resp.ClientSecret = intentResp.ClientSecret

	case "crypto":
		// For crypto, direct the user to the goal's deposit address
		resp.PaymentURL = fmt.Sprintf("%s/goals/%s/pay/crypto?contribution=%s", h.appBaseURL(r), req.GoalID, contributionID.String())

	case "mpesa":
		// For M-Pesa, we'd trigger STK push here
		resp.PaymentURL = fmt.Sprintf("%s/goals/%s/pay/mpesa?contribution=%s", h.appBaseURL(r), req.GoalID, contributionID.String())

	default:
		http.Error(w, `{"error": "unsupported payment method"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func createStripeCheckoutSession(req ContributionPaymentRequest, contributionID string) (*stripe.CheckoutSession, error) {
	// Convert amount to cents
	amountCents := int64(req.Amount * 100)

	params := &stripe.CheckoutSessionParams{
		PaymentMethodTypes: stripe.StringSlice([]string{"card"}),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
					Currency: stripe.String(req.Currency),
					ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
						Name:        stripe.String("Goal Contribution"),
						Description: stripe.String(fmt.Sprintf("Contribution to goal %s", req.GoalID)),
					},
					UnitAmount: stripe.Int64(amountCents),
				},
				Quantity: stripe.Int64(1),
			},
		},
		Mode:       stripe.String(string(stripe.CheckoutSessionModePayment)),
		SuccessURL: stripe.String(req.SuccessURL + "?contribution=" + contributionID),
		CancelURL:  stripe.String(req.CancelURL + "?contribution=" + contributionID),
	}
	params.AddMetadata("contribution_id", contributionID)
	params.AddMetadata("goal_id", req.GoalID)
	params.AddMetadata("contributor", req.ContributorName)

	return session.New(params)
}

func createStripePaymentIntent(req ContributionPaymentRequest, contributionID string) (*stripe.PaymentIntent, error) {
	amountCents := int64(req.Amount * 100)

	params := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(amountCents),
		Currency: stripe.String(req.Currency),
		AutomaticPaymentMethods: &stripe.PaymentIntentAutomaticPaymentMethodsParams{
			Enabled: stripe.Bool(true),
		},
	}
	params.AddMetadata("contribution_id", contributionID)
	params.AddMetadata("goal_id", req.GoalID)
	params.AddMetadata("contributor", req.ContributorName)

	return paymentintent.New(params)
}

// handleStripeContributionWebhook processes Stripe webhooks for contributions
func (h *Handler) handleStripeContributionWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// TODO: Verify Stripe webhook signature
	// sig := r.Header.Get("Stripe-Signature")
	// event, err := webhook.ConstructEvent(payload, sig, endpointSecret)

	var event stripe.Event
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		http.Error(w, `{"error": "invalid webhook body"}`, http.StatusBadRequest)
		return
	}

	ctx := r.Context()

	switch event.Type {
	case "checkout.session.completed":
		var sess stripe.CheckoutSession
		if err := json.Unmarshal(event.Data.Raw, &sess); err != nil {
			log.Printf("Error parsing checkout session: %v", err)
			w.WriteHeader(http.StatusOK)
			return
		}

		contributionID := sess.Metadata["contribution_id"]
		goalID := sess.Metadata["goal_id"]
		contributor := sess.Metadata["contributor"]

		if contributionID != "" {
			// Complete the contribution
			h.completeContribution(ctx, contributionID, goalID, contributor)
		}

	case "payment_intent.succeeded":
		var intent stripe.PaymentIntent
		if err := json.Unmarshal(event.Data.Raw, &intent); err != nil {
			log.Printf("Error parsing payment intent: %v", err)
			w.WriteHeader(http.StatusOK)
			return
		}

		contributionID := intent.Metadata["contribution_id"]
		goalID := intent.Metadata["goal_id"]
		contributor := intent.Metadata["contributor"]

		if contributionID != "" {
			h.completeContribution(ctx, contributionID, goalID, contributor)
		}
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) completeContribution(ctx context.Context, contributionIDStr, goalIDStr, contributor string) {
	contributionID, _ := uuid.Parse(contributionIDStr)
	goalID, _ := uuid.Parse(goalIDStr)

	// Get pending contribution details
	var amount float64
	var currency string
	err := h.svc.GetDB().Pool.QueryRow(ctx,
		"SELECT amount, currency FROM pending_contributions WHERE id = $1",
		contributionID).Scan(&amount, &currency)
	if err != nil {
		log.Printf("Error fetching pending contribution %s: %v", contributionIDStr, err)
		return
	}

	// Process the contribution through the service
	_, err = h.svc.ContributeToGoal(ctx, goalID, contributor, amount, currency)
	if err != nil {
		log.Printf("Error completing contribution %s: %v", contributionIDStr, err)
		return
	}

	// Update pending contribution status
	_, err = h.svc.GetDB().Pool.Exec(ctx,
		"UPDATE pending_contributions SET status = 'COMPLETED' WHERE id = $1",
		contributionID)
	if err != nil {
		log.Printf("Error updating contribution status %s: %v", contributionIDStr, err)
	}

	log.Printf("Successfully completed contribution %s for goal %s", contributionIDStr, goalIDStr)
}
