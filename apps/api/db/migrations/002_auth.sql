-- Refresh-token sessions. Only SHA-256 hashes of refresh tokens are stored, never the tokens.
CREATE TABLE IF NOT EXISTS auth_sessions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash BYTEA NOT NULL UNIQUE,
  token_family_id    UUID  NOT NULL,
  device_name        VARCHAR(80),
  user_agent         TEXT,
  ip_address         INET,
  expires_at         TIMESTAMPTZ NOT NULL,
  last_used_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at         TIMESTAMPTZ,
  revoke_reason      VARCHAR(100),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS device_name VARCHAR(80);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user   ON auth_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_family ON auth_sessions (token_family_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_active ON auth_sessions (user_id, revoked_at, expires_at);

-- Append-only security log (logins, failures, resets, admin actions). No secrets are stored here.
CREATE TABLE IF NOT EXISTS auth_audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(80) NOT NULL,
  success    BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auth_audit_user  ON auth_audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_audit_event ON auth_audit_logs (event_type, created_at DESC);

-- Housekeeping: run periodically (cron / pg_cron) to keep the table small.
--   DELETE FROM auth_sessions WHERE expires_at < NOW() - INTERVAL '7 days';
