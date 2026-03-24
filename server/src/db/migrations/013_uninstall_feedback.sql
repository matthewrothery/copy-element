CREATE TABLE IF NOT EXISTS uninstall_feedback (
  id TEXT PRIMARY KEY,
  reason TEXT NOT NULL,
  comment TEXT,
  created_at INTEGER NOT NULL
);
