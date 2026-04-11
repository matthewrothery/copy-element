# Element Armory – Permission Justifications

This document justifies every permission declared in `extension/manifest.ts` and `extension/prod.manifest.ts`. Keep this file updated whenever permissions are added or removed.

---

## `activeTab`

**API unlocked:** `chrome.tabs` access to the currently active tab when the user invokes the extension (clicks the toolbar icon or triggers a keyboard shortcut).

**Justification:** Used for user-initiated actions on the current page, especially starting a capture from the active tab and capturing the visible area for snippet thumbnails. The extension only acts on the tab the user is actively working with when they invoke the product.

---

## `tabs`

**API unlocked:** `chrome.tabs.query`, `chrome.tabs.get`, tab messaging, and tab event listeners.

**Justification:** Used to query the currently active tab's URL and title (stored alongside each captured snippet as provenance data), to send messages between the background service worker and content scripts, and to detect when a tab's URL changes so the content script state can be reset between navigations.

---

## `storage`

**API unlocked:** `chrome.storage.local` and `chrome.storage.session`.

**Justification:** Persists the snippet library (captured HTML, computed CSS, thumbnails, metadata), folder structure, user settings, and authentication state across browser sessions. `chrome.storage.local` is used instead of `localStorage` because it is accessible from the service worker and content scripts simultaneously without cross-origin restrictions.

---

## `unlimitedStorage`

**API unlocked:** Removes the default 5 MB quota on `chrome.storage.local`.

**Justification:** Captured snippets include inlined base64 images, embedded fonts, resolved CSS custom properties, and full computed style declarations. Complex components — especially those with high-resolution imagery or many nested elements — can exceed 5 MB individually. `unlimitedStorage` ensures capture never silently fails or truncates data due to quota limits.

---

## `clipboardWrite`

**API unlocked:** `navigator.clipboard.writeText` (requires explicit permission in extensions).

**Justification:** Required for the "Copy HTML" action in the snippet library. When a user copies a captured snippet, the clean HTML output is written directly to the system clipboard so it can be pasted into a code editor or AI tool.

---

## `debugger`

**API unlocked:** Chrome DevTools Protocol (CDP) via `chrome.debugger.attach`, `chrome.debugger.sendCommand`.

**Justification:** The extension uses the CDP `CSS.getComputedStyleForNode` command to extract fully resolved computed styles for captured elements. This is the only reliable method for capturing styles that involve:
- CSS custom property inheritance across the shadow DOM boundary
- Pseudo-element styles (`::before`, `::after`)
- Styles applied by third-party stylesheets that are CORS-restricted and inaccessible to `getComputedStyle` in the content script context

Without `debugger`, captured snippets would be missing critical style information.

---

## `webNavigation`

**API unlocked:** `chrome.webNavigation.onCommitted`, `chrome.webNavigation.onCompleted`, and related navigation event listeners.

**Justification:** Used to detect both hard navigations and soft navigations (client-side routing in SPAs like React, Vue, Next.js). When a navigation is detected mid-capture, the element picker and overlay are cleanly removed and state is reset. Without this, a partially-initialised picker or stale capture state would persist across page transitions.

---

## `alarms`

**API unlocked:** `chrome.alarms.create`, `chrome.alarms.onAlarm`.

**Justification:** Manifest V3 service workers do not persist in memory — they are terminated after a period of inactivity. `alarms` is the sanctioned mechanism for scheduling recurring background work (periodic snippet sync with the server) that must survive service worker restarts. Using `alarms` avoids keepalive hacks such as `chrome.runtime.connect` pings or `setInterval` calls that Manifest V3 explicitly discourages.

---

## `host_permissions: <all_urls>`

**API unlocked:** Content script injection and fetch requests to any origin.

**Justification:** Element Armory must function on any website the user chooses to capture from. The product is inherently site-agnostic — the value proposition is that it works everywhere, not on a curated list of domains. Restricting host permissions to specific origins would make the core capture feature non-functional on the vast majority of sites. `<all_urls>` is the minimal scope that enables universal element capture.
