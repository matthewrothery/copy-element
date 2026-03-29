# Layered CSS Architecture

A guide to the 3-layer CSS token architecture and style system for React projects that share a design language with React Native.

---

## Table of Contents

1. [Overview](#overview)
2. [Three-Layer Token Architecture](#three-layer-token-architecture)
3. [Layer 1: Primitive Tokens](#layer-1-primitive-tokens)
4. [Layer 2: Semantic Tokens](#layer-2-semantic-tokens)
5. [Layer 3: Component Tokens](#layer-3-component-tokens)
6. [File Organization](#file-organization)
7. [CSS Structure Rules](#css-structure-rules)
8. [React Native Parity](#react-native-parity)
9. [Responsive Design](#responsive-design)
10. [Animation and Transitions](#animation-and-transitions)
11. [Layout Patterns](#layout-patterns)
12. [Component Self-Containment](#component-self-containment)
13. [Best Practices](#best-practices)

---

## Overview

This architecture enforces a strict 3-layer token model that prevents hardcoded values, maintains visual consistency, and enables easy theming and responsive design. It is designed for a React + Vite (web) project that shares its design language with a React Native project.

**Core Principles:**

- **No hardcoded values** in component style declarations
- **Three truly distinct layers**: primitives (raw values) → semantics (UI intent) → component tokens (local API)
- **Component selectors are pure consumers**: they use tokens, they do not define them
- **Component self-containment**: token definitions and styles co-located in the same file, but in separate blocks
- **Shared design tokens** expressed in TypeScript so React Native can consume them too

---

## Three-Layer Token Architecture

### The Layers

```
Layer 1: Primitives   — raw scale-based values, no semantic opinion
    ↓
Layer 2: Semantics    — maps design intent to primitives (:root, global)
    ↓
Layer 3: Components   — component-local aliases of semantics (:root, co-located)
    ↓
Component Styles      — pure consumers; only property declarations, no token definitions
```

### Hard Rules

1. **Primitives are scale-based** — `--color-blue-500`, not `--accent`
2. **Semantics always reference primitives** — `--accent: var(--color-blue-500)`
3. **Component tokens always reference semantics** — `--button-bg: var(--accent)`
4. **Component selectors never define tokens** — they only consume them
5. **All three layers are defined in `:root {}` blocks**

### Visual Example

```css
/* ❌ WRONG: Hardcoded value */
.button {
  background-color: #3b82f6;
  padding: 16px;
}

/* ❌ WRONG: Consuming semantics directly in a component selector */
.button {
  background-color: var(--accent);
  padding: var(--space-3);
}

/* ❌ WRONG: Defining component tokens inside the component selector */
.button {
  --button-bg: var(--accent);
  --button-padding: var(--space-3);

  background-color: var(--button-bg);
  padding: var(--button-padding);
}

/* ✅ CORRECT: Component tokens in :root, component selector is a pure consumer */
:root {
  --button-bg:      var(--accent);
  --button-padding: var(--space-3);
}

.button {
  background-color: var(--button-bg);
  padding: var(--button-padding);
}
```

---

## Layer 1: Primitive Tokens

Primitive tokens are raw design values. They are scale-based and carry no semantic meaning — they describe *what the value is*, not *where it's used*. Defined in `tokens.css`, never consumed by components directly.

### Location

`src/styles/tokens.css`

### Token Categories

#### Colors

Named by palette + scale step. No semantic names at this layer.

```css
:root {
  /* Blue scale */
  --color-blue-400: /* lighter blue */;
  --color-blue-500: /* base blue */;
  --color-blue-600: /* darker blue */;
  --color-blue-700: /* darkest blue */;

  /* Gray scale */
  --color-gray-50:  /* lightest gray */;
  --color-gray-100: /* ... */;
  --color-gray-500: /* mid gray */;
  --color-gray-700: /* dark gray */;
  --color-gray-900: /* near black */;

  /* Absolute */
  --color-white: #ffffff;
  --color-black: #000000;

  /* Red scale (for errors/danger) */
  --color-red-500: /* base red */;
  --color-red-600: /* darker red */;
}
```

#### Typography

```css
:root {
  /* Font sizes */
  --font-size-xs:   11px;
  --font-size-sm:   12px;
  --font-size-base: 13px;
  --font-size-md:   16px;
  --font-size-lg:   20px;
  --font-size-xl:   32px;
  --font-size-2xl:  48px;
  --font-size-3xl:  62px;

  /* Font weights */
  --font-weight-normal:   400;
  --font-weight-semibold: 600;
  --font-weight-bold:     700;

  /* Font stack */
  --font-sans: system-ui, -apple-system, sans-serif;
}
```

#### Spacing

Consistent scale based on 4px increments.

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --space-5: 32px;
  --space-6: 48px;
  --space-7: 128px;
}
```

#### Radius

```css
:root {
  --radius-sm:   4px;
  --radius-base: 6px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-pill: 1000px;
}
```

#### Layout

```css
:root {
  --content-max-width: 1200px;
}
```

---

## Layer 2: Semantic Tokens

Semantic tokens map design intent to primitive values. They answer *"what is this for?"* and live in `tokens.css` as a distinct `:root {}` block after the primitives.

Semantic names describe purpose (`--accent`, `--surface`, `--text-muted`). They never contain scale steps or raw values.

### Location

`src/styles/tokens.css` — below Layer 1 primitives

### Pattern

```css
/* =========================
   LAYER 2: SEMANTICS
========================= */

:root {
  /* Action colors */
  --accent:        var(--color-blue-500);
  --accent-hover:  var(--color-blue-600);
  --accent-active: var(--color-blue-700);
  --danger:        var(--color-red-500);
  --danger-hover:  var(--color-red-600);

  /* Surfaces */
  --bg:      /* var(--color-...) */;
  --surface: /* var(--color-...) */;

  /* Text */
  --text:       var(--color-gray-900);
  --text-muted: var(--color-gray-500);

  /* Borders */
  --border:        /* var(--color-...) */;
  --border-strong: /* var(--color-...) */;

  /* Typography (semantic roles) */
  --typo-label:             var(--font-size-sm);
  --typo-copy:              var(--font-size-base);
  --typo-largecopy:         var(--font-size-md);
  --typo-title:             var(--font-size-lg);
  --typo-hero:              var(--font-size-xl);
  --typo-headline:          var(--font-size-3xl);
  --typo-headline-subtitle: var(--font-size-2xl);

  /* Section spacing */
  --section-gap:        256px;
  --section-gap-mobile: 180px;
}
```

### Why Semantics Are Separate From Primitives

| Layer 1 Primitive | Layer 2 Semantic |
|---|---|
| `--color-blue-500: #3b82f6` | `--accent: var(--color-blue-500)` |
| Describes the value | Describes the purpose |
| Never changes meaning | Maps one primitive per theme |
| Reusable across brands | Brand/theme specific |

Keeping them separate means you can retheme the entire product by changing only the semantic layer — no component CSS changes required.

---

## Layer 3: Component Tokens

Component tokens are the local API for a single component. They live in a `:root {}` block at the top of the component's CSS file, before the component selectors.

**The component selector itself never defines tokens — it only uses them.**

This separation means:
- Variants override one token on a class, not re-declare styles
- The component's token API is explicit and easy to find
- Style rules are clean and declarative

### Location

At the top of `src/components/ComponentName/ComponentName.css`, in a dedicated `:root {}` block.

### Pattern

```css
/* =========================
   COMPONENT TOKENS (Layer 3)
========================= */

:root {
  --button-bg:           var(--accent);
  --button-bg-hover:     var(--accent-hover);
  --button-bg-active:    var(--accent-active);
  --button-bg-disabled:  var(--surface);
  --button-text:         var(--text);
  --button-padding:      var(--space-3);
  --button-radius:       var(--radius-base);
}

/* =========================
   COMPONENT STYLES
========================= */

.button {
  background-color: var(--button-bg);
  color:            var(--button-text);
  padding:          var(--button-padding);
  border-radius:    var(--button-radius);
  transition:       background-color 0.15s ease;
}

.button:hover    { background-color: var(--button-bg-hover); }
.button:active   { background-color: var(--button-bg-active); }
.button:disabled { background-color: var(--button-bg-disabled); cursor: not-allowed; }
```

### Variant Overrides

Variants override only the tokens that change. The component styles don't change at all.

```css
/* Secondary variant — override specific tokens only */
.button--secondary {
  --button-bg:       transparent;
  --button-bg-hover: var(--surface);
  --button-border:   var(--border-strong);
}

/* Danger variant */
.button--danger {
  --button-bg:       var(--danger);
  --button-bg-hover: var(--danger-hover);
}
```

### Benefits

1. **Local theming**: Override component tokens from a parent without touching component internals
2. **Explicit API**: The `:root {}` block documents every configurable property
3. **Clean component styles**: Selectors contain only property declarations — easy to scan
4. **Safe variants**: Variants touch only the token they need to change

---

## File Organization

### Structure

```
src/
├── main.tsx
├── styles/
│   ├── tokens.css       # Layer 1 (primitives) + Layer 2 (semantics)
│   └── base.css         # Document reset and defaults (consumes semantics)
└── components/
    └── ComponentName/
        ├── ComponentName.tsx
        └── ComponentName.css   # Layer 3 :root block + component styles
```

### `tokens.css` structure

```css
/* =========================
   LAYER 1: PRIMITIVES
========================= */
:root {
  --color-blue-500: #3b82f6;
  --space-3: 16px;
  /* ... all scale-based primitives ... */
}

/* =========================
   LAYER 2: SEMANTICS
========================= */
:root {
  --accent: var(--color-blue-500);
  /* ... all semantic aliases ... */
}

/* Responsive semantic overrides */
@media (max-width: 884px) {
  :root {
    --typo-headline: var(--font-size-2xl);
  }
}
```

### `ComponentName.css` structure

```css
/* ComponentName – self-contained */

/* =========================
   COMPONENT TOKENS (Layer 3)
========================= */
:root {
  --card-bg:      var(--surface);
  --card-text:    var(--text);
  --card-padding: var(--space-4);
  --card-radius:  var(--radius-md);
}

/* =========================
   COMPONENT STYLES
========================= */
.card {
  background-color: var(--card-bg);
  color:            var(--card-text);
  padding:          var(--card-padding);
  border-radius:    var(--card-radius);
}
```

### `base.css`

Document-level reset and defaults. Consumes semantic tokens only.

```css
* {
  box-sizing: border-box;
}

body {
  background-color: var(--bg);
  color:            var(--text);
  font-family:      var(--font-sans);
  font-size:        var(--typo-largecopy);
  font-weight:      var(--font-weight-normal);
  line-height:      1.33em;
}
```

---

## CSS Structure Rules

### Rule 1: Self-Contained Components

Every component CSS file opens with a self-containment comment.

```css
/* ComponentName – self-contained */
```

### Rule 2: Tokens Before Styles

Component tokens are always in a `:root {}` block at the top of the file, before any component selectors.

```css
/* ✅ CORRECT */
:root {
  --component-bg:   var(--surface);
  --component-text: var(--text);
}

.component {
  background-color: var(--component-bg);
  color:            var(--component-text);
}

/* ❌ WRONG: tokens defined inside the selector */
.component {
  --component-bg: var(--surface);
  background-color: var(--component-bg);
}
```

### Rule 3: Token Naming Convention

```
--[component-name]-[property]-[state?]
```

Examples: `--card-bg`, `--button-bg-hover`, `--nav-item-text-active`

### Rule 4: Strict Layer Consumption

Each layer may only reference the layer directly above it.

```
Component tokens → reference Semantics only
Semantics        → reference Primitives only
Primitives       → raw values only
```

```css
/* ❌ WRONG: component token skips Layer 2 */
:root {
  --button-bg: var(--color-blue-500); /* direct primitive */
}

/* ✅ CORRECT: component token references Layer 2 */
:root {
  --button-bg: var(--accent); /* semantic */
}
```

### Rule 5: Heading Size Aliases

Always alias global typography tokens rather than hardcoding values.

```css
/* ✅ CORRECT: aliases that scale via :root responsive overrides */
:root {
  --section-heading-title-size:    var(--typo-headline);
  --section-heading-subtitle-size: var(--typo-headline-subtitle);
}

/* ❌ WRONG: hardcoded values won't scale */
:root {
  --section-heading-title-size: 62px;
}
```

---

## React Native Parity

CSS custom properties do not exist in React Native. Mirror the 3-layer structure in TypeScript so both platforms consume the same design language.

### Shared Token File Structure

```
src/tokens/
├── primitives.ts    # Layer 1: scale-based raw values
├── semantic.ts      # Layer 2: design intent, references primitives
└── components/
    └── button.ts    # Layer 3: component tokens, references semantics
```

### `primitives.ts` — Layer 1

```ts
export const color = {
  blue: {
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  gray: {
    50:  '#f8fafc',
    100: '#f1f5f9',
    500: '#6b7280',
    700: '#374151',
    900: '#111827',
  },
  red: {
    500: '#ef4444',
    600: '#dc2626',
  },
  white: '#ffffff',
  black: '#000000',
} as const;

export const space = {
  1: 4,
  2: 8,
  3: 16,
  4: 24,
  5: 32,
  6: 48,
  7: 128,
} as const;

export const radius = {
  sm:   4,
  base: 6,
  md:   8,
  lg:   12,
  pill: 1000,
} as const;

export const fontSize = {
  xs:   11,
  sm:   12,
  base: 13,
  md:   16,
  lg:   20,
  xl:   32,
} as const;

export const fontWeight = {
  normal:   '400' as const,
  semibold: '600' as const,
  bold:     '700' as const,
};
```

### `semantic.ts` — Layer 2

```ts
import { color, space, fontSize, fontWeight } from './primitives';

export const semantic = {
  color: {
    accent:       color.blue[500],
    accentHover:  color.blue[600],
    accentActive: color.blue[700],
    danger:       color.red[500],
    dangerHover:  color.red[600],
    bg:           color.white,
    surface:      color.gray[50],
    text:         color.gray[900],
    textMuted:    color.gray[500],
    border:       color.gray[100],
    borderStrong: color.gray[700],
  },
  typo: {
    label:    fontSize.sm,
    copy:     fontSize.base,
    largecopy: fontSize.md,
    title:    fontSize.lg,
    hero:     fontSize.xl,
  },
  fontWeight,
  space,
} as const;
```

### `components/button.ts` — Layer 3

```ts
import { semantic } from '../semantic';

export const buttonTokens = {
  bg:          semantic.color.accent,
  bgHover:     semantic.color.accentHover,
  bgActive:    semantic.color.accentActive,
  bgDisabled:  semantic.color.surface,
  text:        semantic.color.text,
  padding:     semantic.space[3],
  radius:      6, // radius.base
} as const;
```

### React Native component consumption

```ts
import { StyleSheet } from 'react-native';
import { buttonTokens } from '../tokens/components/button';

export const buttonStyles = StyleSheet.create({
  root: {
    backgroundColor: buttonTokens.bg,
    padding:         buttonTokens.padding,
    borderRadius:    buttonTokens.radius,
  },
  label: {
    color:      buttonTokens.text,
  },
});
```

### Theming on React Native

```tsx
import { createContext, useContext } from 'react';
import { semantic } from './tokens/semantic';

const ThemeContext = createContext(semantic);
export const useTheme = () => useContext(ThemeContext);
```

### Summary: what lives where

| Layer | Web | React Native |
|---|---|---|
| **1. Primitives** | `tokens.css` `:root` (scale-based vars) | `primitives.ts` exports |
| **2. Semantics** | `tokens.css` `:root` (semantic vars) | `semantic.ts` exports |
| **3. Component tokens** | `ComponentName.css` `:root` block | `components/[name].ts` exports |
| **Component styles** | Selectors — pure consumers | `StyleSheet.create()` — pure consumers |
| **Responsive overrides** | CSS media queries on `:root` | `useWindowDimensions` hook |
| **Theming** | CSS var override on scoped selector | React context |

---

## Responsive Design

### Breakpoint Strategy

```css
/* Desktop: default (no media query) */

/* Tablet/Medium */
@media (max-width: 884px) { }

/* Mobile */
@media (max-width: 480px) { }

/* Wide screens */
@media (max-width: 1280px) { }
```

### Responsive Token Overrides

Override semantic tokens at breakpoints. All components that alias them update automatically.

```css
/* tokens.css */
:root {
  --typo-headline: var(--font-size-3xl); /* 62px */
  --section-gap:   256px;
}

@media (max-width: 884px) {
  :root {
    --section-gap:            var(--section-gap-mobile);
    --typo-headline:          var(--font-size-2xl); /* 36px */
    --typo-headline-subtitle: var(--font-size-lg);  /* 20px */
  }
}

@media (max-width: 480px) {
  :root {
    --typo-headline: var(--font-size-xl); /* 28px */
    --typo-hero:     28px;
  }
}
```

### Component-Level Responsive Overrides

Override component tokens at breakpoints for layout changes specific to that component.

```css
:root {
  --feature-section-direction: row;
}

.feature-section {
  flex-direction: var(--feature-section-direction);
  gap: var(--space-5);
}

@media (max-width: 884px) {
  :root {
    --feature-section-direction: column;
  }

  .feature-section {
    gap: var(--space-4);
  }
}
```

---

## Animation and Transitions

### Timing Standards

- **Quick feedback**: `120ms` (hover states)
- **Standard transitions**: `150ms–200ms` (component state changes)
- **Maximum duration**: `300ms` (never exceed)

### Easing

- `ease` (default)
- `ease-out` (entrances)
- `cubic-bezier(0.37, 2, 0.42, 1.02)` (dramatic entrances with overshoot)

### Example

```css
.button {
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.button:hover {
  background-color: var(--button-bg-hover);
  transition-duration: 0.075s;
}
```

---

## Layout Patterns

### Section Container Pattern

```css
:root {
  --section-padding-inline: 20px;
}

.section {
  display:        flex;
  flex-direction: column;
  gap:            var(--section-gap);
  max-width:      var(--content-max-width);
  margin:         0 auto;
  padding:        0 var(--section-padding-inline);
  width:          100%;
}

.section-inner {
  display:        flex;
  flex-direction: column;
  gap:            var(--space-5);
  width:          100%;
}
```

**Pattern:**
```
.section (max-width container, large gap)
  └── .section-inner (content wrapper, tight gap)
       └── [component content]
```

### Full-Bleed Carousel Pattern

```css
:root {
  --carousel-padding-inline: 20px;
}

.carousel-track {
  margin-left:  calc(-1 * max(var(--carousel-padding-inline), calc((100vw - var(--content-max-width)) / 2 + 20px)));
  margin-right: calc(-1 * max(var(--carousel-padding-inline), calc((100vw - var(--content-max-width)) / 2 + 20px)));
  padding-left:  max(var(--carousel-padding-inline), calc((100vw - var(--content-max-width)) / 2 + 20px));
  padding-right: max(var(--carousel-padding-inline), calc((100vw - var(--content-max-width)) / 2 + 20px));
  width:         100vw;
  display:       flex;
  overflow-x:    auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
}

@media (max-width: 1280px) {
  .carousel-track {
    margin-left:  calc(-1 * var(--carousel-padding-inline));
    margin-right: calc(-1 * var(--carousel-padding-inline));
    padding-left:  var(--carousel-padding-inline);
    padding-right: var(--carousel-padding-inline);
  }
}
```

---

## Component Self-Containment

### Philosophy

Each component CSS file should be self-contained and organized as two blocks:

1. **Token block** — `:root {}` with all component tokens (Layer 3)
2. **Style block** — component selectors as pure consumers

### Template

```css
/* ComponentName – self-contained */

/* =========================
   COMPONENT TOKENS (Layer 3)
========================= */

:root {
  /* Colors */
  --component-bg:     var(--surface);
  --component-text:   var(--text);
  --component-border: var(--border);

  /* Spacing */
  --component-padding: var(--space-4);
  --component-gap:     var(--space-3);

  /* Shape */
  --component-radius: var(--radius-md);
}

/* =========================
   COMPONENT STYLES
========================= */

.component-name {
  display:          flex;
  flex-direction:   column;
  gap:              var(--component-gap);
  background-color: var(--component-bg);
  color:            var(--component-text);
  border:           1px solid var(--component-border);
  border-radius:    var(--component-radius);
  padding:          var(--component-padding);
}

.component-child {
  font-size: var(--typo-largecopy);
  color:     var(--component-text);
}

@media (max-width: 884px) {
  :root {
    --component-padding: var(--space-3);
  }

  .component-name {
    flex-direction: column;
  }
}
```

---

## Best Practices

### 1. Token Aliasing Over Duplication

```css
/* ❌ Duplication */
:root { --footer-text: #111827; }

/* ✅ Aliasing */
:root { --footer-text: var(--text); }
```

### 2. Purpose-Based Token Names

```css
/* ❌ Value-based naming */
:root {
  --button-blue:  var(--accent);
  --button-16px:  var(--space-3);
}

/* ✅ Purpose-based naming */
:root {
  --button-bg:      var(--accent);
  --button-padding: var(--space-3);
}
```

### 3. Group Tokens by Category

```css
:root {
  /* Colors */
  --component-bg:     var(--surface);
  --component-text:   var(--text);
  --component-border: var(--border);

  /* Spacing */
  --component-padding: var(--space-4);
  --component-gap:     var(--space-3);

  /* Typography */
  --component-title-size: var(--typo-title);
  --component-body-size:  var(--typo-copy);
}
```

### 4. Avoid Page-Level Component Overrides

```css
/* ❌ WRONG: Page overriding component internals directly */
.page .button { background-color: red; }

/* ✅ CORRECT: Override the component token */
.page .button { --button-bg: var(--danger); }

/* ✅ CORRECT: Use a variant class */
.button--danger { --button-bg: var(--danger); }
```

### 5. Mobile-First Responsive Tokens

```css
:root {
  --component-padding-inline: 20px;
}

.component {
  padding-left:  var(--component-padding-inline);
  padding-right: var(--component-padding-inline);
}

@media (max-width: 480px) {
  :root {
    --component-padding-inline: 16px;
  }
}
```

### 6. Use Tokens for Themeable Values Only

Use tokens for: colors, spacing, typography size/weight, radius, semantic values that might change.

Skip tokens for: `display`, `position`, `flex-direction`, `cursor`, `pointer-events`, one-off structural values.

### 7. Use `clamp()` for Fluid Sizing

```css
:root {
  --component-width: clamp(280px, 38vw, 460px);
}

.component {
  width: var(--component-width);
}
```

---

## Accessibility Standards

- Contrast ratio: **4.5:1** or higher for all text
- Minimum hit target: **32px × 32px**
- All interactive elements must support focus states
- Icon-only buttons require `aria-label`

```css
.button:focus-visible {
  outline:        2px solid var(--accent);
  outline-offset: 2px;
}
```

```tsx
<button aria-label="Close menu"><CloseIcon /></button>
```

---

## Migration Guide

### Converting Existing CSS to Layered Architecture

**Step 1: Extract Primitives**

Move raw values to `tokens.css` with scale-based names.

```css
/* tokens.css */
:root {
  --color-gray-50: #f8fafc;
  --space-4: 24px;
  --font-size-md: 16px;
}
```

**Step 2: Create Semantic Aliases**

Map primitives to design intent.

```css
:root {
  --surface:     var(--color-gray-50);
  --typo-largecopy: var(--font-size-md);
}
```

**Step 3: Create Component Tokens**

Add a `:root {}` token block at the top of the component CSS file.

```css
:root {
  --component-bg:        var(--surface);
  --component-padding:   var(--space-4);
  --component-text-size: var(--typo-largecopy);
}
```

**Step 4: Write Pure Consumer Styles**

```css
.component {
  background-color: var(--component-bg);
  padding:          var(--component-padding);
  font-size:        var(--component-text-size);
}
```

**Step 5: Add Responsive Overrides**

```css
@media (max-width: 480px) {
  :root {
    --component-padding: var(--space-3);
  }
}
```

---

## Advanced Patterns

### Variant Theming

```css
:root {
  --button-bg:     var(--accent);
  --button-border: transparent;
}

.button {
  background-color: var(--button-bg);
  border:           1px solid var(--button-border);
}

.button--secondary {
  --button-bg:     transparent;
  --button-border: var(--border-strong);
}

.button--danger {
  --button-bg:       var(--danger);
  --button-bg-hover: var(--danger-hover);
}
```

### Dynamic Token Calculation

```css
:root {
  --card-padding: var(--space-4);
  --card-gap:     calc(var(--card-padding) / 2);
}

.card {
  padding: var(--card-padding);
  gap:     var(--card-gap);
}
```

### Scoped Token Overrides

Override component tokens for specific page contexts by targeting the component token on a parent.

```css
/* Override a component token in a specific page context */
.pricing-page {
  --section-gap: var(--space-6);
}
```

---

## Maintenance Checklist

Before finalizing any CSS work:

- [ ] Component tokens defined in a `:root {}` block at top of file, not inside selectors
- [ ] Component selectors contain only property declarations — no token definitions
- [ ] No hardcoded color, spacing, or typography values anywhere
- [ ] Primitives are scale-based (`--color-blue-500`), not semantic names
- [ ] Semantics reference primitives (`--accent: var(--color-blue-500)`)
- [ ] Component tokens reference semantics, not primitives
- [ ] Heading sizes alias global typography tokens (not hardcoded pixels)
- [ ] Responsive overrides use `:root {}` token overrides in media queries
- [ ] Transitions stay under 300ms
- [ ] Interactive elements meet 32px minimum hit target
- [ ] Focus states defined for keyboard navigation
- [ ] Contrast ratios exceed 4.5:1
- [ ] File includes self-containment comment at top
- [ ] New tokens added to `tokens.css` are also reflected in `primitives.ts` / `semantic.ts`

---

## Common Mistakes

### Mistake 1: Hardcoding Values

```css
/* ❌ */ .button { background: #3b82f6; padding: 16px; }

/* ✅ */
:root    { --button-bg: var(--accent); --button-padding: var(--space-3); }
.button  { background-color: var(--button-bg); padding: var(--button-padding); }
```

### Mistake 2: Defining Component Tokens Inside the Selector

```css
/* ❌ Mixed — tokens defined and consumed in the same block */
.card {
  --card-bg: var(--surface);
  background-color: var(--card-bg);
}

/* ✅ Separated */
:root { --card-bg: var(--surface); }
.card { background-color: var(--card-bg); }
```

### Mistake 3: Skipping the Semantic Layer

```css
/* ❌ Component token references a primitive directly */
:root { --button-bg: var(--color-blue-500); }

/* ✅ Component token references the semantic alias */
:root { --button-bg: var(--accent); }
```

### Mistake 4: Semantic Names on Primitives

```css
/* ❌ Primitive using a semantic name (collapses Layer 1 and 2) */
:root { --accent: #3b82f6; }

/* ✅ Primitive uses scale name; semantic points to it */
:root { --color-blue-500: #3b82f6; }
:root { --accent: var(--color-blue-500); }
```

### Mistake 5: Page-Level Component Overrides

```css
/* ❌ Breaks component encapsulation */
.pricing-page .button { background-color: red; }

/* ✅ Override the token */
.pricing-page .button { --button-bg: var(--danger); }
```

### Mistake 6: Inconsistent Naming

```css
/* ❌ */
.button { --btn-background: var(--accent); --buttonPadding: var(--space-3); }

/* ✅ */
:root { --button-bg: var(--accent); --button-padding: var(--space-3); }
```

### Mistake 7: Hardcoded Responsive Typography

```css
/* ❌ Won't scale with global token overrides */
:root { --section-title-size: 62px; }

/* ✅ Aliases the semantic token, scales automatically */
:root { --section-title-size: var(--typo-headline); }
```

---

## Summary

The layered architecture provides:

1. **Consistency**: All design values centralized and aliased
2. **Maintainability**: Change one token to update the entire system
3. **Clarity**: Selectors contain only declarations — no token noise
4. **Themability**: Override tokens at any layer to create variants or themes
5. **Responsiveness**: Global token overrides cascade to all components
6. **Cross-platform**: TypeScript mirrors the 3-layer structure for React Native

**The Golden Rule:**

> Primitives hold values. Semantics give them meaning. Component tokens name their role. Selectors only consume.
