package notifications

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/corridrlabs/corridor/backend/internal/email"
)

type NotificationType string

const (
	TypeEmail    NotificationType = "EMAIL"
	TypeWeb      NotificationType = "WEB"
	TypePush     NotificationType = "PUSH"
)

type Notification struct {
	ID        uuid.UUID
	AccountID uuid.UUID
	Type      NotificationType
	Title     string
	Message   string
	Data      map[string]interface{}
	CreatedAt time.Time
}

type Service struct {
	emailSvc *email.Service
	mu       sync.RWMutex
	webQueue map[uuid.UUID][]Notification // In-memory queue for "web notifier"
	stopChan chan struct{}
}

func NewService(emailSvc *email.Service) *Service {
	return &Service{
		emailSvc: emailSvc,
		webQueue: make(map[uuid.UUID][]Notification),
		stopChan: make(chan struct{}),
	}
}

func (s *Service) Notify(ctx context.Context, accountID uuid.UUID, title, message string, nType NotificationType) error {
	n := Notification{
		ID:        uuid.New(),
		AccountID: accountID,
		Type:      nType,
		Title:     title,
		Message:   message,
		CreatedAt: time.Now(),
	}

	switch nType {
	case TypeEmail:
		// We'd ideally need the email address here.
		// For now, we'll log it. Real implementation would fetch account email.
		log.Printf("[NOTIFY] Sending Email to Account %s: %s - %s", accountID, title, message)
		// s.emailSvc.Send(...)

	case TypeWeb:
		s.mu.Lock()
		s.webQueue[accountID] = append(s.webQueue[accountID], n)
		if len(s.webQueue[accountID]) > 50 { // Cap at 50 notifications
			s.webQueue[accountID] = s.webQueue[accountID][1:]
		}
		s.mu.Unlock()
		log.Printf("[NOTIFY] Web Notification for Account %s: %s", accountID, title)

	default:
		return fmt.Errorf("unsupported notification type: %s", nType)
	}

	return nil
}

func (s *Service) GetWebNotifications(accountID uuid.UUID) []Notification {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.webQueue[accountID]
}

func (s *Service) ClearWebNotifications(accountID uuid.UUID) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.webQueue, accountID)
}

// StartBackgroundTask could run a loop to prune old notifications or sync with Render
func (s *Service) Start(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Minute)
	go func() {
		for {
			select {
			case <-ticker.C:
				// Prune logic or external sync
				log.Println("[NOTIFY] Heartbeat: Notification service is healthy")
			case <-ctx.Done():
				return
			}
		}
	}()
}
