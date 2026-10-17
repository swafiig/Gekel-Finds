package notifications

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ExpoPushMessage struct {
	To    string            `json:"to"`
	Title string            `json:"title"`
	Body  string            `json:"body"`
	Data  map[string]string `json:"data,omitempty"`
	Sound string            `json:"sound,omitempty"`
}

var ExpoPushURL = "https://exp.host/--/api/v2/push/send"


func SendAndSave(ctx context.Context, db *pgxpool.Pool, log *slog.Logger, userID, token, title, body, notifType, refID string) {

	if db != nil {
		_, err := db.Exec(ctx, `
			INSERT INTO user_notifications (user_id, title, body, type, reference_id)
			VALUES ($1, $2, $3, $4, $5)`,
			userID, title, body, notifType, refID,
		)
		if err != nil {
			log.Error("notifications: failed to save to DB", "err", err)
		}
	}

	
	if token == "" {
		return
	}
	msg := ExpoPushMessage{
		To:    token,
		Title: title,
		Body:  body,
		Data:  map[string]string{"type": notifType, "id": refID},
		Sound: "default",
	}
	payload, _ := json.Marshal(msg)
	resp, err := http.Post(ExpoPushURL, "application/json", bytes.NewBuffer(payload))
	if err != nil {
		log.Error("notifications: push failed", "err", err)
		return
	}
	defer resp.Body.Close()
}