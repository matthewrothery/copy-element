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
