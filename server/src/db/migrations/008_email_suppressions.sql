-- Email suppression / unsubscribe list. Checked before every send.

CREATE TABLE email_suppressions (
  email TEXT PRIMARY KEY,
  suppressed_at INTEGER NOT NULL,
  reason TEXT                     -- 'unsubscribe' | 'bounce' | 'complaint' | 'manual'
);
