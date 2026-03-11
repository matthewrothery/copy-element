# DivMagic vs SnipCSS — Comparison & Best Practices

This document compares DivMagic (v2.1.22) and SnipCSS (v2.0.3) for element capture and CSS extraction. It informs our copy-element extension design and target whitelist.

---

## 1. Feature Parity Comparison Table

| Feature | DivMagic | SnipCSS |
|---------|----------|---------|
| **Element selection** | DevTools panel, popup, context menu | Content script (Kiwi), popup |
| **CSS extraction source** | `getComputedStyle` (implied) + whitelist | Chrome debugger API (`CSS.getMatchedStylesForNode`) |
| **Property filtering** | Whitelist (~80 properties) | None — extracts all matched rules |
| **Copy modes** | Adaptable, Balanced, Exact | Single mode |
| **Output formats** | HTML, React, JSX, Tailwind, CSS | HTML + CSS, Tailwind |
| **Inline styles** | Optional (style format setting) | External CSS only |
| **Media queries** | Parsed, grouped, per-element | Full support, grouped |
| **CSS variables** | Not resolved | Resolved (recursive, nested) |
| **Pseudo-elements** | Balanced/Exact modes | `CSS.forcePseudoState` for extraction |
| **Selector fixing** | N/A (uses IDs) | `snipcssFixSelector` algorithm |
| **Inherited rules** | Not explicit | INHERITED_RULES list, distance/specificity |
| **Multi-element** | No | Yes |
| **Subselection (include/exclude)** | No | Yes |
| **Transmogrify (class scoping)** | No | Yes |
| **Snippet library** | No | No |
| **Permissions** | script, activeTab, storage, contextMenus | debugger, storage, activeTab, scripting, tabs, unlimitedStorage |

---

## 2. Common CSS Property Whitelist (Both Tools Extract)

These properties are in DivMagic’s whitelist and are commonly extracted by SnipCSS (via matched rules):

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
- Per-side: `border-*-color`, `border-*-style`, `border-*-width`
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

## 3. Properties SnipCSS Extracts That DivMagic Does Not

SnipCSS extracts all matched rules; DivMagic uses a whitelist. SnipCSS therefore includes:

| Category | Properties |
|----------|------------|
| **Flexbox** | `flex`, `flex-wrap`, `flex-flow`, `align-content`, `align-self`, `order` |
| **Gap** | `gap`, `column-gap`, `row-gap` |
| **Grid** | `grid`, `grid-template-columns`, `grid-template-rows`, `grid-template-areas`, `grid-column`, `grid-row`, `grid-area`, `grid-auto-flow`, `grid-auto-columns`, `grid-auto-rows` |
| **Box model** | `box-sizing` |
| **Background** | `background-clip`, `background-origin` |
| **Typography** | `text-shadow`, `text-overflow`, `font-stretch` |
| **Visual** | `filter`, `clip-path`, `backface-visibility` |
| **Object** | `object-fit`, `object-position` |
| **Transitions** | `transition`, `transition-property`, `transition-duration`, etc. |
| **Animations** | `animation`, `animation-name`, etc. |
| **Other** | `resize`, `word-wrap`, `word-break`, `-webkit-*` vendor prefixes |

---

## 4. Properties DivMagic Extracts That SnipCSS May Not

SnipCSS extracts all matched rules; DivMagic’s whitelist is a subset. If a rule has no matching selector, SnipCSS may omit it. DivMagic’s whitelist explicitly includes:

- `cursor` — SnipCSS may include if it appears in rules
- `list-style` variants — SnipCSS includes if they match
- `text-indent` — SnipCSS includes if they match
- `font-variant` — SnipCSS includes if they match

DivMagic does not add properties SnipCSS does not have; it only filters them.

---

## 5. Style Minimization Techniques

### DivMagic
- **Whitelist filtering**: Only properties in the whitelist are kept.
- **`!important` stripping**: Removed from values.
- **Media query grouping**: Rules grouped by `@media` block.
- **Copy modes**: Adaptable (minimal), Balanced (pseudo-elements), Exact (full).

### SnipCSS
- **Merge duplicate properties**: Same property in multiple rules → later value wins.
- **Shorthand merging**: Longhand properties merged into shorthand where possible.
- **`display` ordering**: `display` placed first in rule bodies.
- **Inherited rules**: Only inherited properties from INHERITED_RULES applied to body/root.
- **Skip empty values**: `lineVal == ''` or `lineVal.length <= 0` skipped.
- **Vendor prefix handling**: Avoid merging when vendor-prefixed values differ.
- **`alreadySnippedWhole`**: Deduplicate identical rules.
- **Transmogrify**: Optional class renaming to reduce conflicts.

### Our Project (style-defaults.ts)
- **Default value omission**: Skip `position: static`, `margin: 0`, `opacity: 1`, etc.
- **Whitelist**: `VISUAL_STYLE_PROPERTIES` only.

---

## 6. Selector Specificity Handling

### DivMagic
- Uses element IDs (`#id`) for extracted rules.
- Filters rules to those targeting element IDs.
- Parses `#id` from selectors; no selector fixing.
- No containment checks; assumes IDs are unique.

### SnipCSS
- **Selector fixing**: `snipcssFixSelector` rewrites selectors.
  - Splits on spaces (respecting parentheses).
  - Iterates right-to-left.
  - Tests containment with `$(rootSelector).find(testParts).length > 0`.
  - Strips pseudo-classes for matching (`:hover`, `:before`, etc.).
  - Falls back to `snipcssUniqueSelector` if too generic.
- **Specificity**: Uses `calculateSingle(selector)` (parsel.js).
- **Sorting**: Rules by specificity, then distance.
- **Inherited rules**: Distance from element to matching ancestor via `snipcssGetDistance`.
- **Body tag**: `.snipcss-bodytag` for inherited root styles.

### Implication for Us
- **Inline styles only**: No selector fixing needed.
- **Class-based output**: Would need selector fixing.

---

## 7. Edge Cases Each Tool Handles (or Fails On)

### DivMagic

| Edge Case | Handling |
|-----------|----------|
| Pseudo-elements | Balanced/Exact modes include `::before`/`::after` |
| CSS variables | Not resolved |
| Media queries | Parsed and grouped |
| `gap` in flex/grid | Not in whitelist (blockRegistration.bundle.js); may be missing |
| Grid layouts | Not in whitelist |
| Shadow DOM | Not documented |
| Nested `var()` | N/A |

### SnipCSS

| Edge Case | Handling |
|-----------|----------|
| Pseudo-elements | `CSS.forcePseudoState` for extraction |
| CSS variables | Recursive resolution (v1.7.0+), nested `var()` |
| Media queries | Full support, grouped |
| Complex selectors | `snipcssFixSelector` |
| Inherited rules | INHERITED_RULES, distance, specificity |
| Grid layouts | Extracted via matched rules |
| Shadow DOM | Not documented |
| Liquid template | Skips `property == 'src'`-like rules |
| `skipcss` | Excludes elements with `.skipcss` |

### Common Gaps
- Shadow DOM: Neither documented as handling.
- Canvas/video: Both require special handling.
- iframes: Not inlined.

---

## 8. Target CSS Property Whitelist for Minimal Output

Based on our project rules (dom-capture.mdc), checklist.md, and both tools:

### Core Visual Properties (Required)

```
display
position
margin, margin-top, margin-right, margin-bottom, margin-left
padding, padding-top, padding-right, padding-bottom, padding-left
font-family, font-size, font-weight, line-height, letter-spacing
text-align, text-decoration, text-transform
color
background, background-color, background-image, background-size, background-position, background-repeat
border, border-top, border-right, border-bottom, border-left
border-radius
box-shadow
opacity
visibility
width, height, min-width, min-height, max-width, max-height
top, right, bottom, left
z-index
overflow, overflow-x, overflow-y
transform
```

### Flexbox (Required for Layout)

```
flex, flex-direction, flex-wrap, flex-grow, flex-shrink, flex-basis
justify-content, align-items, align-self, align-content
gap, column-gap, row-gap
```

### Grid (Required for Layout)

```
grid, grid-template-columns, grid-template-rows
grid-column, grid-row, grid-area
grid-auto-flow
```

### Optional (Per dom-capture.mdc)

```
font (shorthand)
vertical-align
white-space
word-wrap, word-break
text-shadow
text-overflow
filter
clip-path
object-fit, object-position
```

### Omit (Per dom-capture.mdc)

```
transition
animation
cursor
pointer-events
```

### Default Value Omission

Omit when value equals default:

- `position: static`
- `margin: 0`, `padding: 0`
- `opacity: 1`
- `display: block` (when element is block)
- `font-weight: normal`

---

## Summary

| Aspect | Our Approach |
|--------|--------------|
| **Property source** | `getComputedStyle` (no debugger) |
| **Filtering** | Whitelist + default omission |
| **Output** | Inline styles only |
| **Selector fixing** | Not needed |
| **CSS variables** | Resolve to computed values |
| **Pseudo-elements** | Convert to real elements |
| **Media queries** | Defer or optional |
