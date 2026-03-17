# Jobs

Scheduled or on-demand tasks. These are **placeholders** for:

- **verify-capture-assets** — Validate that capture_assets reference existing S3 objects (and optionally checksums).
- **cleanup-orphan-uploads** — Remove S3 uploads that were never linked to a capture (e.g. after a failed submit).
- **nightly-db-backup** — Optional: backup SQLite DB to S3.

Run via cron, a job runner, or manually. No scheduler is wired in the server by default.
