package auth

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"net"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store struct{ DB *pgxpool.Pool }

const userCols = `id, full_name, email, phone, role, is_active, phone_verified_at, email_verified_at, created_at, last_login_at, COALESCE(expo_push_token, '')`
func scanUser(row pgx.Row, extra ...any) (User, error) {
	var u User
	dest := append([]any{&u.ID, &u.FullName, &u.Email, &u.Phone, &u.Role, &u.IsActive, &u.PhoneVerifiedAt, &u.EmailVerifiedAt, &u.CreatedAt, &u.LastLoginAt, &u.ExpoPushToken}, extra...)
	err := row.Scan(dest...)
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, ErrNotFound
	}
	return u, err
}

func isUnique(err error) bool {
	var pg *pgconn.PgError
	return errors.As(err, &pg) && pg.Code == "23505"
}

func ipArg(ip string) any {
	if net.ParseIP(ip) == nil {
		return nil
	}
	return ip
}

/* ───────────── Users ───────────── */

func (s Store) CreateUser(ctx context.Context, id, fullName string, email *string, phone, hash string, role Role) (User, error) {
	u, err := scanUser(s.DB.QueryRow(ctx,
		`INSERT INTO users (id, full_name, email, phone, password_hash, role) VALUES ($1,$2,$3,$4,$5,$6) RETURNING `+userCols,
		id, fullName, email, phone, hash, string(role)))
	if isUnique(err) {
		return User{}, ErrAccountExists
	}
	return u, err
}

func (s Store) UserByID(ctx context.Context, id string) (User, error) {
	return scanUser(s.DB.QueryRow(ctx, `SELECT `+userCols+` FROM users WHERE id=$1`, id))
}

func (s Store) recordBy(ctx context.Context, where string, arg any) (userRecord, error) {
	var hash *string
	u, err := scanUser(s.DB.QueryRow(ctx, `SELECT `+userCols+`, password_hash FROM users WHERE `+where, arg), &hash)
	rec := userRecord{User: u}
	if hash != nil {
		rec.PasswordHash = *hash
	}
	return rec, err
}
func (s Store) RecordByID(ctx context.Context, id string) (userRecord, error) {
	return s.recordBy(ctx, `id=$1`, id)
}
func (s Store) RecordByEmail(ctx context.Context, email string) (userRecord, error) {
	return s.recordBy(ctx, `lower(email)=lower($1)`, email)
}
func (s Store) RecordByPhone(ctx context.Context, phone string) (userRecord, error) {
	return s.recordBy(ctx, `phone=$1`, phone)
}

func (s Store) SetLastLogin(ctx context.Context, id string) {
	_, _ = s.DB.Exec(ctx, `UPDATE users SET last_login_at=NOW() WHERE id=$1`, id)
}

func (s Store) UpdatePasswordHash(ctx context.Context, id, hash string) error {
	_, err := s.DB.Exec(ctx, `UPDATE users SET password_hash=$2, updated_at=NOW() WHERE id=$1`, id, hash)
	return err
}

// UpdateProfile changes name and email. A changed email loses its verified status.
func (s Store) UpdateProfile(ctx context.Context, id, fullName string, email *string) (User, error) {
	u, err := scanUser(s.DB.QueryRow(ctx, `
		UPDATE users SET full_name=$2,
		  email_verified_at = CASE WHEN lower(COALESCE(email,'')) IS DISTINCT FROM lower(COALESCE($3::text,'')) THEN NULL ELSE email_verified_at END,
		  email=$3, updated_at=NOW()
		WHERE id=$1 RETURNING `+userCols, id, fullName, email))
	if isUnique(err) {
		return User{}, ErrAccountExists
	}
	return u, err
}

// SetPhoneVerified is idempotent: the first verification time is kept.
func (s Store) SetPhoneVerified(ctx context.Context, id string) (User, error) {
	return scanUser(s.DB.QueryRow(ctx, `UPDATE users SET phone_verified_at=COALESCE(phone_verified_at,NOW()), updated_at=NOW() WHERE id=$1 RETURNING `+userCols, id))
}

func (s Store) SetActive(ctx context.Context, id string, active bool) (User, error) {
	return scanUser(s.DB.QueryRow(ctx, `UPDATE users SET is_active=$2, updated_at=NOW() WHERE id=$1 RETURNING `+userCols, id, active))
}

func (s Store) SetRole(ctx context.Context, id string, role Role) (User, error) {
	return scanUser(s.DB.QueryRow(ctx, `UPDATE users SET role=$2, updated_at=NOW() WHERE id=$1 RETURNING `+userCols, id, string(role)))
}

// ListUsers uses keyset pagination (created_at, id) so deep pages stay fast.
func (s Store) ListUsers(ctx context.Context, q string, role Role, limit int, cursor string) ([]User, string, error) {
	args := []any{}
	conds := []string{}
	add := func(cond string, v any) { args = append(args, v); conds = append(conds, fmt.Sprintf(cond, len(args))) }

	if q != "" {
		like := "%" + strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(strings.ToLower(q)) + "%"
		add(`(lower(full_name) LIKE $%d ESCAPE '\' OR lower(COALESCE(email,'')) LIKE $%[1]d ESCAPE '\' OR phone LIKE $%[1]d ESCAPE '\')`, like)
	}
	if role != "" {
		add(`role=$%d`, string(role))
	}
	if cursor != "" {
		t, id, err := decodeCursor(cursor)
		if err != nil {
			return nil, "", errors.New("invalid cursor")
		}
		args = append(args, t, id)
		conds = append(conds, fmt.Sprintf(`(created_at, id) < ($%d, $%d)`, len(args)-1, len(args)))
	}
	where := ""
	if len(conds) > 0 {
		where = "WHERE " + strings.Join(conds, " AND ")
	}
	args = append(args, limit+1)
	rows, err := s.DB.Query(ctx, fmt.Sprintf(`SELECT %s FROM users %s ORDER BY created_at DESC, id DESC LIMIT $%d`, userCols, where, len(args)), args...)
	if err != nil {
		return nil, "", err
	}
	defer rows.Close()
	out := []User{} // never nil: clients expect [] not null
	for rows.Next() {
		u, err := scanUser(rows)
		if err != nil {
			return nil, "", err
		}
		out = append(out, u)
	}
	if rows.Err() != nil {
		return nil, "", rows.Err()
	}
	next := ""
	if len(out) > limit {
		out = out[:limit]
		last := out[len(out)-1]
		next = base64.RawURLEncoding.EncodeToString([]byte(last.CreatedAt.UTC().Format(time.RFC3339Nano) + "|" + last.ID))
	}
	return out, next, nil
}

func decodeCursor(c string) (time.Time, string, error) {
	b, err := base64.RawURLEncoding.DecodeString(c)
	if err != nil {
		return time.Time{}, "", err
	}
	parts := strings.SplitN(string(b), "|", 2)
	if len(parts) != 2 {
		return time.Time{}, "", errors.New("bad cursor")
	}
	t, err := time.Parse(time.RFC3339Nano, parts[0])
	return t, parts[1], err
}

/* ───────────── Sessions (refresh tokens) ───────────── */

type NewSession struct {
	ID, UserID, FamilyID string
	RefreshHash          []byte
	ExpiresAt            time.Time
	Meta                 ClientMeta
}

func (s Store) CreateSession(ctx context.Context, n NewSession) error {
	_, err := s.DB.Exec(ctx, `INSERT INTO auth_sessions (id,user_id,refresh_token_hash,token_family_id,expires_at,user_agent,device_name,ip_address)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8::inet)`, n.ID, n.UserID, n.RefreshHash, n.FamilyID, n.ExpiresAt, n.Meta.UserAgent, n.Meta.Device, ipArg(n.Meta.IP))
	return err
}

// ReuseError means a refresh token that was already rotated was presented again.
// That is the signature of token theft, so the whole token family is revoked.
type ReuseError struct {
	UserID  string
	Revoked []string
}

func (e *ReuseError) Error() string { return "refresh token reuse detected" }

type RotateResult struct{ UserID, SessionID string }

func (s Store) RotateSession(ctx context.Context, oldHash, newHash []byte, newExpiry time.Time, m ClientMeta) (RotateResult, error) {
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return RotateResult{}, err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	var (
		id, userID, family string
		revokedAt          *time.Time
		reason             *string
		expires            time.Time
		deviceName         *string
	)
	err = tx.QueryRow(ctx, `SELECT id,user_id,token_family_id,revoked_at,revoke_reason,expires_at,device_name
		FROM auth_sessions WHERE refresh_token_hash=$1 FOR UPDATE`, oldHash).Scan(&id, &userID, &family, &revokedAt, &reason, &expires, &deviceName)
	if errors.Is(err, pgx.ErrNoRows) {
		return RotateResult{}, ErrInvalidRefresh
	}
	if err != nil {
		return RotateResult{}, err
	}

	if revokedAt != nil {
		if reason != nil && *reason == "rotated" {
			rows, qerr := tx.Query(ctx, `UPDATE auth_sessions SET revoked_at=NOW(), revoke_reason='reuse_detected'
				WHERE token_family_id=$1 AND revoked_at IS NULL RETURNING id`, family)
			if qerr != nil {
				return RotateResult{}, qerr
			}
			var ids []string
			for rows.Next() {
				var sid string
				if err = rows.Scan(&sid); err == nil {
					ids = append(ids, sid)
				}
			}
			rows.Close()
			if err = tx.Commit(ctx); err != nil {
				return RotateResult{}, err
			}
			return RotateResult{}, &ReuseError{UserID: userID, Revoked: ids}
		}
		return RotateResult{}, ErrInvalidRefresh
	}
	if !expires.After(time.Now()) {
		return RotateResult{}, ErrInvalidRefresh
	}

	if _, err = tx.Exec(ctx, `UPDATE auth_sessions SET revoked_at=NOW(), revoke_reason='rotated', last_used_at=NOW() WHERE id=$1`, id); err != nil {
		return RotateResult{}, err
	}
	device := m.Device
	if device == "" && deviceName != nil {
		device = *deviceName
	}
	var newID string
	err = tx.QueryRow(ctx, `INSERT INTO auth_sessions (user_id,refresh_token_hash,token_family_id,expires_at,user_agent,device_name,ip_address)
		VALUES ($1,$2,$3,$4,$5,$6,$7::inet) RETURNING id`, userID, newHash, family, newExpiry, m.UserAgent, device, ipArg(m.IP)).Scan(&newID)
	if err != nil {
		return RotateResult{}, err
	}
	if err = tx.Commit(ctx); err != nil {
		return RotateResult{}, err
	}
	return RotateResult{UserID: userID, SessionID: newID}, nil
}

func (s Store) revokeReturning(ctx context.Context, sql string, args ...any) ([]string, error) {
	rows, err := s.DB.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

// RevokeSession revokes one session that belongs to userID.
func (s Store) RevokeSession(ctx context.Context, userID, sessionID, reason string) (bool, error) {
	ids, err := s.revokeReturning(ctx, `UPDATE auth_sessions SET revoked_at=NOW(), revoke_reason=$3
		WHERE id=$1 AND user_id=$2 AND revoked_at IS NULL RETURNING id`, sessionID, userID, reason)
	return len(ids) > 0, err
}

func (s Store) RevokeByRefreshHash(ctx context.Context, userID string, hash []byte, reason string) ([]string, error) {
	return s.revokeReturning(ctx, `UPDATE auth_sessions SET revoked_at=NOW(), revoke_reason=$3
		WHERE refresh_token_hash=$1 AND user_id=$2 AND revoked_at IS NULL RETURNING id`, hash, userID, reason)
}

// RevokeAll revokes every active session of a user, optionally keeping one (exceptID).
func (s Store) RevokeAll(ctx context.Context, userID, reason, exceptID string) ([]string, error) {
	return s.revokeReturning(ctx, `UPDATE auth_sessions SET revoked_at=NOW(), revoke_reason=$2
		WHERE user_id=$1 AND revoked_at IS NULL AND ($3 = '' OR id::text <> $3) RETURNING id`, userID, reason, exceptID)
}

func (s Store) ListSessions(ctx context.Context, userID, currentSID string) ([]SessionInfo, error) {
	rows, err := s.DB.Query(ctx, `SELECT id, COALESCE(device_name,''), COALESCE(user_agent,''), COALESCE(host(ip_address),''), created_at, last_used_at, expires_at
		FROM auth_sessions WHERE user_id=$1 AND revoked_at IS NULL AND expires_at>NOW() ORDER BY last_used_at DESC LIMIT 50`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []SessionInfo{}
	for rows.Next() {
		var x SessionInfo
		if err := rows.Scan(&x.ID, &x.DeviceName, &x.UserAgent, &x.IP, &x.CreatedAt, &x.LastUsedAt, &x.ExpiresAt); err != nil {
			return nil, err
		}
		x.Current = x.ID == currentSID
		out = append(out, x)
	}
	return out, rows.Err()
}

/* ───────────── Audit ───────────── */

type AuditEvent struct {
	UserID  string
	Type    string
	Success bool
	Meta    ClientMeta
	Data    map[string]any
}

// Audit is best-effort: a failure to write the log must not break the request.
func (s Store) Audit(ctx context.Context, e AuditEvent) error {
	var uid any
	if e.UserID != "" {
		uid = e.UserID
	}
	data := e.Data
	if data == nil {
		data = map[string]any{}
	}
	_, err := s.DB.Exec(ctx, `INSERT INTO auth_audit_logs (user_id,event_type,success,ip_address,user_agent,metadata) VALUES ($1,$2,$3,$4::inet,$5,$6)`,
		uid, e.Type, e.Success, ipArg(e.Meta.IP), e.Meta.UserAgent, data)
	return err
}

func (s Store) UpdatePushToken(ctx context.Context, userID, token string) error {
	_, err := s.DB.Exec(ctx, `UPDATE users SET expo_push_token = $1 WHERE id = $2`, token, userID)
	return err
}