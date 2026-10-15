// Package auth implements registration, login, token rotation, logout, OTP password
// reset, session management and the authentication middleware.
package auth

import (
	"errors"
	"time"
)

type Role string

const (
	RoleBuyer      Role = "buyer"
	RoleSupplier   Role = "supplier"
	RoleRider      Role = "rider"
	RoleStaff      Role = "staff"
	RoleAdmin      Role = "admin"
	RoleSuperAdmin Role = "super_admin"
)

func (r Role) Valid() bool {
	switch r {
	case RoleBuyer, RoleSupplier, RoleRider, RoleStaff, RoleAdmin, RoleSuperAdmin:
		return true
	}
	return false
}

// Privileged roles can never be assigned through public endpoints.
func (r Role) Privileged() bool { return r == RoleStaff || r == RoleAdmin || r == RoleSuperAdmin }

type User struct {
	ID              string     `json:"id"`
	FullName        string     `json:"full_name"`
	Email           *string    `json:"email"`
	Phone           string     `json:"phone"`
	Role            Role       `json:"role"`
	IsActive        bool       `json:"is_active"`
	PhoneVerifiedAt *time.Time `json:"phone_verified_at"`
	EmailVerifiedAt *time.Time `json:"email_verified_at"`
	CreatedAt       time.Time  `json:"created_at"`
	LastLoginAt     *time.Time `json:"last_login_at"`
}

type userRecord struct {
	User
	PasswordHash string
}

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
}

type AuthResponse struct {
	User   User      `json:"user"`
	Tokens TokenPair `json:"tokens"`
}

type SessionInfo struct {
	ID         string    `json:"id"`
	DeviceName string    `json:"device_name"`
	UserAgent  string    `json:"user_agent"`
	IP         string    `json:"ip_address"`
	CreatedAt  time.Time `json:"created_at"`
	LastUsedAt time.Time `json:"last_used_at"`
	ExpiresAt  time.Time `json:"expires_at"`
	Current    bool      `json:"current"`
}

// ClientMeta describes the calling device. It is stored on sessions and audit logs.
type ClientMeta struct {
	IP        string
	UserAgent string
	Device    string
}

// Domain errors. Handlers translate them to HTTP responses.
var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrAccountDisabled    = errors.New("account disabled")
	ErrAccountExists      = errors.New("account exists")
	ErrInvalidRefresh     = errors.New("invalid refresh token")
	ErrInvalidOTP         = errors.New("invalid or expired code")
	ErrInvalidResetToken  = errors.New("invalid or expired reset token")
	ErrWrongPassword      = errors.New("wrong password")
	ErrNotFound           = errors.New("not found")
	ErrAlreadyVerified    = errors.New("already verified")
	ErrDelivery           = errors.New("code delivery failed")
)

type ValidationError struct{ Fields map[string]string }

func (e *ValidationError) Error() string { return "validation failed" }

type RateLimitError struct {
	RetryAfter time.Duration
	Code       string
}

func (e *RateLimitError) Error() string { return "rate limited" }
