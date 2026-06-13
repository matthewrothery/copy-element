# Server – Rules

Shared product identity, coding standards, and design principles are in the root `CLAUDE.md`. This file defines server-specific architecture, conventions, and constraints.

---

## Tech Stack

- **Runtime**: Node.js 18+, ESM (`"type": "module"`), TypeScript
- **API**: Express 4, cors, Better Auth (Google OAuth + magic-link)
- **DB**: SQLite via `better-sqlite3`; custom migration runner; migrations 001–006
- **Billing**: Stripe SDK; sync via webhooks; entitlements from DB
- **Storage**: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` for presigned capture uploads
- **Email**: `@aws-sdk/client-ses`, `@react-email/components`, `react-email`; template in `src/emails/magic-link.tsx`
- **Static app**: Plain HTML/JS in `server/public/`; no SPA build
- **IDs/secrets**: `nanoid` for install secrets, extension codes, and tokens
- **Dev**: `tsx watch`; build: `tsc` → `dist/`

Scripts: `npm run dev`, `npm run build`, `npm start`, `npm run migrate`, `npm run migrate:create -- <name>`

---

## Directory Structure

```
src/
  api/
    middleware/       # session.ts, install-auth.ts
    routes/           # one file per domain
    index.ts          # mounts all domain routers
  config/index.ts     # single config object; only place env is read
  constants/index.ts  # ENV_KEYS and DEFAULTS only
  db/
    connection.ts     # getDb(), closeDb()
    migrate.ts        # migration runner
    migrate-create.ts # scaffold new migration file
    migrations/       # NNN_description.sql in sorted order
    schema/
  emails/             # react-email templates
  jobs/               # background job placeholders
  loaders/
    express.ts        # app wiring and middleware order
    auth.ts           # Better Auth instance
    stripe.ts         # Stripe singleton
  models/
  services/           # stateless domain logic; no req/res
  types/index.ts      # AppConfig, shared request/response types
  utils/
  constants/
  index.ts            # entry: load config, getDb(), listen(PORT)
public/               # static HTML served by Express
```

---

## Middleware and Route Order (Critical)

In `src/loaders/express.ts`, order is load-bearing — do not change without understanding the reason:

1. Trust proxy — `app.set('trust proxy', 1)` in production; `app.enable('trust proxy')` for reverse proxy
2. `cors({ origin: true, credentials: true })` — enables cookies for hosted app
3. Request-time middleware — `req.requestTime = Date.now()` for diagnostics
4. Morgan — HTTP request logging (method, url, status, response-time)
5. `cookieParser()` — parse `Cookie` header into `req.cookies`
6. `app.post('/api/billing/webhook', express.raw(...), handleStripeWebhook)` — **before** `express.json()` so Stripe signature verification gets raw body
7. `express.json({ limit: '256kb' })` — all routes below can parse JSON
8. Auth route diagnostics — dev-only 404 warnings for auth routes
9. `app.use('/api/auth/extension-session', extensionSessionRouter)` — **before Better Auth catch-all** so our routes win for `/api/auth/extension-session/*`
10. `app.all('/api/auth/*', toNodeHandler(auth))` — Better Auth handles all remaining `/api/auth/` (sign-in, callback, magic-link, sign-out)
11. `mountApi(app)` — health, `/api/me`, `/api/installs`, `/api/billing`, `/api/captures`
12. `express.static(publicDir)` — static files last so API routes always win
13. 404 catch-all — forward to error handler with status 404
14. Error handlers — UnauthorizedError (if any), then final JSON error response

---

## Coding Conventions

### ESM Imports

All imports must use `.js` extension: `from '../config/index.js'`. This is required for ESM compatibility even when the source file is `.ts`.

### Config

- `dotenv/config` is loaded once in `src/config/index.ts`
- All other modules import `config` from there — no `process.env` access outside config
- Add new env vars to: `ENV_KEYS` in constants, `AppConfig` type in types, `getConfig()` in config, `.env.example`, and README

### Database

- Singleton: `getDb()` from `src/db/connection.ts`
- Ensure config (and dotenv) is loaded before first `getDb()` call
- `DATABASE_PATH` is resolved relative to `process.cwd()` — run from `server/` or set an absolute path in production

### Services

- Stateless: receive params, call `getDb()` or other services, return data
- No Express `req`/`res` in services
- Called from routes or other services

### Routes

- One router file per domain in `src/api/routes/`
- Mount in `src/api/index.ts` unless order relative to Better Auth matters (then mount in `express.ts`)
- Use `requireSession` for session-protected routes; then cast `req as RequestWithSession` and access `req.session!.user.id`
- Use `requireInstallAuth` for install-scoped routes (extension Bearer token or `install_id` + `install_secret`)

### Migrations

- Add `NNN_description.sql` in `src/db/migrations/` in sorted order
- Use portable SQL: `INTEGER`, `TEXT`; avoid SQLite-specific syntax for future Postgres compatibility
- Run with `npm run migrate`; never run Better Auth CLI migrate — we own `003_better_auth.sql`
- No down migrations

### Types

- Shared request/response and config types: `src/types/index.ts`
- Env key names only: `src/constants/index.ts`

---

## Authentication Model

### Browser (Hosted App)

Better Auth sets HTTP-only cookies. Static pages use `credentials: 'include'` on fetch. Session read via `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })`.

### Extension (Bearer Token Flow)

Extensions cannot rely on cookies. Full flow:

1. Extension generates `install_id` (UUID/ULID) on first run
2. `POST /api/installs/register` with `install_id` → server issues and stores `install_secret`; extension stores both securely
3. User signs in on hosted app → account page generates one-time code: `POST /api/auth/extension-session/code`
4. Extension receives code → `POST /api/auth/extension-session` with `{ install_id, install_secret, code }` → server returns `{ token, expires_at }`
5. Extension stores token; sends as `Authorization: Bearer <token>` for all authenticated requests
6. Before expiry: `POST /api/auth/extension-session/refresh` with token → replace stored token
7. Sign-out: `POST /api/auth/extension-session/revoke` then clear local token

Token is hashed (SHA-256) in DB; TTL 90 days. Extension never sends cookies to API.

### Install-First Model

- Identity is **install** (`install_id` + `install_secret`), not machine fingerprint
- Captures belong to **install** first; `user_id` on install is nullable, set when user links from account page
- Anonymous captures remain on install and become visible when install is linked to a user
- One install ↔ at most one user at a time; one user can have many installs
- Unlink clears `installs.user_id` but does not delete the install or its data

---

## API Reference

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/health` | none | `{ status: "ok", timestamp }` |
| GET | `/ready` | none | 200 or 503; DB ping |
| GET | `/api/me` | cookie (optional) | `{ user }` or 401 `{ user: null }` |
| POST | `/api/installs/register` | none | Issues `install_secret` |
| GET | `/api/installs` | session | List user's linked installs |
| POST | `/api/installs/link` | session | Link install to user |
| POST | `/api/installs/unlink` | session | Clear `user_id` from install |
| POST | `/api/auth/extension-session/code` | session | Generate one-time code |
| POST | `/api/auth/extension-session` | none | Exchange code for token |
| POST | `/api/auth/extension-session/refresh` | Bearer or body `token` | Rotate token |
| POST | `/api/auth/extension-session/revoke` | Bearer or body `token` | Revoke token |
| (all other `/api/auth/*`) | — | — | Handled by Better Auth |
| GET | `/api/billing/entitlement` | session | `{ plan_code, status, active, ... }` |
| POST | `/api/billing/checkout-session` | session | Returns Stripe Checkout URL |
| POST | `/api/billing/portal-session` | session | Returns Stripe Portal URL |
| POST | `/api/billing/webhook` | none (Stripe sig) | Raw body; signature verified |
| POST | `/api/captures/upload-url` | install | Returns presigned S3 PUT URL |
| POST | `/api/captures` | install | Create capture record |
| GET | `/api/captures/install/:installId` | install (own only) | List captures for install |
| GET | `/api/captures` | session | List captures for user (all linked installs) |

---

## Database Schema

All timestamps stored as epoch milliseconds (`INTEGER`). Use `Date.now()` — never `new Date().toISOString()`. Tables by migration:

- **001** — `schema_migrations` (`version` TEXT PK, `applied_at` INTEGER)
- **002** — `installs` (`install_id`, `install_secret`, `user_id` NULL, `created_at`, `last_seen_at`, `extension_version`, `chrome_version`, `os_family`, `screen_width`, `screen_height`, `locale`, `timezone`)
- **003** — Better Auth tables: `user`, `session`, `account`, `verification` (camelCase columns; quoted `"user"` for SQLite)
- **004** — `extension_codes` (one-time codes, deleted after use), `extension_sessions` (`token_hash` SHA-256, 90d TTL)
- **005** — `stripe_customers`, `subscriptions`, `subscription_events` (idempotency + audit via `stripe_event_id` UNIQUE)
- **006** — `captures` (`install_id`, `user_id` nullable denormalized, `source_url`, `captured_at`, `status`, `metadata_json`), `capture_assets` (`capture_id`, `asset_kind`, `object_key`, `storage_provider`, `content_type`, `byte_size`, checksums)
- **022** — `captures.snippet_id` (TEXT, nullable; backfilled from `metadata_json.snippet_id`), index `idx_captures_install_snippet` on `(install_id, snippet_id)`

---

## Environment Variables

All env access goes through `src/config/index.ts`. Add new keys to `ENV_KEYS`, `AppConfig`, `getConfig()`, `.env.example`, and README.

| Key | Phase | Notes |
|-----|-------|-------|
| `PORT` | 1 | Default `3000` |
| `DATABASE_PATH` | 1 | Default `./data/element-armory.db`; relative to cwd |
| `BETTER_AUTH_SECRET` | 2 | Min 32 chars |
| `BETTER_AUTH_URL` | 2 | Base URL for OAuth callbacks |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | 2 | Google Cloud Console OAuth client |
| `AWS_SES_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | 2 | SES email |
| `FROM_EMAIL` | 2 | If unset, magic-link URL logs to console |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | 3 | |
| `STRIPE_PRICE_PRO_MONTHLY` | 3 | Price ID → `pro` plan code |
| `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`, `STRIPE_PORTAL_RETURN_URL` | 3 | |
| `S3_REGION`, `S3_BUCKET_CAPTURES` | 4 | |
| `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE` | 4 | Optional; for S3-compatible storage |

---

## Key Files

| Path | Responsibility |
|------|----------------|
| `src/index.ts` | Entry: load config, create app, `getDb()`, `listen(PORT)` |
| `src/logger.ts` | Minimal logger wrapper for startup and request logging |
| `src/loaders/express.ts` | App wiring and middleware order |
| `src/loaders/auth.ts` | Better Auth: DB, baseURL, Google, magicLink |
| `src/loaders/stripe.ts` | Stripe singleton; fails fast if key missing |
| `src/api/index.ts` | Mount domain routers |
| `src/api/middleware/session.ts` | `requireSession`, `optionalSession`, `RequestWithSession` type |
| `src/api/middleware/install-auth.ts` | `requireInstallAuth` (Bearer or install_id+secret) |
| `src/config/index.ts` | Single config object; only env access point |
| `src/constants/index.ts` | `ENV_KEYS`, `DEFAULTS` only |
| `src/types/index.ts` | `AppConfig`, shared request/response types |
| `src/db/connection.ts` | `getDb()`, `closeDb()` |
| `src/db/migrate.ts` | Migration runner |
| `src/services/install.ts` | `registerInstall`, `linkInstallToUser`, `unlinkInstall`, `listInstallsByUserId` |
| `src/services/extension-session.ts` | `createExtensionCode`, `exchangeCodeForToken`, `refreshExtensionToken`, `revokeExtensionToken` |
| `src/services/billing-customer.ts` | `getOrCreateStripeCustomerForUser` |
| `src/services/subscription-sync.ts` | `syncFromStripeEvent` — maps Stripe events to local entitlements |
| `src/services/entitlements.ts` | `getUserEntitlement`, `hasActivePaidPlan` |
| `src/services/billing-plan-map.ts` | `priceIdToPlanCode` — price ID → plan code mapping |
| `src/services/s3.ts` | `buildCaptureObjectKey`, presigned PUT URLs |
| `src/services/capture.ts` | `createCaptureWithAssets`, `listCapturesByInstall`, `listCapturesByUser` |
| `src/services/email.ts` | `sendMagicLinkEmail`; graceful fallback to console log |
| `src/services/email-ses.ts` | SES send via react-email rendered template |
| `src/emails/magic-link.tsx` | `MagicLinkEmail` react-email component |
| `public/*.html` | Static pages: sign-in, account, billing, auth/extension-callback |
| `src/jobs/` | Background job placeholders (verify assets, cleanup orphans, nightly backup) |

---

## How to Add…

**New env var**: `ENV_KEYS` → `AppConfig` → `getConfig()` → `.env.example` → README.

**New migration**: `src/db/migrations/NNN_name.sql` (portable SQL) → `npm run migrate`. Or scaffold with `npm run migrate:create -- <name>`.

**New route (normal order)**: Create router in `src/api/routes/`, export it; mount in `src/api/index.ts` with `app.use('/api/...', router)`.

**New route that must be before Better Auth**: Mount in `src/loaders/express.ts` before the `app.all('/api/auth/*', ...)` catch-all.

**New session-protected route**: Use `requireSession` middleware; cast `req as RequestWithSession`; access `req.session!.user.id`.

**New install-protected route**: Use `requireInstallAuth`; then `req.install.install_id`.

**New service**: Add `src/services/<name>.ts`; use `getDb()` or other services; no Express types.

---

## Upcoming Phases

### Phase 5 — Rate limits and abuse protection (next)

- Per-install rate limiting: throttle by `install_id`; validate `install_secret` on each install-scoped request
- Middleware in `src/api/middleware/` for rate limiting and install auth
- User-Agent validation: expect extension identity
- Optional: per-extension-version checks, proof-of-install token

### Phase 6 — MCP server

- Run on a **different port** from Express API
- Thin layer: MCP tools call the same `src/services/` — no duplicate business logic
- Auth: accept app-issued tokens; validate per-request; map to user/install
- Structure for future extraction to a separate microservice (no tight Express coupling)
- Chrome extension: add "Copy MCP" flow to generate connection config for MCP clients (Cursor, etc.)
- Token must be scoped and revocable

### Phase 7 — Hosted app polish and operations (optional)

- Hosted library/history view for captures
- Sign-out: remove account link from install; captures remain
- Nightly DB backup to S3 with retention policy
- Monitoring, request logging, error tracking

---

## Gotchas and Lessons Learned

### Better Auth and express.json() ordering

Better Auth docs warn against putting `express.json()` before the auth handler. Our setup is correct: extension-session routes (which need JSON) are mounted before the Better Auth catch-all, and json() middleware is applied globally but after the raw-body Stripe webhook. Do not reorder without re-testing auth flows.

### SQLite path resolution

`DATABASE_PATH` resolves relative to `process.cwd()`. Run `npm run dev` / `npm start` from `server/`, or use an absolute path in production. Running from repo root resolves to repo root `/data/...`.

### better-sqlite3 version

Using `^12` for Better Auth compatibility. Check peer deps before adding other drivers that may expect `^11`.

### Better Auth type export

In `auth.ts`, `getDb() as any` is used for the database option so the exported `auth` type does not reference `better-sqlite3`'s `Database` type (avoids TS export issues with the type-only import).

### Extension callback page

`public/auth/extension-callback.html` redirects to `chrome-extension://<extension_id>/?code=...&install_id=...` if `extension_id` is in the query string; otherwise displays the code. Pass `extension_id` from the account page when initiating the link.

### Stripe webhook requires raw body

The Stripe webhook handler **must** be mounted before `express.json()` and use `express.raw({ type: 'application/json' })`. If this order is broken, Stripe signature verification will fail for all webhooks.

### Captures: DB holds metadata only

Raw screenshots and large blobs go to S3. DB `capture_assets` stores object keys and URLs. Never store binary data in `captures` or `capture_assets` rows.

### Capture idempotency by (install_id, snippet_id)

`POST /api/captures` (and the matching internal create path) checks for an existing row with the same `(install_id, snippet_id)` before inserting. This lets the extension safely retry capture uploads — e.g. when re-syncing a guest's pre-sign-in backlog after sign-in — without creating duplicate capture records. `snippet_id` is the extension-local snippet identifier; captures created without one (`snippet_id IS NULL`) are not deduplicated.

### Entitlements check, not raw Stripe

The rest of the app uses `getUserEntitlement` / `hasActivePaidPlan` from `src/services/entitlements.ts`. Never query Stripe directly from routes or other services — always go through the local entitlements layer that is kept in sync by `subscription-sync.ts` via webhooks.
