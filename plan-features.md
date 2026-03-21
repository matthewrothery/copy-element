# Feature Tiers

## Account Tiers

| Feature | Guest (no account) | Free (signed in) | Paid |
|---|---|---|---|
| Capture elements | ✓ | ✓ | ✓ |
| Library size | 10 (FIFO) | 20/month | Unlimited |
| Copy HTML/code | ✓ | ✓ | ✓ |
| Copy AI prompt | ✗ (promo modal) | ✓ | ✓ |
| Copy JSX | ✗ | ✓ | ✓ |
| Copy MCP | ✗ | ✓ | ✓ |
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

**Library limit:** 20 captures per month, tracked in `SAVES_THIS_MONTH_KEY` (chrome.storage.local).

**Usage meter:** Shows monthly usage from storage.

**All copy actions available:** Prompt, HTML, JSX, MCP, Tailwind.

## Paid Tier

**No capture limit.**

**All copy actions available.**

---

## Enforcement Locations

| Limit | Client enforcement | Server enforcement |
|---|---|---|
| Guest library FIFO (10) | `background/index.ts` SAVE_SNIPPET handler | `server/src/api/routes/captures.ts` POST handler |
| Free monthly limit | `shared/usage.ts` + popup UsageMeter | (future) |
| Guest copy prompt | `SnippetCard.tsx` — shows promo modal | — |
| Guest more menu | `SnippetCard.tsx` — isGuest hides non-delete items | — |
| Guest popup copy | `MainPanel.tsx` — calls onCopyCode instead of onCopyPrompt | — |

### Client-side FIFO constants

- `GUEST_LIBRARY_LIMIT = 10` in `chrome-extension/extension/src/shared/usage.ts`

### Server-side FIFO constants

- `GUEST_CAPTURE_LIMIT = 10` in `server/src/api/routes/captures.ts`
