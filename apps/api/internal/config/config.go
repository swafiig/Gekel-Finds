// Package config loads and validates configuration from environment variables.
// The process refuses to start with weak or missing secrets.
package config

import (
	"fmt"
	"net"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Env  string // development | staging | production
	Port string

	DatabaseURL string
	RedisURL    string

	JWTSecret   string
	OTPSecret   string
	JWTIssuer   string
	JWTAudience string

	AccessTTL     time.Duration
	RefreshTTL    time.Duration
	OTPTTL        time.Duration
	ResetTokenTTL time.Duration

	CORSOrigins    []string
	TrustedProxies []*net.IPNet

	SwaggerEnabled  bool
	SwaggerUser     string
	SwaggerPassword string

	// SMS (Africa's Talking). Required in production.
	ATUsername string
	ATAPIKey   string
	ATSender   string
	ATSandbox  bool

	// If Redis is down, auth endpoints refuse requests (true) or skip rate limiting (false).
	RateLimitFailClosed bool
}

func (c Config) IsProd() bool { return c.Env == "production" }

func Load() (Config, error) {
	c := Config{
		Env:                 get("APP_ENV", "development"),
		Port:                get("API_PORT", "8080"),
		DatabaseURL:         os.Getenv("DATABASE_URL"),
		RedisURL:            os.Getenv("REDIS_URL"),
		JWTSecret:           os.Getenv("JWT_SECRET"),
		OTPSecret:           os.Getenv("OTP_SECRET"),
		JWTIssuer:           get("JWT_ISSUER", "gekel-api"),
		JWTAudience:         get("JWT_AUDIENCE", "gekel"),
		AccessTTL:           dur("ACCESS_TOKEN_TTL", 10*time.Minute),
		RefreshTTL:          dur("REFRESH_TOKEN_TTL", 30*24*time.Hour),
		OTPTTL:              dur("OTP_TTL", 5*time.Minute),
		ResetTokenTTL:       dur("RESET_TOKEN_TTL", 10*time.Minute),
		CORSOrigins:         list(os.Getenv("CORS_ORIGINS")),
		SwaggerEnabled:      boolean("SWAGGER_ENABLED", true),
		SwaggerUser:         os.Getenv("SWAGGER_USER"),
		SwaggerPassword:     os.Getenv("SWAGGER_PASSWORD"),
		ATUsername:          os.Getenv("AT_USERNAME"),
		ATAPIKey:            os.Getenv("AT_API_KEY"),
		ATSender:            os.Getenv("AT_SENDER_ID"),
		ATSandbox:           boolean("AT_SANDBOX", false),
		RateLimitFailClosed: boolean("RATE_LIMIT_FAIL_CLOSED", true),
	}

	if c.DatabaseURL == "" || c.RedisURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL and REDIS_URL are required")
	}
	if len(c.JWTSecret) < 32 {
		return Config{}, fmt.Errorf("JWT_SECRET must be at least 32 characters (try: openssl rand -base64 48)")
	}
	if len(c.OTPSecret) < 32 {
		return Config{}, fmt.Errorf("OTP_SECRET must be at least 32 characters and different from JWT_SECRET")
	}
	if c.JWTSecret == c.OTPSecret {
		return Config{}, fmt.Errorf("OTP_SECRET must differ from JWT_SECRET")
	}
	if c.AccessTTL <= 0 || c.AccessTTL > time.Hour {
		return Config{}, fmt.Errorf("ACCESS_TOKEN_TTL must be between 1s and 1h")
	}

	proxies, err := parseCIDRs(list(os.Getenv("TRUSTED_PROXIES")))
	if err != nil {
		return Config{}, err
	}
	c.TrustedProxies = proxies

	if c.IsProd() {
		if c.ATUsername == "" || c.ATAPIKey == "" {
			return Config{}, fmt.Errorf("AT_USERNAME and AT_API_KEY are required in production (OTP delivery)")
		}
		for _, o := range c.CORSOrigins {
			if o == "*" {
				return Config{}, fmt.Errorf("CORS_ORIGINS must not contain * in production")
			}
		}
		if c.SwaggerEnabled && (c.SwaggerUser == "" || c.SwaggerPassword == "") {
			return Config{}, fmt.Errorf("set SWAGGER_USER and SWAGGER_PASSWORD, or SWAGGER_ENABLED=false, in production")
		}
	}
	return c, nil
}

func parseCIDRs(items []string) ([]*net.IPNet, error) {
	var out []*net.IPNet
	for _, it := range items {
		if !strings.Contains(it, "/") {
			if strings.Contains(it, ":") {
				it += "/128"
			} else {
				it += "/32"
			}
		}
		_, n, err := net.ParseCIDR(it)
		if err != nil {
			return nil, fmt.Errorf("TRUSTED_PROXIES: %q is not a valid IP or CIDR", it)
		}
		out = append(out, n)
	}
	return out, nil
}

func get(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

func dur(k string, d time.Duration) time.Duration {
	if v := os.Getenv(k); v != "" {
		if x, err := time.ParseDuration(v); err == nil {
			return x
		}
	}
	return d
}

func boolean(k string, d bool) bool {
	if v := os.Getenv(k); v != "" {
		if x, err := strconv.ParseBool(v); err == nil {
			return x
		}
	}
	return d
}

func list(v string) []string {
	var out []string
	for _, x := range strings.Split(v, ",") {
		if x = strings.TrimSpace(x); x != "" {
			out = append(out, x)
		}
	}
	return out
}
