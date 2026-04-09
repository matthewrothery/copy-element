# Element Armory – Chrome Web Store Listing

---

## Store Description

### Extended Description (500-700 chars)

Element Armory helps developers capture real UI from any website and turn it into reusable building blocks for AI-assisted development. Hover over an element, save its HTML structure and computed styles, and keep it in a snippet library you can revisit anytime. Copy clean HTML, generate an AI-ready prompt, and sync your library across devices when signed in. Use captured snippets as precise visual references when rebuilding components in your editor. Instead of reverse-engineering layouts by hand, you get a practical reference you can reuse, adapt, and rebuild faster.

---

### Full Description

Capture UI from any site and rebuild it with AI.

Element Armory helps you go from seeing a great interface to rebuilding it faster. When you find a button, card, form, pricing block, navigation pattern, or layout you want to learn from, you can capture the real structure and styling instead of trying to recreate it from memory.

Open the extension, point at any element on the page, and save it in seconds. Element Armory extracts the HTML structure and computed styles, then turns that capture into a reusable snippet you can keep in your library, revisit later, and use as a high-quality reference while you build.

The benefit is simple: less guesswork, less time in DevTools, and less manual CSS archaeology. Instead of inspecting layers of markup, copying fragments by hand, and trying to remember spacing, typography, and layout decisions, you get a practical reference you can actually work from.

This is especially useful when building with AI. You can copy clean HTML or generate a structured prompt based on the captured element, then paste it into your AI coding tool with much better visual and structural context. That leads to clearer prompts, better outputs, and fewer correction loops.

Your snippet library stays accessible from both the popup and the full-page library view, so the UI patterns you want to reuse do not disappear into screenshots, bookmarks, or scattered notes. You build a working library of references you can return to whenever you need inspiration, consistency, or a starting point.

If you sign in, you can sync your snippet library across devices and keep your captures available wherever you work. Paid plan users get unlimited cloud storage, while free plan users get a generous local library for everyday use.

Element Armory also connects to AI coding environments through MCP, which makes your captured snippets available as usable context inside tools like Cursor or Claude Code. Instead of describing a component vaguely, you can give your editor a real captured reference to work from.

Element Armory is built for developers who want to move faster without sacrificing fidelity. Capture what you see, save what matters, and rebuild with more speed, confidence, and precision.

---

## Single Purpose Statement

Element Armory has a single purpose: to capture styled HTML elements from web pages and save them as reusable snippets that developers can reference when building UI.

---

## Remote Code

**Element Armory does not execute remote code.**

All extension logic is bundled at build time. The extension communicates with the Element Armory server API (`elementarmory.com`) only to sync snippets to the user's cloud library and to authenticate the user's account. No JavaScript or executable code is fetched from a remote source and run inside the extension.

---

## Permission Justifications

### `activeTab`
Used to interact with the page the user is actively viewing when they open the extension and start a capture. `activeTab` gives temporary access to that one tab so the extension can start the capture flow, message the content script, and generate a thumbnail from the visible area after the user selects an element. The permission is not used for background browsing access or passive monitoring of other tabs.

**Status: required**

### `tabs`
Used for a small set of tab-management actions that are visible to the user. The extension queries tabs to identify the active tab in the current window, opens a new tab when the user chooses to view the full library, and closes the temporary auth callback tab once sign-in is complete. It is not used to read browsing history or inspect the contents of unrelated tabs.

**Status: required**

### `storage`
Used to persist the user's local snippet library and extension state in `chrome.storage.local`. This includes captured snippets, folder organization, auth/session state, onboarding flags, and user preferences so the extension continues working across browser restarts. Local storage is also required so users can keep and access captures even before signing in or when temporarily offline.

**Status: required**

### `unlimitedStorage`
Captured snippets can contain full HTML, extracted CSS, metadata, and optional thumbnail images. That data grows quickly for users who capture many elements, and Chrome's default extension storage quota is too small for a practical snippet library. `unlimitedStorage` prevents save failures caused by quota exhaustion and lets the extension reliably fulfill its core purpose of building a reusable local library.

**Status: required**

### `scripting`
Used to programmatically inject or activate capture logic in the current page when the user starts a capture. The extension uses `chrome.scripting` to run the page-side code that shows the hover overlay, lets the user select an element, and returns the capture result back to the extension UI. This permission is necessary because capture is user-triggered on arbitrary sites rather than limited to a fixed set of domains.

**Status: required**

### `clipboardWrite`
Used only when the user explicitly clicks a copy action inside the extension. It writes the generated HTML or AI-ready prompt text to the system clipboard so the user can paste it into their code editor or AI tool. The extension does not read clipboard contents and does not write to the clipboard without a direct user action.

**Status: required**

### `debugger`
Used to attach the Chrome DevTools Protocol (CDP) to the active tab during a capture so the extension can inspect stylesheet rules that are otherwise inaccessible from standard page scripts. Many modern sites load styles from cross-origin CSS files, and browser security rules prevent the content script from reading those rules directly. Without this permission, captures from a large number of production websites would lose critical styling fidelity. The debugger session is started only for the active capture, scoped to the selected page, and detached immediately after the required CSS data is collected.

**Status: required**

> Note: This permission causes Chrome to display an "Element Armory is debugging this browser" banner while a capture is in progress. This is expected behaviour.

### `webNavigation`
Used to enumerate frames inside the active tab with `webNavigation.getAllFrames`. This is required because many real-world UIs render inside embedded frames, and the extension needs to know which frames exist in order to inject the capture overlay and capture logic into the correct one. Without `webNavigation`, users would be unable to capture elements that appear inside iframes even when those elements are visibly part of the page they are working on.

**Status: required**

### `alarms`
Used to schedule a lightweight background timer for authentication maintenance. When a user is signed in, the extension refreshes its token before expiry so cloud sync continues to work without interrupting the user or requiring repeated sign-ins. This permission is not used for periodic page access, crawling, or analytics jobs.

**Status: required**

### Host permissions (`<all_urls>`)
Element Armory is intentionally domain-agnostic: the user can capture UI from any website they choose to inspect. Because the extension cannot know in advance which site the user will want to capture from, host permissions must allow the content script and capture overlay to run on arbitrary pages. The extension does not crawl the web, scrape pages in the background, or automatically extract content from every visited site. Page access is exercised only in direct support of a user-initiated capture flow or when the user opens the extension on the current page.

**Status: required**

---

## Data Usage Disclosures

### What user data is collected?

| Category | Collected | Notes |
|---|---|---|
| Personally identifiable information | **Yes** | Email address only, when the user creates an account or signs in. Used solely to identify the user's account and sync their snippet library. |
| Health information | **No** | — |
| Financial and payment information | **No** | Payments are processed by a third-party billing provider (Stripe). The extension itself never handles payment data. |
| Authentication information | **Yes** | A short-lived bearer token is stored in `chrome.storage.local` to authenticate API requests. This token is generated server-side and is not a password or credential entered by the user. |
| Personal communications | **No** | — |
| Location | **No** | — |
| Web history | **No** | The source URL of a captured element is stored as part of the snippet record, but only for that specific element the user explicitly captured. The extension does not track browsing history. |
| User activity | **No** | Anonymous install-level events (e.g. "element captured", "extension installed") are recorded for product analytics. These events are tied to an anonymous install ID, not to a user's identity. |
| Website content | **Yes** | The HTML and computed CSS of the specific element the user explicitly selects and captures. This is the core function of the extension. Content is stored locally and, if the user is signed in, synced to their account on the Element Armory server. |

---

### Certification

- [x] I do not sell or transfer user data to third parties, apart from approved use cases
- [x] I do not use or transfer user data for purposes unrelated to the extension's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes
