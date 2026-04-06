# MiroMiro Competitor Analysis & Element Armory Improvement Proposal

**Date:** 2026-04-06  
**Subject:** MiroMiro Chrome Extension (v1.7)  
**Purpose:** Identify MiroMiro's feature set, strengths, and UX patterns to inform Element Armory improvements.

---

## 1. MiroMiro Feature Inventory

### Core Inspection
- **Hover-to-inspect mode** — real-time style capture on mouseover, no click required
- **Computed style panel** — shows colors, typography, spacing, borders, shadows, and position
- **Element dimensions and position** — live bounding rect display
- **Keyboard navigation** — arrow keys to traverse DOM hierarchy during inspection
- **Context-aware tabs** — different panel tabs based on element type (image vs text vs component)

### Color
- **Full-page color palette scan** — extracts every color used on the page
- **Color format conversion** — Hex, RGB, HSL, OKLCH, Tailwind nearest-match
- **Gradient extraction** — captures complex CSS gradients
- **Saved color library** — user can bookmark colors with URL context
- **Group by type/brightness** — organizes palette by hue and lightness
- **WCAG contrast checker** — evaluates contrast ratio with AA/AAA classification
- **Page-wide accessibility audit** — highlights all contrast issues on the current page

### Typography
- **Font detection** — captures font family, size, weight, line-height
- **Web font recognition** — handles both external and system fonts

### Design System Generation
- **Full-page token extraction** — colors, fonts, spacing, radius, shadows
- **Tailwind config export** — generates `tailwind.config.js` with real token values
- **CSS variables export** — generates `theme.css` with CSS custom properties
- **Semantic naming** — assigns names (primary, secondary, etc.) using color clustering

### Component Export
- **HTML + CSS export** — extracts selected element with its computed styles
- **CSS selector normalization** — rewrites selectors with ancestor prefixing for portability
- **Prettier formatting** — clean, formatted output
- **Font embedding** — encodes web fonts as base64 data URLs in the output
- **PostCSS processing** — handles vendor prefixes for compatibility
- **Hover/focus/active state preservation** — captures interactive pseudo-class styles
- **CSS animation and keyframe preservation**

### Asset Extraction
- **Image batch download** — PNG, JPG, WebP with ZIP export
- **SVG inline extraction** — resolves `<use>` references before export
- **Video/animation asset capture**
- **Lottie animation export** — detects `lottie-player`, `dotlottie-player`, and runtime instances
- **Canvas element support** — snapshot (PNG) and 4-second video recording
- **Stylesheet collection** — downloads all linked stylesheets
- **Icon library recognition** — detects Iconify, Font Awesome, Material Icons, Bootstrap Icons

### Library / Technology Detection
- Identifies UI frameworks, chart libraries (Chart.js, D3, Recharts), animation libraries (Three.js, Babylon.js, Anime.js), auth providers

### Accessibility
- WCAG 2.2 contrast compliance with AA/AAA levels
- Page-wide audit with visual issue highlighting
- Colorblind-safe color suggestions (noted in code, partial)

### Account & Storage
- Supabase backend with OAuth auth
- Saved colors, gradients, and assets in cloud library
- Cross-device persistence
- Per-feature usage counters

### Monetization
- **Free tier:** 15 asset extractions, 5 contrast checks, 3 design system generations, 5 component exports, 10 saved items, 0 Lottie extractions (hard lock)
- **Pro tier:** 2000 extractions, unlimited contrast/exports/Lottie
- **24-hour free trial** of Pro on signup

### UI/UX Highlights
- Side panel layout (native Manifest V3 `sidePanel` API)
- Usage ring — circular progress indicator per feature limit, color-coded at 75% and 100%
- Context-aware paywall modals — different modal per feature type
- Post-success upgrade prompts — "You've exported X components" with remaining count
- Trial countdown banner in header with "Keep Pro" CTA
- Feature grid on auth gate — shows six feature cards before sign-in to establish value
- Floating feedback button — persistent across all views

---

## 2. MiroMiro's Technical Strengths

| Strength | Notes |
|---|---|
| Side panel UI | Larger, persistent workspace vs popup |
| Canvas capture | Rare — supports chart and animation elements |
| Lottie export | Detects runtime Lottie instances dynamically |
| Pseudo-element export | `::before`/`::after` styling preserved in export |
| Font embedding | Base64 fonts baked into exported HTML |
| Design system generation | Full-page token extraction with Tailwind export |
| WCAG audit | Page-wide accessibility scan in one click |

---

## 3. MiroMiro's Weaknesses

| Weakness | Notes |
|---|---|
| Aggressive free limits | Lottie locked at 0 free; 5 exports is very low |
| No monthly reset | Free limits are permanent, not per-month — users exhaust quickly and churn |
| Binary pricing | Free → Pro only; no intermediate tier |
| No real AI | Design system names are rule-based heuristics, not ML |
| Canvas cap | 4-second video max; no vector canvas export |
| Selector fragility | Generated CSS selectors may not port cleanly to other contexts |
| No animation timing export | CSS keyframes preserved but easing/timing metadata not surfaced |
| No responsive breakpoint detection | No media query inspection or breakpoint visualization |
| No preview before download | Users download without seeing what they'll get |
| No sharing or collaboration | Library is purely personal, no share-to-team |
| Cognitive load on paywall | Multiple different paywall modals; users experience fragmentation |

---

## 4. Improvement Proposals for Element Armory

Proposals are grouped by priority. Each entry maps MiroMiro's capability to an Element Armory gap or opportunity to differentiate.

---

### Priority 1 — Close Gaps on Core Capture Quality

#### 4.1 Pseudo-element capture (`::before` / `::after`)
**Gap:** Element Armory captures computed styles but doesn't systematically extract pseudo-element styling.  
**Opportunity:** MiroMiro preserves `::before`/`::after` in HTML+CSS exports. Our exports can silently drop decorative elements.  
**Proposal:** Extend the style extractor to detect and inline pseudo-element rules from matching stylesheet rules, outputting them as a scoped `<style>` block alongside the exported HTML.

#### 4.2 Font embedding in exports
**Gap:** Exported HTML references font names by string; fonts don't load outside the origin page.  
**Opportunity:** MiroMiro encodes referenced web fonts as base64 `@font-face` rules in the exported CSS.  
**Proposal:** Add optional font embedding to the HTML export pipeline. Fetch the font file via the background script (CORS bypass), encode as base64, and inject the `@font-face` declaration.

#### 4.3 Hover/interactive state capture
**Gap:** We capture the element's current state only.  
**Opportunity:** MiroMiro preserves `:hover`, `:focus`, `:active` stylesheet rules in exports.  
**Proposal:** Extend `stylesheet-rule-extractor.ts` to also capture rules for interactive pseudo-classes on the matched selector, and include them in the exported `<style>` block.

---

### Priority 2 — High-Differentiation Features

#### 4.4 WCAG contrast checker
**Gap:** No accessibility checking in Element Armory.  
**Opportunity:** MiroMiro's contrast checker is a clear value-add for developer audiences and aligns with our "developer-focused" positioning.  
**Proposal:** Add a lightweight contrast checker in the element inspector panel. When an element has foreground and background colors, show the contrast ratio and pass/fail badges for AA and AAA. No page-wide audit needed initially — element-level checking is sufficient for an MVP.

#### 4.5 Color format switcher on copy
**Gap:** Colors are copied in a single format.  
**Opportunity:** MiroMiro converts between Hex, RGB, HSL, OKLCH, and Tailwind on demand.  
**Proposal:** Add a format toggle on color values in the inspector. Default to Hex; allow switching to RGB/HSL with a click. Persist user preference. No Tailwind mapping needed at first.

#### 4.6 Full-page color palette extraction
**Gap:** Element Armory captures per-element colors only.  
**Opportunity:** MiroMiro scans the whole page and surfaces a deduplicated color palette — a popular feature for design handoff.  
**Proposal:** Add a "Page Colors" panel that scans `document.querySelectorAll('*')`, extracts `color`, `background-color`, `border-color`, and `fill`/`stroke` from computed styles, deduplicates, and presents as swatches with copy-on-click.

#### 4.7 Design token export (CSS variables / Tailwind config)
**Gap:** Element Armory has no full-page design system extraction.  
**Opportunity:** MiroMiro's token generator is its strongest differentiator for designers — it turns any site into a working design system file. This is genuinely novel.  
**Proposal:** Build a "Design Tokens" export panel. Scan the page for color palette, font stack, spacing values, radius values, and shadow definitions. Output as a downloadable `tokens.css` (CSS custom properties). A Tailwind config export can follow as a v2.

---

### Priority 3 — UX and Conversion Improvements

#### 4.8 Usage ring / visual limit meter
**Gap:** Element Armory shows a basic usage meter text count.  
**Opportunity:** MiroMiro's circular progress indicator with color-coded warning states (75%, 100%) creates persistent but non-intrusive awareness of limits.  
**Proposal:** Replace the text usage meter with a compact ring component. Color: neutral → amber at 80% → red at 100%. Show remaining count in the center. This makes limit state more visceral without being aggressive.

#### 4.9 Feature value grid on auth gate
**Gap:** The sign-in gate currently has minimal framing of what users unlock.  
**Opportunity:** MiroMiro shows a 6-card feature grid before sign-in, establishing product value clearly before asking for commitment.  
**Proposal:** Update the auth gate to show a concise feature grid (4–6 cards): Capture Elements, Copy HTML, AI Prompts, MCP Integration, Library, Folder Organization. Each card: icon + 1-line description. Position the sign-in CTA below.

#### 4.10 Post-capture success nudges
**Gap:** After a successful capture, Element Armory returns to a neutral state.  
**Opportunity:** MiroMiro uses the "aha moment" — immediately after a successful export — to surface an upgrade prompt. This is the highest-intent moment.  
**Proposal:** After a capture, if the user is on the Free tier and within 3 of their monthly limit, show a contextual upgrade nudge inline (not a modal): "X captures left this month. Upgrade for unlimited."

#### 4.11 Monthly limit reset (positioning improvement)
**Gap:** We already have monthly resets on Free — this is actually better than MiroMiro's permanent limits.  
**Opportunity:** We should communicate this clearly on pricing and in-extension.  
**Proposal:** Add explicit "Resets monthly" language to the usage meter tooltip and the upgrade modal feature comparison. This is a genuine competitive advantage over MiroMiro's approach.

---

### Priority 4 — Longer-Horizon Differentiation

#### 4.12 Responsive breakpoint inspection
**Gap:** Neither extension does this well.  
**Opportunity:** Detecting which media query rules apply to an element at current viewport width is a hard problem MiroMiro skipped.  
**Proposal:** When inspecting an element, surface which `@media` rules from the page's stylesheets are currently active and match the element. Show breakpoint label and the rules they contribute.

#### 4.13 Canvas element capture
**Gap:** Element Armory has no canvas support.  
**Opportunity:** MiroMiro supports canvas snapshots and short video recordings — used for capturing charts and animations.  
**Proposal:** Detect canvas elements during capture. Offer `canvas.toDataURL()` as a PNG export option. Video recording (via `MediaRecorder`) is a stretch goal.

#### 4.14 Lottie / animation asset export
**Gap:** Element Armory doesn't detect or export Lottie animations.  
**Opportunity:** MiroMiro detects `lottie-player`, `dotlottie-player`, and runtime instances (`element.__lottie`, `element.lottie`) and exports the JSON source.  
**Proposal:** During capture, detect known Lottie DOM attributes and attempt to extract animation JSON. Offer as a downloadable asset in the snippet editor.

---

## 5. Features to Avoid or Approach Differently

| MiroMiro feature | Our verdict |
|---|---|
| 24-hour trial countdown + "Keep Pro" banner | Too aggressive. Our monthly reset model is friendlier and more sustainable. Don't copy this. |
| Per-feature separate limits (5 contrast, 3 design system, etc.) | Creates cognitive fragmentation and multiple paywall surfaces. Our unified capture count is cleaner. |
| Binary Free/Pro pricing only | Risky. Consider whether a team tier makes sense for us before committing to two-tier only. |
| Algorithm-based "AI" naming | Don't market heuristics as AI. If we build design token naming, be honest about what it is. |

---

## 6. Summary Table

| Feature | MiroMiro | Element Armory | Action |
|---|---|---|---|
| Hover inspect mode | ✓ | ✓ | Parity |
| Pseudo-element export | ✓ | Partial | 4.1 |
| Font embedding | ✓ | ✗ | 4.2 |
| Interactive state export | ✓ | ✗ | 4.3 |
| WCAG contrast checker | ✓ | ✗ | 4.4 |
| Color format switcher | ✓ | ✗ | 4.5 |
| Full-page color palette | ✓ | ✗ | 4.6 |
| Design token export | ✓ | ✗ | 4.7 |
| Visual usage ring | ✓ | ✗ | 4.8 |
| Auth gate feature grid | ✓ | Partial | 4.9 |
| Post-capture upgrade nudge | ✓ | ✗ | 4.10 |
| Monthly limit reset | ✗ | ✓ | Communicate better (4.11) |
| AI prompt generation | ✗ | ✓ | Our differentiator |
| MCP integration | ✗ | ✓ | Our differentiator |
| Folder organization | ✗ | ✓ | Our differentiator |
| Canvas capture | ✓ | ✗ | 4.13 (longer term) |
| Lottie export | ✓ | ✗ | 4.14 (longer term) |
| Responsive breakpoint inspection | ✗ | ✗ | 4.12 (greenfield opportunity) |
| Design file export (Figma) | ✗ | ✗ | Out of scope |
