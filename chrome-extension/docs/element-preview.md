# Element Preview – Code Editor Page

A full-page CodePen-style editor that opens when a user clicks **Open in Editor** on any snippet card. Provides live HTML/CSS editing, a resizable device preview, and export actions.

---

## Entry Point

`preview.html` → `extension/src/preview/main.tsx`

Opened via `chrome.tabs.create` with a query param:

```
preview.html?id=<snippetId>
```

The snippet is loaded from storage via the `GET_SNIPPET_BY_ID` background message.

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│ PreviewHeader  title · source URL ↗ · captured date  [Save] │
├─────────────────────────────────────────────────────────────┤
│ ActionBar  [Copy Code] [Copy Prompt (~N tokens)] [Copy MCP] │
│            [Download .zip]                                  │
├──────────────────────┬──────────────────────────────────────┤
│ HTML                 │ CSS                                   │
│  Monaco editor       │  Monaco editor                       │
│  (live, 280px tall)  │  (live, 280px tall)                  │
├──────────────────────┴──────────────────────────────────────┤
│ PreviewPane  [Desktop] [Mobile] [Tablet]  [ 375 ] px        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │              iframe (sandboxed, live)             ║ ◁   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Components

### `PreviewHeader`
- Displays snippet title
- Source URL as a full clickable external link
- Captured timestamp (epoch ms → human-readable)
- Save button — disabled when no unsaved changes, shows "Saving…" / "Saved" feedback

### `ActionBar`
- **Copy Code** — copies `<style>` block + HTML (uses `buildCopyHtml`)
- **Copy Prompt** — copies AI-formatted prompt; shows saved token estimate `(~N tokens)`
  - Token count is only recomputed after a Save, not during live editing
- **Copy MCP** — copies MCP-formatted prompt (uses `buildCopyMcpPrompt`)
- **Download .zip** — generates and downloads a zip via JSZip containing:
  - `index.html` — standalone file with CSS inlined in `<style>`
  - `styles.css` — extracted CSS
  - `README.md` — source URL, captured date, Element Armory credit

### `CodeEditorPane`
- Two-column layout, each column flex-equal width
- Left: Monaco editor, `language="html"`
- Right: Monaco editor, `language="css"`
- Both use `theme="vs"` (light), minimap off, word wrap on, font size 13
- Changes debounced 150ms before updating the preview iframe

### `PreviewPane`
- **Device toolbar** — three preset buttons: Desktop (full width), Mobile (375px), Tablet (768px)
- **Width input** — editable numeric input when a constrained preset is active; typing a value activates a custom width
- **Drag resize handle** — vertical bar on the right edge of the iframe wrapper, drag to resize (like Chrome DevTools device toolbar); constrained between 200px and 3840px
- Mobile and Tablet modes show a subtle box-shadow border to suggest a device frame
- Desktop mode fills the full viewport width with no constraint

---

## Data Flow

```
SnippetCard "Open in Editor"
  → openPreviewInNewTab(snippet.id)
  → chrome.tabs.create(preview.html?id=XYZ)
  → PreviewApp mounts, reads ?id from URL
  → GET_SNIPPET_BY_ID message → background → getSnippetById() → storage
  → htmlContent = snippet.html  (editable copy)
  → cssContent  = snippet.styleBlock  (editable copy)
  → buildEditorPreviewSrcDoc(html, css, snippet) → iframe srcDoc
  → user edits HTML/CSS in Monaco
  → 150ms debounce → rebuild srcDoc → iframe updates live
  → user clicks Save
  → SAVE_SNIPPET message → background → saveSnippet() + syncCaptureToServer()
  → savedHtml / savedCss updated → token count recomputed
```

---

## Save Behaviour

- `hasUnsavedChanges = currentHtml !== savedHtml || currentCss !== savedCss`
- Save button disabled when no changes or save in progress
- On success: updates local snippet state, resets saved baseline, recomputes token count
- Token count shown in "Copy Prompt" label is based on the **last saved state**, not the live editor content

---

## Monaco Worker Setup

Monaco requires web workers for language services. Configured in `main.tsx` before any editor renders:

```ts
self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === "html" ...) return new htmlWorker();
    if (label === "css" ...) return new cssWorker();
    return new editorWorker();
  }
};

loader.config({ monaco }); // use local bundle, not CDN
```

Workers are imported via Vite's `?worker` syntax and bundled into the extension. The preview bundle is ~4MB (Monaco is ~3.9MB) — acceptable for a dedicated editor tab, isolated from the popup/library bundles.

---

## Preview SrcDoc

Uses `buildEditorPreviewSrcDoc(html, css, snippet)` from `preview-srcdoc-builder.ts`.

Unlike `buildPreviewSrcDoc` (used in the modal), this function does **not** apply a fixed-size stage wrapper. Content fills the iframe naturally. It still:
- Injects a `<base>` tag from `snippet.sourceUrl` for relative URL resolution
- Converts `externalFontLinks` to `@import` rules
- Wraps HTML in a layout context div if `renderContext` requires it

---

## Files Changed

| File | Change |
|------|--------|
| `extension/preview.html` | New entry HTML |
| `extension/src/preview/main.tsx` | React entry, Monaco worker + loader setup |
| `extension/src/preview/App.tsx` | Root component, state, load/save logic |
| `extension/src/preview/components/PreviewHeader.tsx` | Title, URL, date, Save button |
| `extension/src/preview/components/ActionBar.tsx` | Copy + Download actions |
| `extension/src/preview/components/CodeEditorPane.tsx` | Dual Monaco editors |
| `extension/src/preview/components/PreviewPane.tsx` | Device toolbar, resize handle, iframe |
| `extension/src/preview/styles.css` | Full page styles (component-token architecture) |
| `extension/src/shared/types/messages.ts` | Added `GetSnippetByIdRequest` |
| `extension/src/background/index.ts` | Handler for `GET_SNIPPET_BY_ID` |
| `extension/src/popup/api.ts` | Added `getSnippetById()`, `openPreviewInNewTab()` |
| `extension/src/shared/utils/preview-srcdoc-builder.ts` | Added `buildEditorPreviewSrcDoc()` |
| `extension/src/popup/components/SnippetCard.tsx` | Replaced Preview button with Open in Editor |
| `extension/src/popup/components/SnippetCard.test.tsx` | Fixed selector, added api mock |
| `vite.config.ts` | Added `preview` Rollup entry |
| `extension/manifest.ts` | Added `preview.html` to `web_accessible_resources` |

---

## Dependencies Added

| Package | Purpose |
|---------|---------|
| `monaco-editor` | Core editor engine |
| `@monaco-editor/react` | React wrapper for Monaco |
| `jszip` | Zip generation for Download action |
| `@types/jszip` | TypeScript types for JSZip |
