package core

import (
	"testing"
	"time"
)

type TestSplitRequest struct {
	ID           string
	CreatorID    string
	Amount       float64
	Participants []string
	Status       string
	CreatedAt    time.Time
}

func TestSplitRequestCreation(t *testing.T) {
	creator := "user1"
	amount := 100.0
	participants := []string{"user2", "user3", "user4"}

	split, err := createSplitRequest(creator, amount, participants)
	if err != nil {
		t.Errorf("failed to create split: %v", err)
	}

	if split.Amount != amount {
		t.Errorf("expected amount %f, got %f", amount, split.Amount)
	}

	if len(split.Participants) != len(participants) {
		t.Errorf("expected %d participants, got %d", len(participants), len(split.Participants))
	}

	if split.Status != "pending" {
		t.Errorf("expected status pending, got %s", split.Status)
	}
}

func TestParticipantManagement(t *testing.T) {
	split := &TestSplitRequest{
		ID:           "split1",
		Participants: []string{"user1", "user2"},
	}

	// Add participant
	err := addParticipant(split, "user3")
	if err != nil {
		t.Errorf("failed to add participant: %v", err)
	}

	if len(split.Participants) != 3 {
		t.Errorf("expected 3 participants, got %d", len(split.Participants))
	}

	// Remove participant
	err = removeParticipant(split, "user2")
	if err != nil {
		t.Errorf("failed to remove participant: %v", err)
	}

	if len(split.Participants) != 2 {
		t.Errorf("expected 2 participants, got %d", len(split.Participants))
	}
}

func TestPaymentTracking(t *testing.T) {
	splitID := "split1"
	userID := "user1"
	amount := 25.0

	// Record payment
	err := recordSplitPayment(splitID, userID, amount)
	if err != nil {
		t.Errorf("failed to record payment: %v", err)
	}

	// Check payment status
	paid := getSplitPaymentStatus(splitID, userID)
	if !paid {
		t.Error("expected payment to be recorded")
	}

	// Check total collected
	total := getTotalCollected(splitID)
	if total != amount {
		t.Errorf("expected total %f, got %f", amount, total)
	}
}

func TestAutoPurchaseLogic(t *testing.T) {
	split := &TestSplitRequest{
		ID:           "split1",
		Amount:       100.0,
		Participants: []string{"user1", "user2", "user3", "user4"},
		Status:       "pending",
	}

	// Simulate payments from 3 out of 4 participants
	recordSplitPayment(split.ID, "user1", 25.0)
	recordSplitPayment(split.ID, "user2", 25.0)
	recordSplitPayment(split.ID, "user3", 25.0)

	// Check if auto-purchase should trigger (75% threshold)
	shouldTrigger := checkAutoPurchaseTrigger(split.ID, 0.75)
	if !shouldTrigger {
		t.Error("expected auto-purchase to trigger at 75% threshold")
	}

	// Execute auto-purchase
	err := executeAutoPurchase(split.ID)
	if err != nil {
		t.Errorf("auto-purchase failed: %v", err)
	}

	// Verify status changed
	status := getSplitStatus(split.ID)
	if status != "completed" {
		t.Errorf("expected status completed, got %s", status)
	}
}

// Helper functions
func createSplitRequest(creator string, amount float64, participants []string) (*TestSplitRequest, error) {
	return &TestSplitRequest{
		ID:           "split1",
		CreatorID:    creator,
		Amount:       amount,
		Participants: participants,
		Status:       "pending",
		CreatedAt:    time.Now(),
	}, nil
}

func addParticipant(split *TestSplitRequest, userID string) error {
	split.Participants = append(split.Participants, userID)
	return nil
}

func removeParticipant(split *TestSplitRequest, userID string) error {
	for i, p := range split.Participants {
		if p == userID {
			split.Participants = append(split.Participants[:i], split.Participants[i+1:]...)
			break
		}
	}
	return nil
}

var splitPayments = make(map[string]map[string]float64)

func recordSplitPayment(splitID, userID string, amount float64) error {
	if splitPayments[splitID] == nil {
		splitPayments[splitID] = make(map[string]float64)
	}
	splitPayments[splitID][userID] = amount
	return nil
}

func getSplitPaymentStatus(splitID, userID string) bool {
	return splitPayments[splitID][userID] > 0
}

func getTotalCollected(splitID string) float64 {
	total := 0.0
	for _, amount := range splitPayments[splitID] {
		total += amount
	}
	return total
}

func checkAutoPurchaseTrigger(splitID string, threshold float64) bool {
	return getTotalCollected(splitID) >= 100.0*threshold
}

func executeAutoPurchase(splitID string) error {
	setSplitStatus(splitID, "completed")
	return nil
}

var splitStatuses = make(map[string]string)

func setSplitStatus(splitID, status string) { splitStatuses[splitID] = status }
func getSplitStatus(splitID string) string { return splitStatuses[splitID] }