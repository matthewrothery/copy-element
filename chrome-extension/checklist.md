# Element Capture – Complete Extraction Checklist

This checklist defines everything required to **accurately copy a DOM element and recreate it elsewhere with the same visual appearance**.

The goal is to produce **portable HTML that visually matches the original element as closely as possible**.

This document is intended for:

- developers implementing extraction
- AI agents working on capture logic
- reverse engineering analysis of competitor extensions

The system must capture:

- HTML structure
- styles
- layout dependencies
- images/assets
- SVG
- fonts
- pseudo elements
- CSS variables
- parent layout context

The final output should render **identically in isolation**.

---

# Phase 1 – Element Selection

## Tasks

- Detect clicked element.
- Identify correct root capture element.
- Avoid selecting overly small or deeply nested nodes when a larger component should be captured.

### Checklist

- [ ] Determine clicked DOM node.
- [ ] Allow user to override selection (expand to parent).
- [ ] Store element bounding box.
- [ ] Record element tag name.
- [ ] Record class list.
- [ ] Record element id.
- [ ] Record DOM depth.

### Optional heuristic

Detect component-like containers:

- elements with multiple children
- layout containers
- elements with grid or flex display

---

# Phase 2 – DOM Cloning

## Tasks

Clone the DOM subtree safely.

### Checklist

- [ ] Clone element using `cloneNode(true)`.
- [ ] Remove event listeners.
- [ ] Remove script tags.
- [ ] Remove inline event handlers.

### Remove attributes

- [ ] `onclick`
- [ ] `onmouseover`
- [ ] `onload`
- [ ] `data-*` tracking attributes
- [ ] analytics attributes

### Keep attributes

- [ ] `src`
- [ ] `href`
- [ ] `alt`
- [ ] `title`
- [ ] `aria-*`

---

# Phase 3 – DOM Traversal

Traverse entire subtree.

### Checklist

- [ ] Walk all descendant nodes.
- [ ] Track parent-child relationships.
- [ ] Preserve DOM order.
- [ ] Detect text nodes.

### Node types

Handle:

- [ ] Element nodes
- [ ] Text nodes
- [ ] SVG nodes

Ignore:

- [ ] Comment nodes

---

# Phase 4 – Computed Style Extraction

Core step: convert CSS into inline styles.

Use:

```

getComputedStyle(element)

```

### Checklist

- [ ] Extract computed styles for each node.
- [ ] Convert style object to inline CSS.
- [ ] Attach styles to cloned element.

---

# Phase 5 – CSS Property Filtering

Not all computed styles should be copied.

### Required properties

Layout:

- [ ] display
- [ ] position
- [ ] top
- [ ] left
- [ ] right
- [ ] bottom

Box model:

- [ ] width
- [ ] height
- [ ] margin
- [ ] padding
- [ ] border
- [ ] box-sizing

Flex/Grid:

- [ ] flex
- [ ] flex-direction
- [ ] align-items
- [ ] justify-content
- [ ] gap
- [ ] grid-template
- [ ] grid-area

Typography:

- [ ] font-family
- [ ] font-size
- [ ] font-weight
- [ ] line-height
- [ ] letter-spacing
- [ ] text-align
- [ ] text-decoration

Colors:

- [ ] color
- [ ] background
- [ ] background-color
- [ ] background-image

Visual:

- [ ] opacity
- [ ] border-radius
- [ ] box-shadow

---

# Phase 6 – CSS Variable Resolution

CSS variables often break copied components.

Example:

```

color: var(--primary)

```

### Tasks

Resolve variables to computed values.

### Checklist

- [ ] Detect `var(--*)`.
- [ ] Resolve variable using computed style.
- [ ] Replace variable with actual value.

Example conversion:

```

color: var(--primary)

```

becomes:

```

color: rgb(34, 34, 34)

```

---

# Phase 7 – Pseudo Elements

Many UI elements rely on:

- `::before`
- `::after`

### Checklist

- [ ] Detect pseudo elements using `getComputedStyle(el, "::before")`.
- [ ] Detect pseudo elements using `getComputedStyle(el, "::after")`.
- [ ] If content exists, recreate pseudo node.

Example transformation:

```

```

becomes:

```

<span class="pseudo-before"></span>

```

with inline styles.

---

# Phase 8 – Parent Layout Context

Many components depend on parent layout.

Example:

```

display:flex

```

### Checklist

- [ ] Detect parent display.
- [ ] Detect grid/flex layout.
- [ ] Replicate minimal parent container if needed.

Example:

```

parent display:flex

```

Add wrapper:

```

<div style="display:flex">
```

---

# Phase 9 – Image Handling

Images must be preserved.

### Checklist

* [ ] Detect `<img>` tags.
* [ ] Convert relative URLs to absolute URLs.
* [ ] Preserve `src`.
* [ ] Preserve `srcset`.

### Optional

Convert images to data URLs.

Steps:

* fetch image
* convert to base64
* inline image

---

# Phase 10 – Background Images

CSS backgrounds must be preserved.

Example:

```
background-image: url(...)
```

### Checklist

* [ ] Detect background-image.
* [ ] Extract URL.
* [ ] Convert relative paths to absolute.

---

# Phase 11 – SVG Handling

SVG can appear in two forms.

### Inline SVG

Example:

```
<svg>...</svg>
```

Checklist:

* [ ] Preserve SVG markup.
* [ ] Preserve attributes.
* [ ] Preserve viewBox.

---

### External SVG

Example:

```
<img src="icon.svg">
```

Checklist:

* [ ] Fetch SVG file.
* [ ] Inline SVG markup.

---

# Phase 12 – Font Handling

Fonts affect visual fidelity.

### Checklist

* [ ] Detect `font-family`.
* [ ] Check if font is system font.
* [ ] If external font detected, record font URL.

Optional:

* embed font link

---

# Phase 13 – Text Node Preservation

### Checklist

* [ ] Preserve whitespace.
* [ ] Preserve line breaks.
* [ ] Preserve special characters.

---

# Phase 14 – Shadow DOM Detection

Some elements use shadow DOM.

### Checklist

* [ ] Detect `shadowRoot`.
* [ ] Traverse shadow DOM nodes.
* [ ] Copy shadow styles.

---

# Phase 15 – Canvas Handling

Canvas content cannot be copied as DOM.

### Checklist

* [ ] Detect `<canvas>`.
* [ ] Convert to image using `toDataURL`.

---

# Phase 16 – Video Handling

### Checklist

* [ ] Preserve `<video>` tags.
* [ ] Preserve poster image.
* [ ] Preserve source URLs.

---

# Phase 17 – Form Elements

### Checklist

Preserve values:

* [ ] input value
* [ ] textarea value
* [ ] checkbox state
* [ ] select option

---

# Phase 18 – Attribute Cleanup

Remove unnecessary attributes.

### Remove

* `data-reactroot`
* `data-testid`
* `ng-*`
* framework attributes

---

# Phase 19 – Layout Stabilization

To ensure visual match.

### Checklist

* [ ] Set explicit width.
* [ ] Set explicit height.
* [ ] Prevent layout collapse.

---

# Phase 20 – Inline Style Generation

Convert style object to string.

Example:

```
display:flex
gap:12px
```

becomes:

```
style="display:flex;gap:12px"
```

---

# Phase 21 – Output Generation

Produce portable HTML.

### Formats

* [ ] HTML
* [ ] JSX

---

# Phase 22 – Thumbnail Generation

Optional but useful.

### Checklist

* [ ] render element
* [ ] capture with html2canvas
* [ ] crop bounding box
* [ ] store base64 thumbnail

---

# Phase 23 – Performance

Extraction must remain fast.

Targets:

```
<500ms extraction
```

### Checklist

* [ ] Avoid full DOM traversal.
* [ ] Limit recursion depth.
* [ ] Avoid unnecessary style reads.

---

# Phase 24 – Testing Scenarios

Test against:

### Layouts

* [ ] flex layouts
* [ ] grid layouts
* [ ] absolute positioning

### Assets

* [ ] external images
* [ ] inline svg
* [ ] background images

### CSS

* [ ] CSS variables
* [ ] pseudo elements

---

# Phase 25 – Competitor Reverse Engineering

When inspecting minified extension code, search for patterns like:

### Key functions

```
getComputedStyle
cloneNode
querySelectorAll
getBoundingClientRect
```

### Likely pipelines

Look for:

```
style extraction loops
css property filters
svg parsing
asset handling
```

---

# Phase 26 – Final Validation

After extraction:

### Checklist

* [ ] Render extracted HTML in isolation.
* [ ] Compare screenshot with original element.
* [ ] Ensure visual match.

---

# Final Goal

The extracted component should:

* render identically
* require no external CSS
* require no external scripts

The output should be **fully portable UI markup**.
