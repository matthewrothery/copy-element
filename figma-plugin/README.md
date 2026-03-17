# Element Armory — Figma Plugin

Browse components captured by the [Element Armory Chrome extension](https://github.com/your-org/copy-element) and insert them into Figma.

## Status

**Placeholder / planned.** APIs for listing captured elements are not ready; the plugin uses mock data and is structured for the roadmap in [info.md](./info.md). Phased tasks are in [tasks.todo](./tasks.todo).

## Prerequisites

- Node 18+
- npm

## Setup

```bash
cd figma-plugin
npm install
```

## Build

```bash
npm run build
```

Output is in `dist/`: `main.js`, `ui.html` (with UI inlined). **Import from the built manifest:** **Plugins → Development → Import plugin from manifest…** and select **`figma-plugin/dist/manifest.json`** (not the manifest in the project root, or Figma will look for `main.js` in the wrong folder and fail with ENOENT).

## Development

```bash
npm run dev
```

Then run **Plugins → Development → Import plugin from manifest…** and select **`figma-plugin/dist/manifest.json`**. Re-run `npm run build` after changes (or use `npm run dev` for watch).

## Design

UI follows the same design system as the Chrome extension library. See:

- [.cursor/rules/design.mdc](.cursor/rules/design.mdc) — parity with extension library
- [.cursor/rules/shared-design-system.mdc](../.cursor/rules/shared-design-system.mdc) — shared tokens and baseline

## Roadmap

See [info.md](./info.md) for the full implementation roadmap and [tasks.todo](./tasks.todo) for phased task breakdown.
