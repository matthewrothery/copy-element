## v1.1.0 - April 17, 2026

### Added
- Website install buttons now take you directly to the Chrome Web Store listing
- Capture limits are now clearer and more consistent across account tiers

### Changed
- Improved mobile website layout and readability
- Updated onboarding and in-product guidance to help new users get started faster
- Refreshed privacy and account-related messaging for better clarity
- Account and billing access from the extension is now easier

### Fixed
- Improved reliability when restoring previously captured elements
- Clearer warnings when a page cannot be captured successfully
- Minor extension stability and security improvements

---

## v1.0.0 - April 5, 2026

### Added
- Google sign-in: create an account and log in directly from the extension popup
- Cross-device library sync: captures are saved to your account and available on every device
- Free and Pro plan limits: guest users get up to 10 saves; free accounts up to 25; paid accounts are unlimited
- MCP server production-ready: connect Element Armory to Claude, Cursor, and compatible AI editors with a stable, deployed endpoint and configurable default model
- Scroll-to-capture: the extension automatically scrolls to off-screen or sticky elements before capturing, so animated and positioned elements render at their natural state
- Improved element preview: split editor view with more accurate visual rendering alongside the HTML output

### Changed
- Signing in on the website now automatically signs you in to the extension — no separate login step required
- Snippet library sort order persists between sessions and respects capture order
- Uninstall page collects an optional reason to help improve the product

### Fixed
- Style capture regression resolved: computed styles are now reliably extracted across all element types
- MCP output delivery: the copy command consistently delivers content to the connected AI client

---

## v0.1.1 - March 26, 2026

### Fixed
- Clipboard write now falls back gracefully on pages with strict Content Security Policies
- Preview pane no longer collapses on narrow screen widths
- Capture of large elements with many descendants no longer times out on slower machines

### Changed
- Element names in the library are derived from visible text, ARIA labels, and semantic tags for more readable snippet titles
- Footer links and layout refreshed

---

## v0.1.0 - March 20, 2026

### Added
- Multi-element capture: select and export multiple elements at once
- MCP server support: use Element Armory as a tool in AI-native editors and agents

### Fixed
- Capture no longer routes through CDP for elements that do not require theme or viewport emulation, restoring fast in-page extraction
- MCP copy command now reliably delivers output to the connected client

---

## v0.0.2 - March 10, 2026

### Fixed
- Overlay highlight flicker resolved when moving the cursor quickly between sibling elements
- Snippet thumbnail generation now works correctly for elements captured inside iframes
- HTML copy output no longer includes duplicate `@font-face` declarations

### Changed
- Capture confirmation step redesigned: preview, source URL, and save action are now vertically aligned for clarity

---

## v0.0.1 - March 5, 2026

### Fixed
- Storage write errors during capture now surface a visible in-popup error instead of silently failing
- Element picker no longer interferes with page scroll on sites using `overflow: hidden` on the body
- Popup renders correctly on Windows at 125% and 150% display scaling

---

## v0.0.0 - March 1, 2026

### Added
- Initial release of Element Armory
- One-click capture of any UI element on any webpage
- Export captured elements as clean, portable HTML with inlined styles
- Snippet library for saving and reusing captured elements
- Folder organisation for grouping snippets by project or theme
- Free and paid subscription plans
- Chrome extension with in-page element picker
