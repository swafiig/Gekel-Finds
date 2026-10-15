package auth

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"golang.org/x/crypto/argon2"
)

// Argon2id parameters (OWASP recommends at least m=19MiB,t=2,p=1; we use more).
const (
	argonTime    uint32 = 3
	argonMemory  uint32 = 64 * 1024 // KiB = 64 MiB
	argonThreads uint8  = 2
	argonKeyLen  uint32 = 32
	argonSaltLen        = 16
)

// Hasher runs Argon2id with a cap on concurrent operations. Each hash needs 64 MiB,
// so an unbounded number of parallel logins could exhaust memory (a DoS vector).
type Hasher struct {
	sem   chan struct{}
	dummy string
}

func NewHasher(maxConcurrent int) (*Hasher, error) {
	if maxConcurrent < 1 {
		maxConcurrent = 1
	}
	h := &Hasher{sem: make(chan struct{}, maxConcurrent)}
	random := make([]byte, 24)
	if _, err := rand.Read(random); err != nil {
		return nil, err
	}
	d, err := h.Hash(context.Background(), base64.RawStdEncoding.EncodeToString(random))
	if err != nil {
		return nil, err
	}
	h.dummy = d
	return h, nil
}

func (h *Hasher) acquire(ctx context.Context) error {
	select {
	case h.sem <- struct{}{}:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}
func (h *Hasher) release() { <-h.sem }

func (h *Hasher) Hash(ctx context.Context, password string) (string, error) {
	if err := h.acquire(ctx); err != nil {
		return "", err
	}
	defer h.release()
	salt := make([]byte, argonSaltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	key := argon2.IDKey([]byte(password), salt, argonTime, argonMemory, argonThreads, argonKeyLen)
	return fmt.Sprintf("$argon2id$v=19$m=%d,t=%d,p=%d$%s$%s", argonMemory, argonTime, argonThreads,
		base64.RawStdEncoding.EncodeToString(salt), base64.RawStdEncoding.EncodeToString(key)), nil
}

// Verify checks password against an encoded hash in constant time.
// needsRehash is true when the stored hash uses weaker parameters than the current ones.
func (h *Hasher) Verify(ctx context.Context, encoded, password string) (ok, needsRehash bool, err error) {
	m, t, p, salt, want, perr := parseHash(encoded)
	if perr != nil {
		_ = h.VerifyDummy(ctx, password) // keep timing similar for malformed or empty hashes
		return false, false, nil
	}
	if err = h.acquire(ctx); err != nil {
		return false, false, err
	}
	defer h.release()
	got := argon2.IDKey([]byte(password), salt, t, m, p, uint32(len(want)))
	ok = subtle.ConstantTimeCompare(got, want) == 1
	return ok, ok && (m != argonMemory || t != argonTime || p != argonThreads), nil
}

// VerifyDummy burns the same CPU/memory as a real verification. Used when the account
// does not exist so response time does not reveal which accounts are registered.
func (h *Hasher) VerifyDummy(ctx context.Context, password string) error {
	_, _, err := h.verifyRaw(ctx, h.dummy, password)
	return err
}

func (h *Hasher) verifyRaw(ctx context.Context, encoded, password string) (bool, bool, error) {
	m, t, p, salt, want, err := parseHash(encoded)
	if err != nil {
		return false, false, err
	}
	if err = h.acquire(ctx); err != nil {
		return false, false, err
	}
	defer h.release()
	got := argon2.IDKey([]byte(password), salt, t, m, p, uint32(len(want)))
	return subtle.ConstantTimeCompare(got, want) == 1, false, nil
}

// parseHash decodes and bounds-checks parameters so a tampered database row cannot
// make us allocate gigabytes.
func parseHash(encoded string) (m, t uint32, p uint8, salt, key []byte, err error) {
	parts := strings.Split(encoded, "$")
	if len(parts) != 6 || parts[1] != "argon2id" || parts[2] != "v=19" {
		return 0, 0, 0, nil, nil, errors.New("unsupported hash")
	}
	if _, err = fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &m, &t, &p); err != nil {
		return 0, 0, 0, nil, nil, err
	}
	if m < 8*1024 || m > 256*1024 || t < 1 || t > 10 || p < 1 || p > 16 {
		return 0, 0, 0, nil, nil, errors.New("hash parameters out of range")
	}
	if salt, err = base64.RawStdEncoding.DecodeString(parts[4]); err != nil || len(salt) < 8 {
		return 0, 0, 0, nil, nil, errors.New("bad salt")
	}
	if key, err = base64.RawStdEncoding.DecodeString(parts[5]); err != nil || len(key) < 16 || len(key) > 64 {
		return 0, 0, 0, nil, nil, errors.New("bad key")
	}
	return m, t, p, salt, key, nil
}
