# Feature Tiers

## Account Tiers

| Feature | Guest (no account) | Free (signed in) | Paid |
|---|---|---|---|
| Capture elements | ✓ | ✓ | ✓ |
| Library size | 10 (FIFO) | 25 (FIFO) | Unlimited |
| Monthly captures | — | 20 soft limit | Unlimited |
| MCP requests/month | — | 10 | Unlimited |
| Copy HTML/code | ✓ | ✓ | ✓ |
| Copy AI prompt (basic) | ✗ (promo modal) | ✓ + upgrade nudge | ✓ (full) |
| Copy AI prompt (advanced) | ✗ | ✗ (upgrade modal) | ✓ |
| Copy JSX | ✗ | ✓ | ✓ |
| Copy MCP | ✗ | ✗ (upgrade modal) | ✓ |
| Copy Tailwind | ✗ | ✓ | ✓ |
| Cross-device sync | ✗ | ✓ | ✓ |
| Folder organization | ✓ | ✓ | ✓ |

## Guest Tier (no auth token)

**Definition:** Extension installed, `!signed_in` (no auth token in storage).

**Library limit:** 10 items, hard ceiling. No monthly reset.

**FIFO eviction:** When a new capture would push the library over 10, the oldest item (by `createdAt`) is deleted before saving the new one.

**Usage meter:** Shows `snippetCount / 10`. Derived from snippet count directly — no storage reads.

**Copy actions (popup recent captures):** Copy button copies HTML code, not AI prompt.

**Library "Copy prompt":** Shows `SignInPromoModal` with sign-in CTA instead of copying.

**Library "⋮" more menu:** Shows only Delete (Copy JSX, Copy MCP, Copy Tailwind hidden).

## Free Tier (signed in, no paid plan)

**Definition:** `signed_in && user_plan` not in `['pro', 'team']`.

**Library limit:** 25 items, hard ceiling. FIFO eviction when a new capture would push over 25.

**Monthly captures:** 20 soft limit tracked in `SAVES_THIS_MONTH_KEY` (chrome.storage.local).

**MCP requests:** 10 per month (enforced by MCP server `rate-limiter.ts`).

**Usage meter:** Shows monthly usage from storage.

**Copy actions (popup recent captures):** Copy button copies HTML code, not AI prompt (treated as guest/non-paid in popup via `isGuest={!isPaid}`).

**Library "Copy prompt":** Copies basic prompt (same as `buildSnippetPrompt`) **and** shows `UpgradePromoModal` as upgrade nudge.

**Editor upgrade banner:** Visible below header when not paid. Click opens `UpgradePromoModal`.

**Editor "Copy Prompt":** Copies basic prompt and opens `UpgradePromoModal`.

**Editor "Copy MCP":** Opens `UpgradePromoModal` only — does not copy (MCP is a paid-only value prop).

## Paid Tier

**No capture limit.**

**All copy actions available.**

---

## Enforcement Locations

| Limit | Client enforcement | Server enforcement |
|---|---|---|
| Guest library FIFO (10) | `background/index.ts` SAVE_SNIPPET handler | `server/src/api/routes/captures.ts` POST handler |
| Free library FIFO (25) | `background/index.ts` SAVE_SNIPPET handler | `server/src/api/routes/captures.ts` POST handler |
| Free monthly captures (20) | `shared/usage.ts` + popup UsageMeter | (future) |
| MCP free limit (10/month) | — | `mcp-server/src/rate-limiter.ts` `consumeCallQuota` |
| Guest copy prompt | `SnippetCard.tsx` — shows `SignInPromoModal` | — |
| Free copy prompt | `SnippetCard.tsx` — copies basic prompt + shows `UpgradePromoModal` | — |
| Free editor copy MCP | `ActionBar.tsx` — shows `UpgradePromoModal`, no copy | — |
| Guest more menu | `SnippetCard.tsx` — isGuest hides non-delete items | — |
| Guest/free popup copy | `MainPanel.tsx` — calls onCopyCode (isGuest={!isPaid}) | — |

### Client-side FIFO constants

- `GUEST_LIBRARY_LIMIT = 10` in `chrome-extension/extension/src/shared/usage.ts`
- `FREE_LIBRARY_LIMIT = 25` in `chrome-extension/extension/src/shared/usage.ts`

### Server-side FIFO constants

- `GUEST_CAPTURE_LIMIT = 10` in `server/src/api/routes/captures.ts`
- `FREE_USER_CAPTURE_LIMIT = 25` in `server/src/api/routes/captures.ts`

### Paid plan detection

- `PAID_PLANS = ['pro', 'team']` in `chrome-extension/extension/src/shared/usage.ts`
- Server: `hasActivePaidPlan(userId)` in `server/src/services/entitlements.ts`
