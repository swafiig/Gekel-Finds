package httpx

import (
	"context"
	"net"
	"net/http"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

// Limiter is a Redis fixed-window counter. The INCR+PEXPIRE pair runs in one Lua script,
// so a crash can never leave a key without an expiry.
type Limiter struct {
	rdb        *redis.Client
	FailClosed bool
}

func NewLimiter(rdb *redis.Client, failClosed bool) *Limiter {
	return &Limiter{rdb: rdb, FailClosed: failClosed}
}

var hitScript = redis.NewScript(`
local c = redis.call('INCR', KEYS[1])
local ttl = redis.call('PTTL', KEYS[1])
if c == 1 or ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {c, ttl}
`)

// Hit increments the counter for key and returns the new count and time until reset.
func (l *Limiter) Hit(ctx context.Context, key string, window time.Duration) (int64, time.Duration, error) {
	res, err := hitScript.Run(ctx, l.rdb, []string{key}, window.Milliseconds()).Int64Slice()
	if err != nil || len(res) != 2 {
		return 0, 0, err
	}
	return res[0], time.Duration(res[1]) * time.Millisecond, nil
}

// Count reads the counter without incrementing it.
func (l *Limiter) Count(ctx context.Context, key string) (int64, time.Duration, error) {
	pipe := l.rdb.Pipeline()
	g := pipe.Get(ctx, key)
	t := pipe.PTTL(ctx, key)
	_, err := pipe.Exec(ctx)
	if err != nil && err != redis.Nil {
		return 0, 0, err
	}
	n, _ := g.Int64()
	return n, t.Val(), nil
}

func (l *Limiter) Reset(ctx context.Context, key string) { l.rdb.Del(ctx, key) }

// Allow counts one hit and reports whether it is within limit.
func (l *Limiter) Allow(ctx context.Context, key string, limit int, window time.Duration) (bool, time.Duration, error) {
	n, ttl, err := l.Hit(ctx, key, window)
	if err != nil {
		return !l.FailClosed, 0, err
	}
	return n <= int64(limit), ttl, nil
}

// PerIP limits requests per client IP for one named bucket.
func (l *Limiter) PerIP(name string, limit int, window time.Duration, trusted []*net.IPNet) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := ClientIP(r, trusted)
			ok, retry, err := l.Allow(r.Context(), "rl:"+name+":"+ip, limit, window)
			if err != nil && l.FailClosed {
				Error(w, r, http.StatusServiceUnavailable, "service_unavailable", "Please try again shortly", nil)
				return
			}
			w.Header().Set("RateLimit-Limit", strconv.Itoa(limit))
			if !ok {
				TooMany(w, r, retry, "rate_limited", "Too many requests. Please slow down and try again later.")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
