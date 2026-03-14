# SnipCSS Analysis (v2.0.3)

Analysis of the SnipCSS Chrome extension for element capture and CSS extraction. Used to inform our copy-element extension design.

---

## 1. Manifest and Extension Architecture

### manifest.json

- **Manifest Version**: 3
- **Version**: 2.0.3
- **Permissions**: `debugger`, `storage`, `activeTab`, `scripting`, `tabs`, `unlimitedStorage`
- **Host permissions**: `*://*/*` (all URLs)
- **Key components**:
  - **Action**: popup.html, default icon
  - **Background**: `background-wrapper.js` (service worker)
  - **Options**: options.html
  - **Content scripts**: Injected via `scripting` API (contentscript_kiwi.js)
  - **Web accessible**: templates/*, css/*, img/*, fonts/*, js/*

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  popup.html          │  options.html                             │
│  (Capture UI)        │  (Settings, Tailwind, Transmogrify)       │
└──────────┬───────────┴────────────────┬─────────────────────────┘
           │                             │
           ▼                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  background-wrapper.js (Service Worker)                           │
│  Imports: cheerio, uri, css.min, parsel, media-query-parser,       │
│           snipcss_api, tailwind_*.js, snipbackground.js           │
└──────────────────────────┬───────────────────────────────────────┘
                            │ chrome.debugger API
                            │ CSS.getMatchedStylesForNode
                            │ DOM.getDocument, etc.
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│  contentscript_kiwi.js (injected into page)                         │
│  - Element selection UI (Shadow DOM)                               │
│  - snipcssUtils (from sniptools.js)                                │
│  - Message handlers for snipcss_fix_selector, snipcss_get_tagname  │
└──────────────────────────────────────────────────────────────────┘
```

**Critical**: SnipCSS requires the **debugger** permission and uses Chrome DevTools Protocol (`CSS.getMatchedStylesForNode`, `DOM.getDocument`, `Emulation.setDeviceMetricsOverride`) for CSS extraction. This is a significant permission ask.

---

## 2. Element Labeling Strategy (contentscript_kiwi.js / sniptools.js)

### Class Format

```
snipcss{index}-{level}-{parentId}-{id}
```

- **index**: Device/resolution index (0 = default, 1+ = responsive)
- **level**: DOM depth (0 = root of selection, 1 = first child, etc.)
- **parentId**: ID of parent element in the labeled tree
- **id**: Unique ID for this element

**Example**: `snipcss0-4-52-53` = device 0, level 4, parent 52, self 53

### Labeling Flow

1. **snipcssLabelAll(elemSelector, labelIndex)** – Entry point
   - Root gets `snipcss{index}-0-0-{id}`
   - Calls `snipcssLabelSubelements(1, parentId, elem, labelIndex)` recursively

2. **snipcssLabelSubelements(level, parentId, elem, labelIndex)**
   - Skips elements with class `skipcss` (subselection exclude)
   - Skips SVG path/rect/circle/etc. for labeling (but keeps in DOM)
   - Adds `snipcss{index}-{level}-{parentId}-{id}` to each child
   - Increments `SNIP_CSS_CURRENT_ID` globally

3. **snipcssRemoveAllLabels()** – Cleans up after extraction
   - Removes all classes matching `/^snipcss\d+-\d+-\d+-\d+$/`

### Multi-Element Placeholder Classes

For multi-element selection, SnipCSS uses placeholder classes before labeling:

- `XXsnipcss_extracted_selector_selectionXX` (primary)
- `XXsnipcss_extracted_selector_2_XX` … `XXsnipcss_extracted_selector_20_XX`

These are replaced with `snipcss-{timestamp}` or actual snip classes during processing.

---

## 3. snipbackground.js CSS Extraction Pipeline

### High-Level Flow

1. **Attach debugger** to tab
2. **Get DOM** via `DOM.getDocument`
3. **Resolve node IDs** for selected elements (by snip class)
4. **Fetch stylesheets** – iterate stylesheetArr, optionally `CSS.getStyleSheetText`
5. **For each element** (by classname in `allClassnamesArr`):
   - `CSS.getMatchedStylesForNode(nodeId)` → `allMatchedStyles`
   - Extract `matchedCSSRules`, `inherited`, `inlineStyle`
6. **Process rules** – selector fixing, inherited handling, specificity
7. **Build snippedArr** – array of `{selector, body, media, device, ...}`
8. **CSS variable resolution** (if `resolve_variables == 'yes'`)
9. **Transmogrify** (if `replaceClasses == 'yes'` and not Tailwind)
10. **Media query grouping** – merge rules with same `@media`
11. **Output** – HTML + CSS, optionally Tailwind

### Key Data Structures

- **snippedArr**: `[{selector, body, media, device, sel_index, inherited_type, ...}]`
- **cssvarUsedArr**: List of `var(--x)` references found in rules
- **cssvarDefinedArr**: `{ '--varName': [{label, value, media, selector}, ...] }`
- **cssvarAllArr**: Flat `{ '--varName': 'value;' }` for resolution
- **stylesheetArr**: Parsed stylesheets with source URLs

### Chrome Debugger Commands Used

- `CSS.getMatchedStylesForNode` – primary CSS source
- `CSS.getMediaQueries` – for responsive extraction
- `CSS.getStyleSheetText` – full stylesheet when needed
- `DOM.getDocument` / `DOM.querySelector` – DOM resolution
- `Emulation.setDeviceMetricsOverride` – viewport for responsive
- `Emulation.setUserAgentOverride` – device simulation

---

## 4. Selector Fixing Algorithm (snipcssFixSelector)

**Location**: `js/sniptools.js` lines 418–527

### Purpose

Takes a CSS selector that may match elements outside the snipped subtree and rewrites it so it only matches within the root element. Handles complex selectors with combinators, pseudo-classes, and inheritance.

### Algorithm

1. **Split selector** on spaces (respecting parentheses):  
   `cssSelector.split(/(?!\(.*)\s(?![^(]*?\))/g)`

2. **Iterate from right to left** (most specific part first):
   - Skip `>`, `~`, `+` as delimiters
   - Skip parts with `:`, `[` (pseudo, attributes) for trimming
   - For each part, build `currParts = newPart + " " + currParts`

3. **Test containment**:
   - `$(rootSelector).find(testParts).length > 0` → part is inside root, keep
   - `rootMatches && $rootClone.find(testParts).length > 0` → root matches and clone contains, keep
   - Otherwise: if `lastPartDelim == '>'` and parent of root matches, special case for `otherInherited`
   - Else: **skip** (break) and trim left parts

4. **Pseudo stripping** for matching:
   - Remove `:before`, `:after`, `:first-letter`, `:first-line`, `:selection`
   - Remove `:hover`, `:active`, `:link`, `:checked`, `:disabled`
   - Truncate at `:where(`, `:not(`, `:has(`, `:is(`

5. **Fallbacks**:
   - If result is too generic (no `.` or `#`), use `snipcssUniqueSelector(elem, [])` to build a unique path
   - If last part is root, return `lastPart + " " + finalSelector`

6. **Final check**: `snipcssFixAndInside` – verify selector matches and is contained in root

### Return Value

```js
{ selector: string, is_contained: "0"|"1"|"-1", target_found: "0"|"1" }
```

---

## 5. Inherited Rule Handling

### INHERITED_RULES List

Properties that CSS inherits (snipbackground.js ~line 62):

```
azimuth, border-collapse, border-spacing, caption-side, color, cursor, direction,
elevation, empty-cells, font-family, font-size, font-style, font-variant, font-weight,
font, letter-spacing, line-height, list-style-image, list-style-position, list-style-type,
list-style, orphans, pitch-range, pitch quotes, richness, speak-header, speak-numeral,
speak-punctuation, speak, speech-rate, stress, text-align, text-indent, text-transform,
visibility, voice-family, volume, white-space, widows, word-spacing,
background-image, background, background-color
```

### Rule Types

1. **inherited** – Rule matches the element via inheritance (e.g. `body { color: red }` on a child)
2. **other_inherited** – Rule matches an ancestor, style flows down
3. **default** – Direct match, not inherited

### Processing

- `allMatchedStyles['inherited']` contains inherited rules
- For each inherited rule, compute **distance** from element to matching ancestor via `snipcssGetDistance(inheritedSelector, elemSelector)`
- **Specificity** via `calculateSingle(selector)` (parsel.js)
- Rules sorted by: specificity, then distance (closer = higher priority)
- Inherited rules are **unshifted in reverse order** so they apply before direct rules
- `other_inherited` rules get `snipcss_matching_elements` to find which snip classes they apply to

### Body Tag for Global Inherited

For inherited rules from `body`, SnipCSS adds a `.snipcss-bodytag` selector to capture root-level inherited styles.

---

## 6. CSS Variable Resolution Logic

### Data Structures

- **cssvarUsedArr**: `var(--x)` references found in rule values
- **cssvarDefinedArr**: `{ '--var': [{label, value, media, selector}, ...] }` – definitions per element/scope
- **cssvarAllArr**: `{ '--var': 'value;' }` – flat map for simple resolution
- **cssvarResolvedValues**: Cache of resolved values

### Resolution Flow (snipbackground.js)

1. **Collect definitions** while processing rules:
   - From `matchedCSSRules` and `inherited` – property names starting with `--`
   - Store in `cssvarDefinedArr` with `{label, value, media, selector}`

2. **Collect usages** – regex for `var(--varname)` in rule values → `cssvarUsedArr`

3. **lookupReferenceCssVar(refCssVar, level)** (recursive, max depth 5):
   - Look up `--` + refCssVar in `cssvarAllArr`
   - If value contains `--`, parse nested var name and recurse
   - Add to `danglingCssVarPropVal` for output

4. **resolveCssVariableValue** (tailwind_helper.js) – used for Tailwind:
   - Uses `cssvarDefinedArr` with element labels for specificity
   - `parseVarFunctionHelper` for correct `var()` parsing
   - `resolveValue` recursively resolves nested `var()`
   - Handles circular refs via `seenVars` Set
   - Supports `var(--x, fallback)` default values

### Nested/Recursive Variables

- SnipCSS v1.7.0+ handles `var(--a)` where `--a: var(--b)` and `--b: 1px`
- Resolution walks the chain with a depth limit (5 in lookupReferenceCssVar)
- Tailwind path uses `resolveCssVariableValue` with `seenVars` to prevent cycles

---

## 7. Media Query Parsing and Grouping

### Media Query Parser

- **media-query-parser.bundle.js** – Parses media query strings into AST
- Exports: `parseMediaQueryList`, `parseMediaQuery`, `parseMediaCondition`, `parseMediaFeature`, `stringify`
- Supports range syntax: `(min-width: 500px)`, `(500px < width < 1000px)`, etc.

### Grouping in snipbackground.js

- Each rule has `media` (e.g. `(min-width: 768px)`)
- **tryMergeSameMedia**: When iterating `snippedArrCleaned`, if next rules have same `myMedia`, merge into single `@media` block
- Output structure:
  ```css
  @media (min-width: 768px) {
    .selector1 { ... }
    .selector2 { ... }
  }
  ```

### Device/Resolution Handling

- `CSS.getMediaQueries` returns all media queries from the page
- Regex `/\d+px/g` extracts breakpoint values
- `fillAutoMediaWidths` builds `DEVICE_PROPS` for custom widths
- Each device (default, mobile, tablet, custom) gets its own extraction pass; snip classes use device index (e.g. `snipcss0`, `snipcss1`)

---

## 8. Transmogrify Feature (Class Renaming/Scoping)

**Location**: snipbackground.js `transmogrifyCSS(theHtml, mySnippedArr, globalPrefix)`

### Purpose

Rename classes and IDs to avoid conflicts when pasting snippets into other pages. "Scope CSS and replace classes."

### Process

1. **Build rename maps** (`tmClassArr`, `tmIdArr`):
   - **Common classes** (container, header, btn, etc.): `{origClass: commonClass + "-" + randomLowercase(3)}`
   - **Scope prefix match**: if class starts with `scope_prefix`, rename to `class + "-" + random(3)`
   - **Has hyphen**: `prefix + "-" + random(3)` (e.g. `btn-primary` → `btn-x7k`)
   - **Length > 3**: first 3 chars + `-` + random(3)
   - **Else**: random 5 letters
   - **IDs**: same logic, stored in `tmIdArr`

2. **Apply to HTML** (Cheerio):
   - Replace class values using `tmClassArr`
   - Replace id/name using `tmIdArr`

3. **Apply to CSS selectors**:
   - `replaceClasses` function walks selectors, replaces `.oldClass` with `.newClass`
   - Handles escaped colons in class names

4. **Update snippedArr** – selector and body references updated to new names

### Options

- `scope_prefix` – only transmogrify classes starting with this
- `scopeType` – 'class' or 'attribute'
- `globalPrefix` – prefix for all generated names

---

## 9. Multi-Element Selection Workflow

### Data Structures

- **SNIPCSS.MULTIPLE_ELEMENTS**: Array of selectors, e.g. `['.hero', '.footer']`
- **SNIPCSS.MULTIPLE_CLASSES**: Placeholder classes per element, e.g. `['XXsnipcss_extracted_selector_selectionXX', 'XXsnipcss_extracted_selector_2_XX', ...]`
- **SNIPCSS.PICKING_MULTIPLE**: Boolean
- **SNIPCSS.CURRENT_ELEMENT**: Current selector being processed

### Flow

1. User enables "Pick multiple" (or automation sends `run_snipper_from_background` with `|`-separated selectors)
2. Each selected element gets a class from `MULTIPLE_CLASSES`
3. `startSnipper()` runs extraction for each element
4. `multipleAllElementClassnames` – pipe-separated class strings per element, e.g. `"snipcss0-0-0-1|snipcss0-1-1-2|..."`
5. Background processes each element index; outputs combined HTML/CSS

### Automation

- `run_snipper_from_background` with `automate_selectors` containing `|` → split and add each to `MULTIPLE_ELEMENTS`
- `continue_snipper_from_background` – process next element in queue

---

## 10. Subselection (Include/Exclude) Feature

### skipcss Class

- Elements to **exclude** from the snippet get class `skipcss`
- `snipcssLabelSubelements` skips children with `skipcss`
- `snipcssGetOuterHtml` clones and removes `.skipcss` before serializing
- `snipcssGetZipOuterHtml` removes `.skipcss` from clone
- Images inside `.skipcss` are not collected for download

### snipcssLabelSkipElements(rootElem, keepArr)

**Location**: sniptools.js ~line 618

- **keepArr**: 1-based indices of children to **include** (e.g. `[1, 3, 5]`)
- Iterates `rootElem.children()` – if index in keepArr, keep; else add `skipcss`
- Validates: must have at least one kept and one skipped
- Highlights kept elements

### UI Flow (selectElemListeners.js, contentscript_kiwi.js)

- In multi-element mode, user can click child to toggle include/exclude
- Click on element → if inside parent, toggle `skipcss`
- `childrenIndices` (e.g. `"1,3,5"`) passed to `snipcssLabelSkipElements`

### Change Selection Modal

- `modal_change_selection.html` – user enters child indices to include
- Parsed as `keepArr` and passed to labeling

---

## 11. Tailwind Conversion Approach (v1.9.0+)

### Components

- **tailwind_main.js** – Core conversion logic
- **tailwind_helper.js** – `resolveCssVariableValue`, `parseVarFunctionHelper`, media query parsing
- **tailwind_properties.js** – CSS property → Tailwind class mapping
- **tailwind_shortlong.js** – Shorthand expansion, value parsing
- **tailwind_reduce.js** – Class reduction (combine padding/margin, etc.)
- **tailwind.cdn.3.4.14.js** – Tailwind config reference

### Flow

1. **Input**: `snippedArr` (CSS rules), `allElementOuterHtml` (HTML), element class names
2. **getTailwindHtml** – For each element:
   - Get ancestry chain from snip class names (`getElementAncestryChain`)
   - For each CSS property, find best Tailwind class via `getBestTailwindClasses`
   - Handle overrides (e.g. `margin` shorthand overwriting `margin-top`)
   - Resolve CSS variables before mapping
3. **getTailwindBodyClasses** – Global/body-level rules → body classes
4. **Icon font preservation** – Font Awesome, Tabler, Bootstrap Icons, etc. kept as-is
5. **Media queries** – `parseMediaQueryToTailwind` maps to Tailwind breakpoints (sm, md, lg, xl, 2xl)
6. **Output** – HTML with Tailwind classes, optional `@tailwind` directives or inline CSS

### Property Mapping

- `tailwind_properties.js` maps CSS properties to Tailwind utility classes
- Handles shorthand (e.g. `margin: 1rem` → `m-4`)
- Handles transforms, filters, fonts via `getTransformClasses`, `getFilterClasses`, `getFontClasses`

### Options

- `forceBreakpoints` – include breakpoint modifiers even when not needed
- `resolveVariables` – resolve `var(--x)` before Tailwind mapping
- `scope_prefix` – only convert rules matching prefix

---

## Summary: Implications for Our Extension

| SnipCSS Feature | Our Approach |
|-----------------|--------------|
| Chrome debugger API | Avoid – use getComputedStyle for simpler permissions |
| Element labeling | Simpler: single class per element or inline styles only |
| Selector fixing | Not needed if we output inline styles only |
| Inherited rules | Use INHERITED_RULES list to detect and optionally omit |
| CSS variable resolution | Implement recursive resolution for modern sites |
| Media queries | Complex; consider deferring or optional |
| Transmogrify | Optional post-processing for scoping |
| Multi-element | Consider for Phase 2 |
| Subselection | Consider for Phase 2 |
| Tailwind | Post-MVP feature |
