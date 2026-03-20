# Chrome Extension – Rules

Shared design and coding standards are in the root `CLAUDE.md`. This file defines extension-specific constraints.

---

## Chrome Extension Architecture

Manifest V3. Directory structure:

```
extension/
  background/
  content/
  overlay/
  popup/
```

### Content Script Rules

- Avoid blocking page scripts
- Avoid modifying page styles
- Isolate injected UI
- Use shadow DOM when needed

### Overlay Rules

- Non-intrusive
- Use pointer events carefully
- Highlight elements accurately

### Permissions

Use minimal permissions. Preferred: `activeTab`, `storage`, `scripting`. Avoid unnecessary host permissions.

### Storage

Use `chrome.storage.local`. Never store large binary data unnecessarily.

### Performance

DOM operations must be efficient. Avoid: full page traversal, expensive query selectors.

---

## DOM Capture Rules

Element capture must produce a portable snippet.

### Capture Process

1. Detect clicked element
2. Clone subtree
3. Traverse DOM
4. Extract computed styles
5. Inline styles
6. Remove external assets

### Inline Style Rules

Only include visual styles: `display`, `position`, `margin`, `padding`, `font`, `color`, `background`, `border`, `flex`, `grid`.

Omit default values (e.g. `position: static`, `margin: 0`, `opacity: 1`) for conciseness.

Ignore: `transition`, `animation`, `cursor`, `pointer-events`.

### Asset Handling

Replace with placeholders: `video`, `canvas`, `iframe`.

Inline SVGs: preserve when cloning. Use `createElementNS` with SVG namespace. SVG sprite references (`<use href="...">`) rely on base URL resolution; same-origin sprites load when `sourceUrl` is set.

### Script Removal

Remove: `script`, `iframe`, tracking pixels.

### Output

Must be: clean, portable, framework-neutral.

### Export Formats

Generate `HTML` and `JSX`. JSX must convert style syntax correctly.

---

## MCP Server Rules

The MCP server exposes snippet data to AI coding tools.

**Stack:** Node.js, TypeScript, Express.

**Responsibilities:** serve snippet metadata, serve snippet HTML, support AI tooling.

### API Endpoints

- `GET /snippets` — list snippets
- `GET /snippets/:id` — get snippet

### Response Format

Always return JSON: `{ id, title, html, jsx, thumbnail, sourceUrl }`

### AI Tool Integration

Expose tools: `list_snippets`, `get_snippet`. These allow AI editors to fetch UI components.

**Security:** Do not expose private browsing data or sensitive content.

**Future additions:** `search_snippets`, `similar_ui_search`.

---

## Extension UI Design

### ExtensionConstraint: Popup Structure and Dimensions

Chrome popup shell: Header → Main Content → Footer.

- Width: `360px`
- Height: `500px–600px`

If content grows, make the library region scrollable rather than increasing popup size.

### ExtensionConstraint: Header and Primary Action

- Header height target: `56px`
- Must contain: extension name + primary capture action
- Primary capture action remains visible and easy to reach
- Keep header low-clutter

### ExtensionConstraint: Main View Modes

Main area shows one mode at a time: Library View, Snippet Preview, or Empty State. Avoid mixing multiple dense panes.

### ExtensionConstraint: Capture Overlay in Page Context

- Immediate hover bounding box feedback
- Smooth overlay movement with no flicker
- Readable element tooltip (selector + dimensions)
- Overlay border: `2px solid #3b82f6`
- Overlay fill: `rgba(59,130,246,0.08)`
- Do not fully block page content while selecting

### ExtensionConstraint: Capture Confirmation Modal

After selecting an element, show confirmation UI with: preview, element info, actions.

- Modal width target: `320px`
- Actions: `Save` and `Cancel`
- Primary action visually prominent and consistently positioned

### ExtensionConstraint: Library Grid in Popup

- Two-column card layout
- Card width target: `160px`
- Thumbnail height target: `100px`
- Card gap target: `12px`

Cards include: thumbnail, title, source domain, quick actions (`Copy HTML`, `Copy JSX`, `Delete`, `Preview`).

### ExtensionConstraint: Sandboxed Snippet Preview

- Never execute scripts from captured markup
- Preserve visual fidelity within popup constraints

### ExtensionConstraint: Performance and Feedback

- Loader for operations over `200ms`
- Lazy load thumbnails
- Virtualize large lists where practical
- Target interaction latency below `100ms`

### Extension Parity Checklist

Before finalizing extension UI work, verify:

- [ ] Shared token architecture and visual baseline preserved
- [ ] No hardcoded component internals bypass shared token rules
- [ ] Popup-specific constraints documented as `ExtensionConstraint`
- [ ] Capture overlay and popup UX are clear, fast, and low-friction
- [ ] Accessibility baseline from shared rule still passes

---

## Token Implementation

Visual inspiration: Untitled-UI-like (clean, modern, neutral). Implementation must follow the shared 3-layer token model.

### ExtensionConstraint: Token File Layout

Keep extension token layers in:
- `extension/src/styles/tokens/primitives.css`
- `extension/src/styles/tokens/semantic.css`

Component tokens remain local to each component root.

Load order in UI entries:
1. `styles/tokens/index.css`
2. `styles/base.css`
3. Entry/component styles

### ExtensionConstraint: Page-Context UI (Shadow DOM)

For content-script UI running in page context (cannot import extension bundle CSS directly):
- Inject a style block with equivalent primitive + semantic variables
- Keep token names aligned with shared token contract
- Avoid ad-hoc color/spacing constants

### Icons

Use: Lucide, Feather. Do not introduce alternate icon systems unless explicitly documented.

### Hard Rules

- No hardcoded colors/spacing/radius in component internals
- No primitive token usage directly in component declarations
- Map component tokens to semantic (and spacing/radius) tokens
- Keep divergence from shared design standards explicitly documented as `ExtensionConstraint`

---

## Testing Standards

**Framework:** Vitest for unit tests, React Testing Library for UI component tests.

- Write unit tests for all new utility modules
- Prefer pure functions to simplify testability
- Place tests next to source files: `*.test.ts` / `*.test.tsx`
- Mock `chrome.*` APIs in tests; never rely on real extension APIs in test runs
- For React tests, assert user-visible behavior and accessible labels

### Coverage Expectations

- Utility modules: target at least 80% statement coverage
- Core flows (capture pipeline, snippet storage, export conversion) must have explicit tests

### MVP Minimum Test Gates

- `npm test` must pass before merging
- New capture pipeline logic requires at least one happy-path and one edge-case test
- Storage CRUD requires create/read/delete test coverage

---

## Context Persistence

This project maintains a `MEMORY.md` file in the directory root for cross-session context.

Read `MEMORY.md` before beginning any task. It contains: project overview, current implementation status, technical decisions, notes from previous sessions, and open questions.

Update `MEMORY.md` when: completing a task or phase, making architectural decisions, discovering important insights, encountering blockers, or changing project direction. Update the "Last updated" date and move completed items from "In Progress" to "Completed".

`MEMORY.md` sections: Project Overview, Project Structure, Tech Stack, Competitors Analysis Summary, CSS Property Whitelist, Implementation Status, Key Insights, Design System, Performance Targets, Notes for Next Session, Questions to Resolve.












Notes: 
- We are hiding a settings icon in the popup footer.
- 