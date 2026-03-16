# Element Armory Server — Progress & memory store

Summary of what’s built, how it works, and what’s next. Use this when continuing to Phase 3+. Detailed checklist: [server.todo](server.todo). Product/architecture context: repo-root `server-setup.md` (if present).

---

## Done

### Phase 1: Setup (complete)

- **Project**: Node.js, ESM, TypeScript in `server/`. Scripts: `dev`, `build`, `start`, `migrate`, `migrate:create`.
- **Layout**: `src/api` (routes, middleware), `src/config`, `src/db` (connection, migrations, schema), `src/loaders`, `src/models`, `src/services`, `src/jobs`, `src/public`, `src/types`, `src/utils`, `src/constants`.
- **DB**: SQLite via `better-sqlite3`, configurable path; migrations in `src/db/migrations/` with a custom runner (portable SQL for future Postgres).
- **API**: Express with JSON body, CORS; health at `GET /health`, readiness at `GET /ready`; routes mounted from `src/api/index.ts`.
- **Docs**: README and `.env.example` with run commands and env vars.

### Phase 2: Identity, auth, hosted app (complete)

- **Install identity**: `install_id` (UUID/ULID) + backend-issued `install_secret`; no fingerprinting. `installs` table (002) with optional telemetry; [src/services/install.ts](src/services/install.ts) for register, link, unlink, list.
- **Install API**: `POST /api/installs/register` (no auth), `GET /api/installs`, `POST /api/installs/link`, `POST /api/installs/unlink` (session required).
- **Better Auth**: [src/loaders/auth.ts](src/loaders/auth.ts) — Google OAuth + magic link; SQLite; tables in 003. Mounted at `/api/auth/*` before `express.json()`.
- **Email**: AWS SES + [@react-email](src/emails/magic-link.tsx) for magic-link; [src/services/email.ts](src/services/email.ts) and [src/services/email-ses.ts](src/services/email-ses.ts).
- **Session**: [src/api/middleware/session.ts](src/api/middleware/session.ts) (Better Auth `getSession`); `GET /api/me`.
- **Extension session**: Long-lived token for user + install. Tables in 004; [src/services/extension-session.ts](src/services/extension-session.ts). Endpoints: `POST /api/auth/extension-session/code`, `POST /api/auth/extension-session` (exchange), `.../refresh`, `.../revoke`.
- **Hosted app**: Static HTML in [public/](public/) — sign-in, account (linked installs, connect extension), billing placeholder; served by Express with CORS credentials. [public/auth/extension-callback.html](public/auth/extension-callback.html) passes one-time code to extension.
- **README**: Env (auth, SES), auth flow, install identity, and extension-session usage documented.

---

## Next (from server.todo)

| Phase | Focus |
|-------|--------|
| **3** | Stripe: SDK, webhooks, Hosted Checkout, Customer Portal, subscription sync and entitlement tables. |
| **4** | Element sync: capture/capture_assets models, S3, upload flow, payload limits, API for submit/list captures. |
| **5** | Rate limits and abuse: per-install throttling, install_secret checks, UA validation, middleware. |
| **6** | MCP server on a different port, thin over shared services; extension “Copy MCP” and docs. |
| **7** | Optional: library view, sign-out behavior, DB backup to S3, monitoring. |

---

## Architecture and request flow

### Middleware and route order (critical)

In `src/loaders/express.ts` the order is:

1. `express.json()` — so all routes below can read JSON body.
2. `cors({ origin: true, credentials: true })` — allow credentials (cookies) for hosted app.
3. `app.use('/api/auth/extension-session', extensionSessionRouter)` — **must be before** the Better Auth catch-all so our extension-session routes handle `/api/auth/extension-session/*` instead of Better Auth.
4. `app.all('/api/auth/*', toNodeHandler(auth))` — Better Auth handles everything else under `/api/auth/` (sign-in, callback, magic-link, sign-out). Do **not** put `express.json()` before this in a way that breaks Better Auth; our current order is correct.
5. `mountApi(app)` — health, `/api/me`, `/api/installs`.
6. `express.static(publicDir)` — `server/public/` (index, sign-in, account, billing, auth/extension-callback.html). Resolved as `join(__dirname, '../../public')` so from `dist/loaders`, public is `server/public/`.

### Session and auth

- **Browser (hosted app)**: Better Auth sets HTTP-only cookies. Use `credentials: 'include'` on fetch. Session is read via `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })` in middleware.
- **Extension**: Cannot rely on cookies. Flow: user signs in on hosted app → account page gets one-time code (`POST /api/auth/extension-session/code`) → user opens extension-callback or extension receives code → extension calls `POST /api/auth/extension-session` with `install_id`, `install_secret`, `code` → server returns `{ token, expires_at }`. Extension stores token and sends it as `Authorization: Bearer <token>` (or body `token`) for refresh/revoke. Token is hashed (SHA-256) in DB; TTL 90 days; refresh issues a new token and updates hash.

### Install-first model

- Identity is **install** (install_id + install_secret), not machine fingerprint. Extension generates install_id (UUID/ULID) on first run; backend issues install_secret on first register.
- **Captures** (Phase 4) will belong to **install** first; `user_id` on install is nullable and set when user links the install from the account page. Anonymous captures stay on install and become visible when install is linked.
- One install ↔ at most one user at a time. One user can have many installs. Unlink clears `installs.user_id` but does not delete the install or its data.

### Database

- **Single SQLite file**; path from `config.DATABASE_PATH` (default `./data/element-armory.db`). Path is resolved relative to **process.cwd()** when not absolute; ensure you run from `server/` or set an absolute path.
- **Migrations**: Custom runner in `src/db/migrate.ts`. Reads `src/db/migrations/*.sql` in sorted order; runs each file not in `schema_migrations` inside a transaction; records filename as version. No down migrations. Use portable SQL (INTEGER, TEXT; avoid SQLite-specific types) for future Postgres.
- **Better Auth**: Uses the same DB via `getDb()`. Tables `user`, `session`, `account`, `verification` (003) use camelCase columns and quoted `"user"` for SQLite. Do not run Better Auth CLI migrate in parallel with our runner; we own 003_better_auth.sql.

---

## Full API reference

| Method | Path | Auth | Body / notes | Response |
|--------|------|------|--------------|----------|
| GET | `/health` | none | — | `{ status: "ok", timestamp: ISO }` |
| GET | `/ready` | none | — | 200 `{ ready: true }` or 503 `{ ready: false }` (DB ping) |
| GET | `/api/me` | cookie (optional) | — | 200 `{ user: { id, name, email, image? } }` or 401 `{ user: null }` |
| POST | `/api/installs/register` | none | `{ install_id, extension_version?, chrome_version?, os_family?, screen_width?, screen_height?, locale?, timezone? }` | 200 `{ install_id, install_secret }` or 400 `{ error }` (invalid install_id format) |
| GET | `/api/installs` | session | — | 200 `{ installs: [{ install_id, created_at, last_seen_at, extension_version? }] }` |
| POST | `/api/installs/link` | session | `{ install_id }` | 200 `{ ok }` or 400/404 `{ error }` |
| POST | `/api/installs/unlink` | session | `{ install_id }` | 200 `{ ok }` |
| POST | `/api/auth/extension-session/code` | session | `{ install_id }` | 200 `{ code }` (one-time, short-lived) |
| POST | `/api/auth/extension-session` | none | `{ install_id, install_secret, code }` | 200 `{ token, expires_at }` or 400 `{ error }` |
| POST | `/api/auth/extension-session/refresh` | Bearer or body `token` | `{ token? }` | 200 `{ token, expires_at }` or 401 |
| POST | `/api/auth/extension-session/revoke` | Bearer or body `token` | `{ token? }` | 200 `{ ok }` |
| (all other `/api/auth/*`) | — | — | — | Handled by Better Auth (sign-in, callback, magic-link, sign-out, etc.) |

Health router is mounted at root (no prefix); installs at `/api/installs`; me at `/api/me`. Session-required routes use `requireSession` from `src/api/middleware/session.ts`; they call `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })` and attach `req.session`; 401 if no session.

---

## Database schema (current)

- **schema_migrations** — `version` (TEXT PK), `applied_at` (TEXT). Managed by migration runner.
- **installs** — `install_id` (TEXT PK), `install_secret` (TEXT), `user_id` (TEXT NULL), `created_at`, `last_seen_at` (TEXT), `extension_version`, `chrome_version`, `os_family` (TEXT), `screen_width`, `screen_height` (INTEGER), `locale`, `timezone` (TEXT). `user_id` references Better Auth `user.id` when linked.
- **user** (Better Auth) — `id`, `name`, `email`, `emailVerified` (INTEGER), `image`, `createdAt`, `updatedAt`.
- **session** (Better Auth) — `id`, `userId`, `token`, `expiresAt`, `ipAddress`, `userAgent`, `createdAt`, `updatedAt`; FK to `user`.
- **account** (Better Auth) — `id`, `userId`, `accountId`, `providerId`, `accessToken`, `refreshToken`, `idToken`, `accessTokenExpiresAt`, `refreshTokenExpiresAt`, `scope`, `password`, `createdAt`, `updatedAt`; FK to `user`.
- **verification** (Better Auth) — `id`, `identifier`, `value`, `expiresAt`, `createdAt`, `updatedAt`.
- **extension_codes** — `code` (TEXT PK), `user_id`, `install_id`, `expires_at`, `created_at`. One-time codes for extension token exchange; deleted after use.
- **extension_sessions** — `id` (TEXT PK), `user_id`, `install_id`, `token_hash` (SHA-256 of token), `created_at`, `expires_at`. Long-lived extension tokens; refresh updates `token_hash` and `expires_at`.

All timestamps stored as ISO strings (TEXT) for portability.

---

## Environment variables

Defined in `src/constants/index.ts` and read in `src/config/index.ts`. Single `config` object; no env access elsewhere.

| Key | Required | Default | Notes |
|-----|----------|---------|--------|
| NODE_ENV | no | `development` | |
| PORT | no | `3000` | |
| DATABASE_PATH | no | `./data/element-armory.db` | Relative to cwd or absolute. |
| BETTER_AUTH_SECRET | yes for auth | `''` | Min 32 chars. |
| BETTER_AUTH_URL | no | `http://localhost:${PORT}` | Base URL for OAuth/magic-link callbacks. |
| GOOGLE_CLIENT_ID | yes for Google sign-in | `''` | Google Cloud Console OAuth client. |
| GOOGLE_CLIENT_SECRET | yes for Google sign-in | `''` | |
| AWS_SES_REGION | yes to send email | `''` | |
| AWS_ACCESS_KEY_ID | no (default creds) | `''` | For SES. |
| AWS_SECRET_ACCESS_KEY | no | `''` | |
| FROM_EMAIL | no | `''` | Sender for magic-link. If unset, magic-link logs URL to console. |

Add new keys in `ENV_KEYS`, `AppConfig` in types, and in `getConfig()`. Update `.env.example` and README.

---

## Conventions and patterns

- **ESM**: All imports use `.js` extension (e.g. `from '../config/index.js'`). `"type": "module"` in package.json.
- **Imports**: Config is loaded once via `import 'dotenv/config'` in `src/config/index.js`; other modules import `config` from there. DB: singleton `getDb()` from `src/db/connection.js`; ensure config (and thus dotenv) is loaded before first use (index.ts imports config then loaders).
- **Routes**: Each domain has a router in `src/api/routes/`; mounted in `src/api/index.ts` or in `express.ts` when order matters (extension-session). Session: use `requireSession` or `optionalSession`; then `req.session` and `req.session!.user.id` (with RequestWithSession type).
- **Services**: Stateless; receive params and call `getDb()` or other services. No request/response in services. Install service: `registerInstall`, `getInstallByInstallId`, `linkInstallToUser`, `unlinkInstall`, `listInstallsByUserId`. Extension-session: `createExtensionCode`, `exchangeCodeForToken`, `refreshExtensionToken`, `revokeExtensionToken`.
- **Types**: Shared request/response and config types in `src/types/index.ts`. Env key names only in `src/constants/index.ts`.
- **Migrations**: Add `NNN_description.sql` in `src/db/migrations/`; run `npm run migrate`. Create new file with `npm run migrate:create -- name` (script in package.json uses tsx and `src/db/migrate-create.ts`).

---

## Hosted app (static) and extension flow

- **Static files**: `server/public/` — `index.html`, `sign-in.html`, `account.html`, `billing.html`, `auth/extension-callback.html`. Served after API routes so `/account.html` etc. work. Same origin as API so cookies work.
- **Sign-in**: User opens sign-in page; “Sign in with Google” goes to `/api/auth/signin/google?callbackURL=/account.html`. Magic-link: form POSTs to `/api/auth/sign-in/magic-link` with `{ email, callbackURL }` (Better Auth). Callback URL should point to account (or a page that then links install if `install_id` in query).
- **Account**: Fetches `/api/me` and `/api/installs` with `credentials: 'include'`. If no session, redirect to sign-in. “Connect extension”: user enters install_id, submits → POST `/api/auth/extension-session/code` → response has `code`; page can link to `auth/extension-callback.html?code=...&install_id=...` (and optionally `extension_id` for chrome-extension redirect).
- **Extension**: (1) Register install: `POST /api/installs/register` with `install_id` (and telemetry); store `install_secret` securely. (2) Sign-in: open hosted app sign-in URL; after sign-in, user goes to account and gets code (or callback page redirects to extension with code). (3) Exchange: `POST /api/auth/extension-session` with `install_id`, `install_secret`, `code`; store `token` and `expires_at`. (4) Authenticated requests: send `Authorization: Bearer <token>`. (5) Refresh before expiry: `POST /api/auth/extension-session/refresh` with token; replace stored token. (6) Sign-out: `POST /api/auth/extension-session/revoke` then clear local token. Extension should not send cookies for API; only the Bearer token (or body) for extension-session endpoints.

---

## Key files and responsibilities

| Path | Responsibility |
|------|----------------|
| `src/index.ts` | Load config, create app, getDb(), listen(PORT). |
| `src/loaders/express.ts` | Create Express app; middleware order; mount extension-session router, Better Auth, mountApi, static. |
| `src/loaders/auth.ts` | Better Auth instance: DB, baseURL, secret, Google, magicLink(sendMagicLink → email service). |
| `src/api/index.ts` | Mount healthRouter (no prefix), meRouter at `/api/me`, installsRouter at `/api/installs`. |
| `src/api/routes/health.ts` | GET /health, GET /ready (DB ping). |
| `src/api/routes/me.ts` | GET / — optionalSession; return `{ user }` or `{ user: null }`. |
| `src/api/routes/installs.ts` | POST /register, GET /, POST /link, POST /unlink. Link/unlink use requireSession. |
| `src/api/routes/extension-session.ts` | POST /code (requireSession), POST / (exchange), POST /refresh, POST /revoke. Mounted at `/api/auth/extension-session` in express.ts. |
| `src/api/middleware/session.ts` | requireSession, optionalSession; fromNodeHeaders + auth.api.getSession; RequestWithSession type. |
| `src/config/index.ts` | dotenv/config; build config from process.env using ENV_KEYS and DEFAULTS. |
| `src/constants/index.ts` | ENV_KEYS, DEFAULTS only. |
| `src/types/index.ts` | AppConfig, HealthResponse, ReadyResponse, InstallIdentity, RegisterInstallBody, RegisterInstallResponse. |
| `src/db/connection.ts` | getDb(), closeDb(); ensure dir exists; resolve path relative to cwd. |
| `src/db/migrate.ts` | Read migrations dir; ensure schema_migrations; run new .sql in transaction; log applied. |
| `src/db/migrate-create.ts` | Create new timestamped .sql file in migrations (used by migrate:create script). |
| `src/services/install.ts` | registerInstall (nanoid(32) for secret), getInstallByInstallId, linkInstallToUser, unlinkInstall, listInstallsByUserId. UUID/ULID regex for install_id. |
| `src/services/extension-session.ts` | createExtensionCode (5 min TTL), exchangeCodeForToken (validates code, install, secret; deletes code; creates session 90d), refreshExtensionToken, revokeExtensionToken. Token hashed with SHA-256 in DB. |
| `src/services/email.ts` | sendMagicLinkEmail(email, url); if no FROM_EMAIL/SES config, log and return; else call email-ses. |
| `src/services/email-ses.ts` | sendMagicLinkViaSes: render MagicLinkEmail (react-email), SendEmailCommand via @aws-sdk/client-ses. |
| `src/emails/magic-link.tsx` | React component MagicLinkEmail({ url, email }); used by email-ses. |
| `public/*.html` | Static pages; account.html calls /api/me, /api/installs, /api/installs/unlink, /api/auth/extension-session/code. |

---

## Gotchas and implementation notes

- **Better Auth and express.json()**: Better Auth docs say do not put express.json() before the auth handler; we put json() first for our own routes (extension-session, mountApi) and the catch-all is after, so Better Auth still sees raw body where it needs it for its own routes. Our extension-session routes need JSON, so they are mounted before the catch-all and after json().
- **SQLite path**: `DATABASE_PATH` is resolved with `process.cwd()`. When running `npm run dev` or `npm start` from `server/`, cwd is `server/`, so `./data/element-armory.db` is `server/data/element-armory.db`. When running from repo root, it would be repo-root/data/... . Prefer running from `server/` or set an absolute path in production.
- **better-sqlite3 version**: We use ^12 for Better Auth compatibility. If you add another driver that expects 11.x, check peer deps.
- **Auth type export**: In auth.ts we use `getDb() as any` for the database option so the exported `auth` type does not reference better-sqlite3’s Database type (which would require a type-only import and can cause TS export issues).
- **Extension callback**: `public/auth/extension-callback.html` can redirect to `chrome-extension://<extension_id>/?code=...&install_id=...` if `extension_id` is in the query; otherwise it shows the code. Extension ID is typically from manifest or build; you can pass it as query param when linking from account.
- **CORS**: We use `origin: true, credentials: true` so the hosted app (same origin in prod) and local dev with different ports can send cookies. For Phase 3+ (Stripe, webhooks), webhook endpoints must not rely on browser CORS; Stripe will POST from their IP.
- **Phase 4 captures**: Design from server-setup: captures belong to install; store only metadata in DB; screenshots/large blobs in S3. Add `captures` and `capture_assets` tables; capture_assets hold object keys/URLs, not raw binary.
- **Phase 5 rate limits**: Plan per-install throttling and install_secret validation middleware for install-scoped routes (e.g. future capture submit). Apply after session middleware where needed.
- **Phase 6 MCP**: Run on a different port; MCP tools should call the same services (install, capture, etc.) so business logic is not duplicated. Auth: can accept extension token or app session; validate and map to user/install.

---

## How to add…

- **New env var**: Add to `ENV_KEYS`, `AppConfig` in types, `getConfig()`, `.env.example`, and README if user-facing.
- **New migration**: Add `NNN_name.sql` under `src/db/migrations/` (portable SQL). Run `npm run migrate`.
- **New route (no special order)**: Create router in `src/api/routes/`, export it; in `src/api/index.ts` do `app.use('/api/...', yourRouter)`.
- **New route that must be before Better Auth**: Mount in `src/loaders/express.ts` before `app.all('/api/auth/*', ...)` (like extension-session).
- **New session-protected route**: Use `requireSession` middleware; then `(req: RequestWithSession, res) => { req.session!.user.id ... }`.
- **New service**: Add under `src/services/`; use `getDb()` or other services; no Express req/res. Call from a route or from another service.

---

## Tech stack (current)

- **Runtime**: Node 18+, ESM, TypeScript. Build: `tsc` → `dist/`; dev: `tsx watch src/index.ts`.
- **API**: Express 4, cors, Better Auth (Google OAuth + magic-link plugin).
- **DB**: SQLite via better-sqlite3; custom migration runner; migrations 001–004.
- **Email**: @aws-sdk/client-ses, @react-email/components, @react-email/render, react-email; template in src/emails/magic-link.tsx.
- **Static app**: Plain HTML/JS in server/public/; no separate SPA build.
- **IDs/secrets**: nanoid (install_secret, extension codes and tokens); install_id format validated with UUID/ULID regex.

---

## Key files (quick ref)

| Area | Paths |
|------|--------|
| Entry | `src/index.ts` |
| App wiring | `src/loaders/express.ts`, `src/loaders/auth.ts`, `src/api/index.ts` |
| Config | `src/config/index.ts`, `src/constants/index.ts`, `src/types/index.ts` |
| DB | `src/db/connection.ts`, `src/db/migrate.ts`, `src/db/migrations/*.sql` |
| Install | `src/services/install.ts`, `src/api/routes/installs.ts` |
| Auth / session | `src/api/middleware/session.ts`, `src/api/routes/me.ts` |
| Extension session | `src/services/extension-session.ts`, `src/api/routes/extension-session.ts` |
| Email | `src/services/email.ts`, `src/services/email-ses.ts`, `src/emails/magic-link.tsx` |
| Hosted app | `public/*.html` |
