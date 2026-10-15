package auth

import (
	"context"
	"encoding/base64"
	"fmt"
	"strings"
	"testing"

	"golang.org/x/crypto/argon2"
)

func TestHashVerify(t *testing.T) {
	h, err := NewHasher(2)
	if err != nil {
		t.Fatal(err)
	}
	ctx := context.Background()
	enc, err := h.Hash(ctx, "correct horse 42")
	if err != nil {
		t.Fatal(err)
	}
	if !strings.HasPrefix(enc, "$argon2id$v=19$m=65536,t=3,p=2$") {
		t.Fatalf("unexpected encoding: %s", enc)
	}
	if ok, rehash, err := h.Verify(ctx, enc, "correct horse 42"); !ok || rehash || err != nil {
		t.Fatalf("verify good: ok=%v rehash=%v err=%v", ok, rehash, err)
	}
	if ok, _, _ := h.Verify(ctx, enc, "wrong horse 42"); ok {
		t.Fatal("wrong password accepted")
	}
	enc2, _ := h.Hash(ctx, "correct horse 42")
	if enc == enc2 {
		t.Fatal("salts must differ between hashes")
	}
}

func TestVerifyRejectsMalformedAndOversizedParams(t *testing.T) {
	h, _ := NewHasher(1)
	ctx := context.Background()
	for _, enc := range []string{"", "plain", "$argon2id$v=19$m=999999999,t=3,p=2$c2FsdHNhbHQ$aGFzaGhhc2hoYXNoaGFzaA", "$bcrypt$x$y$z$w$v"} {
		if ok, _, err := h.Verify(ctx, enc, "x"); ok || err != nil {
			t.Errorf("Verify(%q) = %v, %v; want false, nil", enc, ok, err)
		}
	}
}

func TestRehashFlag(t *testing.T) {
	h, _ := NewHasher(1)
	ctx := context.Background()
	// A hash made with weaker parameters (m=19MiB, t=2, p=1) must verify AND ask to be upgraded.
	salt := []byte("0123456789abcdef")
	key := argon2.IDKey([]byte("old password 1"), salt, 2, 19*1024, 1, 32)
	weak := fmt.Sprintf("$argon2id$v=19$m=19456,t=2,p=1$%s$%s",
		base64.RawStdEncoding.EncodeToString(salt), base64.RawStdEncoding.EncodeToString(key))
	ok, rehash, err := h.Verify(ctx, weak, "old password 1")
	if !ok || !rehash || err != nil {
		t.Fatalf("weak hash: ok=%v rehash=%v err=%v", ok, rehash, err)
	}
	if ok, rehash, _ := h.Verify(ctx, weak, "not the password"); ok || rehash {
		t.Fatal("wrong password must not verify or request rehash")
	}
}
