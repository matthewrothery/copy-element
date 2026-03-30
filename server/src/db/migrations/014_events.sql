CREATE TABLE events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  user_id TEXT,
  install_id TEXT,
  payload_json TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_events_type_user ON events(type, user_id, created_at);
CREATE INDEX idx_events_type_install ON events(type, install_id, created_at);
