# Veritas Text Highlighting Bug - Root Cause Analysis & Fix

## Problem Summary

The fact-checking highlights (green underlines for verified claims, red strikethrough for false claims) were completely failing to appear on the page. The logs showed:

- ✅ Claims were being identified correctly
- ⚠️ Text highlighting was failing with "Text not found" warnings
- ❌ Zero spans were being created (`Found 0 span(s)`)
- ❌ Verification updates couldn't find any elements to style

## Visual Overview

![Bug Fix Diagram](/Users/willowveil/.gemini/antigravity/brain/fd895023-6cd9-4f8c-8423-fbeb44579a5d/highlighting_bug_fix_diagram_1763744725929.png)


## Root Cause Analysis

### The Critical Bug

In `text-highlighter.ts`, when the `highlightTextInElement()` function **failed to find exact matching text**, it had a fallback path (lines 113-136) that:

1. Applied CSS classes directly to the **parent element** (block-level styling)
2. Added `data-veritas-*` attributes to the **parent element**
3. **Did NOT create any `<span>` elements**

This was problematic because:

```typescript
// Later in cursor.tsx, the verification layer looks for spans:
const spans = document.querySelectorAll(`span[data-veritas-claim-id="${claim.id}"]`)

if (spans.length === 0) {
    console.error(`[CURSOR] ❌ NO SPANS FOUND!`)  // <-- This happened every time!
}
```

### Why Text Matching Failed

The exact text matching failed for several reasons:

1. **Whitespace differences** - The text extracted by the AI might have normalized whitespace
2. **Truncation** - The `claimText` field contains "10-50 char snippets" that may not match exactly
3. **Encoding issues** - Chinese/special characters might have slight variations
4. **DOM structure** - Text spread across multiple text nodes

## The Fix

### Fix #1: Always Create Spans (PRIMARY FIX)

Modified the fallback path to **always create a `<span>` wrapper**, even when exact text matching fails:

```typescript
// OLD CODE (BROKEN):
// Just applied classes to parent element, no span created
element.classList.add(blockClassName)
element.setAttribute(`data-veritas-${key}`, value)

// NEW CODE (FIXED):
// Create a span wrapping the entire element's content
const wrapper = document.createElement("span")
wrapper.className = styleClass
wrapper.setAttribute("data-veritas-highlighted", "true")

// Attach all metadata to the span
for (const [key, value] of Object.entries(metadata)) {
    wrapper.setAttribute(`data-veritas-${key}`, attrValue)
}

// Move all child nodes into the wrapper
while (element.firstChild) {
    wrapper.appendChild(element.firstChild)
}
element.appendChild(wrapper)
```

**Impact**: Now even when exact text matching fails, a `<span>` is created with the correct `data-veritas-claim-id` attribute, allowing verification styling to work.

### Fix #2: Correct Attribute Value Serialization

Fixed how metadata attributes are serialized:

```typescript
// OLD CODE (BROKEN):
wrapper.setAttribute(`data-veritas-${key}`, JSON.stringify(value))
// Result: data-veritas-claim-id='"claim-1"'  (with quotes!)

// NEW CODE (FIXED):
const attrValue = typeof value === 'string' || typeof value === 'number' 
    ? String(value) 
    : JSON.stringify(value)
wrapper.setAttribute(`data-veritas-${key}`, attrValue)
// Result: data-veritas-claim-id='claim-1'  (correct!)
```

**Impact**: Attribute selectors now match correctly without dealing with extra quotes.

### Fix #3: Enhanced Debugging

Added detailed logging when text matching fails:

```typescript
console.warn(`[TEXT-HIGHLIGHT] 🔍 Debug info:`)
console.warn(`[TEXT-HIGHLIGHT]   - XPath: ${xpath}`)
console.warn(`[TEXT-HIGHLIGHT]   - Element tag: ${element.tagName}`)
console.warn(`[TEXT-HIGHLIGHT]   - Element text content: "${element.textContent?.substring(0, 200)}..."`)
console.warn(`[TEXT-HIGHLIGHT]   - Text nodes found: ${textNodes.length}`)
console.warn(`[TEXT-HIGHLIGHT]   - Search text length: ${searchText.length}`)
```

**Impact**: Future debugging will be much easier with this information.

## Expected Behavior After Fix

### Claim Highlighting Flow

1. **RATIO_COMPLETE** event fires with claims
2. For each claim, `highlightTextInElement()` is called
3. **BEST CASE**: Exact text match found → Precise span created around matched text
4. **FALLBACK CASE**: Text not found → **Span wrapping entire element created** (NEW!)
5. Span gets `data-veritas-claim-id="claim-X"` attribute
6. Logs show: `✅ Fallback: Wrapped entire element content`

### Verification Update Flow

1. **VERITAS_COMPLETE** event fires with verification results
2. For each verification, code searches: `span[data-veritas-claim-id="claim-X"]`
3. **NOW**: Spans are found! (Previously: 0 spans found)
4. Code updates span classes based on status:
   - `verified` → Adds `veritas-verified-text` class (green underline)
   - `false` → Adds `veritas-false-text` class (red strikethrough)
   - `unverifiable` → Keeps neutral styling
5. Click handlers are attached to spans
6. User can click to see evidence cards

## Visual Results

### ✅ Verified Claims
- **Green gradient background** with **green underline**
- Smooth hover effect with glow
- Click to see evidence card

### ❌ False Claims
- **Red strikethrough** with **red tinted background**
- Reduced opacity (0.85)
- Click to see debunking evidence

### ⚠️ Unverifiable Claims
- Neutral highlight, slightly dimmed
- No strong visual indicator

## Files Changed

1. **`/src/lib/text-highlighter.ts`** (Lines 113-180)
   - Fixed fallback to always create spans
   - Fixed attribute value serialization (3 locations)
   - Added detailed debug logging

## Testing Recommendations

1. Test with **Chinese text** (as in your logs)
2. Test with text containing **special characters**
3. Test with **long paragraphs** where exact matching might fail
4. Verify that:
   - Green underlines appear for verified claims
   - Red strikethroughs appear for false claims
   - Click handlers work on all highlights
   - Evidence cards pop up correctly

## Conclusion

The bug was a **critical architectural flaw** where the fallback path broke the assumption that `<span>` elements would always exist for claims. This caused a complete failure of the verification highlighting system. The fix ensures that spans are **always created**, making the system resilient to text matching failures.
