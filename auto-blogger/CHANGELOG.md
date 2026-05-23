# Auto-blogger changelog

## 2026-05-17 — Lambda migration and project-agnostic package extraction

**Substrate change:** The auto-blogger no longer runs as a one-shot Docker container fired by EC2 systemd timers. It now runs as two AWS Lambda functions on EventBridge Scheduler.

### What changed

**Infrastructure**
- Two Lambda functions replace the EC2 systemd timers: `element-armory-prod-auto-blogger-topics` (09:00 Sydney) and `element-armory-prod-auto-blogger-news` (10:00 Sydney).
- State moves from `/data/auto-blogger-state.json` on the EC2 host to a DynamoDB on-demand table (`element-armory-prod-auto-blogger-state`). Keyword and slug claims use conditional `PutItem` writes — safe for the parallel topic pipeline.
- Internal-link candidates move from a filesystem walk of `../website/content/topics` to an S3 JSON manifest published by the website CI after each deploy.
- Lambda code is deployed as a zip (esbuild bundle, ~2–3 MB compressed) via GitHub Actions `build_auto_blogger_lambda`. Terraform owns config; GHA owns code.

**Code**
- All Element-Armory-specific values extracted from `auto-blogger/src/*` into `auto-blogger.config.mts` at the repo root. The `auto-blogger/` directory is now vendor-copyable — see `PORTING.md`.
- Three new interfaces: `StateStore`, `ContentRepository`, `OutputAdapter`. DynamoDB, S3-manifest, and S3+SES implementations ship in the package; filesystem implementations remain for local dev.
- Four topic articles now run in parallel via `Promise.all` in one Lambda invocation rather than staggered across the day.
- One digest email per Lambda run replaces per-article emails.
- `lock.ts`, `state.ts`, `scheduler.ts`, and daemon mode removed. Atomic DynamoDB conditional writes replace the PID lock.

**Publish cadence**
- Before: 4 topic articles staggered at 09:30, 11:30, 13:30, 15:30 Sydney.
- After: 4 topic articles published in bulk at 09:00 Sydney. Website-visible timing depends on when the importer CI (`import-auto-blog-content.yml`) next fires.

### Plan references
- Active plan: `plans/active/2026-05-17-auto-blogger-lambda-migration-and-reusable-package.md`
- Superseded plan: `plans/complete/2026-05-14-ec2-stability-auto-blogger-offload.md`
