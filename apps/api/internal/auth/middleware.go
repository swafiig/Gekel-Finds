package auth

import (
	"context"
	"net/http"
	"strconv"

	"github.com/redis/go-redis/v9"

	"github.com/geofreysakayo/gekel-finds-auth/internal/httpx"
)

type claimsKey struct{}

func ClaimsFrom(ctx context.Context) (Claims, bool) {
	c, ok := ctx.Value(claimsKey{}).(Claims)
	return c, ok
}

type Authenticator struct {
	Tokens TokenManager
	RDB    *redis.Client
}

func unauthorized(w http.ResponseWriter, r *http.Request, code, msg string) {
	w.Header().Set("WWW-Authenticate", `Bearer realm="gekel"`)
	httpx.Error(w, r, http.StatusUnauthorized, code, msg, nil)
}

// Require verifies the access token and then checks Redis, so logout, password change,
// reuse detection and account disabling take effect immediately, not when the token expires.
func (a Authenticator) Require(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		raw := BearerToken(r.Header.Get("Authorization"))
		if raw == "" {
			unauthorized(w, r, "unauthenticated", "Sign in to continue")
			return
		}
		c, err := a.Tokens.ParseAccess(raw)
		if err != nil {
			unauthorized(w, r, "invalid_token", "Your session has expired. Please sign in again")
			return
		}
		vals, err := a.RDB.MGet(r.Context(), "revoked:sid:"+c.SessionID, "revoked_after:"+c.UserID).Result()
		if err != nil {
			httpx.Error(w, r, http.StatusServiceUnavailable, "service_unavailable", "Please try again shortly", nil)
			return
		}
		if vals[0] != nil {
			unauthorized(w, r, "session_revoked", "This session was signed out")
			return
		}
		if s, ok := vals[1].(string); ok {
			if after, perr := strconv.ParseInt(s, 10, 64); perr == nil && c.IssuedMs < after {
				unauthorized(w, r, "session_revoked", "This session was signed out")
				return
			}
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), claimsKey{}, c)))
	})
}

// RequireRoles must run after Require.
func RequireRoles(roles ...Role) httpx.Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			c, ok := ClaimsFrom(r.Context())
			if !ok {
				unauthorized(w, r, "unauthenticated", "Sign in to continue")
				return
			}
			for _, role := range roles {
				if c.Role == role {
					next.ServeHTTP(w, r)
					return
				}
			}
			httpx.Error(w, r, http.StatusForbidden, "forbidden", "You do not have permission to do this", nil)
		})
	}
}
