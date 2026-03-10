
```markdown
# Element Capture Extension – Architecture

This document describes the architecture for the Element Capture Chrome Extension and MCP server.

It is intended for developers and AI coding agents.

---

# System Overview

The system consists of two main parts:

1. Chrome Extension (UI + DOM capture)
2. MCP Server (AI integration)

Architecture diagram:

Browser
│
├── Content Script
│   ├── Element Picker
│   ├── Highlight Overlay
│   ├── Capture Confirmation Modal (in-page)
│   └── DOM Extraction
│
├── Extension UI (React)
│   ├── Capture Controls
│   ├── Snippet Library
│   └── Export Tools
│
└── Local Storage
    └── Snippets

Local MCP Server
│
└── Provides snippets to AI editors (Cursor)
```

---

# Chrome Extension Architecture

### Manifest Version

```
Manifest V3
```

---

## Extension Components

### Background Script

Responsibilities:

* open capture mode
* coordinate content scripts
* communicate with popup UI

---

### Content Script

Runs on all pages.

Responsibilities:

```
element highlighting
mouse tracking
element selection
DOM extraction
style computation
in-page capture confirmation modal (Save, Copy, Save & Capture another, Cancel)
```

---

### Popup UI

Built with:

```
React
TypeScript
```

Responsibilities:

```
display snippet library
preview snippets
export snippets
delete snippets
```

---

### Capture Overlay

Injected UI layer used during element selection.

Overlay must:

* highlight hovered elements
* show bounding box
* avoid blocking pointer events

---

# DOM Capture Pipeline

The capture process follows these steps:

```
User click
↓
Detect target element
↓
Clone DOM subtree
↓
Traverse tree
↓
Extract computed styles
↓
Convert styles to inline
↓
Replace external assets
↓
Serialize HTML
```

---

# DOM Traversal Algorithm

Pseudo code:

```
function processNode(node):
    clone = node.cloneNode(false)

    styles = getComputedStyle(node)

    clone.style = serialize(styles)

    for child in node.children:
        clone.append(processNode(child))

    return clone
```

---

# Style Extraction Rules

Only extract visual styles.

Avoid:

```
animation
transition
cursor
pointer-events
user-select
```

Prefer:

```
layout styles
typography
color
spacing
```

---

# Image Replacement Rules

Replace:

```
img
video
svg
canvas
```

With placeholder elements.

Example:

```
<div
 style="
 width:300px;
 height:200px;
 background:#ddd;
 ">
</div>
```

---

# Thumbnail Capture

Preferred approach:

```
html2canvas
```

Steps:

```
render element
crop bounding box
scale to 200px width
store base64
```

---

# Snippet Storage

Snippets stored locally using:

```
chrome.storage.local
```

Structure:

```
{
 id,
 title,
 html,
 jsx,
 thumbnail,
 sourceUrl,
 createdAt
}
```

---

# React UI Architecture

Component structure:

```
App
├── CaptureButton
├── SnippetLibrary
│   ├── SnippetCard
│   └── SnippetPreview
└── ExportPanel
```

---

# MCP Server Architecture

The MCP server exposes snippet data to AI tools.

Runs locally:

```
localhost:3030
```

---

## API Endpoints

List snippets:

```
GET /snippets
```

Fetch snippet:

```
GET /snippets/:id
```

---

# MCP Tools

Expose tools:

```
get_snippet
list_snippets
```

AI editors can request snippet HTML for code generation.

---

# Performance Targets

Capture latency:

```
<500ms
```

Snippet library load:

```
<200ms
```

---

# Security Rules

Never capture:

```
input values
password fields
script tags
tracking pixels
```

---

# Future Architecture Extensions

Possible additions:

```
cloud sync
team libraries
AI-generated component conversion
```

````

---

# MVP Implementation Snapshot (v0.1.0)

The current implementation follows the architecture in this document and includes:

- MV3 extension scaffold with Vite + CRXJS.
- Content script picker + capture overlay + in-page capture confirmation modal.
- DOM clone pipeline that inlines visual styles and replaces media assets with placeholders.
- In-page modal on element click: Save to library, Copy (HTML/JSX toggle), Save & Capture another, Cancel.
- Popup React library UI with capture action, snippet cards, preview modal, copy/delete actions, and toast feedback.
- Local snippet persistence via `chrome.storage.local`.
- Background-script message routing between popup and content script.
- Unit tests using Vitest + React Testing Library across capture utilities, storage, and popup components.