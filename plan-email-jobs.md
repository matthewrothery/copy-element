# Email Templates + Background Job Queue — Implementation Plan

## Status

- [x] Phase 1 — DB-Backed Job Queue
- [x] Phase 2 — New Email Templates
- [x] Phase 3 — Email Send Functions
- [ ] Phase 4 — Trigger Wiring

---

## Phase 1 — DB-Backed Job Queue

### Migration: `server/src/db/migrations/015_job_queue.sql`

Table: `job_queue`
- `id` TEXT PK (nanoid)
- `type` TEXT — job type constant
- `payload_json` TEXT — JSON stringified payload
- `status` TEXT — `pending | processing | done | failed`
- `run_at` INTEGER — epoch ms; when to next attempt
- `created_at` INTEGER — epoch ms
- `started_at` INTEGER — epoch ms, nullable
- `completed_at` INTEGER — epoch ms, nullable
- `attempts` INTEGER — default 0
- `max_attempts` INTEGER — default 3
- `last_error` TEXT — nullable

Index: `(status, run_at)` for efficient polling.

### Service: `server/src/services/job-queue.ts`

**Exports:**
- `enqueueJob(type, payload, runAt)` — insert a pending job
- `startJobWorker(intervalMs?)` — start polling loop (default 60s); no-op if already running
- `stopJobWorker()` — clear interval (for tests/graceful shutdown)

**Internals:**
- `claimNextJob()` — transaction: SELECT oldest pending where `run_at <= now`, UPDATE to `processing`
- `completeJob(id)` — set `status = 'done'`, `completed_at = now`
- `failJob(id, error, attempts, maxAttempts)` — if `attempts >= maxAttempts`: set `failed`; else reset to `pending` with exponential backoff (×3 per attempt, starting at 5 min)
- `processNextJob()` — claim → dispatch handler → complete or fail; guarded by `isProcessing` flag to prevent overlap
- `handlers` record — dispatches by job type; stubs in Phase 1, wired to email functions in Phase 3

### Job Types

| Type | Payload | Action (Phase 3) |
|---|---|---|
| `onboarding_24h` | `{ userId, email, name? }` | Send onboarding reminder email |
| `onboarding_day3` | `{ userId, email, name? }` | Send day 3–5 value email |
| `post_limit_followup` | `{ userId, email, name?, quotaLimit }` | Send post-limit re-engagement email |

### Server Startup: `server/src/index.ts`

Call `startJobWorker()` inside `app.listen()` callback after `getDb()`.

---

## Phase 2 — New Email Templates

Six new templates in `server/src/emails/`:

| File | When Sent | Dedup Key |
|---|---|---|
| `onboarding-reminder.tsx` | 24h after signup (job queue) | once per email, ever |
| `value-email.tsx` | Day 3 after signup (job queue) | once per email, ever |
| `account-nudge.tsx` | 3rd capture, logged-in user | once per email, ever |
| `capture-milestone.tsx` | 10th capture, logged-in user | once per email, ever |
| `save-your-work.tsx` | ≥80% of monthly quota used | once per email per calendar month |
| `post-limit-followup.tsx` | 48h after `quota.reached` (job queue) | once per email per billing period |

All templates follow the existing pattern: react-email component, props include `name?`, `email`, contextual data, `pixelUrl?`, `ctaUrl?`, `unsubUrl?`. Style via shared `styles.ts` tokens.

---

## Phase 3 — Email Send Functions

New functions in `server/src/services/email.ts`:

| Function | Template | Dedup via `wasSentRecently` |
|---|---|---|
| `sendOnboardingReminderEmail(email, name?)` | `onboarding-reminder` | ever |
| `sendValueEmail(email, name?)` | `value-email` | ever |
| `sendAccountNudgeEmail(email, name?)` | `account-nudge` | ever |
| `sendCaptureMilestoneEmail(email, name?)` | `capture-milestone` | ever |
| `sendSaveYourWorkEmail(email, name?, quotaUsed, quotaLimit)` | `save-your-work` | this month |
| `sendPostLimitFollowupEmail(email, name?, quotaLimit)` | `post-limit-followup` | this billing period |

Update job handlers in `job-queue.ts` to call the real email functions.

---

## Phase 4 — Trigger Wiring

### `server/src/loaders/auth.ts` — `user.create.after` hook

Alongside the existing `sendWelcomeEmail` call:
1. `recordEvent('user.created', { userId: user.id })`
2. `enqueueJob('onboarding_24h', { userId, email, name? }, now + 24h)`
3. `enqueueJob('onboarding_day3', { userId, email, name? }, now + 3 days)`

### `server/src/api/routes/captures.ts` — on successful capture

- Count === 3 (logged-in user): `sendAccountNudgeEmail(email, name?)`
- Count === 10 (logged-in user): `sendCaptureMilestoneEmail(email, name?)`
- `quota_used / quota_limit >= 0.8` (logged-in user): `sendSaveYourWorkEmail(...)` (deduped monthly)

### `server/src/api/routes/captures.ts` — on quota reached

- Enqueue `post_limit_followup` job (`runAt = now + 48h`)

---

## Template Name Constants (for `email_sends` dedup queries)

Add to `email.ts` or a shared constants file:
```
'onboarding_reminder' | 'value_email' | 'account_nudge' | 'capture_milestone' | 'save_your_work' | 'post_limit_followup'
```
