---
title: Live auth state, guest-capture sync on sign-in, and MCP onboarding polish
status: Planned
created: 2026-06-13
owner: Matt
area: cross-cutting
tags: [bug, feature, refactor, migration]
---

# Live auth state, guest-capture sync on sign-in, and MCP onboarding polish

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

> Status colours: `Planned` blue, `In progress` yellow, `Completed` brightgreen, `On hold` orange, `Deprecated` red. Update the badge alongside the front-matter `status` field.

## Context

A signed-in user reported two onboarding failures on the extension's **MCP Connection** screen:

1. After signing in (Google, in a separate tab), the open MCP screen stayed on the signed-out view until a manual page refresh.
2. Their one pre-sign-in ("guest") capture never appeared over MCP, because guest captures are stored **local-only** and are never uploaded to the server.

Investigation this session established the mechanics:

- **Stale views.** `MCPPage.tsx:48-54` and `library/App.tsx:183-193` read `getAuthState()` once in a `useEffect([])` and never re-check. Sign-in completes in a different tab (website `ExtensionCallback` → `auth-callback.html` → background `EXCHANGE_AUTH_CODE` writes the token to `chrome.storage.local`, `background/index.ts:629`). No open view is notified. The **popup already solves this for itself** with a `chrome.storage.onChanged` listener (`popup/App.tsx:216-241`) — that proven pattern is the model to generalise.
- **Guest captures never sync.** `SAVE_SNIPPET` saves locally then calls `syncCaptureToServer`, which bails when there is no token (`sync-capture.ts:95 if (!token) return;`). Guest captures end up `syncStatus:'failed'`. `retryPendingSyncs()` (`background/index.ts:316`) already re-uploads `pending`/`failed` captures, but is only called on `onStartup` — **not after sign-in**. The website callback already links the install (`/api/installs/link` → `backfillUserIdForInstall`), and the server stamps `user_id` from the linked install at insert time (`server/src/services/capture.ts:53`). So a single post-sign-in `retryPendingSyncs()` call makes the backlog appear in MCP. The backlog is bounded to **≤ 10** (`GUEST_LIBRARY_LIMIT`, `src/shared/usage.ts:9`).
- **Duplicate-row risk.** `createCaptureWithAssets` does a plain `INSERT` with no dedup by `snippet_id`. Overlapping sync runs — or a service-worker teardown after `POST /api/captures` succeeds but before the local snippet is marked `synced` — create duplicate server rows that surface twice in MCP `listCaptures` and inflate capture counts.
- **Stale docs.** `mcp-server/README.md` still describes a local stdio server reading `~/.snappymcp/snippets.json`. The real implementation (`mcp-server/src/index.ts`) is a remote HTTP server with OAuth/JWT auth backed by the live user DB.

This plan ships: live auth state in all three extension views, guest-capture sync triggered on sign-in with a visible toast, a client-side concurrency guard plus a server-side idempotency safety net, and a README rewrite.

We explicitly **reject** uploading guest captures while still anonymous (no account): captures contain arbitrary page content (potential PII), guests have not consented to server storage, anonymous uploads are an unbounded S3-cost and abuse vector (`install_secret` is self-issued, not a verified user), and they create orphan rows needing retention tooling. Sync happens **only at/after sign-in**.

## Requirements & constraints

- **REQ-001** All three extension views (popup, library, MCP page) must reflect sign-in/sign-out without a manual refresh.
- **REQ-002** On successful sign-in (both `EXCHANGE_AUTH_CODE` and `trySilentAuth`), the local guest-capture backlog must upload to the server and become visible over MCP.
- **REQ-003** When a post-sign-in sync runs with a non-empty backlog, any open extension view must show a toast (start → done), with the MCP page as the primary surface.
- **REQ-004** A capture must never produce duplicate server rows, even under overlapping sync runs or service-worker teardown mid-upload.
- **REQ-005** `mcp-server/README.md` must accurately describe the remote HTTP/OAuth-JWT server and its tool set.
- **CON-001** Guest captures are uploaded **only** at/after sign-in — never anonymously. (Hard product/privacy boundary.)
- **CON-002** Backlog size is bounded to ≤ 10 (`GUEST_LIBRARY_LIMIT`); no batching/pagination needed.
- **GUD-001** TypeScript only; React functional components + hooks (no class components); Less/CSS only (no Tailwind); named exports; no `any`; files < 300 lines. (`chrome-extension/CLAUDE.md`, root `CLAUDE.md`.)
- **GUD-002** DB timestamps are epoch-ms `INTEGER` via `Date.now()` — never ISO strings. (root `CLAUDE.md`, `server/CLAUDE.md`.)
- **GUD-003** Server: business logic in `src/services/`, routes in `src/api/routes/`, migrations in `src/db/migrations/` as `NNN_description.sql` portable SQL. (`server/CLAUDE.md`.)
- **PAT-001** Live-auth via `chrome.storage.onChanged` on the auth token key — generalise the existing popup pattern (`popup/App.tsx:216-241`).
- **PAT-002** Background→view broadcast via `chrome.runtime.sendMessage({ type, payload })` — model on the existing `CAPTURE_READY` broadcast (`background/index.ts:413`).
- **PAT-003** Server idempotency reads `snippet_id` from `metadata.snippet_id` already carried in the capture POST body (`sync-capture.ts:167`).
- **SEC-001** No anonymous capture upload (see CON-001). No change to JWT/auth validation.
- **A11Y-001** The sync toast/status region uses `role="status"` + `aria-live="polite"`, is non-blocking, and auto-dismisses; contrast ≥ 4.5:1; respects `prefers-reduced-motion`.
- **TIER-001** Guest = local-only (10 FIFO). On sign-in the user becomes Free (25 ceiling), so a ≤10 backlog always fits without eviction. No tier-gating change. (`plan-features.md`.)

## References

- Internal docs: root `CLAUDE.md`, `chrome-extension/CLAUDE.md`, `server/CLAUDE.md`, `plan-features.md`, `mcp-server/README.md`, `copywriter.md` (currently empty — copy follows root voice rules).
- Key source read this session:
  - Extension: `src/app/pages/MCPPage.tsx`, `src/app/pages/mcp/McpSignedOut.tsx`, `src/popup/App.tsx`, `src/library/App.tsx`, `src/popup/api.ts`, `src/background/index.ts`, `src/background/sync-capture.ts`, `src/background/restore-from-cloud.ts`, `src/shared/storage/auth-storage.ts`, `src/shared/storage/snippet-storage.ts`, `src/shared/types/snippet.ts`, `src/shared/types/messages.ts`, `src/shared/usage.ts`, `src/popup/components/Toast.tsx`.
  - Server: `src/api/routes/internal-mcp.ts`, `src/api/routes/extension-session.ts`, `src/api/routes/captures.ts`, `src/services/capture.ts`, `src/services/mcp-capture.ts`, `src/services/install.ts`, `src/services/oauth.ts`.
  - MCP: `mcp-server/src/index.ts`, `src/tools/captures.ts`, `src/rate-limiter.ts`, `src/auth.ts`, `src/client/api-client.ts`.
- External docs: none new.
- Related plans: none in `./plans/active/` overlap (directory empty at planning time — verify before execution).

## Active plans affected

None found in `./plans/active/`. Execution agent should re-scan `./plans/active/` before starting; if a capture/sync/auth plan has appeared, reconcile FILE overlaps in `background/index.ts`, `sync-capture.ts`, and `captures.ts`.

## Docs to update on completion

- `mcp-server/README.md` — full rewrite (Phase 5 is the rewrite itself).
- `server/CLAUDE.md` — note the new `captures.snippet_id` column + idempotency behaviour in the schema/gotchas sections.
- `chrome-extension/CLAUDE.md` — note the `useAuthState` hook as the canonical auth-state pattern, the post-sign-in sync behaviour, and the new `'syncing'` snippet status + `CAPTURE_SYNC_STATUS` broadcast.
- `plan-features.md` — add a one-line note that guest captures sync to the server on sign-in (Guest→Free transition), reinforcing that guest data is local-only until then.
- `ARCHITECTURE.md` — **does not exist at repo root** (root `CLAUDE.md` references it aspirationally). Do not create a stray file; skip unless one is added before execution.

## Design & UX requirements

- **Tokens:** reuse existing extension semantic tokens; no hardcoded colours/spacing. Toast reuses `popup/components/Toast.tsx` styling. The MCP-page status line reuses existing `.mcp-loading`/`.mcp-spinner` tokens plus a text region.
- **New components:** none required if `Toast.tsx` is reusable across views; if the MCP page cannot host the popup `Toast` cleanly, add a minimal `McpSyncStatus` inline region (component token mapped to semantics, < 60 lines).
- **States covered:** sync **start** (spinner + "syncing" copy), **done-success** (count synced), **done-noop** (nothing to sync → no toast), **done-with-failures** (degraded copy, e.g. "Some captures didn't sync"). No blocking/modal state — the toast is non-intrusive.
- **Motion:** spinner + toast fade within `120–200ms`; honour `prefers-reduced-motion` (no spin, instant show). Auto-dismiss reuses the existing 2000ms toast timeout.
- **Copy direction** (exact wording deferred; follow root voice — concise, technical, developer-oriented; never claim unshipped features):
  - Start: "Syncing your captures…" (preferred) — avoid "with the MCP server", which misstates the data model (captures sync to the main server/S3+DB; MCP only reads them). If MCP relevance is wanted, "Syncing captures for MCP access…" is accurate.
  - Done: "Captures synced" or "N captures synced".
  - Failures: "Some captures didn't sync — they'll retry automatically."
- **Parity checklist:** no hardcoded values; no primitive tokens in component internals; baseline aligned; divergences (if any) annotated `ExtensionConstraint`.

## Accessibility requirements

- **A11Y baseline:** WCAG 2.1 AA.
- Toast/status region: `role="status"`, `aria-live="polite"`, `aria-atomic="true"`; never steals focus.
- Contrast ≥ 4.5:1 for toast text on its surface; spinner is decorative (`aria-hidden="true"`).
- `prefers-reduced-motion`: disable spin animation; show static state.
- No new interactive controls introduced; if a dismiss affordance is added it must be ≥ 32px and keyboard-operable with an explicit label.

## Data & API design

### Schema change (Phase 1)

- New migration `server/src/db/migrations/NNN_capture_snippet_id.sql` (next sorted number — verify highest existing, currently ≥ 021):
  - `ALTER TABLE captures ADD COLUMN snippet_id TEXT;`
  - Backfill: `UPDATE captures SET snippet_id = json_extract(metadata_json, '$.snippet_id') WHERE snippet_id IS NULL AND metadata_json IS NOT NULL;`
  - `CREATE INDEX idx_captures_install_snippet ON captures(install_id, snippet_id);` (non-unique — see ALT-002 for why not unique initially).
- **Timestamps:** none added; reuse existing epoch-ms columns (GUD-002).

### Service change (Phase 1)

- `server/src/services/capture.ts`:
  - Extend `CreateCaptureInput` with optional `snippet_id?: string | null`.
  - In `createCaptureWithAssets`, **before insert**, if `snippet_id` is present, `SELECT id FROM captures WHERE install_id = ? AND snippet_id = ?`. If a row exists, return it (idempotent no-op) instead of inserting. Otherwise insert with the `snippet_id` column populated. Keep inside the existing transaction.
  - Idempotency is scoped by `install_id` (not `user_id`) to match how the row is created and to cover the not-yet-linked case.

### Route change (Phase 1)

- `server/src/api/routes/captures.ts` POST handler: extract `snippet_id` from `body.metadata.snippet_id` (already sent — `sync-capture.ts:167`) and pass it through to `createCaptureWithAssets`. No new endpoint. Existing install auth (`requireInstallAuth`) unchanged.

### Auth / tier

- No change to auth, JWT, or tier gating. Sync uses the existing install Bearer token; the server stamps `user_id` from the linked install (`capture.ts:60`).

## Extension / Figma plugin requirements

- **Manifest:** no changes; no new permissions (`storage` already present; `chrome.storage.onChanged` needs no extra permission).
- **Messaging surfaces touched:**
  - New broadcast `CAPTURE_SYNC_STATUS` (background → open views), added to `src/shared/types/messages.ts` and the `RuntimeMessage`/broadcast union.
  - `EXCHANGE_AUTH_CODE` and `TRY_SILENT_AUTH`/`trySilentAuth` gain a post-auth `retryPendingSyncs({ notify: true })` call.
- **Error handling:** all sync failures already degrade to `syncStatus:'failed'` and are retried; the broadcast and toast must be best-effort (`.catch()`), never blocking auth completion or capture save. MCP network failures are surfaced as the "some captures didn't sync" toast, not thrown.
- **MCP protocol:** unchanged (README only).

## Architecture decisions

- **AD-001 — Generalise the popup listener into a shared `useAuthState` hook; adopt in all three views including a popup refactor.** Chosen over MCPPage-only (would leave library stale) and over leaving the popup bespoke (drift between three copies of the same logic). Risk: the popup is state-heavy (`isPaid`/`email`/`plan` + its own `trySilentAuth` trigger); mitigated by phasing the popup consolidation **last** (Phase 2c) and keeping the popup's `trySilentAuth` call outside the hook. The hook owns auth *state*; it does not own the silent-auth *trigger*.
- **AD-002 — Hook reads `getAuthState()` directly from `chrome.storage.local` and refreshes on changes to any of the token / email / plan keys.** Chosen over the popup's token-only + background round-trip approach, which has a plan-lag quirk (token writes before the async profile write, so plan can briefly read stale). Direct read is lighter (no worker round-trip) and all three contexts have storage access.
- **AD-003 — Client concurrency guard = module-level in-flight flag (for `retryPendingSyncs`) + in-memory per-snippet claim `Set<snippetId>` (covers the `SAVE_SNIPPET` inline-sync path too), plus a persisted `'syncing'` status for UI and a startup reconciliation that resets orphaned `'syncing'`→`'failed'`.** The in-memory `Set` is authoritative for races within a worker lifetime (MV3 runs a single worker instance); the persisted status is for cross-context visibility; reconciliation handles worker teardown mid-sync. See ALT-001.
- **AD-004 — Server-side idempotency by `(install_id, snippet_id)` as a safety net, in addition to the client guard.** The client guard cannot cover a worker teardown that happens *after* `POST /api/captures` succeeds but *before* the local snippet records `synced` — on restart the snippet still looks unsynced and re-uploads. Only the server can dedup that. Chosen as a pre-insert SELECT rather than a DB UNIQUE constraint to avoid a migration failure on any pre-existing duplicate rows (ALT-002).
- **AD-005 — Sequence `restoreCapturesFromCloud` (pull) before `retryPendingSyncs` (push) in the post-sign-in path.** They are largely independent (restore dedups by `snippet_id` and only adds; push only uploads existing locals), but deterministic ordering avoids any library-limit interaction and makes the toast lifecycle predictable.

## Phases

> Recommended ship order: **Phase 1 first** (server safety net deployed before clients begin pushing backlogs), then the extension phases (2→3→4), then docs (5). Each phase is independently verifiable and leaves the app working.

### Phase 1 — Server-side capture idempotency by (install_id, snippet_id)

**Goal (GOAL-001):** `POST /api/captures` becomes idempotent per `(install_id, snippet_id)`, so retries and races can never create duplicate server rows.

| Task     | Description                                                                                                     | Done | Date |
|----------|---------------------------------------------------------------------------------------------------------------|------|------|
| TASK-001 | Add migration `server/src/db/migrations/NNN_capture_snippet_id.sql`: add `snippet_id TEXT`, add non-unique index `idx_captures_install_snippet`. Backfill is **optional** — the idempotency net works on new rows without it (TASK-004). If included, `json_extract(metadata_json,'$.snippet_id')` is SQLite-only; comment it as such (Postgres would use `metadata_json::json->>'snippet_id'`). Backfill cannot fail on dirty data because the index is non-unique |      |      |
| TASK-002 | Extend `CreateCaptureInput` with `snippet_id?: string \| null` and `CaptureRow`/`CaptureWithAssets` with `snippet_id` in `server/src/services/capture.ts` |      |      |
| TASK-003 | In `createCaptureWithAssets`, pre-insert SELECT by `(install_id, snippet_id)`; return existing row if found, else insert with `snippet_id` populated (inside the existing transaction) |      |      |
| TASK-004 | In `server/src/api/routes/captures.ts` POST, extract `snippet_id` from `body.metadata.snippet_id` **before** it is JSON-stringified into `metadata_json` (`:135`); validate it is a string, else pass `null` (mirror the restore route's treatment at `:325`); pass it to the service |      |      |
| TASK-005 | Unit tests for idempotency: same `(install_id, snippet_id)` twice → one row, same id returned; null `snippet_id` still inserts |      |      |

**Files touched (FILE-…):**
- `server/src/db/migrations/NNN_capture_snippet_id.sql` (new)
- `server/src/services/capture.ts` (input/row types + idempotent insert)
- `server/src/api/routes/captures.ts` (pass `snippet_id` through)
- `server/src/services/capture.test.ts` (extend)

**Tests added in this phase:** idempotency unit tests (duplicate insert → single row; null snippet_id path; existing-row id returned).

**Verify:**
- `cd server && npm run migrate` (applies cleanly; backfill populates `snippet_id`).
- `cd server && npm run build && npm test`.
- Manual: `POST /api/captures` twice with identical `metadata.snippet_id` → `SELECT count(*) FROM captures WHERE install_id=? AND snippet_id=?` returns 1.

### Phase 2 — Shared `useAuthState` hook + adopt in MCPPage, library, popup

**Goal (GOAL-002):** All three views reflect sign-in/sign-out live via one shared hook.

#### Phase 2a — Hook
| Task     | Description                                                                                          | Done | Date |
|----------|-----------------------------------------------------------------------------------------------------|------|------|
| TASK-006 | Add `src/app/shared/hooks/useAuthState.ts`: state `{ signedIn, userEmail, userPlan, loading }`; read `getAuthState()` on mount; subscribe to `chrome.storage.onChanged` (area `local`) refreshing when any of `element-armory-auth-token` / `-user-email` / `-user-plan` change; treat falsy token as signed-out; clean up listener on unmount |      |      |
| TASK-007 | Unit tests (Vitest + `chrome.*` mock): initial signed-out, token-add → signed-in, token-remove → signed-out, plan change → updated plan, listener removed on unmount |      |      |

#### Phase 2b — Adopt in MCPPage + library
| Task     | Description                                                                                          | Done | Date |
|----------|-----------------------------------------------------------------------------------------------------|------|------|
| TASK-008 | Refactor `src/app/pages/MCPPage.tsx` to derive `state` from `useAuthState` (loading → spinner, signedIn → ready, else signed-out); remove the one-shot `useEffect` |      |      |
| TASK-009 | Refactor `src/library/App.tsx` auth read (`:183-193`) to `useAuthState`; keep `isGuest`/`isPaid` derived from it |      |      |

#### Phase 2c — Consolidate popup (last, isolated)
| Task     | Description                                                                                          | Done | Date |
|----------|-----------------------------------------------------------------------------------------------------|------|------|
| TASK-010 | Replace the popup's bespoke listener (`popup/App.tsx:216-241`) and one-shot read with `useAuthState`; keep the existing `trySilentAuthFromBackground()` trigger when signed-out; derive `isSignedIn`/`isPaid`/`userEmail`/`userPlan` from the hook |      |      |
| TASK-011 | Manual + existing popup test pass to confirm no regression in paywall/plan gating                    |      |      |

**Files touched (FILE-…):**
- `src/app/shared/hooks/useAuthState.ts` (new) + `useAuthState.test.ts` (new)
- `src/app/pages/MCPPage.tsx`, `src/library/App.tsx`, `src/popup/App.tsx`

**Tests added in this phase:** hook unit tests (TASK-007); existing popup/library tests must still pass.

**Verify:**
- `cd chrome-extension/extension && npm run lint && npm test`.
- **Verify (human):** load unpacked extension, open MCP page in a tab, sign in via the separate tab → MCP page flips to connected **without refresh**. Repeat for the library tab. Sign out → all open views revert live.

### Phase 3 — Sync guest backlog on sign-in + concurrency guard

**Goal (GOAL-003):** The guest backlog uploads on sign-in exactly once per capture, with no duplicate server rows.

| Task     | Description                                                                                                   | Done | Date |
|----------|--------------------------------------------------------------------------------------------------------------|------|------|
| TASK-012 | Add `'syncing'` to the `syncStatus` union in `src/shared/types/snippet.ts:75` and accept it in the normalizer `src/shared/storage/snippet-storage.ts:71` |      |      |
| TASK-013 | In `src/background/index.ts`, add module-level `let retryInFlight = false` and `const syncingIds = new Set<string>()`; add `claimSync`/`releaseSync` helpers |      |      |
| TASK-014 | Refactor `retryPendingSyncs` to early-return if `retryInFlight`; set the flag in a `try/finally`; per snippet, skip if claimed, else claim + set persisted `'syncing'` before upload, release + set `'synced'`/`'failed'` after; accept `options?: { notify?: boolean }`. **Race note:** if a run is requested with `notify:true` while `retryInFlight` is already true (e.g. an `onStartup` retry is mid-flight when sign-in fires), do not silently drop the toast — emit the `CAPTURE_SYNC_STATUS` broadcast around the in-flight run (or queue a single re-run) so REQ-003 holds |      |      |
| TASK-015 | Apply the same per-snippet claim to the inline `SAVE_SNIPPET` sync path (`background/index.ts:528-536`) so it can't race the retry loop for a fresh capture |      |      |
| TASK-016 | Add startup reconciliation: on `onStartup`/init, reset any snippet with `syncStatus:'syncing'` → `'failed'` (orphaned by a dead worker). **Must run before** the existing `onStartup` `retryPendingSyncs()` call (`background/index.ts:172`), otherwise an orphaned `'syncing'` snippet is invisible to the `pending`/`failed` filter and never retries |      |      |
| TASK-017 | Call `retryPendingSyncs({ notify: true })` after auth succeeds in `EXCHANGE_AUTH_CODE` and in `trySilentAuth`, sequenced **after** restore. **Placement:** in `EXCHANGE_AUTH_CODE`, restore is currently fire-and-forget (`void restoreCapturesFromCloud(...).catch()`) inside the nested best-effort IIFE (`:634-660`) — add the push **inside that same IIFE** and `await` restore first; do not place it in the outer handler after `sendResponse`. Same await-restore-then-push ordering in `trySilentAuth` (`:163`) |      |      |
| TASK-018 | Unit tests: overlapping `retryPendingSyncs` calls upload each snippet once; in-flight flag blocks re-entry; orphaned `'syncing'` reconciled to `'failed'`; `notify` flag plumbs through |      |      |

**Files touched (FILE-…):**
- `src/shared/types/snippet.ts`, `src/shared/storage/snippet-storage.ts`
- `src/background/index.ts` (guard, helpers, reconciliation, post-auth calls)
- `src/background/index.test.ts` and/or `src/background/sync-capture.test.ts` (extend)

**Tests added in this phase:** concurrency-guard and reconciliation unit tests with mocked `syncCaptureToServer` and `chrome.storage`.

**Verify:**
- `cd chrome-extension/extension && npm run lint && npm test`.
- **Verify (human):** as a guest, capture 1–2 elements (confirm local-only, `syncStatus` not `synced`); sign in; confirm the captures get `serverCaptureId`/`synced` and appear via MCP `listCaptures`; confirm exactly one server row per capture (`SELECT count(*) … WHERE install_id=? AND snippet_id=?` = 1).

### Phase 4 — Sync-status broadcast + "Syncing your captures…" toast

**Goal (GOAL-004):** When a post-sign-in sync runs with a non-empty backlog, open views show a non-blocking, accessible toast.

| Task     | Description                                                                                                   | Done | Date |
|----------|--------------------------------------------------------------------------------------------------------------|------|------|
| TASK-019 | Add `CAPTURE_SYNC_STATUS` broadcast type to `src/shared/types/messages.ts`: `{ type, payload: { phase: 'start' \| 'done'; total?: number; synced?: number; failed?: number } }` |      |      |
| TASK-020 | In `retryPendingSyncs({ notify: true })`, when the backlog is non-empty, broadcast `phase:'start'` before and `phase:'done'` (with counts) after, best-effort via `chrome.runtime.sendMessage().catch()` (model on `CAPTURE_READY`, `:413`); no broadcast when nothing to sync |      |      |
| TASK-021 | MCP page: listen for `CAPTURE_SYNC_STATUS` and render an accessible status/toast region (`role="status"`, `aria-live="polite"`); reuse `.mcp-loading` spinner tokens; success/failure/none states per Design section |      |      |
| TASK-022 | Popup + library: also handle `CAPTURE_SYNC_STATUS` via the existing `Toast.tsx` if the view is open (trivial reuse of existing toast state) |      |      |
| TASK-023 | Add `role="status"` / `aria-live="polite"` / `aria-atomic="true"` to `popup/components/Toast.tsx` (confirmed a bare `<div className="toast">` today). Popup and library both render `<Toast message={...}/>` off one string, so this single edit satisfies A11Y-001 across all reuse sites |      |      |
| TASK-024 | Unit tests: broadcast emitted only for non-empty notify runs; view handler maps phases to toast copy/states |      |      |

**Files touched (FILE-…):**
- `src/shared/types/messages.ts` (new broadcast type)
- `src/background/index.ts` (emit broadcast inside the guarded retry)
- `src/app/pages/MCPPage.tsx` (or a small `src/app/pages/mcp/McpSyncStatus.tsx` + CSS)
- `src/popup/App.tsx`, `src/library/App.tsx`, `src/popup/components/Toast.tsx`

**Tests added in this phase:** broadcast-emission and view-handler unit tests.

**Verify:**
- `cd chrome-extension/extension && npm run lint && npm test`.
- **Verify (human):** with a guest backlog, sign in while the MCP page is open → "Syncing your captures…" appears, then a success state with the count; with zero backlog, no toast appears; force a sync failure (offline) → degraded toast and captures remain `failed` for later retry.

### Phase 5 — Rewrite `mcp-server/README.md`

**Goal (GOAL-005):** The README matches the real remote HTTP/OAuth-JWT server.

| Task     | Description                                                                                                   | Done | Date |
|----------|--------------------------------------------------------------------------------------------------------------|------|------|
| TASK-025 | Rewrite `mcp-server/README.md`: remote HTTP transport (`StreamableHTTPServerTransport`), OAuth protected-resource metadata (`/.well-known/oauth-protected-resource`), Bearer JWT auth, backed by the live user DB via the internal API |      |      |
| TASK-026 | Document the real tools by category — Captures (`getLatestCapture`, `getCaptureById`, `listCaptures`), Prompts (`getBasicPrompt`, `getAdvancedPrompt` [Pro]), Transform (`cleanCapture`, `extractComponentStructure`, `mapExternalResources`), Convert (`convertCapture`, 5 quota units) — and the free tier limit (10 calls/month, `rate-limiter.ts`) |      |      |
| TASK-027 | Document client setup (Cursor/Claude Code/Claude Desktop) consistent with `McpConnect.tsx` snippets; remove all `~/.snappymcp/snippets.json` / stdio / `snappymcp-host` references |      |      |

**Files touched (FILE-…):** `mcp-server/README.md`.

**Tests added in this phase:** none (docs). 

**Verify:** Manual read-through against `mcp-server/src/index.ts`, `tools/*`, `rate-limiter.ts`; cross-check tool names and the free-tier number against source.

## Alternatives considered

- **ALT-001 — Persist `'syncing'` as the sole race guard (no in-memory Set).** Rejected as *sole* mechanism: MV3 can terminate the worker mid-upload, stranding a persisted `'syncing'` that the retry filter (`pending`/`failed`) never picks up. We keep an in-memory claim `Set` as authoritative and reconcile orphaned `'syncing'` → `'failed'` on startup (AD-003).
- **ALT-002 — DB `UNIQUE(install_id, snippet_id)` constraint instead of a service-level pre-insert SELECT.** Rejected for the initial migration: existing data may already contain duplicates, which would make the unique-index creation fail. Ship the column + non-unique index + service idempotency now; a UNIQUE index can be added in a later migration once data is verified clean.
- **ALT-003 — Upload guest captures anonymously (before sign-in).** Rejected — privacy/consent on arbitrary page content, S3 cost, abuse vector (self-issued `install_secret`), and orphan rows (CON-001, ALT in Context).
- **ALT-004 — Server push/SSE to notify open extension views of sign-in.** Rejected — `chrome.storage.onChanged` is the native, zero-infra signal and is already proven in the popup (PAT-001).
- **ALT-005 — MCPPage-only auth fix.** Rejected — library has the identical staleness bug; one shared hook fixes both and removes drift (AD-001).

## Dependencies

- **DEP-001** Phase 1 must be deployed (`/release server` → migration applied) before, or at the same time as, the extension phases reach users, so the server safety net exists when clients begin pushing backlogs. Not a code dependency, a rollout ordering.
- **DEP-002** No new npm packages. Existing: `@modelcontextprotocol/sdk`, `jose`, `better-sqlite3`, Vitest, React.
- **DEP-003** Extension changes require a Chrome Web Store submission to reach end users (manual review latency).

## Testing strategy

- **Unit (Vitest):** `useAuthState` (storage-change transitions, cleanup); concurrency guard (overlap → single upload, in-flight re-entry block, orphan reconciliation); broadcast emission (only non-empty notify runs); server idempotency (`createCaptureWithAssets` duplicate → single row). Mock `chrome.*` per `chrome-extension/CLAUDE.md`; never touch real extension APIs.
- **Integration:** server `POST /api/captures` idempotency via the route (supertest or `curl` against a local server) — duplicate `metadata.snippet_id` yields one row.
- **E2E / smoke:** extend existing extension test suites; no new harness.
- **Manual verification fallback (human):** the cross-tab sign-in → live-update flow and the visible toast cannot be fully automated in CI (real Chrome extension install + cross-context messaging). Marked `**Verify (human):**` in Phases 2–4.

## Code-quality principles applied

- Server: services/route split honoured; idempotency logic lives in `services/capture.ts`, route only marshals input; migration in `src/db/migrations/`.
- DB: no new timestamps; existing epoch-ms columns unchanged (GUD-002).
- Frontend: hook + functional components only; CSS/Less only (no Tailwind); named exports; no `any`; new files < 300 lines; co-located tests.
- Errors: sync and broadcast failures are best-effort and never block auth or capture save; MCP/network failures surface as a degraded toast, not a throw.
- Tokens: toast/status reuse semantic tokens; no primitives in component internals; parity checklist applied.

## Risks & assumptions

- **RISK-001 — Popup regression (Phase 2c).** The popup is state-heavy and drives paywall gating. Mitigation: consolidate last, keep `trySilentAuth` trigger outside the hook, run existing popup tests + manual gating check (TASK-011).
- **RISK-002 — Migration backfill on dirty data.** If pre-existing duplicate `(install_id, snippet_id)` rows exist, a future UNIQUE index would fail. Mitigation: ship non-unique now (ALT-002); add a cleanup + UNIQUE migration later if desired.
- **RISK-003 — Double toast across multiple open views.** If popup, library, and MCP page are all open, each shows its own toast. Acceptable (each is its own context); not worth coordinating.
- **RISK-004 — `restoreCapturesFromCloud` currently fire-and-forget in `EXCHANGE_AUTH_CODE`.** Sequencing restore→push (AD-005) changes timing slightly; verify restore still completes and the library limit interaction is benign for a ≤10 backlog.
- **ASSUMPTION-001** MV3 runs a single service-worker instance (no true parallel workers), so a module-level in-flight flag + in-memory `Set` are sufficient within a worker lifetime.
- **ASSUMPTION-002** `metadata.snippet_id` is present and stable on every capture POST (confirmed `sync-capture.ts:167`); server idempotency keys on it.
- **ASSUMPTION-003** `copywriter.md` is intentionally empty; copy follows root `CLAUDE.md` voice. Confirm before finalising toast wording.

## Out of scope

- Anonymous (pre-sign-in) guest-capture upload.
- A DB UNIQUE constraint on `(install_id, snippet_id)` in this iteration.
- Any MCP server **code** changes (README only).
- Sync progress beyond start/done (no per-capture progress bar).
- Backfilling/repairing any duplicate rows already in production (separate cleanup task if found).

## Architect notes

Architect review verdict: **ship** — no BLOCKING items. All five flagged risk areas hold up; `getAuthState()` is confirmed importable in all three contexts (`MCPPage.tsx:3` already imports it directly). WARNINGS were folded into the tasks above:

- **Reconciliation-before-retry ordering** → TASK-016 (must precede `onStartup`'s `retryPendingSyncs()` at `:172`).
- **Awaited restore→push inside the nested IIFE** → TASK-017 (place push inside the `:634-660` closure, `await` restore first; not after `sendResponse`).
- **`retryInFlight` + `notify` race suppressing the toast** → TASK-014 (emit broadcast around the in-flight run or queue a single re-run).
- **`json_extract` portability / optional backfill** → TASK-001 (backfill optional; comment SQLite-specificity).
- **Popup direct-read timing change** → covered by TASK-011 gating regression check.

Remaining low-priority suggestions (not folded; act on during execution if convenient):
- AD-005 clarification: the post-sign-in push only re-uploads existing locals (never adds), so it cannot exceed the local count and cannot interact with the Free 25-limit even after a cloud restore — stated here for the executor's confidence.
- TASK-004: ensure the `null` snippet_id path is genuinely exercised (mirror restore route `:325` non-string handling) so TASK-005's null-path test is meaningful.
