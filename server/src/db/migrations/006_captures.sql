-- Captures: metadata only; assets reference object storage. Portable SQL for Postgres compatibility.

CREATE TABLE captures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  install_id TEXT NOT NULL,
  user_id TEXT,
  source_url TEXT,
  captured_at INTEGER NOT NULL,
  created_by_install_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ok',
  metadata_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_captures_install_captured ON captures(install_id, captured_at DESC);
CREATE INDEX idx_captures_user_captured ON captures(user_id, captured_at DESC);

CREATE TABLE capture_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  capture_id INTEGER NOT NULL,
  asset_kind TEXT NOT NULL,
  storage_provider TEXT NOT NULL DEFAULT 's3',
  object_key TEXT NOT NULL,
  public_url TEXT,
  checksum_sha256 TEXT,
  content_type TEXT,
  byte_size INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (capture_id) REFERENCES captures(id)
);

CREATE INDEX idx_capture_assets_capture_id ON capture_assets(capture_id);
