-- Analytics events from website and Chrome extension.
-- Portable SQL (INTEGER, TEXT) for Postgres compatibility.

CREATE TABLE analytics_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  visitor_id TEXT,
  user_id TEXT,
  install_id TEXT,
  session_id TEXT,
  properties_json TEXT,
  url TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  device TEXT,
  browser TEXT,
  country TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_analytics_events_type ON analytics_events(event_type, created_at);
CREATE INDEX idx_analytics_events_visitor ON analytics_events(visitor_id, created_at);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id, created_at);
CREATE INDEX idx_analytics_events_install ON analytics_events(install_id, created_at);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
