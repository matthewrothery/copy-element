Below is a **detailed PRD you can drop directly into a `.md` file** for your developers and AI agents.

I structured it so it works well for:

* **human developers**
* **AI agents (Cursor, Claude Code, etc.)**
* **task planning**

It includes **architecture, UX flows, data models, and MCP integration**, which is the most unique part of your idea.

---

# Element Capture Extension

## Product Requirements Document (PRD)

Version: 1.0
Status: Draft
Target Platform: Chrome Extension (MV3)
Stack: **TypeScript, Node.js, React, Less or standard CSS**

---

# 1. Overview

This project is a **Chrome extension that allows developers to visually capture elements from any website and save them as reusable UI snippets**.

The extension enables users to:

1. Select an element visually (like Chrome DevTools).
2. Capture the **HTML + computed styles**.
3. Convert styles to **inline styles**.
4. Replace images/assets with **placeholder blocks**.
5. Save the snippet into a **library inside the extension**.
6. Export snippets to **HTML, JSX, or code editors**.
7. Access saved snippets via an **MCP server for AI development tools** (e.g. Cursor).

The goal is to provide a **clean, reproducible snapshot of UI elements** that can be reused in development workflows or AI-assisted coding.

---

# 2. Goals

### Primary Goals

* Build the **best element extraction extension on Chrome Store**
* Achieve **> 4.5 star rating**
* Provide **clean UI snippets ready for copy/paste**
* Integrate with **AI coding workflows via MCP**

---

### Success Metrics

| Metric                    | Target |
| ------------------------- | ------ |
| Chrome Store Rating       | > 4.5  |
| First 3 months installs   | 5k+    |
| Snippet save success rate | > 95%  |
| Export success rate       | > 98%  |

---

# 3. Competitive Landscape

## DivMagic

Features:

* Element picker
* Extract HTML + CSS
* Convert to React/Tailwind
* One-click copy

Weaknesses:

* Chrome store rating **3.3**
* CSS extraction sometimes messy
* No snippet library
* No AI integrations

---

## SnipCSS

Features:

* Extract HTML + CSS
* Handles responsive styles
* Exports to snippet

Weaknesses:

* Chrome store rating **3.9**
* Requires devtools workflow
* No visual snippet library
* No reusable component storage

---

# Opportunity

Combine the **best features of both tools** and improve:

| Feature              | DivMagic | SnipCSS | This Product |
| -------------------- | -------- | ------- | ------------ |
| Element picker       | ✓        | ✓       | ✓            |
| Clean CSS export     | partial  | ✓       | ✓            |
| Inline styles        | ✗        | ✗       | ✓            |
| Snippet library      | ✗        | ✗       | ✓            |
| Preview thumbnails   | ✗        | ✗       | ✓            |
| AI integration (MCP) | ✗        | ✗       | ✓            |

---

# 4. Key Features

## 4.1 Visual Element Picker

Users can activate **capture mode**.

Interaction:

1. User clicks extension icon
2. Clicks **Capture Element**
3. Hovering highlights DOM nodes
4. Clicking selects element

### Highlight UI

Display overlay:

```
┌───────────────────────┐
│ element outline       │
│                       │
└───────────────────────┘
```

Overlay styling:

* blue border
* semi-transparent background
* margin indicator

---

## 4.2 Capture Preview

After selection, show preview modal.

Preview includes:

```
Captured Element

[ rendered preview ]

Tag: div.hero
Size: 320x180
Children: 5 nodes

[ Save ]
[ Cancel ]
```

---

## 4.3 Style Extraction

We extract:

* HTML
* computed CSS

Use:

```
getComputedStyle(element)
```

Process:

```
DOM element
↓
cloneNode(true)
↓
walk tree
↓
convert computed styles → inline
```

Output example:

```html
<div style="display:flex;gap:8px;padding:16px;background:#fff">
```

---

## 4.4 Asset Replacement

Images should be replaced to ensure portability.

Replace:

```
<img src="...">
```

with:

```
<div style="width:300px;height:200px;background:#ddd"></div>
```

Also detect:

* background-image
* svg
* video

---

## 4.5 Snippet Library

Extension includes a **local component library**.

Display:

```
Saved Elements

[ Preview ] Card UI
[ Preview ] Button
[ Preview ] Navbar
```

Each item includes:

* mini screenshot
* title
* source domain
* date saved

---

## 4.6 Mini Screenshot Capture

We capture a **thumbnail of the element**.

Possible methods:

Option A (preferred):

```
html2canvas
```

Option B:

Chrome tab capture API.

Thumbnail size:

```
200x120
```

Stored as:

```
base64 PNG
```

---

# 5. Library UI

The extension popup opens a **React UI panel**.

Sections:

```
Capture
Library
Settings
```

---

### Library Layout

Grid:

```
[Thumbnail]
Title
example.com
```

Actions:

```
Copy HTML
Copy JSX
Delete
Open
```

---

# 6. Export Formats

Supported exports:

### HTML

```
<div style="...">
```

---

### JSX

```
<div style={{ display:"flex" }}>
```

---

### Clean HTML

Optional mode removes:

```
data attributes
tracking scripts
```

---

# 7. MCP Server Integration

This is a **major differentiator**.

The extension will expose snippets to AI tools via **Model Context Protocol (MCP)**.

---

## Purpose

Allows AI tools like **Cursor** to reference saved UI components.

Example:

```
@element-library/button-123
```

Cursor can then fetch:

```
HTML
thumbnail
metadata
```

---

## MCP Server

Local Node server.

```
localhost:PORT
```

Endpoints:

### List snippets

```
GET /snippets
```

Response:

```
[
  {
    id: "btn_123",
    title: "Primary Button",
    url: "example.com",
    createdAt: "...",
    thumbnail: "..."
  }
]
```

---

### Get snippet

```
GET /snippets/:id
```

Response:

```
{
  id,
  html,
  jsx,
  metadata
}
```

---

## MCP Tool

Expose tool:

```
get_element_snippet
```

Example usage in Cursor:

```
Use snippet btn_123
```

---

# 8. Data Model

Snippet:

```
{
 id: string
 title: string
 sourceUrl: string
 html: string
 jsx: string
 thumbnail: string
 createdAt: number
 width: number
 height: number
}
```

Storage:

```
chrome.storage.local
```

---

# 9. Architecture

## Chrome Extension

Manifest V3.

Components:

```
background
content script
popup UI
capture overlay
```

---

## Content Script

Responsibilities:

* element picker
* DOM traversal
* style extraction

---

## React Popup

Responsibilities:

* snippet library
* preview
* export

---

## MCP Server

Node.js server.

Responsibilities:

* expose snippets
* serve metadata
* integrate with AI tools

---

# 10. Tech Stack

Frontend:

```
React
TypeScript
Less or CSS
Vite
```

Extension APIs:

```
chrome.storage
chrome.tabs
```

Libraries:

```
html2canvas
uuid
```

---

# 11. UX Flow

### Capture Flow

```
click extension
↓
click capture
↓
hover highlight
↓
click element
↓
preview modal
↓
save snippet
```

---

### Library Flow

```
open extension
↓
view saved snippets
↓
click snippet
↓
copy/export
```

---

# 12. Performance Requirements

Capture must complete in:

```
< 500ms
```

Library load:

```
< 200ms
```

---

# 13. Security

Avoid capturing:

```
input values
password fields
scripts
tracking pixels
```

---

# 14. Quality Requirements

We must beat existing tools.

To achieve **>4.5 rating**:

Focus on:

* clean UI
* fast capture
* accurate styles
* reliable export

---

# 15. Future Features

Potential upgrades:

### Tailwind converter

Convert inline styles → Tailwind.

---

### React component generation

```
function Card() {
  return (...)
}
```

---

### Cloud library

Sync snippets across devices.

---

### Figma export

Export captured UI.

---

# 16. Developer Tasks

## Core Capture

* implement element picker
* highlight overlay
* click selection

---

## DOM Extraction

* clone node
* walk tree
* extract computed styles

---

## Style Processing

* convert computed styles
* generate inline CSS
* remove unsupported styles

---

## Asset Replacement

* detect img/svg/video
* convert to placeholders

---

## Thumbnail Capture

* implement html2canvas
* crop element

---

## Library

* create snippet storage
* implement React UI
* grid display

---

## Export

* HTML generator
* JSX generator

---

## MCP Server

* create Node server
* implement endpoints
* integrate snippet store

---

# 17. MVP Milestones

Phase 1:

```
element picker
html extraction
inline styles
save snippet
```

Phase 2:

```
thumbnail capture
library UI
copy export
```

Phase 3:

```
MCP server
AI integrations
```

---

# 18. Short Developer Todo

### Extension

* setup MV3 extension
* create content script
* build capture overlay
* implement DOM cloning
* build style inline converter

---

### UI

* React popup
* snippet library
* thumbnail grid

---

### MCP

* Node server
* snippet endpoints
* Cursor tool config

---

# 19. Long-Term Vision

Create the **best UI capture tool for developers and AI coding workflows**.

This tool should become the standard workflow for:

* copying UI
* building design systems
* AI-assisted coding
* rapid prototyping

---

If you'd like, I can also generate a **second document that is even more useful for AI agents**:

**`ARCHITECTURE.md`**

It would include:

* folder structure
* APIs
* algorithms for style extraction
* DOM traversal rules

That will make **Cursor + AI dev agents build this much faster.**



# Recommended Repo Structure

element-capture-extension

extension
  background
  content
  overlay
  popup

mcp-server
  src
  routes
  tools

shared
  types
  utils

.cursor
  rules
