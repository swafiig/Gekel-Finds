package auth

import "testing"

func TestNormalizePhone(t *testing.T) {
	good := map[string]string{
		"0712345678": "+254712345678", "0712 345 678": "+254712345678", "+254 712-345-678": "+254712345678",
		"254712345678": "+254712345678", "712345678": "+254712345678", "0112345678": "+254112345678",
		"00254712345678": "+254712345678", "+14155552671": "+14155552671",
	}
	for in, want := range good {
		got, err := NormalizePhone(in)
		if err != nil || got != want {
			t.Errorf("NormalizePhone(%q) = %q, %v; want %q", in, got, err, want)
		}
	}
	for _, in := range []string{"", "abc", "071234567", "07123456789", "+254612345678", "12345", "+0712345678", "07123 45 67a"} {
		if got, err := NormalizePhone(in); err == nil {
			t.Errorf("NormalizePhone(%q) = %q; want error", in, got)
		}
	}
}

func TestNormalizeEmail(t *testing.T) {
	if got, err := NormalizeEmail("  Kelvin@Example.COM "); err != nil || got != "kelvin@example.com" {
		t.Fatalf("got %q, %v", got, err)
	}
	for _, in := range []string{"", "a", "a@b", "Name <a@b.co>", "a@@b.co", "a b@c.co"} {
		if _, err := NormalizeEmail(in); err == nil {
			t.Errorf("NormalizeEmail(%q) should fail", in)
		}
	}
}

func TestParseIdentifier(t *testing.T) {
	if n, k := ParseIdentifier("0712345678"); n != "+254712345678" || k != "phone" {
		t.Errorf("phone: %q %q", n, k)
	}
	if n, k := ParseIdentifier("A@b.co"); n != "a@b.co" || k != "email" {
		t.Errorf("email: %q %q", n, k)
	}
	if n, k := ParseIdentifier("nonsense"); n != "" || k != "" {
		t.Errorf("junk: %q %q", n, k)
	}
}

func TestValidatePassword(t *testing.T) {
	bad := []string{"short1", "onlyletterslong", "1234567890123", "Password123", "gekel12345"}
	for _, p := range bad {
		if err := ValidatePassword(p); err == nil {
			t.Errorf("%q should be rejected", p)
		}
	}
	for _, p := range []string{"Nairobi-Sasa-26", "mchele na maharagwe 2026"} {
		if err := ValidatePassword(p); err != nil {
			t.Errorf("%q should pass: %v", p, err)
		}
	}
	if err := ValidatePassword("abcdefghij1", "ABCDEFGHIJ1"); err == nil {
		t.Error("password equal to related identifier must be rejected")
	}
	long := make([]byte, 129)
	for i := range long {
		long[i] = 'a'
	}
	long[0] = '1'
	if err := ValidatePassword(string(long)); err == nil {
		t.Error("129 chars must be rejected")
	}
}
