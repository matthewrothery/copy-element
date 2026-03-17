# Figma Plugin – Rules

Shared design and coding standards are in the root `CLAUDE.md`. This file defines plugin-specific constraints.

The plugin UI must be **visually and structurally consistent** with the Chrome extension library. If a local rule differs from shared guidance, mark it: `FigmaConstraint: <reason>`

---

## Extension Library Parity (Required)

The plugin UI must match the Chrome extension library (`chrome-extension/extension/src/library`, `SnippetCard.tsx`, `SnippetLibrary.tsx`).

### Layout and Structure

- **Header**: title ("Element Armory"), optional subtitle; search on same row or directly below
- **Main content**: single scrollable area showing either the component list or a preview/detail view (one mode at a time when space is limited)
- **Card grid**: list of captured elements as cards; same information hierarchy as extension snippet cards

### Card Design (match extension SnippetCard)

Each card must include:

- **Thumbnail**: top of card; fixed height (~100px); image or placeholder; clickable for preview
- **Meta block**: title (single line, ellipsis), secondary line (e.g. source domain · date or "Captured")
- **Primary actions**: at least **Insert** (primary) and **Preview**; same clarity and labeling style as extension ("Copy HTML", "Copy JSX", "Preview")
- **Visual style**: border, radius, padding, and hover state aligned with extension tokens: `--color-border`, `--radius-2`, `--space-*`, `--shadow-md` on hover

Use the same 3-layer token model (primitive → semantic → component). Do not hardcode colors or spacing in card internals.

### Search and Filter

- Search input: same behavior as extension library (filter by name/source); same token-based styling
- Optional filters (e.g. by date, source) if they exist in extension; keep parity

### Empty and Loading States

- Empty state: match extension empty state tone and layout (message + optional CTA)
- Loading: show loader for operations over ~200ms; avoid blocking the whole UI

### Typography and Spacing

- Primary text, muted text, caption; spacing scale 4, 8, 12, 16, 24, 32; radius scale 4, 8, 12, 16
- Card gap and internal padding consistent with extension library grid (~gap 12px, card padding ~12px)

### Interaction Quality

- Immediate feedback on click (Insert, Preview)
- Loaders for async work; target interaction latency under ~100ms
- Keyboard support and accessible labels for icon-only buttons

---

## FigmaConstraint: Plugin iframe dimensions

Plugin UI runs in an iframe with fixed dimensions (width 360, height 500–600). Content must fit without horizontal scroll; use vertical scroll for the list. Card grid may be single-column or two-column depending on width; prefer two-column when width allows.

## FigmaConstraint: No capture overlay

The plugin does not have a page overlay or capture flow — only library list, preview, and insert. Do not replicate extension overlay styles unless adding a future in-Figma capture feature.

---

## Parity Checklist (Before Finalizing Plugin UI)

- [ ] Header + search + main list structure matches extension library intent
- [ ] Card layout: thumbnail, title, meta, Insert + Preview match extension snippet card hierarchy and tokens
- [ ] Shared token architecture and visual baseline used; no hardcoded values in component internals
- [ ] Empty and loading states align with extension library
- [ ] Any divergence is marked with `FigmaConstraint` and reason
- [ ] Accessibility baseline from shared rule is preserved
