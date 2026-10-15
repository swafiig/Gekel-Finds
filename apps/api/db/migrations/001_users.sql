-- Safe to run even if you already have a users table: every statement is idempotent.
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY,
  full_name         VARCHAR(120) NOT NULL,
  email             VARCHAR(254),
  phone             VARCHAR(20)  NOT NULL,
  password_hash     TEXT,
  role              VARCHAR(20)  NOT NULL DEFAULT 'buyer'
                    CHECK (role IN ('buyer','supplier','rider','staff','admin','super_admin')),
  is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
  phone_verified_at TIMESTAMPTZ,
  email_verified_at TIMESTAMPTZ,
  last_login_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Compatibility with an older users table.
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- One account per phone and per email (case-insensitive). Email is optional.
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_uidx       ON users (phone);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uidx ON users (lower(email)) WHERE email IS NOT NULL;
CREATE INDEX        IF NOT EXISTS users_created_idx      ON users (created_at DESC, id DESC);
