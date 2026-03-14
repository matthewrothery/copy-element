# CSS Extraction Overhaul - Testing Guide

## Overview

This document provides testing instructions for the CSS extraction overhaul completed on 2026-03-11.

## What Changed

### Before (Inline Style Approach)
- Every element had massive inline styles with redundant properties
- Pseudo-elements were converted to `<span>` elements
- No @font-face support
- Output was verbose and hard to read

### After (Class-Based Stylesheet Approach)
- Original class names are preserved
- CSS rules are extracted from page stylesheets
- Pseudo-elements handled via CSS (::before, ::after)
- @font-face rules included for custom fonts
- Clean, readable HTML + separate stylesheet

## Testing Checklist

### 1. Basic Element Capture

**Test Site:** Any simple webpage

**Steps:**
1. Load the extension in Chrome
2. Click the extension icon to start capture
3. Click on a simple element (e.g., a button or heading)
4. Verify the capture modal shows the element
5. Click "Copy HTML"
6. Paste into a blank HTML file and verify it renders correctly

**Expected Result:**
- HTML should have class names preserved
- No inline styles (except original inline styles from the page)
- Stylesheet should contain matching CSS rules

### 2. Medium.com Article Header

**Test Site:** https://medium.com (any article)

**Steps:**
1. Navigate to a Medium article
2. Start element capture
3. Click on the article header (author info, date, etc.)
4. Verify capture includes:
   - Author avatar
   - Author name
   - Date
   - Read time
5. Copy HTML and verify rendering

**Expected Result:**
- Should look identical to original
- Should include custom font (sohne)
- Should have @font-face rules in stylesheet
- No empty `<span>` elements for pseudo-elements

### 3. Pseudo-Elements

**Test Site:** Any site with ::before or ::after content

**Steps:**
1. Find an element with visible ::before or ::after content
2. Capture the element
3. Verify the stylesheet includes ::before/::after rules
4. Paste and verify pseudo-element content renders

**Expected Result:**
- No `<span data-pseudo-element>` elements in HTML
- CSS stylesheet should contain ::before/::after rules
- Visual appearance should match original

### 4. Custom Fonts

**Test Site:** Any site with custom web fonts

**Steps:**
1. Capture an element using custom fonts
2. Check the stylesheet output
3. Verify @font-face rules are included
4. Verify font URLs are absolute (not relative)

**Expected Result:**
- @font-face rules at top of stylesheet
- Font URLs should be absolute (https://...)
- Font should load when pasted elsewhere

### 5. Responsive Styles

**Test Site:** Any responsive website

**Steps:**
1. Capture an element with responsive styles
2. Check stylesheet for @media rules
3. Paste into HTML and resize browser
4. Verify responsive behavior works

**Expected Result:**
- @media queries included in stylesheet
- Responsive behavior preserved

### 6. Nested Elements

**Test Site:** Any complex layout

**Steps:**
1. Capture a parent element with multiple nested children
2. Verify all child elements are included
3. Verify CSS rules for all elements are extracted

**Expected Result:**
- All nested elements preserved
- CSS rules for parent and children included
- Visual hierarchy maintained

### 7. Cross-Origin Stylesheets

**Test Site:** Site using CDN stylesheets (e.g., Bootstrap from CDN)

**Steps:**
1. Capture an element styled by cross-origin stylesheet
2. Check console for CORS warnings
3. Verify element still renders (may fall back to inline styles)

**Expected Result:**
- Console warning about cross-origin stylesheet
- Element should still be captured
- May not be pixel-perfect if styles are from CDN

## Known Limitations

1. **Cross-Origin Stylesheets**: Cannot access stylesheets from different domains due to CORS
2. **Dynamic Styles**: JavaScript-generated styles may not be captured
3. **CSS-in-JS**: Inline styles from CSS-in-JS libraries are preserved but not extracted as rules

## Comparison with Previous Version

### Output Size Comparison

**Before (Inline Styles):**
```html
<div class="v iq ir" style="display:flex;font-family:medium-content-sans-serif-font, -apple-system, system-ui, Segoe UI, Roboto;font-size:16px;color:rgba(0, 0, 0, 0.8);background:rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box;border:0px none rgba(0, 0, 0, 0.8);box-sizing:border-box;width:680px;height:39.5px;flex:0 1 auto;justify-content:normal;align-items:center;gap:12px;">
  <span data-pseudo-element="::before" aria-hidden="true"></span>
  <!-- content -->
</div>
```

**After (Class-Based):**
```html
<div class="v iq ir">
  <!-- content -->
</div>

<style>
.v { display: flex; }
.iq { align-items: center; }
.ir { gap: 12px; }
</style>
```

### Benefits

1. **Cleaner HTML**: No inline style bloat
2. **Smaller Output**: CSS rules deduplicated across elements
3. **Better Maintainability**: Easier to modify styles
4. **Pseudo-Elements**: Handled via CSS, not fake elements
5. **Font Support**: @font-face rules included

## Debugging

If capture fails or output is incorrect:

1. **Check Console**: Look for errors or CORS warnings
2. **Verify Build**: Run `npm run build` to ensure latest code
3. **Check Stylesheet**: Inspect the extracted CSS in capture modal
4. **Test in Isolation**: Create minimal test case to reproduce issue

## Reporting Issues

When reporting issues, include:
1. Test site URL
2. Element being captured
3. Expected vs actual output
4. Console errors/warnings
5. Screenshots of original vs captured element
