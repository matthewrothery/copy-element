-- One-time codes for extension token exchange (short-lived).
CREATE TABLE IF NOT EXISTS extension_codes (
  code TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  install_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Long-lived extension sessions (token tied to user + install); revocable.
CREATE TABLE IF NOT EXISTS extension_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  install_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
