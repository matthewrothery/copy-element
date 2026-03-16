# The Server

We are building an MCP backend and API service for Element Armory.

There is a partial MCP server already; we need to completely rework it and how everything works.

Users capture elements in their browser extension. Those captures sync to our backend and database.

---

## Identity: Install ID + Install Secret (not fingerprinting)

**Do not** use machine fingerprinting as identity. Use a generated install identity and treat machine details as telemetry only.

- **install_id**: Random UUID or ULID generated on first run (extension generates it; backend may re-issue).
- **install_secret**: Issued by the backend when the install is first registered. The extension uses both `install_id` and `install_secret` for authenticated install-level sync. That gives anonymous-but-authenticated device registration—no one can post captures against an install without the secret.

Store telemetry for stats only (never as primary key):

- install_id, install_created_at, last_seen_at  
- extension_version, chrome_version, os_family  
- screen width/height, locale, timezone, architecture (if useful)

Omit PII (e.g. IP). Those values change, are weak identifiers, and can create privacy concerns. Reinstalls are handled explicitly (new install_id), not guessed.

---

## Anonymous install session (captures belong to install first)

Users can save elements before signing in. Model that explicitly:

1. Extension installs → generates `install_id` (and gets `install_secret` from backend on first registration).
2. Extension can capture and sync using that install identity (no user required).
3. Later, user signs in → backend links one or more installs to that user account.
4. **Elements belong to the install first, not necessarily the user first.** After sign-in, the install is linked to `user_id`; prior captures stay intact and become visible in the account. No migration pain.

**Install linking rules to encode:**

- An install is linked to at most one account at a time.
- If the user signs out on an install: install remains, account link is removed; captures still belong to the install.
- Anonymous captures become visible in the account after linking. User can unlink an install from the account page if desired.

---

## Hosted app / dashboard

Build a lightweight web app (e.g. `https://app.elementarmory.com`) in addition to the extension. The extension can open these URLs for anything that’s easier on the web:

- Auth callback (OAuth / magic link)
- Stripe Checkout success/cancel
- Subscription management, invoices, linked installs
- Library / history of captures
- Plan upgrades

Example links from the extension:

- `https://app.elementarmory.com/account`
- `https://app.elementarmory.com/billing`

Do not try to do all of this only inside the extension UI.

---

## Authentication

Use **Better Auth** on the hosted app/backend:

- **Primary**: Google.
- **Secondary**: Magic link via email.

**Chrome extension session model:**  
The extension must stay signed in until the user signs out. Do not rely on “normal browser cookies” alone across extension contexts.

- Run Better Auth on the hosted app/backend.
- Extension opens the hosted sign-in flow; after auth, exchange into a **long-lived extension-safe session** (e.g. app-issued token tied to user + install).
- Implement silent refresh and explicit sign-out that revokes the extension session. Plan for: secure account session in hosted app → extension holds app-issued token → silent refresh; sign-out revokes extension session.

---

## Payment processing (Stripe)

- **Before purchase:** User must have an account.
- **Checkout:** Use **Stripe Hosted Checkout** for purchase. Link the paid subscription to the user after checkout.
- **Invoices and subscription management:** Use **Stripe Customer Portal** (hosted). Do not build custom invoice/subscription UIs. The app only needs:
  - “Upgrade” → Stripe Checkout
  - “Manage billing” → Stripe Customer Portal

**Webhooks from day one:**  
Provision access from Stripe events, not only from the user landing on the success page. Implement webhooks for at least:

- checkout completed  
- subscription created / updated  
- invoice paid / invoice payment failed  
- subscription canceled  

---

## Element sync and storage

For each element capture, the extension submits data to the server, keyed by **install** (install_id + install_secret).

**Do not store raw screenshots (or other large blobs) in SQLite.**

- **SQLite/Postgres:** Metadata and references only.
- **S3 (or equivalent):** Screenshots, and optionally large HTML/CSS artifacts if they get big.

**Split “capture” from “capture assets”:**

- **Capture record (metadata):**  
  install_id, user_id (nullable), source_url, captured_at (UTC datetime), created_by_user_id (nullable), created_by_install_id (required), status, metadata. Optional derived epoch if needed.
- **Capture assets (in object storage + refs in DB):**  
  screenshot object key, HTML (blob or text reference), stylesheet (blob or text reference). Optionally normalized/extracted summaries later. Store object key/URL/checksum in DB.

This keeps backups and a future Postgres migration manageable and leaves room for retries, reprocessing, MCP enrichment, and deduping.

---

## Rate limits and abuse protection

Anonymous installs can send captures without user auth, so guardrails are required:

- Per install_id rate limit  
- Per extension version checks  
- Signed request or install_secret (install-level auth)  
- Payload size limits, screenshot upload limits  
- User-agent validation  
- Optional: proof-of-install token issued by backend  

---

## Plans and entitlements

Do not drive product logic by reading Stripe tables everywhere. Maintain an internal notion of:

- **Plans:** e.g. free, pro, team  
- **States:** e.g. active, inactive, trialing, past_due, canceled  

A **subscription sync service** (fed by Stripe webhooks and API) maps Stripe state into app entitlements. The rest of the app checks entitlements, not raw Stripe records.

---

## Technology

- Node.js, TypeScript  
- Express API  
- MCP server (thin layer over the same services the API uses—see below)  
- Better Auth (Google + magic link)  
- SQLite for now; design schema and migrations so we can move to Postgres later. Back up DB to S3 (e.g. nightly).  
- S3 (or compatible object storage) for screenshots and large assets  

---

## Project structure

```
/src
  /api
    /middleware
    /routes
    index.ts
  /config
  /db
    /migrations
    /schema
    connection.ts
  /loaders
    express.ts
    auth.ts
    stripe.ts
  /models
  /services
    user
    auth
    install
    capture
    subscription
    billing
    mcp
  /jobs
  /public
  /types
  /utils
  /constants
```

- **Migrations and schema:** First-class under `/db/migrations` and `/db/schema` (even if query logic lives in `/models`).  
- **Jobs:** Reserve a `/jobs` (or `/workers`) folder for async work: screenshot post-processing, asset upload verification, nightly S3 backup, Stripe sync retries, MCP indexing/enrichment, dedupe/cleanup. Start minimal; structure from the beginning.

---

## Core tables (minimum)

- users  
- accounts (or auth-provider-linked accounts)  
- sessions  
- installs (with optional user_id for linking; install_secret)  
- captures  
- capture_assets (references to object storage)  
- subscriptions (or entitlement cache)  
- subscription_events  
- stripe_customers  
- install_events (or telemetry pings)  
- magic_links / verification tokens (if auth layer needs them)  

Let Better Auth own its auth tables; keep app tables separate.

---

## MCP as a thin layer

The MCP server should be a thin interface over the same services the API uses:

- API routes call services.  
- MCP tools call the same services.  
- Models sit below services.
- This must sit on a different port than the API.
- The MCP server must be able to port over to a micro service later. Therefore keep it separate from the API.

Avoid duplicating business logic in MCP so you don’t end up with two backends that drift.

---

## Extension UX (recap)

- Extension shows account/sign-in state (e.g. account icon in footer).  
- When pressed, open the hosted app (e.g. account page, billing).  
- User manages subscription and invoices via Stripe Customer Portal from the app; extension only needs “Upgrade” and “Manage billing” entry points.

---

## Summary: must-haves before proceeding

- Use **install ID + install secret**; never fingerprint as identity.  
- Captures belong to **install first, user second**; anonymous session then link on sign-in.  
- **Stripe Hosted Checkout** + **Stripe Customer Portal**; drive provisioning from **webhooks**.  
- Store **screenshots in S3**, not SQLite blobs; DB holds metadata and references.  
- **Rate limiting** (and install_secret) for anonymous install sync.  
- **Migrations** and **jobs** folders; schema and async work from the start.  
- **MCP** as a thin layer over shared services.  
- **Small hosted account app** alongside the extension for auth, billing, and library.


NPM Packages:
- express
- better-auth
- stripe
- sqlite3
- nanoid
- node-pg-migrate
