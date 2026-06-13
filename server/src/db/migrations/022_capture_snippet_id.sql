ALTER TABLE captures ADD COLUMN snippet_id TEXT;

-- SQLite-only: json_extract. Backfills existing rows from metadata_json so
-- idempotency lookups can match captures synced before this column existed.
UPDATE captures SET snippet_id = json_extract(metadata_json, '$.snippet_id')
  WHERE snippet_id IS NULL AND metadata_json IS NOT NULL;

CREATE INDEX idx_captures_install_snippet ON captures(install_id, snippet_id);
