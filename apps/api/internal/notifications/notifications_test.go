package notifications

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestSendBuildsCorrectPayload(t *testing.T) {
	// 1. Create a mock server to intercept the HTTP call
	var receivedBody []byte
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedBody, _ = io.ReadAll(r.Body)
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	// 2. Point the sender to the mock server
	originalURL := ExpoPushURL
	ExpoPushURL = server.URL
	defer func() { ExpoPushURL = originalURL }()

	// 3. Send a test notification
	log := slog.New(slog.NewTextHandler(io.Discard, nil)) // Discard logs
	Send("ExponentPushToken[abc123]", "Test Title", "Test Body", map[string]string{"type": "order"}, log)

	// 4. Verify the payload
	var msg ExpoPushMessage
	if err := json.Unmarshal(receivedBody, &msg); err != nil {
		t.Fatalf("failed to unmarshal payload: %v", err)
	}

	if msg.To != "ExponentPushToken[abc123]" {
		t.Errorf("wrong token: %s", msg.To)
	}
	if msg.Title != "Test Title" {
		t.Errorf("wrong title: %s", msg.Title)
	}
	if msg.Data["type"] != "order" {
		t.Errorf("wrong data: %v", msg.Data)
	}
}

func TestSendSkipsEmptyToken(t *testing.T) {
	// If the token is empty, it should not even try to make an HTTP request
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("HTTP request was made despite empty token")
	}))
	defer server.Close()

	originalURL := ExpoPushURL
	ExpoPushURL = server.URL
	defer func() { ExpoPushURL = originalURL }()

	log := slog.New(slog.NewTextHandler(io.Discard, nil))
	Send("", "Title", "Body", nil, log) // Should return silently
}