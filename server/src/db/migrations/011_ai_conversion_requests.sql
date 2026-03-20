CREATE TABLE ai_conversion_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  capture_id INTEGER,
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
  FOREIGN KEY (capture_id) REFERENCES captures(id)
);

CREATE INDEX idx_ai_conversion_user_created ON ai_conversion_requests(user_id, created_at DESC);
