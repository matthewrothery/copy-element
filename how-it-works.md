# Element Armory – How It Works
## Product Reference Document

**Version:** 1.0  
**Last updated:** 2026-03-30  
**Purpose:** Reference for writing website copy, marketing pages, and product communications.

---

## Product Identity

**Full name:** Element Armory – Capture UI Elements  
**Short name:** Element Armory  
**Tagline:** Capture UI from any site and rebuild it with AI.  
**Supporting line:** Clean. Clear. Powerful.

**What it is in one sentence:**  
A Chrome extension that lets developers click any element on any website and instantly get clean, portable HTML and CSS snippets — with AI integration built in.

**Who it is for:**  
Developers who build UI. Specifically those who use AI coding tools (Cursor, Claude Code, etc.) and want to reference or replicate real-world UI patterns without manually inspecting DevTools, rewriting styles, or guessing at layout. They want to be able to copy the HTML and CSS snippets and paste them into their codebase or AI tool of choice.

---

## The Problem It Solves

Developers frequently encounter UI patterns on websites they want to replicate or use as reference. The current workflow is painful:

1. Open DevTools
2. Hunt through the DOM for the right element
3. Copy HTML manually
4. Try to extract relevant CSS from layers of inherited rules, framework overrides, and noise
5. Clean it up to make it portable
6. Paste it into an AI tool — which still has to guess at what you actually want

Element Armory collapses all of that into a single click.

**Core insight:** The UI you want to build is already built somewhere. The tool's job is to get it out of the browser and into your hands — clean, portable, and ready for your AI editor.

---

## The Three-Step Workflow

### Step 1 — Click to Capture

The user opens the extension on any website, hovers over an element, and clicks. That's the entire capture interaction.

Under the hood, the extension:
- Activates a visual element picker that highlights DOM nodes on hover
- Extracts the element's HTML structure on click
- Walks the page's stylesheets and collects only the CSS rules that apply to the captured element and its children
- Strips scripts, tracking pixels, event handlers, and anything non-visual
- Saves the result as a portable snippet

The element picker uses a blue overlay (`2px solid #3b82f6`, `rgba(59,130,246,0.08)` fill) that moves with the cursor and highlights exactly what will be captured. A tooltip shows the element selector and dimensions.

**What gets extracted:**  
Display, layout (flex, grid), spacing (margin, padding), typography, color, background, borders, box-shadow. Only what is visually meaningful.

**What gets stripped:**  
Browser default values, transitions, animations, pointer events, scripts, trackers, framework-specific attributes, external image URLs (replaced with placeholder blocks).

---

### Step 2 — Copy or Save

After capture, the user has several immediate options from the popup or the snippet editor:

**Copy HTML** — Clean markup with scoped styles. Works in any project, any framework. Paste directly into a page.

**Copy AI Prompt** — A pre-built prompt that includes the element's HTML, styles, and a clear instruction to rebuild it. Paste into any AI chat tool (ChatGPT, Claude, etc.) and get accurate output immediately.

**Copy Advanced Prompt** *(paid)* — A codebase-aware version of the AI prompt that instructs the AI to adapt the captured element to match the existing codebase, swap external resources for local ones, and follow project conventions.

**Copy MCP** *(paid)* — Copies a formatted prompt for use with the MCP server integration. When the MCP server is running and connected to Cursor or Claude Code, the captured element is available directly as context in the editor without any manual paste.

**Save to Library** — Saves the snippet to the user's personal library for later use.

---

### Step 3 — Rebuild with AI

The captured output is designed to be immediately useful inside AI coding tools.

Two pathways:

**Manual paste:** Copy the AI prompt or code directly. Paste into Cursor, Claude, ChatGPT, or any AI tool. The output already contains the structure, styles, and a clear instruction — the AI has everything it needs.

**MCP server:** Connect the Element Armory MCP server over HTTPS (Cursor, Claude Code, Codex, or any HTTP MCP client) using an API token from the extension. The server exposes tools to list and fetch captures, build prompts, clean and analyze markup, map external assets, and run AI conversion to a target framework — no manual paste required for those flows.

---

## Feature Breakdown

### Visual Element Picker

Activated when the user clicks "Capture Element" in the extension popup.

- Overlay highlights DOM nodes on hover with a blue border + fill
- Tooltip shows element tag/selector and pixel dimensions
- Click selects the element and begins extraction
- ESC or clicking outside cancels capture mode
- Non-intrusive: does not block interaction with the page

---

### CSS Extraction

This is the core technical differentiator.

Rather than reading `getComputedStyle()` and inlining everything (which produces bloated, unreadable output), Element Armory walks the page's actual stylesheets and extracts only the rules that match the captured element tree.

This produces:
- Smaller output (only relevant rules, not every computed property)
- More readable output (class-based styles, not inline blobs)
- Better AI compatibility (AI tools understand class-based CSS better than inline-style dumps)

Supports: `@font-face`, `@media` queries, pseudo-elements (`::before`, `::after`), CSS variables.

Does not capture: cross-origin stylesheets (CORS limitation), JavaScript-applied inline styles beyond the whitelist.

**CSS property whitelist (what we extract):**

| Category | Properties |
|---|---|
| Layout | `display`, `position`, `float`, `clear`, `top`, `right`, `bottom`, `left`, `z-index` |
| Box model | `width`, `height`, `min/max-width/height`, `margin`, `padding`, `box-shadow`, `box-sizing` |
| Flexbox | `flex-direction`, `flex-grow`, `flex-shrink`, `flex-basis`, `justify-content`, `align-items` |
| Grid | `grid-template-*`, `grid-column`, `grid-row`, `gap` |
| Borders | `border`, `border-radius` (all variants) |
| Typography | `font`, `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `text-align`, `text-decoration`, `text-transform` |
| Background | `background`, `background-color`, `background-image`, `background-position`, `background-size` |
| Other | `color`, `opacity`, `visibility`, `overflow`, `white-space` |

**What is stripped:**  
`transition`, `animation`, `cursor`, `pointer-events`, browser default values.

---

### Snippet Library

The user's personal library of saved captures. Accessible from the extension popup at any time, including offline.

Each snippet stores:
- Visual thumbnail (screenshot of the captured element)
- Title (editable)
- Source URL / domain
- Date saved
- HTML output
- CSS style block

**Library views:** Grid layout in the popup (two columns, thumbnails), full editor view for detailed inspection and code editing.

**Actions per snippet:** Copy HTML, Copy AI Prompt, Copy Advanced Prompt (paid), Copy MCP (paid), Delete, Preview, Share link.

**Share links:** Any snippet can be shared via a public URL. The recipient can view and copy the element without installing the extension or creating an account.

---

### Output Formats

| Format | Description | Who gets it |
|---|---|---|
| HTML | Clean markup with scoped CSS | All users |
| AI Prompt (basic) | Pre-built prompt with HTML + styles | Free + Paid |
| AI Prompt (advanced) | Codebase-aware prompt for AI editors | Paid only |
| MCP | Prompt formatted for MCP server context | Paid only |

---

### MCP Server Integration

The MCP server is a hosted HTTPS endpoint that exposes the signed-in user’s capture library to MCP-compatible AI editors and agents.

**Setup:** Generate an MCP API token in the extension (MCP page), then register the server URL with the `ELEMENT_ARMORY_API_KEY` header in your client (for example Cursor `mcp.json`, Claude Code `claude mcp add`, or Codex config). Typically under two minutes.

**How it works:**
1. User adds the Element Armory MCP endpoint and API key to their AI tool
2. The client connects to the server over HTTP (Streamable HTTP / MCP as supported by the client)
3. Captures become callable MCP tools — list, fetch, prompt, transform, and convert without copy-paste

**MCP tools exposed:**

**Captures**
- `listCaptures` — Recent captures with metadata (id, source URL, captured time); optional pagination (`limit` up to 50)
- `getCaptureById` — Full HTML and CSS for a capture by id
- `getLatestCapture` — Full HTML and CSS for the most recent capture

**Prompts**
- `getBasicPrompt` — Formatted chat prompt including HTML and CSS (optional capture id; defaults to latest)
- `getAdvancedPrompt` — Enhanced prompt with structure and resource context *(Pro)*

**Transform**
- `cleanCapture` — Strip scripts, event handlers, and tracking-oriented attributes; optional raw HTML/CSS instead of a stored capture
- `extractComponentStructure` — Hierarchical element tree from HTML for layout understanding
- `mapExternalResources` — External images, fonts, and CDN references found in given HTML/CSS

**Convert**
- `convertCapture` — AI conversion to a chosen framework (e.g. React, Vue, Svelte, Solid, Alpine, Astro, Lit, Preact) and styling mode (Tailwind, CSS Modules, styled-components, inline). **Costs 5 MCP quota units** per invocation.

**Use case:** Developer captures a hero from a reference site, connects MCP in Cursor, and asks the model to rebuild it for their stack — the model can list or fetch the capture, sanitize it, inspect assets, and call `convertCapture` without the developer pasting HTML by hand.

---

### Cross-Device Sync

Snippet libraries sync to the user's account via the Element Armory server. Capture on one machine, access on another.

Available on Free and Paid tiers. Guest users (no account) get local-only storage with a 10-snippet FIFO limit.

---

## Account Tiers

| Feature | Guest (no account) | Free | Paid |
|---|---|---|---|
| Capture elements | ✓ | ✓ | ✓ |
| Copy HTML | ✓ | ✓ | ✓ |
| Copy AI Prompt (basic) | ✗ | ✓ | ✓ |
| Copy AI Prompt (advanced) | ✗ | ✗ | ✓ |
| Copy MCP | ✗ | ✗ | ✓ |
| Library size | 10 (FIFO) | 25 (FIFO) | Unlimited |
| Monthly captures | — | 20 soft limit | Unlimited |
| MCP requests/month | — | 10 | Unlimited |
| Cross-device sync | ✗ | ✓ | ✓ |
| Share links | ✓ | ✓ | ✓ |

**Guest:** Extension installed, no account. Limited to 10 locally stored snippets. Copy actions produce HTML only. AI prompt shows a sign-in prompt.

**Free (signed in):** 25 snippets, 20 captures/month, 10 MCP requests/month. JSX, Tailwind, and basic AI prompt available. Advanced prompt and MCP copy show upgrade prompts.

**Paid:** Unlimited everything. Full access to advanced prompts and MCP copy.

---

## Technical Constraints (Useful for Copy Accuracy)

- **Works on:** Any publicly accessible website. Does not require source code or API access.
- **Does not capture:** JavaScript behavior, event handlers, runtime logic. Visual structure and styles only.
- **No dependency on source site:** Once captured, a snippet is completely independent. The original site can change or go down — the snippet is unaffected.
- **No cleanup required:** Output is designed to paste directly into any project without reformatting.
- **Framework neutral:** HTML and JSX both work with any framework. Next.js, Remix, SvelteKit, plain React, or static HTML.
- **Performance target:** Capture completes in under 500ms. Library loads in under 200ms.

---

## Competitive Position

Primary competitors: DivMagic (3.3 Chrome rating), SnipCSS (3.9 Chrome rating), CSS Scan, CopyCSS.

**Where Element Armory wins:**

| Capability | DivMagic | SnipCSS | Element Armory |
|---|---|---|---|
| Clean, minimal CSS output | Partial | Partial | ✓ |
| Snippet library | ✗ | ✗ | ✓ |
| AI prompt generation | ✗ | ✗ | ✓ |
| MCP server integration | ✗ | ✗ | ✓ |
| Cross-device sync | ✗ | ✗ | ✓ |
| Share links | ✗ | ✗ | ✓ |
| No DevTools required | Partial | ✗ | ✓ |

The main differentiation story: competitors stop at CSS extraction. Element Armory extends the capture into the AI development workflow — prompts, MCP, library, sync.

---

## Key Messages (for Copy Use)

**Primary message:**  
The UI you want is already built. Element Armory gets it out of the browser and into your AI editor in one click.

**Secondary messages:**
- No DevTools. No copy-paste archaeology. Click the element, get the code.
- Clean output that drops straight into your project. No cleanup, no reformatting.
- Save the good ones. Build a library. Access them anytime, even offline.
- Your AI editor already knows what to build — it just needs the context.
- Works on any site. No source code access required.
- Free to start. No sign-up required to capture.

**Tone:**  
Developer-focused. Specific. Confident without hype. Technical but clear. Never uses "amazing", "revolutionary", or generic marketing phrases. Speaks to the friction developers actually feel — not abstract problems.

---

## Primary CTAs

| Surface | Label |
|---|---|
| Header, Hero, Footer top | `Add to Chrome - It's Free` (with "Free" bold) |
| Product page / feature deep-dive | `Add to Chrome` |
| Pricing / upgrade | `Upgrade to Pro` |
| Post-capture upgrade nudge | `Unlock advanced prompts` |
| MCP feature gate | `Upgrade to use MCP` |

Use `website/components/ChromeStoreCtaLabel` for all Chrome CTA instances on the website.

---

## Pages and Content Structure Reference

### Homepage (`/`)
Sections: Hero → Element showcase (real captures) → Snippet library → Pipeline diagram → How it works (3 steps) → Your library → Output formats grid → Clean output feature section → Pricing CTA → FAQ

### Product page (`/product`)
Sections: Hero → Element showcase → Capture feature section → Pipeline diagram → Snippet library showcase → Library feature section → AI integration section → Output format grid → CTA block → FAQ

### Pricing page (`/pricing`)
Tier comparison: Guest vs Free vs Paid.

### Compare pages (`/compare/*`)
- Element Armory vs DivMagic
- Element Armory vs SnipCSS
- Element Armory vs CSS Scan
- Element Armory vs CopyCSS
