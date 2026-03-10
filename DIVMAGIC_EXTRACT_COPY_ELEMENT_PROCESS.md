# DivMagic 2.1.22 — Extract/Copy Element Process

This document outlines how the DivMagic Chrome extension extracts elements and retains their styles for copying. It is derived from analysis of the `divmagic` directory (extension version 2.1.22).

---

## Overview

DivMagic copies elements from any webpage as reusable web components, producing HTML, CSS, React, JSX, or Tailwind CSS. The core goal is to capture the visual appearance of a selected element and preserve it in a portable form.

---

## Extension Architecture

| Component | File | Role |
|-----------|------|------|
| DevTools Panel | `devtools.html`, `panel.bundle.js` | Main UI for element selection and copy |
| DevTools Content | `devtoolContent.bundle.js` | Injected into page when DevTools is open; runs in page context |
| Content Script | `contentScript.bundle.js` | Injected for popup/context menu flows |
| Block Registration | `blockRegistration.bundle.js` | WordPress-specific; registers blocks from copied HTML |
| Background | `background.bundle.js` | Service worker; coordinates messaging |
| Popup | `popup.html`, `popup.bundle.js` | Quick capture from popup |

---

## Copy Modes

The extension supports three copy modes that control how much style information is included:

| Mode | Description |
|------|-------------|
| **Adaptable** | Only essential styles for structure and basic appearance. Easier to customize. |
| **Balanced** | Includes pseudo-elements (`::before`, `::after`) that affect visuals, without excessive bloat. |
| **Exact** | Full copy of all styles so the element matches the source as closely as possible. |

---

## Style Output Formats

Styles can be emitted in three formats:

- **Inline CSS** — Styles applied via `style` attributes on elements
- **External CSS** — Styles in a separate stylesheet
- **Local CSS** — Styles scoped to the component (e.g., scoped or namespaced)

---

## CSS Properties Extracted

From `blockRegistration.bundle.js`, the extension uses a whitelist of CSS properties for extraction:

### Layout & Box Model
- `display`, `position`, `float`, `clear`
- `width`, `height`, `min-width`, `min-height`, `max-width`, `max-height`
- `margin`, `margin-top`, `margin-right`, `margin-bottom`, `margin-left`
- `padding`, `padding-top`, `padding-right`, `padding-bottom`, `padding-left`
- `box-shadow`

### Flexbox
- `flex-direction`, `flex-grow`, `flex-shrink`, `flex-basis`
- `justify-content`, `align-items`

### Borders
- `border`, `border-width`, `border-style`, `border-color`, `border-radius`
- `border-top`, `border-right`, `border-bottom`, `border-left`
- Per-side variants: `border-*-color`, `border-*-style`, `border-*-width`
- Per-corner: `border-top-left-radius`, `border-top-right-radius`, `border-bottom-left-radius`, `border-bottom-right-radius`

### Typography
- `font`, `font-family`, `font-size`, `font-style`, `font-variant`, `font-weight`
- `line-height`, `letter-spacing`, `word-spacing`
- `text-align`, `text-decoration`, `text-indent`, `text-transform`

### Background
- `background`, `background-color`, `background-image`, `background-position`
- `background-repeat`, `background-size`, `background-attachment`

### Other
- `color`, `opacity`, `visibility`
- `overflow`, `overflow-x`, `overflow-y`
- `transform`, `vertical-align`
- `top`, `right`, `bottom`, `left`
- `z-index`
- `cursor`
- `list-style`, `list-style-image`, `list-style-position`, `list-style-type`
- `outline`, `outline-color`, `outline-style`, `outline-width`
- `white-space`

---

## Extraction Process (WordPress / Block Registration)

The most detailed extraction logic is in `blockRegistration.bundle.js`, which targets WordPress. The flow:

### 1. HTML Parsing

- Uses `DOMParser` to parse the copied HTML string.
- Extracts a `<style>` block from the parsed document.
- Parses CSS rules from the style block.

### 2. CSS Rule Parsing

- Splits CSS into base rules and `@media` blocks.
- Uses regex to extract selectors and declarations.
- Filters rules to those targeting element IDs (e.g. `#id`).
- Builds a structure per element ID: `{ base: {...}, media: { "media query string": {...} } }`.

### 3. Property Filtering

- Only properties in the whitelist are kept.
- `!important` is stripped from values.
- Declarations are split on `;` and parsed as `property: value`.

### 4. Media Query Handling

- Media queries are parsed with: `@media\s*([^{]+)\s*\{`.
- Styles are stored per media query so responsive behavior can be preserved.
- At render time, `window.matchMedia(mediaQuery).matches` decides which media block to apply.

### 5. Element Traversal

- Walks the DOM tree recursively.
- For each element with an `id`, looks up styles in the parsed style dictionary.
- Merges base styles with matching media query styles.

### 6. Element-Specific Mapping

Different element types are mapped to different block types:

| Element | Block Type | Special Handling |
|---------|------------|------------------|
| `p`, `span`, `a`, `div` | `core/group` | Flex layout, content size, spacing |
| `h1`–`h6` | `core/heading` | Level from tag name |
| `img` | `core/image` | `width`, `height`, `border-radius` from styles |
| `button` | `core/button` | `backgroundColor`, `textColor`, `typography` |
| `svg` | `divmagic/svg` | Custom block; SVG cloned with attributes |

### 7. Style-to-Block Mapping

For WordPress blocks, styles are converted into block attributes:

- **Background:** `background-color` → `color.background` or `backgroundColor`
- **Typography:** `font-size`, `text-align` → `typography`
- **Spacing:** `margin-*`, `padding-*` → `spacing.margin`, `spacing.padding`
- **Borders:** `border-*` → `border` with `style`, `width`, `color`, `radius`
- **Layout:** `display`, `flex-direction`, `justify-content`, `align-items` → `layout`

---

## DOM Parsing & Output Libraries

The `devtoolContent.bundle.js` and `contentScript.bundle.js` bundles use:

- **htmlparser2** — DOM parsing and tree representation
- **html-to-react** — Converting parsed HTML to React elements
- **Prettier** — Formatting output code

---

## Element Selection UI

- **Highlight overlay:** `inject_css.css` defines `.divmagichighlight` with red outline and background.
- **Inspector:** Element details view in the toolbox.
- **Copy Element:** Toolbox action to copy the selected element.
- **Navigation:** Parent, child, sibling controls to move selection.

---

## Element Settings vs Class Settings

- **Element Settings:** Control which HTML attributes are included.
- **Class Settings:** Control which CSS settings are included.

---

## Asset Handling

- **SVG:** Cloned with `cloneNode(true)`; width/height from styles applied as attributes; SVG kept inline.
- **Images:** `src` and `alt` preserved; dimensions can come from styles.
- **Fonts:** “Copy Font” tool can copy web font information.

---

## Script & Security

- **Script removal:** Scripts and tracking pixels are removed from the output.
- **Sandbox:** Preview is rendered in a sandboxed context; scripts are not executed.

---

## Output Formats

- **HTML only** — Raw HTML with attributes
- **HTML + DivMagic IDs** — Original attributes replaced with DivMagic IDs
- **HTML + Original attributes** — Original attributes preserved
- **CSS only** — DivMagic classes or original classes
- **React / JSX** — React-compatible code
- **Tailwind CSS** — Tailwind utility classes

---

## Summary

1. **Selection:** User selects an element via DevTools, popup, or context menu.
2. **Clone:** HTML subtree is cloned and parsed.
3. **Style extraction:** Computed styles from the page are read and filtered.
4. **CSS parsing:** Styles are parsed and organized by element and media query.
5. **Format conversion:** Output is generated in the chosen format (HTML, React, JSX, Tailwind).
6. **Copy:** Result is copied to clipboard or saved to the library.

The core idea is to use a whitelist of CSS properties, parse and organize styles, and optionally merge media queries and pseudo-elements so the copied element can be reused in other contexts while retaining its visual appearance.
