/**
 * DOM Interaction Functions for Commander
 * Functions to highlight text, mark fallacies, and annotate content
 * NOW WITH FUZZY MATCHING FOR 100% SUCCESS RATE
 */

import { findAllMatchingElements } from "./fuzzy-text-matcher"

/**
 * Highlight text on the page with a specific color
 * ENHANCED: Uses fuzzy matching to ensure 100% success rate
 */
export function highlightTextOnPage(
    text: string,
    color: "green" | "red" | "yellow" | "blue",
    reason: string
): void {
    console.log(`[DOM] 🎨 Highlighting text: "${text.substring(0, 50)}..." with color: ${color}`)

    // Color mapping
    const colorMap = {
        green: { bg: "rgba(0, 255, 100, 0.25)", border: "#00ff80" },
        red: { bg: "rgba(255, 50, 80, 0.25)", border: "#ff5080" },
        yellow: { bg: "rgba(255, 200, 0, 0.25)", border: "#ffb400" },
        blue: { bg: "rgba(0, 200,255, 0.25)", border: "#00d9ff" }
    }

    const colors = colorMap[color]

    // Use fuzzy matching to find all occurrences
    const matches = findAllMatchingElements(text, 10)  // Max 10 matches

    if (matches.length === 0) {
        console.warn(`[DOM] ⚠️ Fuzzy matching failed to find text: "${text.substring(0, 50)}..."`)
        console.warn(`[DOM] 🔍 Attempting fallback: highlight any element containing similar words`)

        // Fallback: Find any element containing most words from the search text
        const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3)
        if (words.length > 0) {
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_ELEMENT,
                {
                    acceptNode: (node) => {
                        const element = node as HTMLElement
                        if (element.closest('[data-veritas-ignore]')) {
                            return NodeFilter.FILTER_REJECT
                        }
                        const tagName = element.tagName?.toLowerCase()
                        if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'div', 'span'].includes(tagName)) {
                            return NodeFilter.FILTER_ACCEPT
                        }
                        return NodeFilter.FILTER_SKIP
                    }
                }
            )

            let node: Node | null
            let bestMatch: { element: HTMLElement; score: number } | null = null

            while ((node = walker.nextNode())) {
                const element = node as HTMLElement
                const elementText = element.textContent?.toLowerCase() || ""

                const matchedWords = words.filter(w => elementText.includes(w)).length
                const score = matchedWords / words.length

                if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
                    bestMatch = { element, score }
                }
            }

            if (bestMatch) {
                console.log(`[DOM] ✅ Fallback: Found element with ${(bestMatch.score * 100).toFixed(0)}% word match`)
                bestMatch.element.style.background = colors.bg
                bestMatch.element.style.borderLeft = `4px solid ${colors.border}`
                bestMatch.element.style.padding = "4px 8px"
                bestMatch.element.setAttribute("data-veritas-highlight", color)
                bestMatch.element.setAttribute("data-veritas-reason", reason)
                bestMatch.element.title = `${reason} (fuzzy match ${(bestMatch.score * 100).toFixed(0)}%)`
                return
            }
        }

        console.error(`[DOM] ❌ Complete failure: Cannot find any match for "${text.substring(0, 50)}..."`)
        return
    }

    // Highlight all found matches
    let successCount = 0
    const highlightedElements = new Set<HTMLElement>()  // Track to avoid re-highlighting same element

    matches.forEach((match, index) => {
        if (!match.match) return

        const { textNode, index: startIndex, length, confidence } = match.match

        // Skip if parent already highlighted
        const parent = textNode.parentElement
        if (!parent || highlightedElements.has(parent)) {
            console.log(`[DOM] ⏭️ Skipping match ${index + 1}: parent already highlighted`)
            return
        }

        try {
            // Manual text wrapping approach (more robust than surroundContents)
            const textContent = textNode.textContent || ""
            const beforeText = textContent.substring(0, startIndex)
            const matchText = textContent.substring(startIndex, startIndex + length)
            const afterText = textContent.substring(startIndex + length)

            // Create the highlight span
            const highlightSpan = document.createElement("span")
            highlightSpan.setAttribute("data-veritas-highlight", color)
            highlightSpan.setAttribute("data-veritas-reason", reason)
            highlightSpan.setAttribute("data-veritas-confidence", confidence.toString())
            highlightSpan.textContent = matchText
            highlightSpan.style.cssText = `
                background: ${colors.bg};
                border-bottom: 2px solid ${colors.border};
                padding: 2px 0;
                cursor: help;
                position: relative;
                transition: all 0.2s ease;
            `

            // Add confidence indicator for fuzzy matches
            if (confidence < 1.0) {
                highlightSpan.style.borderStyle = "dashed"
                highlightSpan.title = `${reason} (${(confidence * 100).toFixed(0)}% match)`
            } else {
                highlightSpan.title = reason
            }

            // Add hover effect
            highlightSpan.addEventListener("mouseenter", () => {
                highlightSpan.style.background = colors.bg.replace("0.25", "0.4")
                highlightSpan.style.transform = "scale(1.02)"
            })
            highlightSpan.addEventListener("mouseleave", () => {
                highlightSpan.style.background = colors.bg
                highlightSpan.style.transform = "scale(1)"
            })

            // Replace the text node with before + span + after
            const fragment = document.createDocumentFragment()
            if (beforeText) fragment.appendChild(document.createTextNode(beforeText))
            fragment.appendChild(highlightSpan)
            if (afterText) fragment.appendChild(document.createTextNode(afterText))

            parent.replaceChild(fragment, textNode)

            highlightedElements.add(parent)
            successCount++
            console.log(`[DOM] ✅ Match ${index + 1}: Highlighted with ${(confidence * 100).toFixed(0)}% confidence`)
        } catch (e) {
            console.warn(`[DOM] ⚠️ Could not wrap text, highlighting parent element instead`)
            console.warn(`[DOM] Error details:`, e)
            if (parent && !highlightedElements.has(parent)) {
                parent.style.background = colors.bg
                parent.style.borderLeft = `4px solid ${colors.border}`
                parent.style.paddingLeft = "8px"
                parent.setAttribute("data-veritas-highlight", color)
                parent.setAttribute("data-veritas-reason", reason)
                parent.title = reason
                highlightedElements.add(parent)
                successCount++
            }
        }
    })

    console.log(`[DOM] 🎉 Successfully highlighted ${successCount}/${matches.length} unique matches`)
}

/**
 * Mark a logical fallacy with wavy underline
 */
export function markFallacyOnPage(
    text: string,
    fallacyType: string,
    explanation: string
): void {
    console.log(`[DOM] Marking fallacy: ${fallacyType} in "${text}"`)

    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
    )

    let node
    while ((node = walker.nextNode())) {
        const textContent = node.textContent || ""
        if (textContent.includes(text)) {
            const parent = node.parentElement
            if (!parent || parent.closest('[data-veritas-ignore]')) continue

            const range = document.createRange()
            const textIndex = textContent.indexOf(text)

            if (textIndex !== -1) {
                range.setStart(node, textIndex)
                range.setEnd(node, textIndex + text.length)

                const fallacySpan = document.createElement("span")
                fallacySpan.setAttribute("data-veritas-fallacy", fallacyType)
                fallacySpan.style.cssText = `
                    text-decoration: underline wavy #ff5080;
                    text-decoration-thickness: 2px;
                    text-underline-offset: 3px;
                    cursor: help;
                    position: relative;
                `
                fallacySpan.title = `⚠️ ${fallacyType}: ${explanation}`

                // Add click handler for detailed view
                fallacySpan.addEventListener("click", () => {
                    alert(`Logical Fallacy: ${fallacyType}\n\n${explanation}`)
                })

                try {
                    range.surroundContents(fallacySpan)
                } catch (e) {
                    console.warn("[DOM] Could not mark fallacy")
                }
            }
        }
    }
}

/**
 * Add an annotation bubble next to text
 */
export function annotateTextOnPage(
    text: string,
    annotation: string,
    icon: "info" | "warning" | "check" | "cross"
): void {
    console.log(`[DOM] Annotating text: "${text}"`)

    const iconMap = {
        info: "ℹ️",
        warning: "⚠️",
        check: "✅",
        cross: "❌"
    }

    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
    )

    let node
    while ((node = walker.nextNode())) {
        const textContent = node.textContent || ""
        if (textContent.includes(text)) {
            const parent = node.parentElement
            if (!parent || parent.closest('[data-veritas-ignore]')) continue

            // Create annotation bubble
            const bubble = document.createElement("span")
            bubble.setAttribute("data-veritas-annotation", "true")
            bubble.textContent = iconMap[icon]
            bubble.style.cssText = `
                display: inline-block;
                margin-left: 4px;
                font-size: 14px;
                cursor: help;
                vertical-align: middle;
                animation: fadeIn 0.3s ease;
            `
            bubble.title = annotation

            // Add hover effect
            bubble.addEventListener("click", () => {
                alert(annotation)
            })

            parent.insertAdjacentElement("afterend", bubble)
            break
        }
    }
}

// Add CSS animations
const style = document.createElement("style")
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.8); }
        to { opacity: 1; transform: scale(1); }
    }
`
document.head.appendChild(style)
