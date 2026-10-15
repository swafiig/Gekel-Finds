package auth

import (
	"context"
	"errors"
	"log/slog"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	"github.com/geofreysakayo/gekel-finds-auth/internal/httpx"
)

const (
	maxLoginFailsPerIdentifier = 5
	maxLoginFailsPerIP         = 30
	lockWindow                 = 15 * time.Minute
)

type Service struct {
	Store   Store
	RDB     *redis.Client
	Tokens  TokenManager
	Hasher  *Hasher
	Limiter *httpx.Limiter
	OTP     OTP
	Notify  Notifier
	Log     *slog.Logger

	RefreshTTL time.Duration
	ResetTTL   time.Duration
}

type RegisterInput struct {
	FullName, Phone, Email, Password string
}

func (s Service) audit(ctx context.Context, e AuditEvent) {
	if err := s.Store.Audit(ctx, e); err != nil {
		s.Log.Warn("audit write failed", "event", e.Type, "err", err)
	}
}

/* ───────────── Register ───────────── */

func (s Service) Register(ctx context.Context, in RegisterInput, m ClientMeta) (User, TokenPair, error) {
	fields := map[string]string{}
	name, err := NormalizeName(in.FullName)
	if err != nil {
		fields["full_name"] = err.Error()
	}
	phone, err := NormalizePhone(in.Phone)
	if err != nil {
		fields["phone"] = err.Error()
	}
	var email *string
	emailStr := ""
	if strings.TrimSpace(in.Email) != "" {
		e, err := NormalizeEmail(in.Email)
		if err != nil {
			fields["email"] = err.Error()
		} else {
			email, emailStr = &e, e
		}
	}
	// Public signup creates BUYER accounts only. Suppliers use their own app (and are approved by staff);
	// riders, staff and admins are created by admins. The request has no "role" field to abuse.
	role := RoleBuyer
	if err := ValidatePassword(in.Password, phone, emailStr); err != nil {
		fields["password"] = err.Error()
	}
	if len(fields) > 0 {
		return User{}, TokenPair{}, &ValidationError{Fields: fields}
	}

	hash, err := s.Hasher.Hash(ctx, in.Password)
	if err != nil {
		return User{}, TokenPair{}, err
	}
	u, err := s.Store.CreateUser(ctx, uuid.NewString(), name, email, phone, hash, role)
	if err != nil {
		if errors.Is(err, ErrAccountExists) {
			s.audit(ctx, AuditEvent{Type: "register", Success: false, Meta: m, Data: map[string]any{"reason": "exists"}})
		}
		return User{}, TokenPair{}, err
	}
	pair, err := s.issue(ctx, u, m, "")
	if err != nil {
		return User{}, TokenPair{}, err
	}
	s.audit(ctx, AuditEvent{UserID: u.ID, Type: "register", Success: true, Meta: m})
	s.startPhoneVerification(u.ID, phone) // SMS goes out in the background; the app shows the code screen
	return u, pair, nil
}

/* ───────────── Login ───────────── */

func (s Service) Login(ctx context.Context, identifier, password string, m ClientMeta) (User, TokenPair, error) {
	norm, kind := ParseIdentifier(identifier)
	lockID := norm
	if lockID == "" { // still count attempts for malformed input so it cannot be used to bypass limits
		lockID = strings.ToLower(strings.TrimSpace(identifier))
		if len(lockID) > 254 {
			lockID = lockID[:254]
		}
	}
	idKey, ipKey := "lock:id:"+keyID(lockID), "lock:ip:"+m.IP

	if n, ttl, err := s.Limiter.Count(ctx, idKey); err != nil && s.Limiter.FailClosed {
		return User{}, TokenPair{}, err
	} else if n >= maxLoginFailsPerIdentifier {
		return User{}, TokenPair{}, &RateLimitError{RetryAfter: ttl, Code: "account_locked"}
	}
	if n, ttl, err := s.Limiter.Count(ctx, ipKey); err == nil && n >= maxLoginFailsPerIP {
		return User{}, TokenPair{}, &RateLimitError{RetryAfter: ttl, Code: "rate_limited"}
	}

	var rec userRecord
	var err error
	switch kind {
	case "email":
		rec, err = s.Store.RecordByEmail(ctx, norm)
	case "phone":
		rec, err = s.Store.RecordByPhone(ctx, norm)
	default:
		err = ErrNotFound
	}
	if err != nil && !errors.Is(err, ErrNotFound) {
		return User{}, TokenPair{}, err
	}

	ok := false
	rehash := false
	if errors.Is(err, ErrNotFound) {
		_ = s.Hasher.VerifyDummy(ctx, password) // equalize timing so unknown accounts look the same
	} else {
		if ok, rehash, err = s.Hasher.Verify(ctx, rec.PasswordHash, password); err != nil {
			return User{}, TokenPair{}, err
		}
	}
	if !ok {
		_, _, _ = s.Limiter.Hit(ctx, idKey, lockWindow)
		_, _, _ = s.Limiter.Hit(ctx, ipKey, lockWindow)
		s.audit(ctx, AuditEvent{UserID: rec.ID, Type: "login", Success: false, Meta: m})
		return User{}, TokenPair{}, ErrInvalidCredentials
	}
	if !rec.IsActive {
		s.audit(ctx, AuditEvent{UserID: rec.ID, Type: "login", Success: false, Meta: m, Data: map[string]any{"reason": "disabled"}})
		return User{}, TokenPair{}, ErrAccountDisabled
	}

	s.Limiter.Reset(ctx, idKey)
	if rehash {
		if h, herr := s.Hasher.Hash(ctx, password); herr == nil {
			_ = s.Store.UpdatePasswordHash(ctx, rec.ID, h)
		}
	}
	s.Store.SetLastLogin(ctx, rec.ID)
	pair, err := s.issue(ctx, rec.User, m, "")
	if err != nil {
		return User{}, TokenPair{}, err
	}
	s.audit(ctx, AuditEvent{UserID: rec.ID, Type: "login", Success: true, Meta: m})
	return rec.User, pair, nil
}

// issue creates a session row (holding the hashed refresh token) and a matching access token.
func (s Service) issue(ctx context.Context, u User, m ClientMeta, family string) (TokenPair, error) {
	raw, hash, err := NewRefreshToken()
	if err != nil {
		return TokenPair{}, err
	}
	sid := uuid.NewString()
	if family == "" {
		family = uuid.NewString()
	}
	if err = s.Store.CreateSession(ctx, NewSession{ID: sid, UserID: u.ID, FamilyID: family, RefreshHash: hash, ExpiresAt: time.Now().Add(s.RefreshTTL), Meta: m}); err != nil {
		return TokenPair{}, err
	}
	access, err := s.Tokens.NewAccess(u.ID, u.Role, sid)
	if err != nil {
		return TokenPair{}, err
	}
	return TokenPair{AccessToken: access, RefreshToken: raw, TokenType: "Bearer", ExpiresIn: int64(s.Tokens.TTL() / time.Second)}, nil
}

/* ───────────── Refresh (rotation + reuse detection) ───────────── */

func (s Service) Refresh(ctx context.Context, refresh string, m ClientMeta) (User, TokenPair, error) {
	if !ValidRefreshShape(refresh) {
		return User{}, TokenPair{}, ErrInvalidRefresh
	}
	newRaw, newHash, err := NewRefreshToken()
	if err != nil {
		return User{}, TokenPair{}, err
	}
	res, err := s.Store.RotateSession(ctx, HashToken(refresh), newHash, time.Now().Add(s.RefreshTTL), m)
	var reuse *ReuseError
	if errors.As(err, &reuse) {
		s.blacklist(ctx, reuse.Revoked...)
		s.revokeAccessBefore(ctx, reuse.UserID)
		s.audit(ctx, AuditEvent{UserID: reuse.UserID, Type: "refresh_reuse_detected", Success: false, Meta: m})
		s.Log.Warn("refresh token reuse detected, family revoked", "user_id", reuse.UserID)
		return User{}, TokenPair{}, ErrInvalidRefresh
	}
	if err != nil {
		return User{}, TokenPair{}, err
	}
	u, err := s.Store.UserByID(ctx, res.UserID)
	if err != nil || !u.IsActive {
		_, _ = s.Store.RevokeSession(ctx, res.UserID, res.SessionID, "user_inactive")
		return User{}, TokenPair{}, ErrInvalidRefresh
	}
	access, err := s.Tokens.NewAccess(u.ID, u.Role, res.SessionID)
	if err != nil {
		return User{}, TokenPair{}, err
	}
	return u, TokenPair{AccessToken: access, RefreshToken: newRaw, TokenType: "Bearer", ExpiresIn: int64(s.Tokens.TTL() / time.Second)}, nil
}

/* ───────────── Logout / sessions ───────────── */

// blacklist makes access tokens bound to these sessions fail immediately (instead of at expiry).
func (s Service) blacklist(ctx context.Context, sids ...string) {
	if len(sids) == 0 {
		return
	}
	pipe := s.RDB.Pipeline()
	for _, id := range sids {
		pipe.Set(ctx, "revoked:sid:"+id, "1", s.Tokens.TTL()+30*time.Second)
	}
	if _, err := pipe.Exec(ctx); err != nil {
		s.Log.Error("could not blacklist sessions", "err", err)
	}
}

// revokeAccessBefore rejects every access token issued to this user before now.
func (s Service) revokeAccessBefore(ctx context.Context, userID string) {
	if err := s.RDB.Set(ctx, "revoked_after:"+userID, strconv.FormatInt(time.Now().UnixMilli(), 10), s.Tokens.TTL()+30*time.Second).Err(); err != nil {
		s.Log.Error("could not set revoked_after", "err", err)
	}
}

func (s Service) Logout(ctx context.Context, c Claims, refresh string, m ClientMeta) error {
	if _, err := s.Store.RevokeSession(ctx, c.UserID, c.SessionID, "logout"); err != nil {
		return err
	}
	ids := []string{c.SessionID}
	if ValidRefreshShape(refresh) {
		if more, err := s.Store.RevokeByRefreshHash(ctx, c.UserID, HashToken(refresh), "logout"); err == nil {
			ids = append(ids, more...)
		}
	}
	s.blacklist(ctx, ids...)
	s.audit(ctx, AuditEvent{UserID: c.UserID, Type: "logout", Success: true, Meta: m})
	return nil
}

func (s Service) LogoutAll(ctx context.Context, userID, reason string, m ClientMeta) error {
	if _, err := s.Store.RevokeAll(ctx, userID, reason, ""); err != nil {
		return err
	}
	s.revokeAccessBefore(ctx, userID)
	s.audit(ctx, AuditEvent{UserID: userID, Type: "logout_all", Success: true, Meta: m, Data: map[string]any{"reason": reason}})
	return nil
}

func (s Service) Sessions(ctx context.Context, c Claims) ([]SessionInfo, error) {
	return s.Store.ListSessions(ctx, c.UserID, c.SessionID)
}

func (s Service) RevokeSession(ctx context.Context, c Claims, sessionID string, m ClientMeta) error {
	ok, err := s.Store.RevokeSession(ctx, c.UserID, sessionID, "revoked_by_user")
	if err != nil {
		return err
	}
	if !ok {
		return ErrNotFound
	}
	s.blacklist(ctx, sessionID)
	s.audit(ctx, AuditEvent{UserID: c.UserID, Type: "session_revoked", Success: true, Meta: m})
	return nil
}

/* ───────────── Change password (signed in) ───────────── */

func (s Service) ChangePassword(ctx context.Context, c Claims, current, next string, m ClientMeta) error {
	if ok, retry, err := s.Limiter.Allow(ctx, "chgpw:"+c.UserID, 5, lockWindow); err != nil && s.Limiter.FailClosed {
		return err
	} else if !ok {
		return &RateLimitError{RetryAfter: retry, Code: "rate_limited"}
	}
	rec, err := s.Store.RecordByID(ctx, c.UserID)
	if err != nil {
		return err
	}
	ok, _, err := s.Hasher.Verify(ctx, rec.PasswordHash, current)
	if err != nil {
		return err
	}
	if !ok {
		s.audit(ctx, AuditEvent{UserID: c.UserID, Type: "password_change", Success: false, Meta: m})
		return ErrWrongPassword
	}
	emailStr := ""
	if rec.Email != nil {
		emailStr = *rec.Email
	}
	if current == next {
		return &ValidationError{Fields: map[string]string{"new_password": "Choose a password different from your current one"}}
	}
	if verr := ValidatePassword(next, rec.Phone, emailStr); verr != nil {
		return &ValidationError{Fields: map[string]string{"new_password": verr.Error()}}
	}
	hash, err := s.Hasher.Hash(ctx, next)
	if err != nil {
		return err
	}
	if err = s.Store.UpdatePasswordHash(ctx, c.UserID, hash); err != nil {
		return err
	}
	ids, err := s.Store.RevokeAll(ctx, c.UserID, "password_changed", c.SessionID) // keep this device signed in
	if err != nil {
		return err
	}
	s.blacklist(ctx, ids...)
	s.audit(ctx, AuditEvent{UserID: c.UserID, Type: "password_change", Success: true, Meta: m})
	return nil
}

/* ───────────── Forgot password: OTP -> reset token -> new password ───────────── */

const purposeReset = "pwreset"

func (s Service) allow(ctx context.Context, key string, limit int, window time.Duration, code string) error {
	ok, retry, err := s.Limiter.Allow(ctx, key, limit, window)
	if err != nil && s.Limiter.FailClosed {
		return err
	}
	if !ok {
		return &RateLimitError{RetryAfter: retry, Code: code}
	}
	return nil
}

// RequestPasswordReset always behaves the same whether or not the account exists:
// same limits, same response, same latency (delivery runs in the background).
func (s Service) RequestPasswordReset(ctx context.Context, identifier string, m ClientMeta) error {
	norm, kind := ParseIdentifier(identifier)
	if norm == "" {
		return nil // looks like neither phone nor email; respond identically, do nothing
	}
	idk := keyID(norm)
	if err := s.allow(ctx, "otp_cd:"+idk, 1, 60*time.Second, "otp_cooldown"); err != nil {
		return err
	}
	if err := s.allow(ctx, "otp_hour:"+idk, 5, time.Hour, "otp_limit"); err != nil {
		return err
	}
	if err := s.allow(ctx, "otp_ip:"+m.IP, 20, time.Hour, "rate_limited"); err != nil {
		return err
	}
	go func() {
		bg, cancel := context.WithTimeout(context.Background(), 20*time.Second)
		defer cancel()
		var rec userRecord
		var err error
		if kind == "email" {
			rec, err = s.Store.RecordByEmail(bg, norm)
		} else {
			rec, err = s.Store.RecordByPhone(bg, norm)
		}
		if err != nil || !rec.IsActive {
			return
		}
		code, err := s.OTP.Issue(bg, purposeReset, norm)
		if err != nil {
			s.Log.Error("otp issue failed", "err", err)
			return
		}
		if err = s.Notify.SendOTP(bg, rec.Phone, code, s.OTP.TTL); err != nil {
			s.Log.Error("otp delivery failed", "user_id", rec.ID, "err", err)
			return
		}
		s.audit(bg, AuditEvent{UserID: rec.ID, Type: "password_reset_requested", Success: true, Meta: m})
	}()
	return nil
}

// VerifyResetOTP exchanges a correct code for a single-use reset token.
func (s Service) VerifyResetOTP(ctx context.Context, identifier, code string, m ClientMeta) (string, error) {
	norm, kind := ParseIdentifier(identifier)
	if norm == "" || len(code) != 6 {
		return "", ErrInvalidOTP
	}
	idk := keyID(norm)
	if err := s.allow(ctx, "otp_verify:"+idk, 10, lockWindow, "otp_limit"); err != nil {
		return "", err
	}
	if err := s.allow(ctx, "otp_verify_ip:"+m.IP, 40, lockWindow, "rate_limited"); err != nil {
		return "", err
	}
	ok, err := s.OTP.Verify(ctx, purposeReset, norm, code)
	if err != nil {
		return "", err
	}
	if !ok {
		s.audit(ctx, AuditEvent{Type: "password_reset_otp", Success: false, Meta: m})
		return "", ErrInvalidOTP
	}
	var rec userRecord
	if kind == "email" {
		rec, err = s.Store.RecordByEmail(ctx, norm)
	} else {
		rec, err = s.Store.RecordByPhone(ctx, norm)
	}
	if err != nil || !rec.IsActive {
		return "", ErrInvalidOTP
	}
	token, err := RandomToken(32)
	if err != nil {
		return "", err
	}
	if err = s.RDB.Set(ctx, "pwreset:"+keyID(token), rec.ID, s.ResetTTL).Err(); err != nil {
		return "", err
	}
	s.audit(ctx, AuditEvent{UserID: rec.ID, Type: "password_reset_otp", Success: true, Meta: m})
	return token, nil
}

func (s Service) ResetPassword(ctx context.Context, token, newPassword string, m ClientMeta) error {
	if len(token) < 32 || len(token) > 128 {
		return ErrInvalidResetToken
	}
	key := "pwreset:" + keyID(token)
	uid, err := s.RDB.Get(ctx, key).Result() // peek first: a weak password must not burn the token
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return ErrInvalidResetToken
		}
		return err
	}
	rec, err := s.Store.RecordByID(ctx, uid)
	if err != nil {
		return ErrInvalidResetToken
	}
	emailStr := ""
	if rec.Email != nil {
		emailStr = *rec.Email
	}
	if verr := ValidatePassword(newPassword, rec.Phone, emailStr); verr != nil {
		return &ValidationError{Fields: map[string]string{"password": verr.Error()}}
	}
	if _, err = s.RDB.GetDel(ctx, key).Result(); err != nil { // consume: single use, race-safe
		return ErrInvalidResetToken
	}
	hash, err := s.Hasher.Hash(ctx, newPassword)
	if err != nil {
		return err
	}
	if err = s.Store.UpdatePasswordHash(ctx, uid, hash); err != nil {
		return err
	}
	if _, err = s.Store.RevokeAll(ctx, uid, "password_reset", ""); err != nil {
		return err
	}
	s.revokeAccessBefore(ctx, uid)
	s.Limiter.Reset(ctx, "lock:id:"+keyID(rec.Phone))
	if rec.Email != nil {
		s.Limiter.Reset(ctx, "lock:id:"+keyID(*rec.Email))
	}
	s.audit(ctx, AuditEvent{UserID: uid, Type: "password_reset", Success: true, Meta: m})
	return nil
}

/* ───────────── Phone verification ───────────── */

const purposePhone = "phone_verify"

// startPhoneVerification sends the first code right after signup and starts the 60 s resend cooldown,
// so a user who taps "Resend" immediately is told to wait instead of triggering a second SMS.
func (s Service) startPhoneVerification(userID, phone string) {
	go func() {
		bg, cancel := context.WithTimeout(context.Background(), 20*time.Second)
		defer cancel()
		_, _, _ = s.Limiter.Hit(bg, "pv_cd:"+userID, 60*time.Second)
		_, _, _ = s.Limiter.Hit(bg, "pv_hour:"+userID, time.Hour)
		code, err := s.OTP.Issue(bg, purposePhone, phone)
		if err != nil {
			s.Log.Error("phone otp issue failed", "err", err)
			return
		}
		if err = s.Notify.SendOTP(bg, phone, code, s.OTP.TTL); err != nil {
			s.Log.Error("phone otp delivery failed", "user_id", userID, "err", err)
		}
	}()
}

// SendPhoneCode (re)sends a verification code to the signed-in user's own phone number.
func (s Service) SendPhoneCode(ctx context.Context, c Claims, m ClientMeta) error {
	rec, err := s.Store.RecordByID(ctx, c.UserID)
	if err != nil {
		return err
	}
	if rec.PhoneVerifiedAt != nil {
		return ErrAlreadyVerified
	}
	if err := s.allow(ctx, "pv_cd:"+c.UserID, 1, 60*time.Second, "otp_cooldown"); err != nil {
		return err
	}
	if err := s.allow(ctx, "pv_hour:"+c.UserID, 5, time.Hour, "otp_limit"); err != nil {
		return err
	}
	if err := s.allow(ctx, "pv_ip:"+m.IP, 20, time.Hour, "rate_limited"); err != nil {
		return err
	}
	code, err := s.OTP.Issue(ctx, purposePhone, rec.Phone)
	if err != nil {
		return err
	}
	if err = s.Notify.SendOTP(ctx, rec.Phone, code, s.OTP.TTL); err != nil {
		s.Log.Error("phone otp delivery failed", "user_id", c.UserID, "err", err)
		return ErrDelivery
	}
	s.audit(ctx, AuditEvent{UserID: c.UserID, Type: "phone_code_sent", Success: true, Meta: m})
	return nil
}

// VerifyPhone checks the code against the user's CURRENT phone number and marks it verified.
func (s Service) VerifyPhone(ctx context.Context, c Claims, code string, m ClientMeta) (User, error) {
	rec, err := s.Store.RecordByID(ctx, c.UserID)
	if err != nil {
		return User{}, err
	}
	if rec.PhoneVerifiedAt != nil {
		return rec.User, nil // idempotent
	}
	if len(code) != 6 {
		return User{}, ErrInvalidOTP
	}
	if err := s.allow(ctx, "pv_verify:"+c.UserID, 10, lockWindow, "otp_limit"); err != nil {
		return User{}, err
	}
	ok, err := s.OTP.Verify(ctx, purposePhone, rec.Phone, code)
	if err != nil {
		return User{}, err
	}
	if !ok {
		s.audit(ctx, AuditEvent{UserID: c.UserID, Type: "phone_verify", Success: false, Meta: m})
		return User{}, ErrInvalidOTP
	}
	u, err := s.Store.SetPhoneVerified(ctx, c.UserID)
	if err != nil {
		return User{}, err
	}
	s.audit(ctx, AuditEvent{UserID: c.UserID, Type: "phone_verify", Success: true, Meta: m})
	return u, nil
}

/* ───────────── Used by the users package ───────────── */

func (s Service) Me(ctx context.Context, userID string) (User, error) {
	return s.Store.UserByID(ctx, userID)
}

func (s Service) AuditAdmin(ctx context.Context, actorID, event string, m ClientMeta, data map[string]any) {
	s.audit(ctx, AuditEvent{UserID: actorID, Type: event, Success: true, Meta: m, Data: data})
}
