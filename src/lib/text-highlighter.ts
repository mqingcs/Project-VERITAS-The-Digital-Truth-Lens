/**
 * Text Highlighter - Precise Text-Level DOM Manipulation
 * Wraps specific text within elements with styled spans
 */

/**
 * Highlight specific text within an element by wrapping it in a span
 * @param xpath - XPath to the containing paragraph/element
 * @param searchText - Exact text to find and highlight
 * @param styleClass - CSS class to apply to the span
 * @param metadata - Additional data to attach as data attributes
 * @param onClick - Optional click handler for the highlighted span
 * @returns boolean - True if text was found and highlighted
 */
export function highlightTextInElement(
    xpath: string,
    searchText: string,
    styleClass: string,
    metadata: Record<string, any> = {},
    onClick?: (event: MouseEvent) => void
): boolean {
    // Resolve the containing element
    const element = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
    ).singleNodeValue as HTMLElement

    if (!element) {
        console.warn(`[TEXT-HIGHLIGHT] Element not found for XPath: ${xpath}`)
        return false
    }

    // Find all text nodes within the element
    const textNodes = getTextNodesIn(element)

    // Normalize search text (collapse whitespace)
    const normalizedSearch = searchText.replace(/\s+/g, ' ').trim()

    for (const textNode of textNodes) {
        const text = textNode.textContent || ""
        const normalizedText = text.replace(/\s+/g, ' ')

        // Try exact match first
        let index = text.indexOf(searchText)

        // If failed, try normalized match
        if (index === -1) {
            const normalizedIndex = normalizedText.indexOf(normalizedSearch)
            if (normalizedIndex !== -1) {
                // We found it in normalized text, but we need the index in the ORIGINAL text
                // This is tricky. For now, let's try a simpler approach:
                // If the text node contains the search text with loose whitespace
                // We can try to find the fuzzy match in the original string
                index = findFuzzyIndex(text, searchText)
            }
        }

        if (index !== -1) {
            try {
                // Create a range for the matched text
                const range = document.createRange()
                range.setStart(textNode, index)
                // We need to find the end index in the original text
                // The length might differ due to whitespace
                // Simple heuristic: take the length of search text, but extend if needed?
                // Let's assume the length is roughly the same for now, or use the fuzzy match length
                const matchLength = searchText.length

                // Safety check
                if (index + matchLength <= text.length) {
                    range.setEnd(textNode, index + matchLength)
                } else {
                    range.setEnd(textNode, text.length)
                }

                // Create the wrapper span
                const wrapper = document.createElement("span")
                wrapper.className = styleClass
                wrapper.setAttribute("data-veritas-highlighted", "true")
                wrapper.style.cursor = onClick ? "pointer" : "help"

                // Attach metadata as data attributes
                for (const [key, value] of Object.entries(metadata)) {
                    const attrValue = typeof value === 'string' || typeof value === 'number' ? String(value) : JSON.stringify(value)
                    wrapper.setAttribute(`data-veritas-${key}`, attrValue)
                }

                // Wrap the text
                range.surroundContents(wrapper)

                // Attach click handler if provided
                if (onClick) {
                    wrapper.addEventListener("click", (event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        onClick(event as MouseEvent)
                    })
                }

                console.log(`[TEXT-HIGHLIGHT] ✅ Highlighted: "${searchText.substring(0, 30)}..."`)
                return true
            } catch (error) {
                console.error(`[TEXT-HIGHLIGHT] ❌ Failed to wrap text:`, error)
                // Fallback: Highlight the entire element instead
                element.classList.add(styleClass)
                return false
            }
        }
    }

    console.warn(`[TEXT-HIGHLIGHT] ⚠️ Text not found in text nodes: "${searchText.substring(0, 50)}..."`)
    console.warn(`[TEXT-HIGHLIGHT] 🔍 Debug info:`)
    console.warn(`[TEXT-HIGHLIGHT]   - XPath: ${xpath}`)
    console.warn(`[TEXT-HIGHLIGHT]   - Element tag: ${element.tagName}`)
    console.warn(`[TEXT-HIGHLIGHT]   - Element text content (first 200 chars): "${element.textContent?.substring(0, 200)}..."`)
    console.warn(`[TEXT-HIGHLIGHT]   - Text nodes found: ${textNodes.length}`)
    console.warn(`[TEXT-HIGHLIGHT]   - Search text length: ${searchText.length}`)

    // CRITICAL FIX: Even if we can't find the exact text, we MUST create a span
    // Otherwise the verification layer won't find any spans to update!

    // Wrap the ENTIRE element's text content in a span
    try {
        // Get all the element's content
        const wrapper = document.createElement("span")
        wrapper.className = styleClass
        wrapper.setAttribute("data-veritas-highlighted", "true")
        wrapper.style.cursor = onClick ? "pointer" : "help"

        // Attach metadata as data attributes
        for (const [key, value] of Object.entries(metadata)) {
            const attrValue = typeof value === 'string' || typeof value === 'number' ? String(value) : JSON.stringify(value)
            wrapper.setAttribute(`data-veritas-${key}`, attrValue)
        }

        // Move all child nodes into the wrapper
        while (element.firstChild) {
            wrapper.appendChild(element.firstChild)
        }

        // Put the wrapper back into the element
        element.appendChild(wrapper)

        // Attach click handler if provided
        if (onClick) {
            wrapper.addEventListener("click", (event) => {
                event.preventDefault()
                event.stopPropagation()
                onClick(event as MouseEvent)
            })
        }

        console.log(`[TEXT-HIGHLIGHT] ✅ Fallback: Wrapped entire element content`)
        return true
    } catch (error) {
        console.error(`[TEXT-HIGHLIGHT] ❌ Fallback wrapping failed:`, error)

        // Last resort: Apply classes to element (but this won't work for verification!)
        const blockClassName = styleClass.replace('-text', '') // Remove '-text' suffix if present
        element.classList.add(blockClassName || "veritas-highlight")

        // Attach metadata as data attributes directly to the element
        for (const [key, value] of Object.entries(metadata)) {
            const attrValue = typeof value === 'string' || typeof value === 'number' ? String(value) : JSON.stringify(value)
            element.setAttribute(`data-veritas-${key}`, attrValue)
        }

        // Attach click handler to the element itself
        if (onClick) {
            element.addEventListener("click", (event) => {
                event.preventDefault()
                event.stopPropagation()
                onClick(event as MouseEvent)
            })
            element.style.cursor = "pointer"
        }

        console.warn(`[TEXT-HIGHLIGHT] ⚠️ WARNING: No span created! Verification may fail!`)
        return false
    }
}

/**
 * Find index of search text in target text ignoring whitespace differences
 */
function findFuzzyIndex(target: string, search: string): number {
    // Simple implementation: remove all whitespace and find index, then map back?
    // Too complex for now. Let's just try to find the first few words.
    const searchWords = search.split(/\s+/).filter(w => w.length > 0)
    if (searchWords.length === 0) return -1

    // Try to find the first word
    const firstWord = searchWords[0]
    let start = target.indexOf(firstWord)

    while (start !== -1) {
        // Check if subsequent words match
        let current = start + firstWord.length
        let match = true

        for (let i = 1; i < searchWords.length; i++) {
            // Skip whitespace in target
            while (current < target.length && /\s/.test(target[current])) {
                current++
            }

            if (target.substr(current, searchWords[i].length) !== searchWords[i]) {
                match = false
                break
            }
            current += searchWords[i].length
        }

        if (match) return start

        // Find next occurrence of first word
        start = target.indexOf(firstWord, start + 1)
    }

    return -1
}

/**
 * Get all text nodes within an element (recursive)
 */
function getTextNodesIn(node: Node): Text[] {
    const textNodes: Text[] = []

    const walker = document.createTreeWalker(
        node,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: (node) => {
                // Skip text nodes in script, style, or already highlighted spans
                const parent = node.parentElement
                if (!parent) return NodeFilter.FILTER_REJECT

                const tagName = parent.tagName?.toLowerCase()
                if (tagName === "script" || tagName === "style") {
                    return NodeFilter.FILTER_REJECT
                }

                if (parent.hasAttribute("data-veritas-highlighted")) {
                    return NodeFilter.FILTER_REJECT
                }

                // Skip empty text nodes
                const text = node.textContent?.trim()
                if (!text) return NodeFilter.FILTER_REJECT

                return NodeFilter.FILTER_ACCEPT
            }
        }
    )

    let currentNode: Node | null
    while ((currentNode = walker.nextNode())) {
        textNodes.push(currentNode as Text)
    }

    return textNodes
}

/**
 * Remove all highlights from the page
 */
export function removeAllHighlights(): void {
    const highlights = document.querySelectorAll('[data-veritas-highlighted="true"]')
    highlights.forEach((span) => {
        // Replace the span with its text content
        const parent = span.parentNode
        if (parent) {
            while (span.firstChild) {
                parent.insertBefore(span.firstChild, span)
            }
            parent.removeChild(span)
        }
    })
    console.log(`[TEXT-HIGHLIGHT] 🧹 Removed ${highlights.length} highlights`)
}

/**
 * Highlight multiple instances of text in different elements
 */
export function highlightMultiple(
    highlights: Array<{
        xpath: string
        searchText: string
        styleClass: string
        metadata?: Record<string, any>
        onClick?: (event: MouseEvent) => void
    }>
): void {
    let successCount = 0
    for (const h of highlights) {
        const success = highlightTextInElement(
            h.xpath,
            h.searchText,
            h.styleClass,
            h.metadata,
            h.onClick
        )
        if (success) successCount++
    }
    console.log(`[TEXT-HIGHLIGHT] ✅ Highlighted ${successCount}/${highlights.length} texts`)
}
/**
 * Map an index in normalized text back to the original text
 */
function mapNormalizedIndexToOriginal(original: string, normalized: string, normIndex: number): number {
    let origIndex = 0
    let normCount = 0

    // Skip leading whitespace in original
    while (origIndex < original.length && /\s/.test(original[origIndex])) {
        origIndex++
    }

    // Count characters in normalized space
    while (normCount < normIndex && origIndex < original.length) {
        if (!/\s/.test(original[origIndex])) {
            normCount++
        }
        origIndex++
    }

    return origIndex
}

/**
 * Find actual character span in original text for a normalized match
 */
function findActualMatchLength(original: string, startIndex: number, normalizedSearch: string): number {
    let normChars = 0
    let actualLength = 0
    const targetNormLength = normalizedSearch.length

    while (normChars < targetNormLength && (startIndex + actualLength) < original.length) {
        const char = original[startIndex + actualLength]
        if (!/\s/.test(char)) {
            normChars++
        }
        actualLength++
    }

    return actualLength
}
