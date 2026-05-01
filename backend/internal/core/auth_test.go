package core

import (
	"testing"

	"golang.org/x/crypto/bcrypt"
)

func TestHashPassword(t *testing.T) {
	password := "securePassword123!"

	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}

	if hash == "" {
		t.Error("HashPassword returned empty string")
	}

	if hash == password {
		t.Error("HashPassword returned unhashed password")
	}

	// Hash should be bcrypt format (starts with $2a$ or $2b$)
	if len(hash) < 60 {
		t.Errorf("Hash length too short for bcrypt: got %d, expected at least 60", len(hash))
	}
}

func TestCheckPassword(t *testing.T) {
	password := "securePassword123!"

	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}

	// Test correct password
	if !CheckPassword(password, hash) {
		t.Error("CheckPassword failed for correct password")
	}

	// Test incorrect password
	if CheckPassword("wrongPassword", hash) {
		t.Error("CheckPassword should fail for incorrect password")
	}

	// Test empty password
	if CheckPassword("", hash) {
		t.Error("CheckPassword should fail for empty password")
	}
}

func TestCheckPasswordLegacyBcryptHash(t *testing.T) {
	password := "legacyPassword123!"

	legacyHash, err := bcrypt.GenerateFromPassword([]byte(password), BcryptCost)
	if err != nil {
		t.Fatalf("bcrypt.GenerateFromPassword failed: %v", err)
	}

	if !CheckPassword(password, string(legacyHash)) {
		t.Error("CheckPassword should accept legacy bcrypt hashes without SHA-256 prehashing")
	}
}

func TestHashPasswordDifferentHashes(t *testing.T) {
	password := "samePassword"

	hash1, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}

	hash2, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}

	// Same password should produce different hashes (due to salt)
	if hash1 == hash2 {
		t.Error("Same password should produce different hashes due to salt")
	}

	// But both should verify correctly
	if !CheckPassword(password, hash1) {
		t.Error("CheckPassword failed for hash1")
	}
	if !CheckPassword(password, hash2) {
		t.Error("CheckPassword failed for hash2")
	}
}

func TestHashPasswordSpecialCharacters(t *testing.T) {
	testCases := []string{
		"password with spaces",
		"pässwörd wïth ünicödé",
		"p@$$w0rd!#$%^&*()",
		"very-long-password-that-is-more-than-72-characters-which-is-the-bcrypt-limit-but-should-still-work",
		"",
	}

	for _, tc := range testCases {
		t.Run(tc, func(t *testing.T) {
			hash, err := HashPassword(tc)
			if err != nil {
				t.Fatalf("HashPassword failed for '%s': %v", tc, err)
			}

			if !CheckPassword(tc, hash) {
				t.Errorf("CheckPassword failed for '%s'", tc)
			}
		})
	}
}

func TestClaimsStructure(t *testing.T) {
	// Test that Claims struct has expected fields
	claims := Claims{}

	// These should compile, proving the fields exist
	_ = claims.AccountID
	_ = claims.Email
	_ = claims.RegisteredClaims
}

func TestAuthResponseStructure(t *testing.T) {
	// Test that AuthResponse struct has expected fields
	resp := AuthResponse{}

	// These should compile, proving the fields exist
	_ = resp.AccessToken
	_ = resp.TokenType
	_ = resp.User
}

// Benchmark password hashing
func BenchmarkHashPassword(b *testing.B) {
	password := "benchmarkPassword123!"

	for i := 0; i < b.N; i++ {
		_, _ = HashPassword(password)
	}
}

func BenchmarkCheckPassword(b *testing.B) {
	password := "benchmarkPassword123!"
	hash, _ := HashPassword(password)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		CheckPassword(password, hash)
	}
}
