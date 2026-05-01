package core

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Organization struct {
	ID        uuid.UUID `json:"id"`
	OwnerID   uuid.UUID `json:"owner_id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type OrganizationMember struct {
	OrganizationID uuid.UUID `json:"organization_id"`
	AccountID      uuid.UUID `json:"account_id"`
	Role           string    `json:"role"` // ADMIN, FINANCE, DEVELOPER, MEMBER
	JoinedAt       time.Time `json:"joined_at"`
	
	// Join fields
	Email    string `json:"email,omitempty"`
	FullName string `json:"full_name,omitempty"`
}

func (s *Service) GetOrganizationByOwner(ctx context.Context, ownerID uuid.UUID) (*Organization, error) {
	var org Organization
	err := s.db.Pool.QueryRow(ctx, `
		SELECT id, owner_id, name, created_at, updated_at 
		FROM organizations WHERE owner_id = $1
	`, ownerID).Scan(&org.ID, &org.OwnerID, &org.Name, &org.CreatedAt, &org.UpdatedAt)
	
	if err != nil {
		// Auto-create for now to simplify
		org.ID = uuid.New()
		org.OwnerID = ownerID
		org.Name = "Default Organization"
		
		err = s.db.Pool.QueryRow(ctx, `
			INSERT INTO organizations (id, owner_id, name)
			VALUES ($1, $2, $3)
			RETURNING created_at, updated_at
		`, org.ID, org.OwnerID, org.Name).Scan(&org.CreatedAt, &org.UpdatedAt)
		
		if err != nil {
			return nil, err
		}
		
		// Add owner as ADMIN member
		_, _ = s.db.Pool.Exec(ctx, `
			INSERT INTO organization_members (organization_id, account_id, role)
			VALUES ($1, $2, 'ADMIN')
		`, org.ID, ownerID)
	}
	
	return &org, nil
}

func (s *Service) GetOrganizationMembers(ctx context.Context, orgID uuid.UUID) ([]OrganizationMember, error) {
	rows, err := s.db.Pool.Query(ctx, `
		SELECT om.organization_id, om.account_id, om.role, om.joined_at, a.email, a.full_name
		FROM organization_members om
		JOIN accounts a ON om.account_id = a.id
		WHERE om.organization_id = $1
	`, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var members []OrganizationMember
	for rows.Next() {
		var m OrganizationMember
		if err := rows.Scan(&m.OrganizationID, &m.AccountID, &m.Role, &m.JoinedAt, &m.Email, &m.FullName); err != nil {
			return nil, err
		}
		members = append(members, m)
	}
	return members, nil
}

func (s *Service) AddOrganizationMember(ctx context.Context, orgID uuid.UUID, email string, role string) error {
	var accountID uuid.UUID
	err := s.db.Pool.QueryRow(ctx, "SELECT id FROM accounts WHERE email = $1", email).Scan(&accountID)
	if err != nil {
		return fmt.Errorf("user with email %s not found. They must sign up first", email)
	}

	_, err = s.db.Pool.Exec(ctx, `
		INSERT INTO organization_members (organization_id, account_id, role)
		VALUES ($1, $2, $3)
		ON CONFLICT (organization_id, account_id) DO UPDATE SET role = $3
	`, orgID, accountID, role)
	
	return err
}

func (s *Service) RemoveOrganizationMember(ctx context.Context, orgID uuid.UUID, accountID uuid.UUID) error {
	// Don't allow removing the owner? 
	var ownerID uuid.UUID
	err := s.db.Pool.QueryRow(ctx, "SELECT owner_id FROM organizations WHERE id = $1", orgID).Scan(&ownerID)
	if err == nil && ownerID == accountID {
		return fmt.Errorf("cannot remove the organization owner")
	}

	_, err = s.db.Pool.Exec(ctx, "DELETE FROM organization_members WHERE organization_id = $1 AND account_id = $2", orgID, accountID)
	return err
}
