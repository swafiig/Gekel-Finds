package auth

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Notifier delivers one-time codes. Implementations must never log the code in production.
type Notifier interface {
	SendOTP(ctx context.Context, phone, code string, ttl time.Duration) error
}

// ConsoleNotifier prints codes to the log. Development only: main refuses to use it in production.
type ConsoleNotifier struct{ Log *slog.Logger }

func (n ConsoleNotifier) SendOTP(_ context.Context, phone, code string, _ time.Duration) error {
	n.Log.Warn("DEV ONLY: OTP not sent by SMS", "phone", phone, "code", code)
	return nil
}

// AfricasTalking sends SMS through the Africa's Talking messaging API.
// Check the field names against your account's API docs before going live.
type AfricasTalking struct {
	Username, APIKey, Sender string
	Sandbox                  bool
	Client                   *http.Client
}

func (a AfricasTalking) SendOTP(ctx context.Context, phone, code string, ttl time.Duration) error {
	endpoint := "https://api.africastalking.com/version1/messaging"
	if a.Sandbox {
		endpoint = "https://api.sandbox.africastalking.com/version1/messaging"
	}
	form := url.Values{}
	form.Set("username", a.Username)
	form.Set("to", phone)
	form.Set("message", fmt.Sprintf("Your GEKEL code is %s. It expires in %d minutes. Never share this code with anyone.", code, int(ttl.Minutes())))
	if a.Sender != "" {
		form.Set("from", a.Sender)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, strings.NewReader(form.Encode()))
	if err != nil {
		return err
	}
	req.Header.Set("apiKey", a.APIKey)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	c := a.Client
	if c == nil {
		c = &http.Client{Timeout: 8 * time.Second}
	}
	resp, err := c.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, io.LimitReader(resp.Body, 1<<16))
	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		return fmt.Errorf("sms provider returned status %d", resp.StatusCode)
	}
	return nil
}
