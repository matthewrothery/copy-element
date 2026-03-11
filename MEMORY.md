# Agent Memory - Element Capture Extension

Last updated: 2026-03-11

## Project Overview

Building a Chrome extension to copy DOM elements with minimal CSS/HTML output. Goal is to be the best "copy element" extension on Chrome Web Store (target >4.5 rating).

**Key Differentiator**: Minimal output size while preserving visual fidelity.

---

## Project Structure

```
copy-element/
├── extension/
│   └── src/
│       ├── background/       # Service worker
│       ├── content/          # Content scripts (element picker, capture modal)
│       ├── library/          # Snippet library UI
│       ├── popup/            # Extension popup UI
│       ├── shared/           # Shared utilities
│       │   └── utils/
│       │       ├── dom-cloner.ts
│       │       ├── style-inliner.ts
│       │       ├── preview-srcdoc-builder.ts
│       │       ├── parent-layout-extractor.ts
│       │       └── svg-sprite-inliner.ts
│       └── styles/           # CSS tokens and base styles
├── competitors/
│   ├── divmagic/             # DivMagic v2.1.22 extension files
│   └── snipcss/              # SnipCSS v2.0.3 extension files
├── dist/                     # Built extension
├── TASKS.todo                # Implementation task list (8 phases)
├── checklist.md              # Complete extraction checklist (26 phases)
├── PRD.md                    # Product requirements document
├── DIVMAGIC_EXTRACT_COPY_ELEMENT_PROCESS.md  # DivMagic analysis
└── .cursor/rules/            # Cursor rules for AI agents
```

---

## Tech Stack

- **Language**: TypeScript only
- **Frameworks**: React, Node.js
- **CSS**: Less or standard CSS (NO Tailwind)
- **Build**: Vite
- **Extension**: Chrome Manifest V3
- **Storage**: chrome.storage.local; per-snippet keys + index (avoids 8 KB per-item limit). See ARCHITECTURE.md § Snippet Storage.

---

## Competitors Analysis Summary

### DivMagic (v2.1.22)
- Chrome rating: 3.3
- **Architecture**: DevTools panel, content script, popup, background worker
- **Copy modes**: Adaptable (minimal), Balanced (includes pseudo), Exact (full)
- **Output formats**: Inline CSS, External CSS, Local CSS, React/JSX, Tailwind
- **CSS whitelist**: ~50 properties (layout, box model, flex, borders, typography, background, visual)
- **Libraries**: htmlparser2, html-to-react, Prettier
- **Strengths**: Multiple output formats, WordPress integration
- **Weaknesses**: Messy CSS output, no snippet library

### SnipCSS (v2.0.3)
- Chrome rating: 3.9
- **Architecture**: Content script (kiwi), background, popup, options
- **Key features**: 
  - Element labeling with `snipcss{index}-{level}-{parentId}-{id}` classes
  - Selector fixing algorithm (handles complex selectors)
  - Inherited rule detection
  - CSS variable resolution (including recursive)
  - Media query grouping
  - Transmogrify (class renaming for scoping)
  - Multi-element selection
  - Include/exclude subselection
- **Uses Chrome debugger API** for CSS rule extraction
- **Strengths**: Handles complex CSS scenarios, responsive styles
- **Weaknesses**: Complex workflow, DevTools required

### Key Files to Reference
- `competitors/divmagic/blockRegistration.bundle.js` - CSS property whitelist
- `competitors/snipcss/js/sniptools.js` - DOM labeling and utility functions
- `competitors/snipcss/js/selectElemListeners.js` - Element selection logic
- `competitors/snipcss/contentscript_kiwi.js` - Main content script
- `competitors/snipcss/snipbackground.js` - CSS extraction pipeline

---

## CSS Property Whitelist (From DivMagic)

### Layout & Position
display, position, float, clear, top, right, bottom, left, z-index

### Box Model
width, height, min-width, min-height, max-width, max-height
margin, margin-top/right/bottom/left
padding, padding-top/right/bottom/left
box-shadow, box-sizing

### Flexbox
flex-direction, flex-grow, flex-shrink, flex-basis
justify-content, align-items

### Borders
border, border-width, border-style, border-color, border-radius
border-top/right/bottom/left (and their sub-properties)
border-top-left-radius, border-top-right-radius, etc.

### Typography
font, font-family, font-size, font-style, font-variant, font-weight
line-height, letter-spacing, word-spacing
text-align, text-decoration, text-indent, text-transform

### Background
background, background-color, background-image, background-position
background-repeat, background-size, background-attachment

### Other
color, opacity, visibility, overflow, overflow-x, overflow-y
transform, vertical-align, cursor
list-style, list-style-image, list-style-position, list-style-type
outline, outline-color, outline-style, outline-width
white-space

---

## Implementation Status

### Current Phase: CSS Extraction Overhaul (COMPLETED)

### Major Architectural Change (2026-03-11)
Refactored from inline-style approach to class-based stylesheet extraction (like SnipCSS):

**What Changed:**
- ❌ Removed: Inline style bloat, pseudo-element spans, computed style extraction
- ✅ Added: Stylesheet rule extraction, @font-face support, class name preservation
- 🔄 Simplified: DOM cloner now only sanitizes, no style inlining

**New Files:**
- `stylesheet-rule-extractor.ts` - Walks stylesheets, matches selectors to captured elements
- `font-face-extractor.ts` - Extracts @font-face rules with absolute URLs

**Deleted Files:**
- `pseudo-element-extractor.ts` - No longer needed (CSS handles pseudo-elements)
- `style-inliner.ts` - No longer needed (no inline styles)
- `style-minimizer.ts` - No longer needed (no style minimization)
- `style-block-builder.ts` - Replaced by stylesheet extraction
- `stylesheet-media-extractor.ts` - Replaced by stylesheet extraction

**Updated Files:**
- `dom-cloner.ts` - Simplified to clone + sanitize only
- `content/index.ts` - Uses new extractors, builds stylesheet output

### Completed
- [x] Created TASKS.todo with 8 phases
- [x] Reviewed competitor directory structure
- [x] Read DivMagic analysis (DIVMAGIC_EXTRACT_COPY_ELEMENT_PROCESS.md)
- [x] Read SnipCSS readme and changelog
- [x] Identified CSS property whitelist from DivMagic
- [x] Analyzed SnipCSS element labeling approach
- [x] Analyzed SnipCSS selector fixing algorithm
- [x] Full SnipCSS analysis (SNIPCSS_ANALYSIS.md)
- [x] Document comparison table (DIVMAGIC_SNIPCSS_COMPARISON.md)
- [x] Define our minimal CSS property whitelist
- [x] **CSS Extraction Overhaul** - Complete architectural refactor

### In Progress
- Testing on real websites (Medium.com, etc.)

### Existing Code
- `dom-cloner.ts` - DOM cloning and sanitization
- `preview-srcdoc-builder.ts` - Preview HTML generation
- `parent-layout-extractor.ts` - Parent layout detection
- `capture-confirmation-modal.ts` - Capture confirmation UI
- `stylesheet-rule-extractor.ts` - CSS rule extraction from stylesheets
- `font-face-extractor.ts` - @font-face rule extraction

---

## Key Insights for Minimal Output

1. **Preserve class names**: Keep original classes and extract matching CSS rules
2. **Extract from stylesheets**: Walk document.styleSheets and match selectors
3. **Include pseudo-elements**: Extract ::before/::after rules from stylesheets
4. **Support @font-face**: Extract and include font definitions with absolute URLs
5. **Handle @media queries**: Include responsive styles in extracted CSS
6. **Skip cross-origin**: CORS prevents access to cross-origin stylesheets

---

## Design System

Using Untitled UI-inspired 3-layer token system:
1. **Primitives** - Raw values (colors, spacing, radius)
2. **Semantic** - UI meaning (text-primary, surface, accent)
3. **Component** - Per-component tokens

Primary color: #3b82f6
Fonts: System font stack

---

## Performance Targets

- Extraction time: <500ms
- Library load: <200ms
- UI interaction: <100ms

---

## Notes for Next Session

1. Need to analyze snipbackground.js in detail for CSS extraction logic
2. Need to determine which properties are truly "minimal" vs "safe defaults"
3. Consider implementing copy modes like DivMagic (Minimal, Balanced, Exact)
4. SnipCSS uses Chrome debugger API - we should avoid this for simpler permissions
5. Focus on getComputedStyle approach for style extraction

---

## Questions to Resolve

- Should we support media query extraction? (complex, SnipCSS does this)
- Should we preserve original class names? (DivMagic has option)
- How to handle web fonts? (detect and suggest import?)
- Should we support multiple element selection? (SnipCSS feature)
