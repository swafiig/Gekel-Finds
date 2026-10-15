package auth

import (
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const testSecret = "0123456789abcdef0123456789abcdef-secret"

func TestAccessRoundTrip(t *testing.T) {
	m := NewTokenManager(testSecret, "iss", "aud", time.Minute)
	tok, err := m.NewAccess("user-1", RoleBuyer, "sess-1")
	if err != nil {
		t.Fatal(err)
	}
	c, err := m.ParseAccess(tok)
	if err != nil || c.UserID != "user-1" || c.SessionID != "sess-1" || c.Role != RoleBuyer || c.IssuedMs == 0 {
		t.Fatalf("claims: %+v err=%v", c, err)
	}
}

func TestAccessRejections(t *testing.T) {
	m := NewTokenManager(testSecret, "iss", "aud", time.Minute)
	good, _ := m.NewAccess("u", RoleBuyer, "s")

	if _, err := NewTokenManager("another-secret-another-secret-0000", "iss", "aud", time.Minute).ParseAccess(good); err == nil {
		t.Error("token signed with another secret was accepted")
	}
	if _, err := NewTokenManager(testSecret, "other-iss", "aud", time.Minute).ParseAccess(good); err == nil {
		t.Error("wrong issuer accepted")
	}
	if _, err := NewTokenManager(testSecret, "iss", "other-aud", time.Minute).ParseAccess(good); err == nil {
		t.Error("wrong audience accepted")
	}
	expired := NewTokenManager(testSecret, "iss", "aud", -time.Minute)
	old, _ := expired.NewAccess("u", RoleBuyer, "s")
	if _, err := m.ParseAccess(old); err == nil {
		t.Error("expired token accepted")
	}
	// alg=none forgery
	none := jwt.NewWithClaims(jwt.SigningMethodNone, accessClaims{Role: RoleSuperAdmin, SID: "s", RegisteredClaims: jwt.RegisteredClaims{
		Subject: "u", ID: "x", Issuer: "iss", Audience: jwt.ClaimStrings{"aud"}, ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour))}})
	forged, _ := none.SignedString(jwt.UnsafeAllowNoneSignatureType)
	if _, err := m.ParseAccess(forged); err == nil {
		t.Error("alg=none token accepted")
	}
	// HS512 with the right secret must also be refused (only HS256 is allowed)
	hs512 := jwt.NewWithClaims(jwt.SigningMethodHS512, accessClaims{Role: RoleBuyer, SID: "s", RegisteredClaims: jwt.RegisteredClaims{
		Subject: "u", ID: "x", Issuer: "iss", Audience: jwt.ClaimStrings{"aud"}, ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour))}})
	s512, _ := hs512.SignedString([]byte(testSecret))
	if _, err := m.ParseAccess(s512); err == nil {
		t.Error("HS512 token accepted")
	}
	// tampered payload
	parts := strings.Split(good, ".")
	if _, err := m.ParseAccess(parts[0] + "." + parts[1] + "x." + parts[2]); err == nil {
		t.Error("tampered token accepted")
	}
}

func TestRefreshTokens(t *testing.T) {
	raw, hash, err := NewRefreshToken()
	if err != nil || !ValidRefreshShape(raw) || len(hash) != 32 {
		t.Fatalf("raw=%q len(hash)=%d err=%v", raw, len(hash), err)
	}
	raw2, _, _ := NewRefreshToken()
	if raw == raw2 {
		t.Fatal("refresh tokens must be unique")
	}
	for _, bad := range []string{"", "short", strings.Repeat("a", 63), strings.Repeat("!", 64), strings.Repeat("a", 65)} {
		if ValidRefreshShape(bad) {
			t.Errorf("%q should be rejected", bad)
		}
	}
}

func TestBearerToken(t *testing.T) {
	for in, want := range map[string]string{"Bearer abc": "abc", "bearer abc": "abc", "BEARER  abc ": "abc", "Basic abc": "", "Bearer": "", "": ""} {
		if got := BearerToken(in); got != want {
			t.Errorf("BearerToken(%q) = %q; want %q", in, got, want)
		}
	}
}
