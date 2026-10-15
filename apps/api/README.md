# GEKEL Finds API (Go)

Auth, sessions and user endpoints for the GEKEL apps. Go 1.24+, Postgres, Redis. Swagger UI is built in.

## Quick start
```bash
cp .env.example .env            # fill JWT_SECRET and OTP_SECRET:  make secrets
go mod tidy                     # creates go.sum (one time)
docker compose up --build       # Postgres + Redis + API   (or: make migrate && make run)
open http://localhost:8080/swagger/
```
In development the SMS code is printed in the server log (`"DEV ONLY: OTP not sent by SMS"`). In production the server **refuses to start** without SMS credentials, real secrets, and Swagger credentials (or `SWAGGER_ENABLED=false`).

## Endpoints (`/api/v1`)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | public | Create a **buyer** account (phone required, email optional), returns tokens. Suppliers/riders/staff use their own apps |
| POST | `/auth/login` | public | Phone **or** email + password |
| POST | `/auth/refresh` | public | Rotate refresh token, returns new tokens + user |
| POST | `/auth/forgot-password` | public | Send 6-digit SMS code (always `202`) |
| POST | `/auth/verify-otp` | public | Code → single-use `reset_token` |
| POST | `/auth/reset-password` | public | `reset_token` + new password; signs out everywhere |
| GET | `/auth/me` | bearer | Current user |
| POST | `/auth/logout` | bearer | Sign out this device (instant) |
| POST | `/auth/logout-all` | bearer | Sign out every device |
| POST | `/auth/change-password` | bearer | Keeps this device, signs out others |
| POST | `/auth/phone/send-code` | bearer | (Re)send the phone verification SMS (one is sent automatically at signup) |
| POST | `/auth/phone/verify` | bearer | Confirm the phone with the 6-digit code; sets `phone_verified_at` |
| GET | `/auth/sessions` | bearer | List devices |
| DELETE | `/auth/sessions/{id}` | bearer | Sign out one device |
| GET / PATCH | `/users/me` | bearer | Profile (name, email) |
| GET | `/users`, `/users/{id}` | staff, admin, super_admin | List (keyset pagination, search) / read |
| PATCH | `/users/{id}/status` | admin, super_admin | Enable / disable (kicks the user out instantly) |
| PATCH | `/users/{id}/role` | super_admin | Change role |
| GET | `/health`, `/ready` | public | Liveness / readiness (Postgres + Redis) |
| GET | `/categories` | public | The 15 Kenyan product categories (cached 1h) |

Every error is `{"error":{"code","message","fields?","request_id"}}`.

## How the tokens work
* **Access token**: HS256 JWT, 10 minutes, claims `sub, sid, role, iat, exp, iss, aud, jti`.
* **Refresh token**: 48 random bytes, 30 days, **single use**. Only its SHA-256 is stored.
* Each refresh rotates the token. If an old one is replayed, the **whole token family is revoked** and the user must sign in again (theft detection).
* Logout, logout-all, password change/reset, disabling an account and role changes are enforced **immediately** through Redis (`revoked:sid:*`, `revoked_after:*`), not at token expiry.

## Security measures
| Threat | Defence | Where |
|---|---|---|
| Password theft from a DB leak | Argon2id (64 MiB, t=3, p=2), per-hash salt, rehash-on-login when parameters change | `auth/password.go` |
| Argon2 memory DoS | Concurrency semaphore; parameters bounds-checked when parsing stored hashes | `auth/password.go` |
| Credential stuffing / brute force | 5 failures per identifier → 15 min lock; per-IP limits; Redis fixed-window limiter on every public route | `auth/service.go`, `httpx/ratelimit.go` |
| Account enumeration | Same response and same timing for unknown accounts (dummy hash); forgot-password always `202`; same limits whether or not the account exists | `auth/service.go` |
| Refresh token theft | Rotation + reuse detection + family revocation | `auth/store.go` |
| Stolen/forged JWT | Algorithm pinned to HS256 (`none`/HS512 rejected), issuer + audience + expiry required, 32+ char secret enforced | `auth/tokens.go`, `config` |
| Revoked sessions still valid | Redis revocation check on every authenticated request | `auth/middleware.go` |
| OTP guessing | HMAC-SHA256 digests (not plain hashes), 5 attempts per code, single use, 60 s resend cooldown, 5/hour per identifier | `auth/otp.go` |
| Phone-number squatting | A code is SMSed at signup; `phone_verified_at` is set only after the code is entered (HMAC-stored, 5 tries, single use, bound to that phone). Reset codes go to the phone on file | `auth/service.go` |
| Weak passwords | 10–128 chars, letter + digit, common-password blocklist, not equal to phone/email (NIST 800-63B style) | `auth/validate.go` |
| Privilege escalation | Public signup creates **buyer accounts only** — there is no `role` field to abuse; suppliers, riders, staff and admins are created separately. Role changes need `super_admin`; admins cannot touch staff/admin accounts or themselves | `auth/service.go`, `users/handlers.go` |
| IP spoofing to dodge limits | `X-Forwarded-For` honoured only from `TRUSTED_PROXIES`, right-most untrusted hop used | `httpx/clientip.go` |
| Injection | Parameterised SQL only; `LIKE` wildcards escaped; strict JSON (unknown fields, trailing data, wrong content-type, >64 KiB all rejected) | `auth/store.go`, `httpx/respond.go` |
| Browser attacks on the docs/API | CSP `default-src 'none'`, nosniff, DENY framing, no-store, HSTS over TLS; Swagger UI self-hosted (no CDN) under a narrow CSP, optional basic auth | `httpx/middleware.go`, `docs/` |
| Secrets in logs | Access log records method/path/status only, never queries, headers or bodies; audit log stores no secrets | `httpx/middleware.go` |
| Forensics | `auth_audit_logs` (login ok/fail, reuse detected, resets, admin actions) with IP + user agent | `auth/store.go` |

All of the above is exercised by the tests: `go test ./...` (unit) and an end-to-end run against real Postgres + Redis (111 checks: lockout, rotation and reuse, instant logout, OTP, phone verification, RBAC, `alg=none` forgery, log scrubbing); `scripts/e2e.py` is that run.

## Production checklist
* [ ] TLS in front (Caddy/nginx/ALB) and `TRUSTED_PROXIES` set to its address range.
* [ ] `JWT_SECRET` and `OTP_SECRET`: different, random, 32+ chars, stored in a secrets manager.
* [ ] Postgres `sslmode=require` (or verify-full); Redis with a password/TLS, not exposed publicly.
* [ ] `APP_ENV=production`, `AT_USERNAME`/`AT_API_KEY` set (verify the SMS request against your Africa's Talking account), Swagger credentials set or disabled.
* [ ] Cron to purge old sessions (SQL at the bottom of `002_auth.sql`).
* [ ] Back up Postgres. Redis holds only short-lived state and can be lost safely (users stay signed in; rate limits reset).

## Make the first super admin
Nobody can grant themselves admin through the API. Register normally, then:
```sql
UPDATE users SET role = 'super_admin' WHERE phone = '+2547XXXXXXXX';
```
and sign in again (the role lives in the token).

## Not included yet (good next steps)
Email verification, TOTP 2FA for admin roles, a rule that blocks ordering until the phone is verified (the `phone_verified_at` field is already there to build it on), token signing-key rotation (`kid`), CAPTCHA on register, Prometheus metrics.

## Notes
* `go.sum` is not shipped: run `go mod tidy` once. I compiled and tested with Go 1.22 against slightly older pgx (5.7.1) and x/crypto (0.31.0) because this was built in a sandbox without access to the Go proxy; `go.mod` pins the versions from your original file (pgx 5.8.0, x/crypto 0.43.0, go-redis 9.14.0, jwt 5.3.0), which only need Go 1.24+.
* Changes from the earlier `gekel-finds-auth-api` zip: fixed `go.mod` (pgxpool is not a separate module), Redis URL parsing, IPv6 client IPs, 204 bodies; added refresh reuse detection, lockout, rate limits, instant revocation, phone login, OTP reset flow, users endpoints, self-hosted Swagger UI and the missing base users migration.
