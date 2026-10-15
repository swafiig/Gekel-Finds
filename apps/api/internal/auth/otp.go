package auth

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"time"

	"github.com/redis/go-redis/v9"
)

// OTP stores one-time codes in Redis as HMAC-SHA256 digests keyed with a server secret.
// A plain hash would be trivially reversible (only 1,000,000 possible codes) if Redis leaked.
type OTP struct {
	RDB         *redis.Client
	Secret      []byte
	TTL         time.Duration
	MaxAttempts int64
}

func keyID(s string) string { h := sha256.Sum256([]byte(s)); return hex.EncodeToString(h[:16]) }

func (o OTP) codeKey(purpose, ident string) string { return "otp:" + purpose + ":" + keyID(ident) }
func (o OTP) tryKey(purpose, ident string) string  { return "otp_try:" + purpose + ":" + keyID(ident) }

func (o OTP) mac(purpose, ident, code string) string {
	m := hmac.New(sha256.New, o.Secret)
	m.Write([]byte(purpose + "|" + ident + "|" + code))
	return hex.EncodeToString(m.Sum(nil))
}

// Issue creates a fresh 6-digit code (uniformly random, no modulo bias) and replaces any previous one.
func (o OTP) Issue(ctx context.Context, purpose, ident string) (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1_000_000))
	if err != nil {
		return "", err
	}
	code := fmt.Sprintf("%06d", n.Int64())
	pipe := o.RDB.TxPipeline()
	pipe.Set(ctx, o.codeKey(purpose, ident), o.mac(purpose, ident, code), o.TTL)
	pipe.Del(ctx, o.tryKey(purpose, ident))
	if _, err = pipe.Exec(ctx); err != nil {
		return "", err
	}
	return code, nil
}

// Verify checks a code. At most MaxAttempts guesses are allowed per issued code, after which it is destroyed.
// A correct code is single-use.
func (o OTP) Verify(ctx context.Context, purpose, ident, code string) (bool, error) {
	stored, err := o.RDB.Get(ctx, o.codeKey(purpose, ident)).Result()
	if errors.Is(err, redis.Nil) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	tk := o.tryKey(purpose, ident)
	n, err := o.RDB.Incr(ctx, tk).Result()
	if err != nil {
		return false, err
	}
	if n == 1 {
		o.RDB.Expire(ctx, tk, o.TTL)
	}
	if n > o.MaxAttempts {
		o.RDB.Del(ctx, o.codeKey(purpose, ident), tk)
		return false, nil
	}
	if hmac.Equal([]byte(stored), []byte(o.mac(purpose, ident, code))) {
		o.RDB.Del(ctx, o.codeKey(purpose, ident), tk)
		return true, nil
	}
	return false, nil
}
