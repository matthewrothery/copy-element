-- period is 'YYYY-MM' text — this is a partition label, not a timestamp
CREATE TABLE mcp_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  period TEXT NOT NULL,
  call_count INTEGER NOT NULL DEFAULT 0,
  last_call_at INTEGER,
  UNIQUE(user_id, period)
);

CREATE INDEX idx_mcp_usage_user_period ON mcp_usage(user_id, period);
