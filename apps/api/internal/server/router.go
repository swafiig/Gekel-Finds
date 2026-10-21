package server

import (
	"context"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"

	"github.com/geofreysakayo/gekel-finds-auth/docs"
	"github.com/geofreysakayo/gekel-finds-auth/internal/auth"
	"github.com/geofreysakayo/gekel-finds-auth/internal/catalog"

	"github.com/geofreysakayo/gekel-finds-auth/internal/config"
	"github.com/geofreysakayo/gekel-finds-auth/internal/httpx"
	"github.com/geofreysakayo/gekel-finds-auth/internal/products"
	"github.com/geofreysakayo/gekel-finds-auth/internal/users"
)

type Deps struct {
	Cfg     config.Config
	Log     *slog.Logger
	DB      *pgxpool.Pool
	RDB     *redis.Client
	Auth    auth.Handler
	Users   users.Handler
	Authn   auth.Authenticator
	Limiter *httpx.Limiter
}

func Router(d Deps) http.Handler {
	mux := http.NewServeMux()
	tr := d.Cfg.TrustedProxies
	rl := func(name string, limit int, window time.Duration) httpx.Middleware {
		return d.Limiter.PerIP(name, limit, window, tr)
	}
	authn := httpx.Middleware(d.Authn.Require)
	// protect = valid access token (+ optional role check, + optional extra middleware)
	protect := func(h http.HandlerFunc, extra ...httpx.Middleware) http.Handler {
		return httpx.Chain(h, append([]httpx.Middleware{authn}, extra...)...)
	}
	public := func(h http.HandlerFunc, limit httpx.Middleware) http.Handler { return httpx.Chain(h, limit) }

	/* health */
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		httpx.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("GET /ready", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		if err := d.DB.Ping(ctx); err != nil {
			httpx.Error(w, r, http.StatusServiceUnavailable, "db_unavailable", "Database is not reachable", nil)
			return
		}
		if err := d.RDB.Ping(ctx).Err(); err != nil {
			httpx.Error(w, r, http.StatusServiceUnavailable, "redis_unavailable", "Redis is not reachable", nil)
			return
		}
		httpx.JSON(w, http.StatusOK, map[string]string{"status": "ready"})
	})

	/* public auth endpoints: strict per-IP limits. Account-level lockouts live in the service. */
	a := d.Auth
	mux.Handle("POST /api/v1/auth/register", public(a.Register, rl("register", 5, time.Hour)))
	mux.Handle("POST /api/v1/auth/login", public(a.Login, rl("login", 30, 10*time.Minute)))
	mux.Handle("POST /api/v1/auth/refresh", public(a.Refresh, rl("refresh", 60, time.Minute)))
	mux.Handle("POST /api/v1/auth/forgot-password", public(a.ForgotPassword, rl("forgot", 20, time.Hour)))
	mux.Handle("POST /api/v1/auth/verify-otp", public(a.VerifyOTP, rl("verify_otp", 40, 15*time.Minute)))
	mux.Handle("POST /api/v1/auth/reset-password", public(a.ResetPassword, rl("reset", 10, 15*time.Minute)))


	/* signed-in endpoints */
	u := d.Users
	
	mux.Handle("GET /api/v1/auth/me", protect(a.Me))
	mux.Handle("POST /api/v1/auth/logout", protect(a.Logout))
	mux.Handle("POST /api/v1/auth/logout-all", protect(a.LogoutAll, rl("logout_all", 10, time.Hour)))
	mux.Handle("POST /api/v1/auth/change-password", protect(a.ChangePassword, rl("change_pw", 10, 15*time.Minute)))
	mux.Handle("POST /api/v1/auth/phone/send-code", protect(a.SendPhoneCode, rl("pv_send", 20, time.Hour)))
	mux.Handle("POST /api/v1/auth/phone/verify", protect(a.VerifyPhone, rl("pv_verify", 40, 15*time.Minute)))
	mux.Handle("GET /api/v1/auth/sessions", protect(a.Sessions))
	mux.Handle("DELETE /api/v1/auth/sessions/{id}", protect(a.RevokeSession))
	mux.Handle("POST /api/v1/users/push-token", protect(u.UpdatePushToken))
	mux.Handle("GET /api/v1/notifications", protect(u.ListNotifications))
	mux.Handle("POST /api/v1/notifications/read", protect(u.MarkNotificationsRead))
	catHandler := catalog.Handler{DB: d.DB}
	prodHandler := products.Handler{DB: d.DB}
	
	mux.HandleFunc("GET /api/v1/categories", catHandler.List)
	mux.HandleFunc("GET /api/v1/categories/subcategories", catHandler.ListSubcategories)
	mux.HandleFunc("GET /api/v1/products", prodHandler.ListProducts)
	mux.HandleFunc("GET /api/v1/suppliers", prodHandler.ListSuppliers)

	/* users */

	staff := auth.RequireRoles(auth.RoleStaff, auth.RoleAdmin, auth.RoleSuperAdmin)
	admin := auth.RequireRoles(auth.RoleAdmin, auth.RoleSuperAdmin)
	super := auth.RequireRoles(auth.RoleSuperAdmin)
	mux.Handle("GET /api/v1/users/me", protect(a.Me))
	mux.Handle("PATCH /api/v1/users/me", protect(u.UpdateMe))
	mux.Handle("GET /api/v1/users", protect(u.List, staff))
	mux.Handle("GET /api/v1/users/{id}", protect(u.Get, staff))
	mux.Handle("PATCH /api/v1/users/{id}/status", protect(u.SetStatus, admin))
	mux.Handle("PATCH /api/v1/users/{id}/role", protect(u.SetRole, super))

	/* API docs */
	if d.Cfg.SwaggerEnabled {
		sw := docs.Handler(d.Cfg.SwaggerUser, d.Cfg.SwaggerPassword)
		mux.Handle("/swagger/", sw)
		mux.Handle("/swagger", sw)
	}

	// Catch-all: JSON 404, or JSON 405 + Allow header when the path exists under another method.
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		var allowed []string
		for _, m := range []string{http.MethodGet, http.MethodPost, http.MethodPatch, http.MethodPut, http.MethodDelete} {
			probe := r.Clone(r.Context())
			probe.Method = m
			if _, pattern := mux.Handler(probe); pattern != "" && pattern != "/" {
				allowed = append(allowed, m)
			}
		}
		if len(allowed) > 0 {
			w.Header().Set("Allow", strings.Join(allowed, ", "))
			httpx.Error(w, r, http.StatusMethodNotAllowed, "method_not_allowed", "Method not allowed for this endpoint", nil)
			return
		}
		httpx.Error(w, r, http.StatusNotFound, "not_found", "No such endpoint", nil)
	})

	return httpx.Chain(mux,
		httpx.WithRequestID,
		httpx.Recover(d.Log),
		httpx.AccessLog(d.Log, tr),
		httpx.SecureHeaders(tr),
		httpx.CORS(d.Cfg.CORSOrigins),
		rl("global", 300, time.Minute),
		httpx.Timeout(15*time.Second),
	)
}
