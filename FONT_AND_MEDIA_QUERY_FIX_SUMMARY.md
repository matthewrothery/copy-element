# Font and Media Query Extraction Fix - Implementation Summary

## Overview

Fixed missing `@font-face` rules and media queries in captured snippets by:
1. Preserving external font stylesheet links (Google Fonts, Adobe Fonts, etc.)
2. Adding recursive extraction for nested CSS rules (`@supports`, `@media`, `@layer`)

## Problem Analysis

### Issue 1: Cross-Origin Font Stylesheets
Many websites load fonts from external CDNs (Google Fonts, Adobe Fonts) which are blocked by browser CORS restrictions. JavaScript cannot access `cssRules` on cross-origin stylesheets, causing font declarations to be silently skipped.

### Issue 2: Nested Rules Not Traversed
The extractors only looked at top-level rules, missing:
- `@font-face` inside `@supports` blocks (common for variable fonts)
- `@font-face` inside `@media` blocks
- Style rules inside `@supports` blocks

## Solution Implemented

### 1. External Font Link Extractor (NEW)

**File:** `extension/src/shared/utils/external-font-link-extractor.ts`

Created a new utility that:
- Identifies `<link rel="stylesheet">` elements from known font CDN domains
- Extracts preconnect, dns-prefetch, and font preload links
- Returns serialized link tags to include in output HTML

**Supported CDN patterns:**
- `fonts.googleapis.com` (Google Fonts)
- `fonts.gstatic.com` (Google Fonts static assets)
- `use.typekit.net` (Adobe Fonts)
- `fonts.shopify.com`
- `fast.fonts.net` (Monotype)
- `cloud.typography.com`
- `use.fontawesome.com`
- `fonts.adobe.com`

**Key functions:**
- `extractExternalFontLinks()` - Extracts font stylesheet links
- `extractFontPreloadLinks()` - Extracts preconnect/preload links
- `extractAllFontLinks()` - Returns both stylesheets and preloads

### 2. Font-Face Extractor Enhancement

**File:** `extension/src/shared/utils/font-face-extractor.ts`

Added recursive rule processing:
- New `processRulesForFontFaces()` function recursively searches through CSS rule lists
- Handles `@media`, `@supports`, and `@layer` blocks
- Wraps extracted `@font-face` rules in their conditional blocks when needed

**Example output:**
```css
@supports (font-variation-settings: normal) {
  @font-face {
    font-family: "Variable Font";
    src: url("https://example.com/fonts/variable.woff2");
  }
}
```

### 3. Stylesheet Rule Extractor Enhancement

**File:** `extension/src/shared/utils/stylesheet-rule-extractor.ts`

Added `@supports` rule handling:
- Modified `processRuleList()` to handle `CSSSupportsRule`
- Wraps matching style rules in their `@supports` block
- Preserves feature detection logic

**Example output:**
```css
@supports (display: grid) {
  .container {
    display: grid;
  }
}
```

### 4. Type Updates

**File:** `extension/src/shared/types/snippet.ts`

Added `externalFontLinks?: string[]` field to:
- `CapturedElementData` interface
- `Snippet` interface

### 5. Content Script Integration

**File:** `extension/src/content/index.ts`

Updated capture flow:
- Calls `extractAllFontLinks()` to get external font links
- Combines preload links and stylesheet links
- Passes them to `CapturedElementData`

### 6. Preview Builder Updates

**File:** `extension/src/shared/utils/preview-srcdoc-builder.ts`

Updated both preview functions:
- Added `externalFontLinks` parameter to `CapturePreviewInput`
- Injects external font links into `<head>` section before styles
- Applied to both `buildPreviewForCapture()` and `buildPreviewSrcDoc()`

**File:** `extension/src/content/capture-confirmation-modal.ts`

Updated:
- `buildSnippetFromCapture()` to include `externalFontLinks`
- Preview iframe creation to pass `externalFontLinks` to builder

## Files Created

1. `extension/src/shared/utils/external-font-link-extractor.ts` - New utility
2. `extension/src/shared/utils/external-font-link-extractor.test.ts` - Test suite

## Files Modified

1. `extension/src/shared/utils/font-face-extractor.ts` - Added recursive processing
2. `extension/src/shared/utils/font-face-extractor.test.ts` - Added nested rule tests
3. `extension/src/shared/utils/stylesheet-rule-extractor.ts` - Added @supports handling
4. `extension/src/shared/utils/stylesheet-rule-extractor.test.ts` - Added @supports test
5. `extension/src/shared/types/snippet.ts` - Added externalFontLinks field
6. `extension/src/content/index.ts` - Integrated external font extraction
7. `extension/src/shared/utils/preview-srcdoc-builder.ts` - Added link injection
8. `extension/src/content/capture-confirmation-modal.ts` - Updated snippet building

## Test Results

All tests passing:
- 171 tests passed
- 5 tests skipped (browser-only APIs in jsdom)
- 0 tests failed

## Build Status

✅ Build successful with no errors
✅ No linter errors

## How It Works

### Capture Flow

1. User selects element on page
2. **CSS Extraction:**
   - `extractMatchingRules()` extracts matching CSS rules (including @supports)
   - `extractUsedFontFaces()` recursively searches for @font-face rules
   - `extractAllFontLinks()` finds external font stylesheet links
3. **Data Assembly:**
   - Combines @font-face rules and CSS rules into `styleBlock`
   - Stores external font links in `externalFontLinks` array
4. **Preview/Output:**
   - Preview builder injects external font links into `<head>`
   - Followed by inline `<style>` block with extracted CSS
   - Result: Fonts load correctly in preview and copied HTML

### Output HTML Structure

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <base href="https://example.com/">
  
  <!-- External font links (Google Fonts, etc.) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto">
  
  <!-- Reset and base styles -->
  <style>
    html, body { margin: 0; padding: 0; }
  </style>
  
  <!-- Extracted @font-face and CSS rules -->
  <style>
    @font-face {
      font-family: "CustomFont";
      src: url("https://example.com/fonts/custom.woff2");
    }
    
    @supports (display: grid) {
      .container { display: grid; }
    }
    
    @media (min-width: 768px) {
      .responsive { width: 100%; }
    }
    
    .element { font-family: "Roboto", sans-serif; }
  </style>
</head>
<body>
  <div class="snippet-stage" style="width:680px;min-height:119px;">
    <!-- Captured HTML -->
  </div>
</body>
</html>
```

## Benefits

1. **Complete Font Support:**
   - External fonts (Google Fonts, Adobe Fonts) now load correctly
   - Local @font-face declarations preserved with absolute URLs
   - Font preload/preconnect hints included for performance

2. **Modern CSS Support:**
   - `@supports` rules preserved for progressive enhancement
   - `@media` queries maintained for responsive design
   - Nested conditional blocks handled correctly

3. **Improved Fidelity:**
   - Captured elements render with correct fonts
   - Responsive behavior preserved
   - Feature detection logic maintained

## Next Steps

Manual testing recommended on:
- Sites using Google Fonts
- Sites with variable fonts in @supports blocks
- Sites with responsive @media queries
- Sites using Adobe Fonts (Typekit)
