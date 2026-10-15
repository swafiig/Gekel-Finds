// Command server runs the GEKEL Finds API.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"

	"github.com/geofreysakayo/gekel-finds-auth/internal/auth"
	"github.com/geofreysakayo/gekel-finds-auth/internal/config"
	"github.com/geofreysakayo/gekel-finds-auth/internal/httpx"
	"github.com/geofreysakayo/gekel-finds-auth/internal/server"
	"github.com/geofreysakayo/gekel-finds-auth/internal/users"
)

func main() {
	log := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	if err := run(log); err != nil {
		log.Error("fatal", "err", err)
		os.Exit(1)
	}
}

func run(log *slog.Logger) error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	/* Postgres */
	pcfg, err := pgxpool.ParseConfig(cfg.DatabaseURL)
	if err != nil {
		return err
	}
	pcfg.MaxConns, pcfg.MinConns = 20, 2
	pcfg.MaxConnLifetime, pcfg.HealthCheckPeriod = time.Hour, time.Minute
	db, err := pgxpool.NewWithConfig(ctx, pcfg)
	if err != nil {
		return err
	}
	defer db.Close()
	if err = db.Ping(ctx); err != nil {
		return err
	}

	/* Redis */
	ropt, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		return err
	}
	ropt.DialTimeout, ropt.ReadTimeout, ropt.WriteTimeout = 3*time.Second, 2*time.Second, 2*time.Second
	rdb := redis.NewClient(ropt)
	defer rdb.Close()
	if err = rdb.Ping(ctx).Err(); err != nil {
		return err
	}

	/* Services */
	hasher, err := auth.NewHasher(max(2, runtime.NumCPU()))
	if err != nil {
		return err
	}
	var notify auth.Notifier = auth.ConsoleNotifier{Log: log}
	if cfg.ATUsername != "" {
		notify = auth.AfricasTalking{Username: cfg.ATUsername, APIKey: cfg.ATAPIKey, Sender: cfg.ATSender, Sandbox: cfg.ATSandbox}
	} else if cfg.IsProd() {
		return errors.New("refusing to start in production without an SMS provider")
	}

	limiter := httpx.NewLimiter(rdb, cfg.RateLimitFailClosed)
	tokens := auth.NewTokenManager(cfg.JWTSecret, cfg.JWTIssuer, cfg.JWTAudience, cfg.AccessTTL)
	svc := auth.Service{
		Store: auth.Store{DB: db}, RDB: rdb, Tokens: tokens, Hasher: hasher, Limiter: limiter, Log: log,
		OTP:        auth.OTP{RDB: rdb, Secret: []byte(cfg.OTPSecret), TTL: cfg.OTPTTL, MaxAttempts: 5},
		Notify:     notify,
		RefreshTTL: cfg.RefreshTTL, ResetTTL: cfg.ResetTokenTTL,
	}
	ah := auth.Handler{Svc: svc, Log: log, Trusted: cfg.TrustedProxies}

	handler := server.Router(server.Deps{
		Cfg: cfg, Log: log, DB: db, RDB: rdb, Auth: ah, Users: users.Handler{Auth: ah},
		Authn: auth.Authenticator{Tokens: tokens, RDB: rdb}, Limiter: limiter,
	})

	srv := &http.Server{
		Addr: ":" + cfg.Port, Handler: handler,
		ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second, WriteTimeout: 20 * time.Second,
		IdleTimeout: 60 * time.Second, MaxHeaderBytes: 16 << 10,
	}
	errCh := make(chan error, 1)
	go func() {
		log.Info("api listening", "port", cfg.Port, "env", cfg.Env, "swagger", cfg.SwaggerEnabled)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
	}()

	select {
	case err = <-errCh:
		return err
	case <-ctx.Done():
		log.Info("shutting down")
	}
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	return srv.Shutdown(shutdownCtx)
}
