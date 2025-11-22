/**
 * Content Extractor
 * Runs in the Content Script context to extract text and structure for agents.
 * This avoids using DOMParser in the Background Service Worker.
 */

export interface ExtractedNode {
    id: string // e.g., "[P:0]"
    tagName: string
    index: number
    text: string
    xpath: string
}

export interface PageContent {
    url: string
    title: string
    nodes: ExtractedNode[]
    fullText: string
    outputLanguage?: "English" | "Chinese"
}

/**
 * Extract relevant text content and structure from the current document
 */
export function extractPageContent(): PageContent {
    const nodes: ExtractedNode[] = []
    const processedElements = new Set<Element>()

    console.log("[EXTRACTOR] Starting comprehensive content extraction...")

    // Strategy 1: Get all semantic block elements
    const blockElements = document.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, blockquote, article, section")

    // Strategy 2: Also get divs/spans with substantial DIRECT text content
    const containers = document.querySelectorAll("div, span")

    console.log(`[EXTRACTOR] Found ${blockElements.length} block elements, ${containers.length} potential containers`)

    // Helper to check if element has substantial direct text
    const hasDirectText = (el: Element): boolean => {
        let directText = ""
        for (const node of el.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                directText += node.textContent || ""
            }
        }
        return directText.trim().length > 20
    }

    // Helper to check if element is inside another processed element
    const isInsideProcessed = (el: Element): boolean => {
        let current = el.parentElement
        while (current) {
            if (processedElements.has(current)) return true
            current = current.parentElement
        }
        return false
    }

    // First pass: Add all block elements
    blockElements.forEach((el, index) => {
        const text = el.textContent?.trim()
        if (!text || text.length < 20) return
        if (el.closest('script, style, noscript')) return

        processedElements.add(el)
        const xpath = getXPath(el)

        nodes.push({
            id: `[${el.tagName}:${index}]`,
            tagName: el.tagName,
            index: index,
            text: text.slice(0, 2000),
            xpath: xpath
        })
    })

    // Second pass: Add containers with direct text that aren't already processed
    let containerIndex = blockElements.length
    containers.forEach((el) => {
        if (processedElements.has(el)) return
        // DON'T check isInsideProcessed - we want to capture text from divs even if they contain <p> tags
        if (!hasDirectText(el)) return
        if (el.closest('script, style, noscript')) return

        const text = el.textContent?.trim()
        if (!text || text.length < 20) return

        processedElements.add(el)
        const xpath = getXPath(el)

        nodes.push({
            id: `[${el.tagName}:${containerIndex}]`,
            tagName: el.tagName,
            index: containerIndex,
            text: text.slice(0, 2000),
            xpath: xpath
        })
        containerIndex++
    })

    console.log(`[EXTRACTOR] Extracted ${nodes.length} text nodes (${blockElements.length} blocks + ${containerIndex - blockElements.length} containers)`)

    // Limit to avoid token overflow
    const limitedNodes = nodes.slice(0, 300)
    const fullText = limitedNodes.map(n => n.text).join("\n\n")

    console.log(`[EXTRACTOR] Final text length: ${fullText.length} characters`)

    return {
        url: window.location.href,
        title: document.title,
        nodes: limitedNodes,
        fullText: fullText
    }
}

/**
 * Find the closest block-level parent for an element
 */
function getClosestBlockParent(element: Element | null): Element | null {
    if (!element) return null

    const blockTags = new Set([
        "p", "h1", "h2", "h3", "h4", "h5", "h6",
        "li", "blockquote", "div", "article", "section",
        "main", "aside", "header", "footer"
    ])

    let current = element
    while (current && current !== document.body) {
        if (blockTags.has(current.tagName.toLowerCase())) {
            return current
        }
        current = current.parentElement as Element
    }

    return document.body // Fallback
}

/**
 * Generate a unique XPath for an element
 */
function getXPath(element: Element): string {
    if (element.id !== "") {
        return `//*[@id="${element.id}"]`
    }
    if (element === document.body) {
        return "/html/body"
    }

    let ix = 0
    const siblings = element.parentNode?.childNodes
    if (siblings) {
        for (let i = 0; i < siblings.length; i++) {
            const sibling = siblings[i]
            if (sibling === element) {
                return getXPath(element.parentNode as Element) + "/" + element.tagName.toLowerCase() + "[" + (ix + 1) + "]"
            }
            if (sibling.nodeType === 1 && (sibling as Element).tagName === element.tagName) {
                ix++
            }
        }
    }
    return ""
}
