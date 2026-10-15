// Package httpx holds HTTP plumbing shared by every feature package:
// JSON responses, uniform errors, middleware, rate limiting and client-IP detection.
// It must not import feature packages (auth, users) to avoid import cycles.
package httpx

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"mime"
	"net/http"
	"strconv"
	"time"
)

type ctxKey int

const requestIDKey ctxKey = 1

func RequestID(ctx context.Context) string {
	v, _ := ctx.Value(requestIDKey).(string)
	return v
}

// ErrorBody is the single error shape returned by the API.
type ErrorBody struct {
	Error ErrorDetail `json:"error"`
}
type ErrorDetail struct {
	Code      string            `json:"code"`
	Message   string            `json:"message"`
	Fields    map[string]string `json:"fields,omitempty"`
	RequestID string            `json:"request_id,omitempty"`
}

func JSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if v != nil {
		_ = json.NewEncoder(w).Encode(v)
	}
}

func NoContent(w http.ResponseWriter) { w.WriteHeader(http.StatusNoContent) }

func Error(w http.ResponseWriter, r *http.Request, status int, code, msg string, fields map[string]string) {
	JSON(w, status, ErrorBody{Error: ErrorDetail{Code: code, Message: msg, Fields: fields, RequestID: RequestID(r.Context())}})
}

// TooMany writes a 429 with Retry-After.
func TooMany(w http.ResponseWriter, r *http.Request, retry time.Duration, code, msg string) {
	secs := int(retry.Seconds())
	if secs < 1 {
		secs = 1
	}
	w.Header().Set("Retry-After", strconv.Itoa(secs))
	Error(w, r, http.StatusTooManyRequests, code, msg, nil)
}

// DecodeJSON reads exactly one JSON object: size-capped, content-type checked,
// unknown fields rejected, trailing garbage rejected.
func DecodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	mt, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
	if err != nil || mt != "application/json" {
		Error(w, r, http.StatusUnsupportedMediaType, "unsupported_media_type", "Content-Type must be application/json", nil)
		return false
	}
	r.Body = http.MaxBytesReader(w, r.Body, 64<<10)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		var tooBig *http.MaxBytesError
		if errors.As(err, &tooBig) {
			Error(w, r, http.StatusRequestEntityTooLarge, "payload_too_large", "Request body is too large", nil)
		} else {
			Error(w, r, http.StatusBadRequest, "invalid_json", "Request body is not valid JSON for this endpoint", nil)
		}
		return false
	}
	if _, err := dec.Token(); err != io.EOF {
		Error(w, r, http.StatusBadRequest, "invalid_json", "Request body must contain a single JSON object", nil)
		return false
	}
	return true
}
