-- Admin users: maps Better Auth user IDs to admin access.
-- Checked by requireAdmin middleware on every /api/admin/* request.

CREATE TABLE admin_users (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
