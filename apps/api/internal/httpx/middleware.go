package httpx

import (
	"context"
	"log/slog"
	"net"
	"net/http"
	"regexp"
	"runtime/debug"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Middleware func(http.Handler) http.Handler

// Chain applies middleware so that the first listed runs first (outermost).
func Chain(h http.Handler, mws ...Middleware) http.Handler {
	for i := len(mws) - 1; i >= 0; i-- {
		h = mws[i](h)
	}
	return h
}

var validReqID = regexp.MustCompile(`^[A-Za-z0-9._-]{8,64}$`)

func WithRequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get("X-Request-ID")
		if !validReqID.MatchString(id) {
			id = uuid.NewString()
		}
		w.Header().Set("X-Request-ID", id)
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), requestIDKey, id)))
	})
}

func Recover(log *slog.Logger) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if rec := recover(); rec != nil {
					log.Error("panic", "request_id", RequestID(r.Context()), "panic", rec, "stack", string(debug.Stack()))
					Error(w, r, http.StatusInternalServerError, "internal_error", "Something went wrong", nil)
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}

type statusWriter struct {
	http.ResponseWriter
	status int
	bytes  int
}

func (s *statusWriter) WriteHeader(c int) { s.status = c; s.ResponseWriter.WriteHeader(c) }
func (s *statusWriter) Write(b []byte) (int, error) {
	if s.status == 0 {
		s.status = http.StatusOK
	}
	n, err := s.ResponseWriter.Write(b)
	s.bytes += n
	return n, err
}

// AccessLog logs one structured line per request. It never logs query strings,
// headers or bodies, so tokens, codes and passwords cannot leak into logs.
func AccessLog(log *slog.Logger, trusted []*net.IPNet) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			sw := &statusWriter{ResponseWriter: w}
			next.ServeHTTP(sw, r)
			if r.URL.Path == "/health" {
				return
			}
			log.Info("http",
				"request_id", RequestID(r.Context()), "method", r.Method, "path", r.URL.Path,
				"status", sw.status, "bytes", sw.bytes, "ms", time.Since(start).Milliseconds(),
				"ip", ClientIP(r, trusted))
		})
	}
}

// SecureHeaders sets defensive headers. The API returns JSON only, so the CSP is maximally strict.
// The Swagger UI path gets a narrow exception (inline styles) it needs to render.
func SecureHeaders(trusted []*net.IPNet) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			h := w.Header()
			h.Set("X-Content-Type-Options", "nosniff")
			h.Set("X-Frame-Options", "DENY")
			h.Set("Referrer-Policy", "no-referrer")
			h.Set("Cross-Origin-Resource-Policy", "same-origin")
			h.Set("Cross-Origin-Opener-Policy", "same-origin")
			h.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()")
			if strings.HasPrefix(r.URL.Path, "/swagger") {
				h.Set("Content-Security-Policy", "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'")
			} else {
				h.Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
				h.Set("Cache-Control", "no-store")
				h.Set("Pragma", "no-cache")
			}
			if IsHTTPS(r, trusted) {
				h.Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
			}
			next.ServeHTTP(w, r)
		})
	}
}

// CORS allows only explicitly configured origins. Native mobile apps do not need CORS at all;
// this exists for a future web client and admin dashboard.
func CORS(allowed []string) Middleware {
	set := map[string]struct{}{}
	for _, o := range allowed {
		set[strings.TrimRight(o, "/")] = struct{}{}
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin != "" {
				w.Header().Add("Vary", "Origin")
				if _, ok := set[origin]; ok {
					h := w.Header()
					h.Set("Access-Control-Allow-Origin", origin)
					h.Set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Request-ID, X-Client")
					h.Set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
					h.Set("Access-Control-Expose-Headers", "X-Request-ID, Retry-After")
					h.Set("Access-Control-Max-Age", "600")
				}
			}
			if r.Method == http.MethodOptions && r.Header.Get("Access-Control-Request-Method") != "" {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// Timeout cancels the request context after d. Handlers must pass r.Context() to DB and Redis calls.
func Timeout(d time.Duration) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx, cancel := context.WithTimeout(r.Context(), d)
			defer cancel()
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
