-- Migrate captures.id from INTEGER AUTOINCREMENT to TEXT (nanoid at insert time).
-- Existing rows receive random hex ids; new rows use nanoid() in application code.

PRAGMA foreign_keys = OFF;

CREATE TABLE capture_id_map (
  old_id INTEGER PRIMARY KEY,
  new_id TEXT NOT NULL UNIQUE
);

INSERT INTO capture_id_map (old_id, new_id)
SELECT id, lower(hex(randomblob(10))) FROM captures;

CREATE TABLE captures_new (
  id TEXT PRIMARY KEY,
  install_id TEXT NOT NULL,
  user_id TEXT,
  source_url TEXT,
  captured_at INTEGER NOT NULL,
  created_by_install_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ok',
  metadata_json TEXT,
  snippet_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

INSERT INTO captures_new (
  id, install_id, user_id, source_url, captured_at, created_by_install_id,
  status, metadata_json, snippet_id, created_at, updated_at
)
SELECT
  m.new_id, c.install_id, c.user_id, c.source_url, c.captured_at, c.created_by_install_id,
  c.status, c.metadata_json, c.snippet_id, c.created_at, c.updated_at
FROM captures c
JOIN capture_id_map m ON c.id = m.old_id;

CREATE TABLE capture_assets_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  capture_id TEXT NOT NULL,
  asset_kind TEXT NOT NULL,
  storage_provider TEXT NOT NULL DEFAULT 's3',
  object_key TEXT NOT NULL,
  public_url TEXT,
  checksum_sha256 TEXT,
  content_type TEXT,
  byte_size INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (capture_id) REFERENCES captures_new(id)
);

INSERT INTO capture_assets_new (
  id, capture_id, asset_kind, storage_provider, object_key, public_url,
  checksum_sha256, content_type, byte_size, created_at
)
SELECT
  a.id, m.new_id, a.asset_kind, a.storage_provider, a.object_key, a.public_url,
  a.checksum_sha256, a.content_type, a.byte_size, a.created_at
FROM capture_assets a
JOIN capture_id_map m ON a.capture_id = m.old_id;

CREATE TABLE ai_conversion_requests_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  capture_id TEXT,
  target_framework TEXT NOT NULL,
  target_styling TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_cost_usd_micros INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  response_text TEXT,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  completed_at INTEGER,
  FOREIGN KEY (capture_id) REFERENCES captures_new(id)
);

INSERT INTO ai_conversion_requests_new (
  id, user_id, capture_id, target_framework, target_styling, ai_model,
  input_tokens, output_tokens, total_cost_usd_micros, status,
  response_text, error_message, created_at, completed_at
)
SELECT
  r.id, r.user_id, m.new_id, r.target_framework, r.target_styling, r.ai_model,
  r.input_tokens, r.output_tokens, r.total_cost_usd_micros, r.status,
  r.response_text, r.error_message, r.created_at, r.completed_at
FROM ai_conversion_requests r
LEFT JOIN capture_id_map m ON r.capture_id = m.old_id;

DROP TABLE ai_conversion_requests;
DROP TABLE capture_assets;
DROP TABLE captures;

ALTER TABLE captures_new RENAME TO captures;
ALTER TABLE capture_assets_new RENAME TO capture_assets;
ALTER TABLE ai_conversion_requests_new RENAME TO ai_conversion_requests;

DROP TABLE capture_id_map;

CREATE INDEX idx_captures_install_captured ON captures(install_id, captured_at DESC);
CREATE INDEX idx_captures_user_captured ON captures(user_id, captured_at DESC);
CREATE INDEX idx_capture_assets_capture_id ON capture_assets(capture_id);
CREATE INDEX idx_captures_install_snippet ON captures(install_id, snippet_id);
CREATE INDEX idx_ai_conversion_user_created ON ai_conversion_requests(user_id, created_at DESC);

PRAGMA foreign_keys = ON;
