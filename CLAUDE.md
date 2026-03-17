# Element Armory – Shared Rules

## Product Identity

**Official product name:** `Element Armory – Capture UI Elements`

Use this exact format in: Chrome Web Store listing, website header, marketing pages, documentation headers, onboarding, extension UI.

**Short name:** `Element Armory` (UI labels, navigation, developer references). Never abbreviate to `EA`, `ElementArmory`, or `Armory`.

**Core tagline (do not modify):** `Capture UI from any site and rebuild it with AI.`

**Supporting line:** `Clean. Clear. Powerful.`

Messaging must feel: developer-focused, technical but clear, minimal, confident. Avoid marketing fluff and buzzwords. Never reference competitor tools.

---

## Shared UI Design Authority

This is the default source of truth for UI style and interaction across `website`, `chrome-extension`, and `figma-plugin`.

### Precedence

1. This shared rule (default)
2. Local product `CLAUDE.md` files

Local rules may override shared guidance only when required by platform constraints, and the rule section is explicitly marked as `ExtensionConstraint`, `WebsiteConstraint`, or `FigmaConstraint` with a one-line reason.

### Token Architecture (3-layer model — required everywhere)

- Layer 1: primitives (raw values)
- Layer 2: semantics (UI meaning)
- Layer 3: component tokens (component-local aliases)

Hard rules:
- Do not hardcode colors or spacing in component declarations
- Do not consume primitive tokens directly in component style declarations
- Use component tokens inside component internals

### Shared Visual Baseline

- Primary accent: `#3b82f6`
- Surface neutrals: `#ffffff`, `#f8fafc`
- Borders: `#e5e7eb`
- Primary text: `#111827`
- Muted text: `#6b7280`
- Typography: system sans stack
- Spacing scale: `4, 8, 12, 16, 24, 32`
- Radius scale: `4, 8, 12, 16`
- Motion: `120ms–200ms`, never above `300ms`

### Interaction and UX Quality

- Show explicit feedback for user actions
- Show loaders for operations over `200ms`
- Keep controls clearly labeled and developer-oriented
- Prioritize high signal, low clutter layouts

### Accessibility Baseline

- Contrast ratio target above `4.5`
- Interactive hit target above `32px`
- Keyboard support for all interactive elements
- Explicit accessible labeling on icon-only buttons

### Copy and Labeling

- Concise, technical but clear, developer-friendly
- Button labels: specific (e.g. `Capture Element`, `Copy HTML`, `Copy JSX`)
- Avoid vague labels like `Action`

### Parity Checklist (required before finalizing any UI work)

- [ ] Shared token architecture followed (primitive → semantic → component)
- [ ] No hardcoded style values in component internals
- [ ] Core color, typography, spacing, and radius scales remain aligned
- [ ] Interaction timing and feedback match shared standards
- [ ] Accessibility baseline preserved
- [ ] Any divergence marked with `ExtensionConstraint`, `WebsiteConstraint`, or `FigmaConstraint` plus rationale

### Maintenance Protocol

When a shared style convention changes: update this file first, then update local files only for product-specific constraints. Remove duplicate statements from local files when covered here.

---

## Global Coding Standards

**Language:** TypeScript only.

**Frameworks:** React, Node.js.

**CSS:** Less or standard CSS only. Do not use Tailwind.

### Code Quality

Code must be strongly typed, modular, readable, and well structured.

Avoid: `any`, large files, deep nesting.

Prefer: pure functions, small modules, clear naming.

### File Size

Files should generally stay under 300 lines. If larger, split into modules.

### Naming Conventions

- Variables: `camelCase`
- Components: `PascalCase`
- Constants: `UPPER_CASE`

### React

Use functional components and hooks. Avoid class components.

### Error Handling

Always handle failures: DOM capture failures, storage failures, MCP network errors.

### Architecture Documentation

If architecture changes, update `ARCHITECTURE.md`.
