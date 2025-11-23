/**
 * XPath Utilities - Surgical DOM Navigation
 * Enables precise element targeting across dynamic page mutations
 */

/**
 * Generate a unique XPath for any DOM node
 * @param element - The target DOM element
 * @returns XPath string that uniquely identifies the element
 */
export function generateXPath(element: Node): string {
    if (element.nodeType !== Node.ELEMENT_NODE) {
        return ""
    }

    const el = element as Element

    // If element has an ID, use it for simplicity
    if (el.id) {
        return `//*[@id="${el.id}"]`
    }

    const parts: string[] = []
    let currentElement: Element | null = el

    while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
        let index = 0
        let sibling: Element | null = currentElement.previousElementSibling

        // Count preceding siblings with the same tag name
        while (sibling) {
            if (sibling.nodeName === currentElement.nodeName) {
                index++
            }
            sibling = sibling.previousElementSibling
        }

        const tagName = currentElement.nodeName.toLowerCase()
        const pathIndex = index > 0 ? `[${index + 1}]` : ""
        parts.unshift(tagName + pathIndex)

        currentElement = currentElement.parentElement
    }

    return parts.length ? "/" + parts.join("/") : ""
}

/**
 * Resolve an XPath back to a live DOM element
 * @param xpath - The XPath string
 * @param root - Root element to search from (default: document)
 * @returns The resolved element or null
 */
export function resolveXPath(
    xpath: string,
    root: Document | Element = document
): Element | null {
    if (!xpath) return null // Fail gracefully for empty strings

    try {
        const result = document.evaluate(
            xpath,
            root,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        )
        return result.singleNodeValue as Element | null
    } catch (error) {
        console.error("XPath resolution failed:", xpath, error)
        return null
    }
}

/**
 * Resolve multiple XPaths at once
 * @param xpaths - Array of XPath strings
 * @returns Map of XPath to resolved element
 */
export function resolveXPaths(xpaths: string[]): Map<string, Element | null> {
    const results = new Map<string, Element | null>()

    for (const xpath of xpaths) {
        results.set(xpath, resolveXPath(xpath))
    }

    return results
}

/**
 * Generate a more robust XPath using multiple attributes
 * Fallback for when simple XPath fails due to DOM changes
 */
export function generateRobustXPath(element: Element): string {
    const attributes: string[] = []

    // Collect identifying attributes
    if (element.className) {
        const classes = Array.from(element.classList).slice(0, 3) // Limit to 3 classes
        if (classes.length > 0) {
            attributes.push(`contains(@class, "${classes[0]}")`)
        }
    }

    if (element.getAttribute("data-id")) {
        attributes.push(`@data-id="${element.getAttribute("data-id")}"`)
    }

    if (element.getAttribute("aria-label")) {
        attributes.push(`@aria-label="${element.getAttribute("aria-label")}"`)
    }

    const tagName = element.tagName.toLowerCase()
    const attrString = attributes.length > 0 ? `[${attributes.join(" and ")}]` : ""

    return `//${tagName}${attrString}`
}

/**
 * Find the closest text node to an element
 * Useful for precise text manipulation
 */
export function findTextNode(element: Element): Text | null {
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: (node) => {
                // Skip whitespace-only nodes
                if (node.textContent && node.textContent.trim().length > 0) {
                    return NodeFilter.FILTER_ACCEPT
                }
                return NodeFilter.FILTER_REJECT
            }
        }
    )

    return walker.nextNode() as Text | null
}

/**
 * Get all text nodes within an element
 */
export function getAllTextNodes(element: Element): Text[] {
    const textNodes: Text[] = []
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: (node) => {
                if (node.textContent && node.textContent.trim().length > 0) {
                    return NodeFilter.FILTER_ACCEPT
                }
                return NodeFilter.FILTER_REJECT
            }
        }
    )

    let node: Node | null
    while ((node = walker.nextNode())) {
        textNodes.push(node as Text)
    }

    return textNodes
}

/**
 * Check if an element is still in the DOM
 */
export function isElementInDOM(element: Element): boolean {
    return document.contains(element)
}

/**
 * Wait for an element to appear in the DOM (for dynamic content)
 */
export function waitForElement(
    xpath: string,
    timeout = 5000
): Promise<Element | null> {
    return new Promise((resolve) => {
        const element = resolveXPath(xpath)
        if (element) {
            resolve(element)
            return
        }

        const observer = new MutationObserver(() => {
            const el = resolveXPath(xpath)
            if (el) {
                observer.disconnect()
                resolve(el)
            }
        })

        observer.observe(document.body, {
            childList: true,
            subtree: true
        })

        // Timeout
        setTimeout(() => {
            observer.disconnect()
            resolve(null)
        }, timeout)
    })
}
/**
 * Find an element containing specific text (fallback for broken XPaths)
 * Uses a TreeWalker to find the text node, then returns its parent
 */
export function findElementByText(text: string, root: Element = document.body): Element | null {
    if (!text || text.length < 10) return null

    // Normalize search text
    const normalizedSearch = text.replace(/\s+/g, ' ').trim()

    const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: (node) => {
                if (node.textContent && node.textContent.length > 0) {
                    return NodeFilter.FILTER_ACCEPT
                }
                return NodeFilter.FILTER_REJECT
            }
        }
    )

    let node: Node | null
    while ((node = walker.nextNode())) {
        const nodeText = (node.textContent || "").replace(/\s+/g, ' ')
        if (nodeText.includes(normalizedSearch)) {
            return node.parentElement
        }
    }

    return null
}

/**
 * Check if two XPaths refer to the same logical element (e.g. parent/child relationship)
 * Ignores text node suffixes for comparison
 */
export function areXpathsRelated(xpath1: string, xpath2: string): boolean {
    if (!xpath1 || !xpath2) return false
    if (xpath1 === xpath2) return true

    // Normalize: remove /text()[n] suffix
    const norm1 = xpath1.replace(/\/text\(\)\[\d+\]$/, "")
    const norm2 = xpath2.replace(/\/text\(\)\[\d+\]$/, "")

    if (norm1 === norm2) return true

    // Check parent/child relationship
    // xpath1 is child of xpath2
    if (norm1.startsWith(norm2 + "/")) return true
    // xpath2 is child of xpath1
    if (norm2.startsWith(norm1 + "/")) return true

    return false
}
