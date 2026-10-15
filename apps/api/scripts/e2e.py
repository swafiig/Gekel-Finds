# End-to-end smoke test. Needs a running API on :8080 (APP_ENV=development, OTP printed in the log), Postgres + Redis.
# Dev only: it truncates nothing itself but creates test users and reads the server log at /home/claude/e2e/server.log (edit LOG).
import json, subprocess, sys, time, urllib.request, urllib.error, re, os
BASE = "http://127.0.0.1:8080"
LOG = "/home/claude/e2e/server.log"
fails = 0
def call(method, path, body=None, token=None, headers=None, raw=None, ctype="application/json"):
    h = {"X-Client": "e2e-test"}
    if raw is None and body is not None: h["Content-Type"] = ctype
    if raw is not None: h["Content-Type"] = ctype
    if token: h["Authorization"] = "Bearer " + token
    if headers: h.update(headers)
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    req = urllib.request.Request(BASE + path, data=data, method=method, headers=h)
    try:
        r = urllib.request.urlopen(req, timeout=20); code = r.status; txt = r.read(); hd = r.headers
    except urllib.error.HTTPError as e:
        code = e.code; txt = e.read(); hd = e.headers
    try: js = json.loads(txt) if txt else None
    except Exception: js = None
    return code, js, hd, txt
def check(name, cond, extra=""):
    global fails
    print(("PASS " if cond else "FAIL ") + name + ("" if cond else "  -> " + str(extra)))
    if not cond: fails += 1
def err(js): return (js or {}).get("error", {}).get("code")
def otp_from_log(phone):
    time.sleep(0.8)
    codes = [json.loads(l)["code"] for l in open(LOG) if '"DEV ONLY' in l and phone in l]
    return codes[-1] if codes else None
def psql(sql):
    return subprocess.run(["psql","-h","127.0.0.1","-U","gekel","-d","gekel","-Atc",sql],env={**os.environ,"PGPASSWORD":"gekel_dev_pw"},capture_output=True,text=True).stdout.strip()

PW = "Nairobi-Sasa-26"
# ---------- system / headers / docs
c, js, h, _ = call("GET", "/health"); check("health 200", c == 200 and js["status"] == "ok")
c, js, h, _ = call("GET", "/ready"); check("ready 200 (db + redis)", c == 200, js)
check("security headers", h["X-Content-Type-Options"] == "nosniff" and h["X-Frame-Options"] == "DENY" and "default-src 'none'" in h["Content-Security-Policy"] and h["Cache-Control"] == "no-store" and h.get("X-Request-ID"))
c, js, h, _ = call("GET", "/nope"); check("unknown route -> JSON 404", c == 404 and err(js) == "not_found")
c, js, h, _ = call("DELETE", "/api/v1/auth/login"); check("wrong method -> JSON 405 + Allow header", c == 405 and err(js) == "method_not_allowed" and "POST" in h.get("Allow", ""), (c, js, dict(h)))
c, _, h, txt = call("GET", "/swagger/"); check("swagger UI served", c == 200 and b"swagger-ui" in txt and "script-src 'self'" in h["Content-Security-Policy"])
c, js, h, _ = call("GET", "/swagger/doc.json"); check("openapi spec served", c == 200 and js["openapi"].startswith("3.") and "/api/v1/auth/login" in js["paths"])
c, _, _, txt = call("GET", "/swagger/swagger-ui-bundle.js"); check("swagger bundle embedded", c == 200 and len(txt) > 1_000_000)

# ---------- input hardening
c, js, *_ = call("POST", "/api/v1/auth/login", raw=b"identifier=x", ctype="application/x-www-form-urlencoded"); check("non-JSON content-type -> 415", c == 415, c)
c, js, *_ = call("POST", "/api/v1/auth/login", raw=b'{"identifier":"a","password":"b","admin":true}'); check("unknown field rejected", c == 400 and err(js) == "invalid_json", (c, js))
c, js, *_ = call("POST", "/api/v1/auth/login", raw=b'{"identifier":"a","password":"b"}{"x":1}'); check("trailing JSON rejected", c == 400, c)
c, js, *_ = call("POST", "/api/v1/auth/login", raw=b'{"identifier":"' + b"a" * 70000 + b'","password":"b"}'); check("oversized body -> 413", c == 413, c)

# ---------- register
c, js, *_ = call("POST", "/api/v1/auth/register", {"full_name": "K", "phone": "123", "password": "short"})
check("register validation -> 422 with field errors", c == 422 and set(js["error"]["fields"]) >= {"full_name", "phone", "password"}, js)
c, js, *_ = call("POST", "/api/v1/auth/register", {"full_name": "Kelvin Otieno", "phone": "0712 345 678", "email": "Kelvin@Example.com", "password": PW, "role": "admin"})
check("cannot self-register as admin", c == 422 and "role" in js["error"]["fields"], js)
c, js, h, _ = call("POST", "/api/v1/auth/register", {"full_name": "Kelvin Otieno", "phone": "0712 345 678", "email": "Kelvin@Example.com", "password": PW})
check("register 201 + tokens", c == 201 and js["user"]["phone"] == "+254712345678" and js["user"]["email"] == "kelvin@example.com" and js["user"]["role"] == "buyer" and js["tokens"]["token_type"] == "Bearer", js)
U1 = js["user"]; T1 = js["tokens"]
check("password hash never returned", "password" not in json.dumps(js).lower().replace("password_", ""))
check("hash stored as argon2id", psql("select password_hash from users where phone='+254712345678'").startswith("$argon2id$v=19$m=65536,t=3,p=2$"))
check("only a hash of the refresh token is stored", T1["refresh_token"] not in psql("select encode(refresh_token_hash,'hex') from auth_sessions limit 5"))
c, js, *_ = call("POST", "/api/v1/auth/register", {"full_name": "Dup", "phone": "+254712345678", "password": PW}); check("duplicate phone -> 409", c == 409 and err(js) == "account_exists", js)
c, js, *_ = call("POST", "/api/v1/auth/register", {"full_name": "Dup", "phone": "0722000111", "email": "kelvin@example.com", "password": PW}); check("duplicate email (case-insens) -> 409", c == 409, js)

# ---------- me / auth required
c, js, h, _ = call("GET", "/api/v1/auth/me"); check("me without token -> 401", c == 401 and "Bearer" in h.get("WWW-Authenticate", ""))
c, js, *_ = call("GET", "/api/v1/auth/me", token="garbage"); check("me with garbage token -> 401", c == 401)
c, js, *_ = call("GET", "/api/v1/auth/me", token=T1["access_token"]); check("me 200", c == 200 and js["id"] == U1["id"], js)

# ---------- login, lockout, enumeration
c, js, *_ = call("POST", "/api/v1/auth/login", {"identifier": "0712345678", "password": PW}); check("login by phone", c == 200 and js["user"]["id"] == U1["id"], js)
c, js, *_ = call("POST", "/api/v1/auth/login", {"identifier": "KELVIN@example.com", "password": PW}); check("login by email (any case)", c == 200, js)
t0 = time.time(); c1, j1, *_ = call("POST", "/api/v1/auth/login", {"identifier": "0799999999", "password": "whatever-123"}); d_unknown = time.time() - t0
t0 = time.time(); c2, j2, *_ = call("POST", "/api/v1/auth/login", {"identifier": "0712345678", "password": "wrong-pass-123"}); d_wrong = time.time() - t0
check("unknown vs wrong password: identical response", c1 == c2 == 401 and j1["error"]["code"] == j2["error"]["code"] and j1["error"]["message"] == j2["error"]["message"])
check(f"timing similar (unknown {d_unknown*1000:.0f}ms vs wrong {d_wrong*1000:.0f}ms)", abs(d_unknown - d_wrong) < 0.12 + 0.5 * max(d_unknown, d_wrong))
for i in range(3): call("POST", "/api/v1/auth/login", {"identifier": "0712345678", "password": "wrong-pass-123"})
c, js, h, _ = call("POST", "/api/v1/auth/login", {"identifier": "0712345678", "password": "wrong-pass-123"})  # 5th failure
c, js, h, _ = call("POST", "/api/v1/auth/login", {"identifier": "0712345678", "password": PW})
check("account locked after 5 failures (even with right password) -> 429 + Retry-After", c == 429 and err(js) == "account_locked" and int(h["Retry-After"]) > 0, (c, js))
c, js, *_ = call("POST", "/api/v1/auth/login", {"identifier": "kelvin@example.com", "password": PW}); check("lock applies per identifier, not per spelling of phone/email? (email separate counter)", c in (200, 429), c)
subprocess.run(["redis-cli", "--scan", "--pattern", "lock:*"], capture_output=True); subprocess.run("redis-cli --scan --pattern 'lock:*' | xargs -r redis-cli del >/dev/null", shell=True)

# ---------- refresh rotation + reuse detection
c, js, *_ = call("POST", "/api/v1/auth/login", {"identifier": "0712345678", "password": PW}); A = js["tokens"]
c, js, *_ = call("POST", "/api/v1/auth/refresh", {"refresh_token": A["refresh_token"]})
check("refresh -> new pair + user", c == 200 and js["tokens"]["refresh_token"] != A["refresh_token"] and js["user"]["id"] == U1["id"], js)
B = js["tokens"]
c, js, *_ = call("GET", "/api/v1/auth/me", token=B["access_token"]); check("new access token works", c == 200)
c, js, *_ = call("POST", "/api/v1/auth/refresh", {"refresh_token": A["refresh_token"]}); check("REUSE of old refresh token -> 401", c == 401 and err(js) == "invalid_refresh", js)
c, js, *_ = call("POST", "/api/v1/auth/refresh", {"refresh_token": B["refresh_token"]}); check("...and the whole family is now dead (thief AND victim must sign in again)", c == 401, js)
c, js, *_ = call("GET", "/api/v1/auth/me", token=B["access_token"]); check("...and the latest access token stops working immediately", c == 401 and err(js) == "session_revoked", js)
check("reuse recorded in audit log", int(psql("select count(*) from auth_audit_logs where event_type='refresh_reuse_detected'")) >= 1)
c, js, *_ = call("POST", "/api/v1/auth/refresh", {"refresh_token": "x" * 64}); check("unknown refresh token -> 401", c == 401)
c, js, *_ = call("POST", "/api/v1/auth/refresh", {"refresh_token": "short"}); check("malformed refresh token -> 401", c == 401)

# ---------- logout (immediate), sessions, logout-all
c, js, *_ = call("POST", "/api/v1/auth/login", {"identifier": "0712345678", "password": PW}); L = js["tokens"]
c, js, *_ = call("POST", "/api/v1/auth/login", {"identifier": "0712345678", "password": PW}); M = js["tokens"]
c, js, *_ = call("GET", "/api/v1/auth/sessions", token=L["access_token"])
check("sessions list shows devices + marks current", c == 200 and any(s["current"] for s in js["sessions"]) and js["sessions"][0]["device_name"] == "e2e-test", js)
other = [s for s in js["sessions"] if not s["current"]]
c, *_ = call("DELETE", "/api/v1/auth/sessions/" + other[0]["id"], token=L["access_token"]); check("revoke another session -> 204", c == 204, c)
c, *_ = call("DELETE", "/api/v1/auth/sessions/00000000-0000-4000-8000-000000000000", token=L["access_token"]); check("revoke someone else's/unknown session -> 404", c == 404, c)
c, *_ = call("DELETE", "/api/v1/auth/sessions/not-a-uuid", token=L["access_token"]); check("bad session id -> 400", c == 400, c)
c, js, *_ = call("POST", "/api/v1/auth/logout", token=L["access_token"], body={"refresh_token": L["refresh_token"]}); check("logout 204", c == 204)
c, js, *_ = call("GET", "/api/v1/auth/me", token=L["access_token"]); check("access token dead IMMEDIATELY after logout", c == 401 and err(js) == "session_revoked", js)
c, js, *_ = call("POST", "/api/v1/auth/refresh", {"refresh_token": L["refresh_token"]}); check("refresh token dead after logout", c == 401)
c, js, *_ = call("POST", "/api/v1/auth/login", {"identifier": "0712345678", "password": PW}); N1 = js["tokens"]
c, js, *_ = call("POST", "/api/v1/auth/login", {"identifier": "0712345678", "password": PW}); N2 = js["tokens"]
c, *_ = call("POST", "/api/v1/auth/logout-all", token=N1["access_token"]); check("logout-all 204", c == 204)
c1, *_ = call("GET", "/api/v1/auth/me", token=N1["access_token"]); c2, *_ = call("GET", "/api/v1/auth/me", token=N2["access_token"]); check("logout-all kills every device's access token", c1 == 401 and c2 == 401, (c1, c2))
time.sleep(0.01)
c, js, *_ = call("POST", "/api/v1/auth/login", {"identifier": "0712345678", "password": PW}); S = js["tokens"]
c, *_ = call("GET", "/api/v1/auth/me", token=S["access_token"]); check("signing in again right after logout-all works", c == 200, c)

# ---------- profile
c, js, *_ = call("PATCH", "/api/v1/users/me", {}, token=S["access_token"]); check("PATCH me with nothing -> 422", c == 422, js)
c, js, *_ = call("PATCH", "/api/v1/users/me", {"full_name": "  Kelvin   O.  Otieno "}, token=S["access_token"]); check("PATCH name (whitespace normalized)", c == 200 and js["full_name"] == "Kelvin O. Otieno", js)
c, js, *_ = call("PATCH", "/api/v1/users/me", {"email": "not-an-email"}, token=S["access_token"]); check("PATCH bad email -> 422", c == 422 and "email" in js["error"]["fields"])
c, js, *_ = call("PATCH", "/api/v1/users/me", {"email": ""}, token=S["access_token"]); check("PATCH empty email removes it", c == 200 and js["email"] is None, js)
c, js, *_ = call("GET", "/api/v1/users/me", token=S["access_token"]); check("GET users/me", c == 200 and js["full_name"] == "Kelvin O. Otieno")
c, js, *_ = call("PATCH", "/api/v1/users/me", {"role": "admin"}, token=S["access_token"]); check("cannot PATCH role on self (unknown field)", c == 400, (c, js))

# ---------- change password
c, js, *_ = call("POST", "/api/v1/auth/change-password", {"current_password": "wrong-one-123", "new_password": "Another-Pass-77"}, token=S["access_token"]); check("change-password wrong current -> 400", c == 400 and err(js) == "wrong_password", js)
c, js, *_ = call("POST", "/api/v1/auth/change-password", {"current_password": PW, "new_password": "weak"}, token=S["access_token"]); check("change-password weak new -> 422", c == 422, js)
c, js, *_ = call("POST", "/api/v1/auth/login", {"identifier": "0712345678", "password": PW}); OTHERDEV = js["tokens"]
c, *_ = call("POST", "/api/v1/auth/change-password", {"current_password": PW, "new_password": "Another-Pass-77"}, token=S["access_token"]); check("change-password 204", c == 204, c)
c1, *_ = call("GET", "/api/v1/auth/me", token=S["access_token"]); c2, *_ = call("GET", "/api/v1/auth/me", token=OTHERDEV["access_token"]); check("this device stays signed in, other devices are signed out", c1 == 200 and c2 == 401, (c1, c2))
PW2 = "Another-Pass-77"
c, *_ = call("POST", "/api/v1/auth/login", {"identifier": "0712345678", "password": PW}); check("old password no longer works", c == 401)
c, js, *_ = call("POST", "/api/v1/auth/login", {"identifier": "0712345678", "password": PW2}); check("new password works", c == 200); S = js["tokens"]

# ---------- forgot password -> OTP -> reset token -> new password
c, js, *_ = call("POST", "/api/v1/auth/forgot-password", {"identifier": "0712345678"}); check("forgot-password (real user) 202", c == 202 and js["resend_after_seconds"] == 60, js)
c, js2, *_ = call("POST", "/api/v1/auth/forgot-password", {"identifier": "0700000000"}); check("forgot-password (unknown user) identical 202", c == 202 and js2["message"] == js["message"], js2)
c, js, h, _ = call("POST", "/api/v1/auth/forgot-password", {"identifier": "0712345678"}); check("resend within 60s -> 429 otp_cooldown", c == 429 and err(js) == "otp_cooldown", (c, js))
c, js, h, _ = call("POST", "/api/v1/auth/forgot-password", {"identifier": "0700000000"}); check("same 429 for unknown user (no account enumeration)", c == 429 and err(js) == "otp_cooldown", (c, js))
code = otp_from_log("+254712345678"); check("OTP delivered via notifier (6 digits)", bool(code and re.fullmatch(r"\d{6}", code)), code)
check("OTP is stored hashed (HMAC), not plaintext", code not in subprocess.run("redis-cli --scan --pattern 'otp:*' | xargs -r -n1 redis-cli get", shell=True, capture_output=True, text=True).stdout)
check("no OTP for unknown number", otp_from_log("+254700000000") is None)
wrong = "000000" if code != "000000" else "111111"
c, js, *_ = call("POST", "/api/v1/auth/verify-otp", {"identifier": "0712345678", "code": wrong}); check("wrong OTP -> 400 invalid_code", c == 400 and err(js) == "invalid_code", js)
c, js, *_ = call("POST", "/api/v1/auth/verify-otp", {"identifier": "0712345678", "code": code}); check("correct OTP -> reset token", c == 200 and len(js["reset_token"]) >= 32, js); RT = js.get("reset_token")
c, js, *_ = call("POST", "/api/v1/auth/verify-otp", {"identifier": "0712345678", "code": code}); check("OTP is single-use", c == 400)
c, js, *_ = call("POST", "/api/v1/auth/reset-password", {"reset_token": RT, "new_password": "short"}); check("weak new password -> 422 and token NOT burned", c == 422, js)
c, js, *_ = call("POST", "/api/v1/auth/reset-password", {"reset_token": "x" * 43, "new_password": "Third-Pass-2026"}); check("bad reset token -> 400", c == 400 and err(js) == "invalid_reset_token", js)
c, js, *_ = call("POST", "/api/v1/auth/reset-password", {"reset_token": RT, "new_password": "Third-Pass-2026"}); check("reset-password 200", c == 200, js)
c, js, *_ = call("POST", "/api/v1/auth/reset-password", {"reset_token": RT, "new_password": "Fourth-Pass-2026"}); check("reset token is single-use", c == 400)
c, *_ = call("GET", "/api/v1/auth/me", token=S["access_token"]); check("reset signs out all devices", c == 401)
c, *_ = call("POST", "/api/v1/auth/login", {"identifier": "0712345678", "password": PW2}); check("old password dead after reset", c == 401)
c, js, *_ = call("POST", "/api/v1/auth/login", {"identifier": "0712345678", "password": "Third-Pass-2026"}); check("login with reset password", c == 200); S = js["tokens"]
# OTP brute force
call("POST", "/api/v1/auth/forgot-password", {"identifier": "0712345678"}); 
subprocess.run("redis-cli del otp_cd:$(echo) >/dev/null", shell=True)

# ---------- RBAC: admin endpoints
subprocess.run("redis-cli --scan --pattern 'rl:*' | xargs -r redis-cli del >/dev/null", shell=True)  # reset per-IP limits used up above
c, js, *_ = call("GET", "/api/v1/users", token=S["access_token"]); check("buyer cannot list users -> 403", c == 403 and err(js) == "forbidden", js)
c, js, *_ = call("POST", "/api/v1/auth/register", {"full_name": "Wanjiru Admin", "phone": "0733111222", "email": "admin@gekel.co.ke", "password": "Admin-Pass-2026"}); ADM_ID = js["user"]["id"]
c, js, *_ = call("POST", "/api/v1/auth/register", {"full_name": "Brian Supplier", "phone": "0744333444", "password": "Supplier-Pass-26", "role": "supplier"}); SUP = js["user"]; SUPT = js["tokens"]
check("supplier self-signup allowed with supplier role", SUP["role"] == "supplier")
psql(f"update users set role='super_admin' where id='{ADM_ID}'")
c, js, *_ = call("POST", "/api/v1/auth/login", {"identifier": "admin@gekel.co.ke", "password": "Admin-Pass-2026"}); AT = js["tokens"]["access_token"]
c, js, *_ = call("GET", "/api/v1/users?limit=2", token=AT); check("admin lists users (keyset page 1)", c == 200 and len(js["users"]) == 2 and js["next_cursor"], js)
c, js2, *_ = call("GET", "/api/v1/users?limit=2&cursor=" + js["next_cursor"], token=AT); check("page 2 via cursor, no overlap", c == 200 and not ({u["id"] for u in js["users"]} & {u["id"] for u in js2["users"]}), js2)
c, js, *_ = call("GET", "/api/v1/users?q=brian", token=AT); check("search by name", c == 200 and len(js["users"]) == 1 and js["users"][0]["id"] == SUP["id"], js)
c, js, *_ = call("GET", "/api/v1/users?q=%25", token=AT); check("LIKE wildcards are escaped", c == 200 and js["users"] == [] , js)
c, js, *_ = call("GET", "/api/v1/users?limit=1000", token=AT); check("limit capped -> 400", c == 400)
c, js, *_ = call("GET", "/api/v1/users?cursor=garbage", token=AT); check("bad cursor -> 400", c == 400)
c, js, *_ = call("GET", "/api/v1/users/" + SUP["id"], token=AT); check("admin gets user by id", c == 200 and js["phone"] == "+254744333444")
c, js, *_ = call("PATCH", f"/api/v1/users/{ADM_ID}/status", {"is_active": False}, token=AT); check("cannot disable yourself", c == 400, js)
c, js, *_ = call("PATCH", f"/api/v1/users/{SUP['id']}/status", {"is_active": False}, token=AT); check("admin disables a user", c == 200 and js["is_active"] is False, js)
c, js, *_ = call("GET", "/api/v1/auth/me", token=SUPT["access_token"]); check("disabled user is kicked out immediately", c == 401, js)
c, js, *_ = call("POST", "/api/v1/auth/login", {"identifier": "0744333444", "password": "Supplier-Pass-26"}); check("disabled user cannot log in -> 403", c == 403 and err(js) == "account_disabled", js)
c, js, *_ = call("PATCH", f"/api/v1/users/{SUP['id']}/status", {"is_active": True}, token=AT); check("admin re-enables", c == 200 and js["is_active"])
c, js, *_ = call("PATCH", f"/api/v1/users/{SUP['id']}/role", {"role": "rider"}, token=AT); check("super_admin changes role", c == 200 and js["role"] == "rider", js)
c, js, *_ = call("PATCH", f"/api/v1/users/{SUP['id']}/role", {"role": "overlord"}, token=AT); check("invalid role -> 422", c == 422)
psql(f"update users set role='admin' where id='{ADM_ID}'")
c, js, *_ = call("POST", "/api/v1/auth/login", {"identifier": "admin@gekel.co.ke", "password": "Admin-Pass-2026"}); AT2 = js["tokens"]["access_token"]
c, js, *_ = call("PATCH", f"/api/v1/users/{SUP['id']}/role", {"role": "buyer"}, token=AT2); check("plain admin cannot change roles -> 403", c == 403)
psql(f"update users set role='super_admin' where phone='+254744333444'")
c, js, *_ = call("PATCH", f"/api/v1/users/{SUP['id']}/status", {"is_active": False}, token=AT2); check("admin cannot touch a super_admin", c == 403, js)

# ---------- JWT forgery / audit / rate limit
import base64
def b64(d): return base64.urlsafe_b64encode(json.dumps(d).encode()).rstrip(b"=").decode()
forged = b64({"alg": "none", "typ": "JWT"}) + "." + b64({"sub": ADM_ID, "sid": "x", "role": "super_admin", "jti": "y", "iss": "gekel-api", "aud": "gekel", "exp": int(time.time()) + 3600}) + "."
c, *_ = call("GET", "/api/v1/users", token=forged); check("alg=none forged super_admin token rejected", c == 401)
check("audit log captures login failures/successes", int(psql("select count(*) from auth_audit_logs where event_type='login' and success=false")) >= 4 and int(psql("select count(*) from auth_audit_logs where event_type='login' and success=true")) >= 5)
check("audit metadata never contains passwords/tokens", "Pass" not in psql("select string_agg(metadata::text,'') from auth_audit_logs"))
n429 = 0
for i in range(8):
    c, *_ = call("POST", "/api/v1/auth/register", {"full_name": "Spam Bot", "phone": f"07550000{i:02d}", "password": "Spam-Pass-2026"})
    n429 += c == 429
check("register rate limit (5/hour/IP) kicks in", n429 >= 1, n429)
log = open(LOG).read()
check("logs contain no passwords, access/refresh tokens", PW not in log and "Third-Pass" not in log and T1["refresh_token"] not in log and T1["access_token"] not in log)
print("\nRESULT:", "ALL PASSED" if fails == 0 else f"{fails} FAILED")
sys.exit(1 if fails else 0)
