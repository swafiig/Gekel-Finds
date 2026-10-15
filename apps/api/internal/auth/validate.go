package auth

import (
	"errors"
	"net/mail"
	"regexp"
	"strings"
	"unicode"
	"unicode/utf8"
)

var (
	reLocal1   = regexp.MustCompile(`^0[17]\d{8}$`)
	reIntl254  = regexp.MustCompile(`^254[17]\d{8}$`)
	reBare9    = regexp.MustCompile(`^[17]\d{8}$`)
	reE164     = regexp.MustCompile(`^\+[1-9]\d{7,14}$`)
	reKenyaE   = regexp.MustCompile(`^\+254[17]\d{8}$`)
	errPhone   = errors.New("Enter a valid phone number, e.g. 0712 345 678")
	errEmail   = errors.New("Enter a valid email address")
	errName    = errors.New("Enter your full name (2 to 80 characters)")
	spacesOnly = regexp.MustCompile(`\s+`)
)

// NormalizePhone converts Kenyan local formats (0712…, 254712…, +254712…) to E.164 (+254712…).
// Other countries are accepted only in full international format.
func NormalizePhone(raw string) (string, error) {
	s := strings.Map(func(r rune) rune {
		if unicode.IsSpace(r) || r == '-' || r == '(' || r == ')' || r == '.' {
			return -1
		}
		return r
	}, raw)
	switch {
	case strings.HasPrefix(s, "+"):
	case strings.HasPrefix(s, "00"):
		s = "+" + s[2:]
	case reLocal1.MatchString(s):
		s = "+254" + s[1:]
	case reIntl254.MatchString(s):
		s = "+" + s
	case reBare9.MatchString(s):
		s = "+254" + s
	default:
		return "", errPhone
	}
	if !reE164.MatchString(s) || (strings.HasPrefix(s, "+254") && !reKenyaE.MatchString(s)) {
		return "", errPhone
	}
	return s, nil
}

func NormalizeEmail(raw string) (string, error) {
	s := strings.ToLower(strings.TrimSpace(raw))
	if s == "" || len(s) > 254 {
		return "", errEmail
	}
	a, err := mail.ParseAddress(s)
	if err != nil || a.Address != s {
		return "", errEmail
	}
	at := strings.LastIndex(s, "@")
	if at < 1 || !strings.Contains(s[at+1:], ".") {
		return "", errEmail
	}
	return s, nil
}

func NormalizeName(raw string) (string, error) {
	s := strings.TrimSpace(spacesOnly.ReplaceAllString(raw, " "))
	n := utf8.RuneCountInString(s)
	if n < 2 || n > 80 {
		return "", errName
	}
	for _, r := range s {
		if unicode.IsControl(r) || r == '<' || r == '>' {
			return "", errName
		}
	}
	return s, nil
}

// ParseIdentifier turns what a user typed into a normalized email or E.164 phone.
// kind is "email", "phone", or "" when the input is neither.
func ParseIdentifier(raw string) (normalized, kind string) {
	raw = strings.TrimSpace(raw)
	if strings.Contains(raw, "@") {
		if e, err := NormalizeEmail(raw); err == nil {
			return e, "email"
		}
		return "", ""
	}
	if p, err := NormalizePhone(raw); err == nil {
		return p, "phone"
	}
	return "", ""
}

var commonPasswords = map[string]struct{}{}

func init() {
	for _, p := range []string{
		"password12", "password123", "password1234", "passw0rd123", "qwerty12345", "qwertyuiop1", "1234567890", "12345678910",
		"123456789a", "abc1234567", "abcd123456", "iloveyou123", "welcome123", "welcome1234", "admin12345", "letmein1234",
		"kenya12345", "kenya254254", "nairobi123", "nairobi1234", "mombasa123", "mpesa12345", "safaricom1", "gekel12345",
		"gekelfinds1", "monkey1234", "dragon1234", "football123", "changeme123", "p@ssw0rd123", "1q2w3e4r5t", "0000000000a",
	} {
		commonPasswords[p] = struct{}{}
	}
}

// ValidatePassword enforces: 10 to 128 characters, at least one letter and one digit,
// not a well-known password, and not equal to the user's phone or email.
// Length-based rules follow NIST SP 800-63B (no forced symbols, no expiry).
func ValidatePassword(pw string, related ...string) error {
	n := utf8.RuneCountInString(pw)
	switch {
	case n < 10:
		return errors.New("Use at least 10 characters")
	case n > 128:
		return errors.New("Use at most 128 characters")
	}
	var letter, digit bool
	for _, r := range pw {
		if unicode.IsLetter(r) {
			letter = true
		} else if unicode.IsDigit(r) {
			digit = true
		}
	}
	if !letter || !digit {
		return errors.New("Include at least one letter and one number")
	}
	if _, bad := commonPasswords[strings.ToLower(pw)]; bad {
		return errors.New("That password is too common. Choose something harder to guess")
	}
	for _, r := range related {
		if r != "" && strings.EqualFold(pw, r) {
			return errors.New("Password must not be the same as your phone number or email")
		}
	}
	return nil
}
