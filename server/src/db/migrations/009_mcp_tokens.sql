CREATE TABLE mcp_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER,
  rotated_at INTEGER
);

CREATE INDEX idx_mcp_tokens_token_hash ON mcp_tokens(token_hash);
