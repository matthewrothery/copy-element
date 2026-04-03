-- Add session_id index to analytics_events to support session-level join queries
-- (e.g. modal shown → account created within same session).

CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id, created_at);
