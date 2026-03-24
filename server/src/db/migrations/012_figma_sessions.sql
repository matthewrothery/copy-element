CREATE TABLE figma_sessions (
  session_id TEXT PRIMARY KEY,
  user_id TEXT,
  token TEXT,
  token_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX idx_figma_sessions_expires ON figma_sessions (expires_at);
