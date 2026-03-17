-- Email send log and engagement tracking. Portable SQL.

CREATE TABLE email_sends (
  id TEXT PRIMARY KEY,                     -- nanoid; used in tracking pixel/link URLs
  email TEXT NOT NULL,
  user_id TEXT,
  template TEXT NOT NULL,                  -- 'welcome' | 'magic_link'
  subject TEXT NOT NULL,
  ses_message_id TEXT,
  sent_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',     -- 'sent' | 'failed' | 'skipped'
  error_message TEXT,
  opened_at TEXT,
  open_count INTEGER NOT NULL DEFAULT 0,
  clicked_at TEXT,
  click_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_email_sends_email ON email_sends(email);
CREATE INDEX idx_email_sends_sent_at ON email_sends(sent_at DESC);
CREATE INDEX idx_email_sends_template ON email_sends(template);

CREATE TABLE email_clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email_send_id TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  clicked_at TEXT NOT NULL,
  user_agent TEXT,
  FOREIGN KEY (email_send_id) REFERENCES email_sends(id)
);

CREATE INDEX idx_email_clicks_send_id ON email_clicks(email_send_id);
