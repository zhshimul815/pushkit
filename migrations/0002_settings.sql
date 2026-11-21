-- PushKit key-value settings (e.g. Resend API key configured from the dashboard).
-- Secret values are stored AES-GCM encrypted (see src/lib/crypto-utils.ts).

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
