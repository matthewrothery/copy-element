-- Add first_call_at to mcp_usage to track when a user first used MCP in each period.
-- NULLable; populated on first INSERT, never updated on subsequent calls.

ALTER TABLE mcp_usage ADD COLUMN first_call_at INTEGER;
