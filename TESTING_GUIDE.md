# Quick Testing Guide - Text Highlighting Fix

## What Was Fixed

The fact-checking highlights (green underlines for verified, red strikethrough for false claims) were completely broken. They now work correctly.

## How to Test

### 1. Reload the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Find "Veritas" extension
3. Click the **refresh/reload** icon ⟳
4. The changes are now active

### 2. Test on a Page

1. Navigate to a page with claims (or create a test page with the sample content below)
2. Press **Ctrl+Shift+V** to trigger Veritas analysis
3. Wait for analysis to complete

### 3. What to Look For

#### ✅ SUCCESS INDICATORS:

**In the console logs**, you should see:
```
[CURSOR] ✅ Successfully highlighted claim claim-1
[CURSOR] 🔍 Verification: Found 1 span(s) with data-veritas-claim-id="claim-1"
```

**On the page**, you should see:
- **Green underlines** on verified facts
- **Red strikethrough** on false claims  
- Claims are **clickable** - click to see evidence cards

#### ❌ FAILURE INDICATORS (OLD BUG):

**In console logs** (if bug still exists):
```
[TEXT-HIGHLIGHT] ⚠️ Text not found: "..."
[CURSOR] 🔍 Verification: Found 0 span(s) with data-veritas-claim-id="claim-1"  ❌
[CURSOR] ❌ NO SPANS FOUND!
```

**On the page** (if bug still exists):
- No visual highlights appear
- Nothing is clickable
- No evidence cards

## Sample Test Page

Create a simple HTML file to test:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Veritas Test Page</title>
</head>
<body>
    <h1>Test Claims</h1>
    
    <div>
        <p>Climate change is a hoax invented by China.</p>
    </div>
    
    <div>
        <p>The Earth revolves around the Sun.</p>
    </div>
    
    <div>
        <p>Vaccines cause autism in children.</p>
    </div>
    
    <div>
        <p>Water boils at 100 degrees Celsius at sea level.</p>
    </div>
</body>
</html>
```

Open this page, press **Ctrl+Shift+V**, and watch as:
1. Claims are identified
2. Spans are created (check console)
3. Verification completes
4. Visual highlights appear (green/red)

## Debugging Tips

### Check if Spans Are Created

Open DevTools Console and run:

```javascript
// Check total number of Veritas spans
document.querySelectorAll('span[data-veritas-claim-id]').length

// List all claim IDs
Array.from(document.querySelectorAll('span[data-veritas-claim-id]'))
    .map(s => s.getAttribute('data-veritas-claim-id'))

// Check specific span
document.querySelector('span[data-veritas-claim-id="claim-1"]')
```

**Expected**: Should return numbers > 0 and show the span elements.

**If bug still exists**: Returns 0 or null.

### Check Element Styling

Inspect a highlighted span in DevTools:

**Expected HTML structure**:
```html
<p>
  <span class="veritas-verified-text" 
        data-veritas-claim-id="claim-1" 
        data-veritas-highlighted="true">
    Water boils at 100 degrees Celsius at sea level.
  </span>
</p>
```

**Broken structure (old bug)**:
```html
<p class="veritas-highlight" data-veritas-claim-id="claim-1">
  Water boils at 100 degrees Celsius at sea level.
</p>
<!-- No span! -->
```

## Common Issues

### Issue: Still seeing "Text not found" warnings

**This is NORMAL** - The fix handles this case. What matters is:
- After the warning, you should see: `✅ Fallback: Wrapped entire element content`  
- Spans are still created
- Highlights still appear

### Issue: Highlights appear but are not clickable

Check that click handlers are attached:
```javascript
const span = document.querySelector('span[data-veritas-claim-id="claim-1"]')
console.log('Click listeners:', getEventListeners(span)) // Chrome only
```

### Issue: Wrong colors

Check the CSS classes:
- Verified: `veritas-verified-text` (green)
- False: `veritas-false-text` (red)  
- Unverifiable: `veritas-highlight` (neutral)

## Expected Console Output

### Successful flow:

```
[CURSOR] 📝 RATIO_COMPLETE: Highlighting 15 claims
[CURSOR] 🎯 Highlighting claim claim-1: "新政策是一场绝对的灾难！..."
[TEXT-HIGHLIGHT] ⚠️ Text not found in text nodes: "新政策是一场绝对的灾难！..."
[TEXT-HIGHLIGHT] ✅ Fallback: Wrapped entire element content
[CURSOR] ✅ Successfully highlighted claim claim-1
[CURSOR] 🔍 Verification: Found 1 span(s) with data-veritas-claim-id="claim-1"

...analysis continues...

[CURSOR] 🔍 VERITAS_COMPLETE: Processing 13 verifications
[CURSOR] 🎯 Processing verification 0: claimId="claim-2", status="unverifiable"
[CURSOR] ✅ Found claim claim-2: "It will completely destroy our..."
[CURSOR] 📊 Query result: Found 1 span(s)
[CURSOR] 🎨 Updating span 0 for claim claim-2
[CURSOR]   - Applied: veritas-highlight (neutral)
[CURSOR] ✅ Attached click handler to span 0
```

## Success Criteria

✅ **All tests pass if**:
1. Console shows spans are found (not 0)
2. Visual highlights appear on page
3. Clicking highlights shows evidence cards
4. Green/red colors are correct

---

**Need Help?**  
Check the full technical analysis in [BUG_FIX_ANALYSIS.md](./BUG_FIX_ANALYSIS.md)
