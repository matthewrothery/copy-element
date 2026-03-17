-- Installs: install identity (install_id + install_secret), optional user link, telemetry.
-- Portable SQL (INTEGER, TEXT) for Postgres compatibility.

CREATE TABLE installs (
  install_id TEXT PRIMARY KEY,
  install_secret TEXT NOT NULL,
  user_id TEXT,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  extension_version TEXT,
  chrome_version TEXT,
  os_family TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  locale TEXT,
  timezone TEXT
);
