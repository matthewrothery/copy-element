Below is a **practical implementation roadmap** to build a **high-performance Figma plugin for Element Armory** using **TypeScript + React**, optimized for developers and scalable enough to compete with tools like html.to.design.

The goal of the MVP:

> **Browse captured elements → preview → insert into Figma as components**

Later phases add **HTML → Figma fidelity improvements** and **Figma → HTML export**.

---

# Architecture Overview (Best-practice Figma plugin)

Figma plugins have **two runtimes**:

```
┌─────────────────────────────┐
│ React UI (iframe)           │
│ - component list            │
│ - previews                  │
│ - API requests              │
│ - search/filter             │
└──────────────┬──────────────┘
               │ postMessage
┌──────────────▼──────────────┐
│ Plugin main thread          │
│ (Figma API access)          │
│ - create nodes              │
│ - convert HTML → layers     │
│ - component creation        │
└─────────────────────────────┘
```

Tech stack:

```
TypeScript
React
Vite
Figma Plugin API
Zod (validation)
TanStack Query (data caching)
```

Key performance principles:

* **UI handles networking**
* **Main thread only manipulates Figma nodes**
* **Lazy load previews**
* **Cache API responses**
* **Virtualize long lists**

---

# Phase 1 — Plugin Foundation (1–2 days)

Goal: Create a **fast developer-friendly plugin scaffold**.

### Setup

Use a modern setup:

```
pnpm create figma-plugin
```

Or use **Vite + React template**.

Recommended structure:

```
element-armory-figma-plugin
│
├─ src
│  ├─ main.ts        (plugin runtime)
│  ├─ ui
│  │   ├─ App.tsx
│  │   ├─ api.ts
│  │   ├─ components
│  │   │   ├─ ElementCard.tsx
│  │   │   └─ ElementList.tsx
│  │   └─ hooks
│  │       └─ useElements.ts
│
├─ manifest.json
└─ vite.config.ts
```

Manifest example:

```json
{
  "name": "Element Armory",
  "id": "element-armory",
  "editorType": ["figma"],
  "main": "dist/main.js",
  "ui": "dist/ui.html"
}
```

Main plugin bootstrap:

```ts
figma.showUI(__html__, { width: 360, height: 600 })

figma.ui.onmessage = async (msg) => {
  if (msg.type === "CREATE_COMPONENT") {
    await createComponent(msg.payload)
  }
}
```

---

# Phase 2 — API Integration (Mocked First)

Since your backend isn't built yet, create a **mock API layer**.

Example element model:

```ts
export interface ElementItem {
  id: string
  name: string
  html: string
  css: string
  preview: string
  createdAt: string
}
```

Mock API:

```ts
export async function fetchElements(): Promise<ElementItem[]> {
  return [
    {
      id: "1",
      name: "Navbar",
      html: "<nav>...</nav>",
      css: ".nav {...}",
      preview: "/placeholder.png",
      createdAt: "2026-01-01"
    }
  ]
}
```

Later this becomes:

```
GET /api/elements
GET /api/elements/:id
```

---

# Phase 3 — Fast UI List (Performance Critical)

This determines plugin usability.

Features:

```
Search
Preview
Insert button
Lazy loading
```

Use **virtualized lists**.

Recommended library:

```
react-virtual
```

Example:

```tsx
const rowVirtualizer = useVirtualizer({
  count: elements.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 80
})
```

Benefits:

* Handles **thousands of components**
* Keeps plugin UI fast.

---

# Phase 4 — Insert Element into Figma

When the user clicks **Insert**:

```
React UI
   ↓
postMessage
   ↓
Plugin runtime
   ↓
Create nodes
```

Example:

```ts
figma.ui.onmessage = async (msg) => {
  if (msg.type === "INSERT_ELEMENT") {
    const frame = figma.createFrame()
    frame.resize(400, 200)
    frame.name = msg.payload.name

    figma.currentPage.appendChild(frame)
    figma.viewport.scrollAndZoomIntoView([frame])
  }
}
```

Initially:

```
HTML → frame placeholder
```

Later:

```
HTML → real nodes
```

---

# Phase 5 — HTML → Figma Rendering (Core Feature)

This is the hardest technical problem.

Strategy:

### Option A (MVP — recommended)

Render HTML as **SVG snapshot**.

```
HTML → browser render → SVG → Figma image
```

Fast and reliable.

### Option B (better long term)

Convert DOM → Figma nodes.

Example mapping:

```
div → frame
img → rectangle with image
text → text node
```

Pseudo:

```ts
function domToFigma(node) {
  if (node.type === "text") {
    const text = figma.createText()
    text.characters = node.value
    return text
  }
}
```

This is similar to how tools like html.to.design work internally.

---

# Phase 6 — Component System

Instead of inserting raw frames:

```
Frame
 ↓
Component
 ↓
Instance
```

Example:

```ts
const component = figma.createComponent()
component.name = element.name

figma.currentPage.appendChild(component)
```

Benefits:

* Designers reuse components
* Dev-friendly structure.

---

# Phase 7 — Auth + Sync

Your Chrome extension already captures elements.

Add:

```
OAuth / token
```

Flow:

```
User logs in
↓
Figma plugin stores token
↓
API requests include token
```

Storage:

```ts
figma.clientStorage.setAsync("token", token)
```

---

# Phase 8 — Developer-Focused Features

This is where Element Armory can **beat competitors**.

### 1️⃣ Code panel

Show:

```
HTML
CSS
React
Tailwind (optional)
```

### 2️⃣ Copy to clipboard

Developers love this.

### 3️⃣ "Open in Element Armory"

Deep link to your web app.

---

# Phase 9 — Future Feature (Figma → HTML)

This would be huge.

Flow:

```
Select component
↓
Export node tree
↓
Convert to HTML
↓
Send to Element Armory API
```

Example:

```ts
const selection = figma.currentPage.selection
```

Extract:

```
layout
styles
text
images
```

Then generate HTML.

---

# Phase 10 — Performance Optimizations

To compete with plugins like html.to.design:

### Lazy previews

Load images only when visible.

### Cache elements

```
TanStack Query
```

### Batch node creation

Avoid creating thousands of nodes individually.

### Avoid main thread blocking

Heavy logic stays in UI thread.

---

# Phase 11 — Plugin Listing Optimization

For discoverability:

Plugin name:

```
Element Armory – UI to Code Components
```

Keywords:

```
html
css
ui components
developer
frontend
```

Target:

```
frontend devs
ai coding users
```

---

# Ideal MVP Feature Set

Ship this first:

```
Login
Component list
Search
Preview
Insert into Figma
Component creation
```

Avoid early complexity.

---

# Realistic Timeline

```
Phase 1–2   setup + API mock      1–2 days
Phase 3     UI list               2 days
Phase 4     insert nodes          1 day
Phase 5     HTML rendering MVP    3–5 days
Phase 6     component support      1 day
Phase 7     auth + sync           1–2 days
```

**Total MVP: ~10 days**

---

# Strategic Insight for Element Armory

Your Chrome extension already has **distribution with developers**.

The Figma plugin gives you:

```
Developers → designers
Designers → developers
```

Which expands your user base dramatically.
