package notifications

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
)

type ExpoPushMessage struct {
	To    string            `json:"to"`
	Title string            `json:"title"`
	Body  string            `json:"body"`
	Data  map[string]string `json:"data,omitempty"`
	Sound string            `json:"sound,omitempty"`
}

var ExpoPushURL = "https://exp.host/--/api/v2/push/send" 

func Send(token, title, body string, data map[string]string, log *slog.Logger) {
	if token == "" {
		return
	}

	msg := ExpoPushMessage{
		To:    token,
		Title: title,
		Body:  body,
		Data:  data,
		Sound: "default",
	}

	payload, err := json.Marshal(msg)
	if err != nil {
		log.Error("notifications: marshal failed", "err", err)
		return
	}

	resp, err := http.Post(ExpoPushURL, "application/json", bytes.NewBuffer(payload))
	if err != nil {
		log.Error("notifications: post failed", "err", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Warn("notifications: non-200 from expo", "status", resp.StatusCode)
	}
}