package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// TokenManager issues and verifies short-lived access tokens (HS256 JWT).
// Refresh tokens are NOT JWTs: they are random opaque strings stored hashed in Postgres.
type TokenManager struct {
	secret   []byte
	issuer   string
	audience string
	ttl      time.Duration
	parser   *jwt.Parser
}

func NewTokenManager(secret, issuer, audience string, ttl time.Duration) TokenManager {
	return TokenManager{
		secret: []byte(secret), issuer: issuer, audience: audience, ttl: ttl,
		parser: jwt.NewParser(
			jwt.WithValidMethods([]string{"HS256"}), // blocks alg=none and algorithm-confusion attacks
			jwt.WithIssuer(issuer), jwt.WithAudience(audience),
			jwt.WithExpirationRequired(), jwt.WithIssuedAt(), jwt.WithLeeway(5*time.Second),
		),
	}
}

func (m TokenManager) TTL() time.Duration { return m.ttl }

type accessClaims struct {
	Role     Role   `json:"role"`
	SID      string `json:"sid"`
	IssuedMs int64  `json:"iatms"`
	jwt.RegisteredClaims
}

type Claims struct {
	UserID    string
	SessionID string
	Role      Role
	TokenID   string
	IssuedMs  int64
	ExpiresAt time.Time
}

func (m TokenManager) NewAccess(userID string, role Role, sessionID string) (string, error) {
	now := time.Now()
	c := accessClaims{
		Role: role, SID: sessionID, IssuedMs: now.UnixMilli(),
		RegisteredClaims: jwt.RegisteredClaims{
			Subject: userID, ID: uuid.NewString(), Issuer: m.issuer, Audience: jwt.ClaimStrings{m.audience},
			IssuedAt: jwt.NewNumericDate(now), NotBefore: jwt.NewNumericDate(now), ExpiresAt: jwt.NewNumericDate(now.Add(m.ttl)),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, c).SignedString(m.secret)
}

func (m TokenManager) ParseAccess(raw string) (Claims, error) {
	var c accessClaims
	tok, err := m.parser.ParseWithClaims(raw, &c, func(*jwt.Token) (any, error) { return m.secret, nil })
	if err != nil || !tok.Valid {
		return Claims{}, errors.New("invalid token")
	}
	if c.Subject == "" || c.SID == "" || c.ID == "" || !c.Role.Valid() {
		return Claims{}, errors.New("invalid claims")
	}
	return Claims{UserID: c.Subject, SessionID: c.SID, Role: c.Role, TokenID: c.ID, IssuedMs: c.IssuedMs, ExpiresAt: c.ExpiresAt.Time}, nil
}

// RandomToken returns n random bytes encoded as unpadded base64url.
func RandomToken(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

const refreshBytes = 48 // 48 bytes -> 64 base64url characters

func NewRefreshToken() (raw string, hash []byte, err error) {
	raw, err = RandomToken(refreshBytes)
	if err != nil {
		return "", nil, err
	}
	return raw, HashToken(raw), nil
}

// HashToken is SHA-256. That is appropriate here because the input already has 384 bits of
// entropy, so no slow hash is needed. Never use it for passwords or OTP codes.
func HashToken(s string) []byte { h := sha256.Sum256([]byte(s)); return h[:] }

// ValidRefreshShape cheaply rejects garbage before touching the database.
func ValidRefreshShape(s string) bool {
	if len(s) != 64 {
		return false
	}
	for _, r := range s {
		if !(r >= 'a' && r <= 'z' || r >= 'A' && r <= 'Z' || r >= '0' && r <= '9' || r == '-' || r == '_') {
			return false
		}
	}
	return true
}

func BearerToken(h string) string {
	const p = "bearer "
	if len(h) > len(p) && strings.EqualFold(h[:len(p)], p) {
		return strings.TrimSpace(h[len(p):])
	}
	return ""
}
