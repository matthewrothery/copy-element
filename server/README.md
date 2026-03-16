# Element Armory Server

API and MCP backend for Element Armory. Handles install identity, capture sync, auth, and entitlements.

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
npm install
```

Optional: copy env template and set values (defaults work for local dev):

```bash
cp .env.example .env
```

Default database path is `./data/element-armory.db` (relative to the current working directory when the server runs). The directory is created automatically.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with watch (tsx). |
| `npm run build` | Compile TypeScript to `dist/`. |
| `npm run start` | Run production server (`node dist/index.js`). |
| `npm run migrate` | Run DB migrations. |
| `npm run migrate:create -- [name]` | Create a new migration file in `src/db/migrations/`. |

Run migrations before first start (or when schema changes):

```bash
npm run migrate
npm run dev
```

## Health checks

- **GET /health** — Liveness: returns `200` and `{ "status": "ok", "timestamp": "<ISO>" }`.
- **GET /ready** — Readiness: returns `200` and `{ "ready": true }` when the server and DB are ready; returns `503` and `{ "ready": false }` if the DB is unavailable.

Example:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/ready
```

## Environment (Phase 2+)

See `.env.example` for all keys. Required for auth and magic link:

- **BETTER_AUTH_SECRET** — Min 32 characters (e.g. `openssl rand -base64 32`).
- **BETTER_AUTH_URL** — Base URL of the app (e.g. `http://localhost:3000`).
- **GOOGLE_CLIENT_ID** / **GOOGLE_CLIENT_SECRET** — From Google Cloud Console (OAuth 2.0). Redirect URI: `{BETTER_AUTH_URL}/api/auth/callback/google`.
- **AWS_SES_REGION**, **AWS_ACCESS_KEY_ID**, **AWS_SECRET_ACCESS_KEY**, **FROM_EMAIL** — For sending magic-link emails. If unset, magic links are logged to the console only.

## Auth and hosted app

- **Better Auth** handles sign-in at `/api/auth/*` (Google OAuth and magic link).
- **Hosted app** (static): open `/`, `/sign-in.html`, `/account.html`, `/billing.html`. Sign-in and account pages use cookies; CORS is configured with credentials.
- **Install identity**: `POST /api/installs/register` with `{ install_id }` (and optional telemetry) returns `install_secret`. No auth required.
- **Link install to user**: After sign-in, use account page or `POST /api/installs/link` with session cookie and `{ install_id }`. `GET /api/installs` lists linked installs; `POST /api/installs/unlink` with `{ install_id }` unlinks.
- **Extension session**: From the account page, get a one-time code via `POST /api/auth/extension-session/code` (session required). Exchange it with `POST /api/auth/extension-session` with `{ install_id, install_secret, code }` to receive a long-lived token. Use `POST /api/auth/extension-session/refresh` and `POST /api/auth/extension-session/revoke` for refresh and sign-out.
