# Competitor Analysis: html.to.design vs Element Armory

> Reviewed: 2026-03-18
> Competitor version: 0.0.191
> Our version: 0.1.0

---

## TL;DR

html.to.design's goal is fundamentally different from ours — they serialize the entire DOM into a compressed blob for import into Figma. We produce clean HTML/JSX/CSS snippets for developers. That said, their DOM capture techniques are significantly more thorough and battle-hardened. There are specific techniques we should adopt to make our captures pixel-perfect.

---

## What They Do Well

### 1. Pseudo-Element Extraction

They explicitly call `getComputedStyle(element, "::before")`, `getComputedStyle(element, "::after")`, and `getComputedStyle(element, "::marker")` to extract computed pseudo-element styles. They also inject override CSS classes (`.__h2d-remove-before`, `.__h2d-remove-after`) to suppress pseudo-elements during serialization when needed.

Our approach preserves stylesheet rules with `::before`/`::after` selectors in output CSS, which is decent, but doesn't capture dynamically generated pseudo-element content or `::marker`.

### 2. Animation and Transition Freezing

Before capture, they inject CSS to freeze the page:

```css
caret-color: transparent !important;
transition-duration: 0ms !important;
transition-delay: 0ms !important;
animation-delay: 0ms !important;
animation-duration: 1ms !important;
animation-play-state: paused !important;
content-visibility: initial !important;
```

This ensures captured styles reflect the resting state, not a mid-transition state. We capture with animations running, which can produce non-deterministic output.

### 3. Scroll-to-Load for Lazy Content

Before capture, they auto-scroll the page in `innerHeight/5` increments with 100ms delays (multi-pass, up to 3 passes) to trigger lazy-loaded images and content. They find the main scrolling element by inspecting all elements across iframes for the largest scroll ratio.

We capture only what's currently in the viewport or already loaded.

### 4. Shadow DOM Traversal

They traverse shadow roots, mark them with a `__h2d_shadowRoot` attribute, and fully serialize shadow DOM content and styles. We detect shadow DOM presence and flag it, but don't traverse or serialize any of it.

### 5. Canvas Content Capture

They call `canvas.toDataURL()` to capture rendered canvas content as a data URI before serialization. We replace `<canvas>` with a placeholder div, losing the visual entirely.

### 6. CSS Property Coverage

They extract several CSS properties we're missing entirely:

- **Typography**: `font-style`, `font-stretch`, `font-variant`, `font-variation-settings`, `font-size-adjust`, `word-spacing`, `text-indent`, `text-rendering`, `writing-mode`, `unicode-bidi`, `direction`
- **SVG-specific**: `stroke`, `stroke-width`, `stroke-dasharray`, `fill-opacity`, `color-interpolation`, `clip-rule`, `stop-color`, `stop-opacity`, `flood-color`
- **Interaction**: `user-select`, `pointer-events`
- **Advanced color**: `oklch`, `lab` color space awareness

### 7. Visibility Pre-filtering

They have comprehensive element visibility checks before processing:

- `clip: rect(0px, 0px, 0px, 0px)`
- `clipPath: inset(50%)` and similar zero-area clip variations
- Off-screen absolute positioning (`x < -5000`, `y < -5000`)
- Identity matrix transform detection
- `offsetParent` null check
- `content-visibility` handling

This prevents invisible/offscreen elements from polluting the capture.

### 8. Message Compression

They zlib-compress serialized DOM before sending through Chrome message passing. This avoids hitting message size limits on complex pages.

### 9. Multi-Viewport Capture (5 presets + browser default)

#### Viewport Presets

| ID | Name | Width | Height (computed) |
|---|---|---|---|
| `default` | Browser width | current tab width | current tab height |
| `desktop` | Desktop | 1920px | 1200px |
| `laptop` | Laptop | 1440px | 900px |
| `tablet` | Tablet | 1024px | 640px |
| `phablet` | Phablet | 768px | 1536px (portrait) |
| `phone` | Phone | 390px | 780px |

Heights are computed dynamically: `width > 768 ? width / 1.6 : width / 0.5`. The breakpoint at 768px is what switches from landscape to portrait ratio. All widths are user-editable and persisted to `chrome.storage.local`.

#### Exact CDP Sequence Per Capture Task

```
1. chrome.debugger.attach(target, "1.3")
2. DOM.enable + CSS.enable + Page.enable + Debugger.enable  [in parallel]
3. For each task in [modes × deviceIds]:
   a. Page.getLayoutMetrics               → read cssVisualViewport.zoom (account for browser zoom)
   b. Emulation.setDeviceMetricsOverride  → { width: taskWidth * zoom, height: so(taskWidth) * zoom,
                                              deviceScaleFactor: 0, mobile: false }
   c. Emulation.setEmulatedMedia          → { features: [{ name: "prefers-color-scheme", value: theme }] }
                                            (skipped if theme === "default")
   d. DOM serialization via content script
   e. Emulation.clearDeviceMetricsOverride
   f. Emulation.setEmulatedMedia({ features: [] })  (clear theme emulation)
4. chrome.debugger.detach(target)
```

**Key details:**
- `deviceScaleFactor: 0` means "don't override DPR, use the real screen's value"
- `mobile: false` — they never use mobile user-agent emulation
- There is **no explicit wait/settle delay** after setting viewport. CDP's `Emulation.setDeviceMetricsOverride` is treated as synchronous with respect to the layout engine; `DOM.getDocument` is called immediately after.
- Tasks run **sequentially**, not in parallel (each task cleanly resets before the next begins)

### 10. Theme / Color Scheme Capture (Light, Dark, Browser)

#### Three Theme Modes

| Mode | Label | Icon | CDP behavior |
|---|---|---|---|
| `"default"` | Browser theme | monitor icon | No CDP emulation — uses OS/browser actual preference |
| `"light"` | light | sun icon | `Emulation.setEmulatedMedia({ features: [{ name: "prefers-color-scheme", value: "light" }] })` |
| `"dark"` | dark | moon icon | `Emulation.setEmulatedMedia({ features: [{ name: "prefers-color-scheme", value: "dark" }] })` |

The user selects any combination of themes via checkboxes (at least one must remain checked). All selected themes are captured in a single operation.

#### Cartesian Product Capture

The capture loop generates a Cartesian product of `modes × deviceIds`. Example: selecting `["light", "dark"]` themes with `["desktop", "phone"]` devices produces 4 sequential tasks:

```
{ theme: "light",  width: 1920 }
{ theme: "light",  width: 390  }
{ theme: "dark",   width: 1920 }
{ theme: "dark",   width: 390  }
```

Each task produces a separate serialized frame. The first frame becomes the primary, subsequent frames become `alternatives[]` in the output, each tagged with `.theme` and `.width`.

#### What This Captures

The CDP `Emulation.setEmulatedMedia` approach activates/deactivates any CSS `@media (prefers-color-scheme: dark)` rules on the page. Since this is done at the CDP level, it's transparent — no page CSS is modified, no DOM is touched. After capture, the emulation is reset with `Emulation.setEmulatedMedia({ features: [] })`.

**Note:** They do not handle `forced-colors` (Windows high-contrast) at all.

---

## What We Do Better

| Capability | Notes |
|---|---|
| **AI-ready output** | JSX + HTML + CSS + AI prompt generation. They produce Figma blobs. |
| **CSS variable resolution** | Depth-24 traversal, layer-aware, media-aware, computed fallback. Theirs is implicit. |
| **@layer / @container support** | Full layer ordering preservation, container query extraction. |
| **Render context** | Parent flex/grid extraction for accurate previews. |
| **External font links** | Capture Google Fonts / Adobe Fonts CDN links explicitly. |
| **Clean output** | Code is developer-ready, not raw serialization. |
| **Per-element CDP matching** | `CSS.getMatchedStylesForNode` gives precise rule sets. They serialize everything. |
| **Snippet library** | Full CRUD, folders, persistent library with auth/billing. |

---

## Gap Summary Table

| Feature | html.to.design | Element Armory | Priority |
|---|---|---|---|
| Pseudo-element computed styles | ✅ Full | ⚠️ Stylesheet rules only | High |
| Animation freezing before capture | ✅ | ❌ | High |
| Dark mode capture (`prefers-color-scheme`) | ✅ via CDP | ❌ | High |
| Multi-viewport capture (5 presets) | ✅ | ❌ | High |
| Shadow DOM traversal | ✅ | ❌ Detection only | Medium |
| Canvas `toDataURL()` capture | ✅ | ❌ Placeholder | Medium |
| Scroll-to-load lazy content | ✅ | ❌ | Medium |
| SVG property extraction | ✅ | ⚠️ Partial | Medium |
| Missing typography properties | ✅ | ⚠️ Partial | Medium |
| `::marker` pseudo-element | ✅ | ❌ | Low |
| `user-select`, `pointer-events` | ✅ | ❌ | Low |
| Message compression | ✅ zlib | ❌ | Low |
| Visibility pre-filtering | ✅ Extensive | ❌ | Low |
| Parallel CDP element queries | N/A (no CDP) | ❌ Sequential | Perf/High |
| Parallel stylesheet text fetches | N/A (no CDP) | ❌ Sequential | Perf/High |
| Invisible element pruning pre-CDP | ✅ Inline | ❌ | Perf/Medium |
| Debugger session reuse | N/A (no CDP) | ❌ Attach every time | Perf/Medium |
| Stylesheet fetch size/timeout limits | ✅ 30MB / 5s | ❌ None | Perf/Medium |
| Capture cancellation | ✅ | ❌ | Perf/Low |

---

## Performance: What Makes Them Faster

### The Fundamental Architecture Difference

html.to.design does **not use CDP for CSS extraction at all**. Their entire capture pipeline runs inside the content script — they walk the DOM once, call `getComputedStyle()` on each element inline, collect everything in a single pass, zlib-compress the result, and send one payload to the background. No debugger attachment. No IPC round-trips per element.

We use CDP's `CSS.getMatchedStylesForNode` which produces cleaner, rule-based output — but at a significant speed cost: every element requires two sequential IPC calls (`DOM.querySelector` + `CSS.getMatchedStylesForNode`). For a subtree of 100 elements, that's 200 sequential round-trips before extraction even begins.

This is our biggest performance gap.

### Their Specific Performance Techniques

#### 1. Single-Pass DOM Traversal

They use `document.createTreeWalker` with a **generator function** (`function*`) that yields elements lazily rather than collecting them all into an array first. Visibility pruning happens inline during traversal — invisible elements are skipped immediately and never added to the work queue.

#### 2. Aggressive Visibility Pruning Before Any Work

Their `po()` visibility checker short-circuits on any of these conditions before doing any style work on an element:

- `display: none` or empty string
- `visibility: hidden`
- `offsetParent === null` (for non-fixed elements)
- `overflow` with width or height < 1px
- `clip: rect(0px, 0px, 0px, 0px)`
- `clipPath: inset(50%)` or similar zero-area variants
- `position: absolute` with `x < -5000 || y < -5000`
- `transform: matrix(0, 0, 0, 0, ...)`

This alone can eliminate a large fraction of elements from processing on a typical page.

#### 3. One Compressed Payload Per Capture

They JSON-stringify the full serialized DOM, UTF-8 encode it, zlib-compress it (via the `fflate` library), and base64-encode the result — then send it as a **single message**. On a typical page this reduces payload size by 5–10x and means the background receives one message instead of many.

#### 4. Hard Limits on Asset Fetching

When fetching external assets (fonts, images), they use:
- `AbortController` with a **5-second timeout**
- A **30MB size limit** checked via `content-length` header before downloading
- Assets over the limit are silently skipped

This prevents a single large asset from blocking the entire capture.

#### 5. Short-Circuit Selector Generation on ID Match

Their CSS selector generator checks for a unique `id` attribute first. If found and unique in the document, it returns `#id` immediately without trying class/attribute/nth-child strategies. We use `data-element-capture-id` nanoid attributes which is similarly fast, but requires DOM mutation (adding then removing attributes), which triggers style recalculation on the page.

#### 6. Cancellation Support Mid-Traversal

They check a `cancelled` reactive flag during DOM traversal, allowing the capture to abort immediately without completing unnecessary work. We have no cancellation path — a triggered capture always runs to completion.

### Our CDP Bottlenecks (Prioritized by Impact)

| Bottleneck | Location | Impact |
|---|---|---|
| Sequential `DOM.querySelector` + `CSS.getMatchedStylesForNode` per element | `cdp-css.ts:537–552` | Very High — 2N sequential IPC calls for N elements |
| Sequential `CSS.getStyleSheetText` per stylesheet | `cdp-css.ts:570–597` | High — M sequential calls for M stylesheets |
| `DOM.enable` + `CSS.enable` called sequentially | `cdp-css.ts:528–529` | Low — two calls that could be parallel |
| No element visibility pruning before CDP calls | `content/index.ts:56–83` | Medium — all elements get stamped and queried including invisible ones |
| Debugger attach/detach on every capture | `cdp-css.ts:503, 653` | Medium — attach latency + Chrome notification bar on every capture |

---

## Todo List

### High Priority

- [ ] **Freeze animations before capture**
  In `content/index.ts`, before DOM cloning, inject a `<style id="ea-freeze">` tag into the document:
  ```css
  *, *::before, *::after {
    caret-color: transparent !important;
    transition-duration: 0ms !important;
    transition-delay: 0ms !important;
    animation-delay: 0ms !important;
    animation-duration: 1ms !important;
    animation-play-state: paused !important;
    content-visibility: initial !important;
  }
  ```
  Remove the tag immediately after `cloneNode(true)` completes. This makes captures deterministic regardless of what animations are running on the page.

- [ ] **Improve pseudo-element handling**
  After capture, call `getComputedStyle(element, "::before")` and `getComputedStyle(element, "::after")` on the target element and key descendants. If the pseudo-element has non-default `content`, synthesize a `[data-ea-pseudo-before]` CSS rule or inline it as a style block. At minimum, preserve `::marker` rules from stylesheets.

- [ ] **Dark mode / light mode capture via CDP**
  Add a `theme` option to the capture flow (`"default" | "light" | "dark"`). In `cdp-css.ts` (where we already have the debugger attached), before running `CSS.getMatchedStylesForNode`, issue:
  ```
  Emulation.setEmulatedMedia({ features: [{ name: "prefers-color-scheme", value: theme }] })
  ```
  After extraction is complete, reset with:
  ```
  Emulation.setEmulatedMedia({ features: [] })
  ```
  Because we already attach the debugger for CSS extraction, this costs nothing extra. Surface the option in the popup as a `Light / Dark / Browser` toggle (default: Browser). Store the preference in `chrome.storage.local`.

- [ ] **Multi-viewport capture**
  Add a viewport preset system to the popup. Allow the user to select one or more presets before capturing:

  | Preset | Width | Height formula |
  |---|---|---|
  | Browser (default) | current tab width | current tab height |
  | Desktop | 1920px | 1200px |
  | Laptop | 1440px | 900px |
  | Tablet | 1024px | 640px |
  | Phablet | 768px | 1536px |
  | Phone | 390px | 780px |

  Use `Page.getLayoutMetrics` to read the current zoom level first, then multiply dimensions by zoom before passing to `Emulation.setDeviceMetricsOverride`. CDP call:
  ```
  Emulation.setDeviceMetricsOverride({
    width: Math.round(presetWidth * zoom),
    height: Math.round(presetHeight * zoom),
    deviceScaleFactor: 0,
    mobile: false
  })
  ```
  After capture, reset with `Emulation.clearDeviceMetricsOverride`. Run tasks sequentially (set → capture → reset → next). Store each viewport capture as a separate variant on the snippet (`variants[]` with `.width` tag). Widths should be user-editable and persisted to `chrome.storage.local`.

  **Note:** There is no need to wait for the page to reflow. CDP treats `setDeviceMetricsOverride` as synchronous with the layout engine — calling `DOM.getDocument` or `CSS.getMatchedStylesForNode` immediately after is safe.

  **Combined with theme capture**, the tasks form a Cartesian product of `themes × viewports`. A user selecting Dark + Phone + Desktop gets 2 tasks:
  ```
  { theme: "dark", width: 390  }
  { theme: "dark", width: 1920 }
  ```

### Performance (High Priority)

- [ ] **Parallelize `CSS.getMatchedStylesForNode` calls**
  In `cdp-css.ts`, replace the sequential `for` loop over selectors with a `Promise.all` (or a capped concurrency pool of ~6–10). Currently N elements = 2N sequential IPC round-trips. With parallelism, this collapses to roughly 2 round-trip durations regardless of element count. This is the single highest-impact change in the codebase.

  Current pattern (lines 537–552):
  ```typescript
  for (const selector of selectors) {
    const queryResult = await sendCommand(tabId, "DOM.querySelector", { ... });
    const matched = await sendCommand(tabId, "CSS.getMatchedStylesForNode", { ... });
  }
  ```
  Target pattern:
  ```typescript
  const results = await Promise.all(
    selectors.map(async (selector) => {
      const queryResult = await sendCommand(tabId, "DOM.querySelector", { ... });
      if (!queryResult?.nodeId) return null;
      return sendCommand(tabId, "CSS.getMatchedStylesForNode", { ... });
    })
  );
  ```

- [ ] **Parallelize `CSS.getStyleSheetText` calls**
  In `cdp-css.ts` (lines 570–597), all stylesheet text fetches are sequential. Replace with `Promise.all` — they are fully independent and there is no reason to serialize them.

- [ ] **Parallelize `DOM.enable` + `CSS.enable`**
  In `cdp-css.ts` (lines 528–529), these two setup commands are currently awaited sequentially. Change to:
  ```typescript
  await Promise.all([
    sendCommand(tabId, "DOM.enable"),
    sendCommand(tabId, "CSS.enable"),
  ]);
  ```
  Small win, zero risk.

- [ ] **Prune invisible elements before CDP calls**
  In `content/index.ts`, before `addTempCaptureSelectors` stamps the subtree, walk the elements and filter out any that are invisible. Check: `getComputedStyle(el).display === "none"`, `getComputedStyle(el).visibility === "hidden"`, and `el.getBoundingClientRect().width === 0 && el.getBoundingClientRect().height === 0`. Fewer selectors → fewer CDP calls.

- [ ] **Cache the debugger session between rapid captures**
  In `cdp-css.ts`, instead of `attach` → extract → `detach` on every capture, keep the debugger attached for a short window (e.g. 10 seconds of inactivity) using an `alarms`-based idle timer. On the next capture within that window, skip the attach step. This eliminates the attach latency and the Chrome notification bar flash on every capture. Detach on tab navigation or close.

- [ ] **Add size and timeout limits to `CSS.getStyleSheetText` fetches**
  Currently there are no guards on stylesheet size or fetch time via CDP. Add a timeout (5 seconds) and a size check (skip stylesheets over 2MB) matching the competitor's approach. This prevents a single massive stylesheet from blocking the extraction pipeline.

### Medium Priority

- [ ] **Add SVG-specific CSS properties to extraction list**
  Add to `style-properties.ts`: `fill`, `fill-opacity`, `fill-rule`, `stroke`, `stroke-width`, `stroke-linecap`, `stroke-linejoin`, `stroke-dasharray`, `stroke-dashoffset`, `clip-rule`, `color-interpolation`, `stop-color`, `stop-opacity`. These are critical for SVG elements and currently missing.

- [ ] **Expand typography property list**
  Add to `style-properties.ts`: `font-style`, `font-stretch`, `font-variant`, `font-variation-settings`, `font-size-adjust`, `word-spacing`, `text-indent`, `text-rendering`, `writing-mode`, `unicode-bidi`, `direction`. These matter for accurate text rendering.

- [ ] **Canvas `toDataURL()` capture**
  In `asset-replacer.ts`, instead of always replacing `<canvas>` with a placeholder, first attempt `canvas.toDataURL("image/png")`. If it succeeds (no CORS taint), replace the canvas with an `<img src="...">` using the data URI. Fall back to placeholder only on `SecurityError`.

- [ ] **Shadow DOM serialization**
  In `dom-cloner.ts`, when an element has a `shadowRoot`, clone the shadow DOM content into the cloned element using a `<template shadowrootmode="open">` declarative shadow DOM tag. This preserves the shadow content in the output HTML. Handle styling by injecting shadow root stylesheets into the template.

- [ ] **Scroll-to-load for lazy images**
  Before capture (in `content/index.ts`), check if the target element contains any `<img>` with `loading="lazy"` or `data-src` attributes (common lazy-load patterns). If found, scroll the element into view and wait ~300ms before proceeding with capture.

### Low Priority

- [ ] **Add `user-select` and `pointer-events` to property list**
  These affect interactive behavior and are relevant for developer output. Add to the core whitelist in `style-properties.ts`.

- [ ] **Visibility pre-filtering in element picker**
  In `element-picker.ts`, when traversing the element tree, skip elements that are visually invisible via off-screen absolute positioning (`getBoundingClientRect().width === 0`), or clip tricks. Surface a warning if the picked element appears invisible.

- [ ] **`::marker` pseudo-element extraction**
  For `<li>` elements, call `getComputedStyle(element, "::marker")` and include the resulting styles (list-style-type, color, font-size) in the output CSS.

- [ ] **Message payload size audit**
  Profile captures on large elements. If serialized payloads regularly exceed 5MB, evaluate adding compression (e.g., `CompressionStream` API available in Chrome 80+) to the content→background message pipeline.

---

## Architectural Notes

- Their CDP usage is for **font detection** (`CSS.fontsUpdated`) and **device emulation**. Ours is for **rule matching** (`CSS.getMatchedStylesForNode`). Both approaches are valid for different goals. The dark mode and viewport features can be added on top of our existing CDP session at zero extra cost — we're already attached.
- Their entire pipeline is optimized for throughput (compress + send blob). Ours is optimized for output quality (clean, readable code). Do not conflate these goals when making improvements.
- When adding new CSS properties, always add them to `style-properties.ts` and ensure the defaults filter in `style-defaults.ts` suppresses their default values to keep output clean.
- The viewport + theme Cartesian product model is the right UX pattern. Each combination produces a self-contained capture that can be previewed and copied independently.
