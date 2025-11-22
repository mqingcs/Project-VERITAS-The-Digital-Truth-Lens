/**
 * Fuzzy Text Matching Utilities
 * Provides intelligent text matching to ensure 100% highlight success rate
 */

/**
 * Strategy 1: Exact match with normalization
 */
function normalizeText(text: string): string {
    return text
        .trim()
        .replace(/\s+/g, ' ')  // Collapse multiple spaces
        .replace(/[""]/g, '"')  // Normalize quotes
        .replace(/['']/g, "'")  // Normalize apostrophes
        .toLowerCase()
}

/**
 * Strategy 2: Find best substring match using sliding window
 */
function findBestSubstringMatch(haystack: string, needle: string, threshold: number = 0.7): {
    index: number
    length: number
    score: number
} | null {
    const needleNorm = normalizeText(needle)
    const needleWords = needleNorm.split(/\s+/).filter(w => w.length > 0)

    if (needleWords.length === 0) return null

    let bestMatch: { index: number; length: number; score: number } | null = null

    // Try to find a sequence of words that match
    const haystackNorm = normalizeText(haystack)
    const haystackWords = haystackNorm.split(/\s+/)

    for (let i = 0; i <= haystackWords.length - needleWords.length; i++) {
        const windowWords = haystackWords.slice(i, i + needleWords.length)
        const matchedWords = windowWords.filter((w, idx) => w === needleWords[idx]).length
        const score = matchedWords / needleWords.length

        if (score >= threshold) {
            // Find the actual position in the original text
            const windowText = windowWords.join(' ')
            const startIndex = haystackNorm.indexOf(windowText)

            if (startIndex !== -1 && (!bestMatch || score > bestMatch.score)) {
                bestMatch = {
                    index: mapNormalizedIndexToOriginal(haystack, haystackNorm, startIndex),
                    length: mapNormalizedLengthToOriginal(haystack, startIndex, windowText.length),
                    score
                }
            }
        }
    }

    return bestMatch
}

/**
 * Strategy 3: N-gram based partial matching
 */
function findPartialMatch(haystack: string, needle: string, minNgramSize: number = 15): {
    index: number
    length: number
    score: number
} | null {
    // Adaptive n-gram size based on text length
    const adaptiveNgramSize = Math.max(3, Math.min(minNgramSize, Math.floor(needle.length * 0.3)))
    if (adaptiveNgramSize < 3) return null

    const needleNorm = normalizeText(needle)
    const haystackNorm = normalizeText(haystack)

    // For very short needles, try exact substring match first
    if (needleNorm.length <= 10) {
        const idx = haystackNorm.indexOf(needleNorm)
        if (idx !== -1) {
            return {
                index: mapNormalizedIndexToOriginal(haystack, haystackNorm, idx),
                length: mapNormalizedLengthToOriginal(haystack, idx, needleNorm.length),
                score: 1.0
            }
        }
    }

    // Extract n-grams from needle
    const ngrams: string[] = []
    for (let i = 0; i <= needleNorm.length - adaptiveNgramSize; i++) {
        ngrams.push(needleNorm.substring(i, i + adaptiveNgramSize))
    }

    // Find which n-gram appears in haystack
    for (const ngram of ngrams) {
        const idx = haystackNorm.indexOf(ngram)
        if (idx !== -1) {
            // Found a partial match - try to extend it
            let start = idx
            let end = idx + ngram.length

            // Try to extend backwards
            while (start > 0 && haystackNorm[start - 1] === needleNorm[start - idx - 1]) {
                start--
            }

            // Try to extend forwards
            while (end < haystackNorm.length && (end - idx) < needleNorm.length &&
                haystackNorm[end] === needleNorm[end - idx]) {
                end++
            }

            const matchLength = end - start
            const score = matchLength / needleNorm.length

            return {
                index: mapNormalizedIndexToOriginal(haystack, haystackNorm, start),
                length: mapNormalizedLengthToOriginal(haystack, start, matchLength),
                score
            }
        }
    }

    return null
}

/**
 * Strategy 4: First/last word anchoring
 */
function findAnchoredMatch(haystack: string, needle: string): {
    index: number
    length: number
    score: number
} | null {
    const needleNorm = normalizeText(needle)
    const needleWords = needleNorm.split(/\s+/).filter(w => w.length > 2)

    if (needleWords.length < 2) return null

    const firstWord = needleWords[0]
    const lastWord = needleWords[needleWords.length - 1]
    const haystackNorm = normalizeText(haystack)

    // Find first word
    const firstIndex = haystackNorm.indexOf(firstWord)
    if (firstIndex === -1) return null

    // Find last word after first word
    const lastIndex = haystackNorm.indexOf(lastWord, firstIndex + firstWord.length)
    if (lastIndex === -1) return null

    const matchLength = (lastIndex - firstIndex) + lastWord.length
    return {
        index: mapNormalizedIndexToOriginal(haystack, haystackNorm, firstIndex),
        length: mapNormalizedLengthToOriginal(haystack, firstIndex, matchLength),
        score: 0.6  // Lower confidence for anchored match
    }
}

/**
 * Map index in normalized text back to original text
 */
function mapNormalizedIndexToOriginal(original: string, normalized: string, normIndex: number): number {
    let origIdx = 0
    let normIdx = 0
    let inWhitespace = false

    while (origIdx < original.length && normIdx < normIndex) {
        const char = original[origIdx]
        const isWhitespace = /\s/.test(char)

        if (isWhitespace) {
            if (!inWhitespace) {
                normIdx++ // Count first whitespace
                inWhitespace = true
            }
            // Skip subsequent whitespace
        } else {
            normIdx++
            inWhitespace = false
        }

        origIdx++
    }

    return origIdx
}

/**
 * Map length in normalized text to original text
 */
function mapNormalizedLengthToOriginal(original: string, startIndex: number, normalizedLength: number): number {
    let length = 0
    let normLength = 0
    let inWhitespace = false

    while ((startIndex + length) < original.length && normLength < normalizedLength) {
        const char = original[startIndex + length]
        const isWhitespace = /\s/.test(char)

        if (isWhitespace) {
            if (!inWhitespace) {
                normLength++
                inWhitespace = true
            }
        } else {
            normLength++
            inWhitespace = false
        }

        length++
    }

    return length
}

/**
 * Main function: Find text in element using multiple strategies
 */
export function findTextInElement(element: HTMLElement, searchText: string): {
    textNode: Text
    index: number
    length: number
    confidence: number
} | null {
    const textNodes = getTextNodesIn(element)

    for (const textNode of textNodes) {
        const text = textNode.textContent || ""

        // Strategy 1: Exact match
        const exactMatch = text.indexOf(searchText)
        if (exactMatch !== -1) {
            return {
                textNode,
                index: exactMatch,
                length: searchText.length,
                confidence: 1.0
            }
        }

        // Strategy 2: Normalized exact match
        const normText = normalizeText(text)
        const normSearch = normalizeText(searchText)
        const normMatch = normText.indexOf(normSearch)
        if (normMatch !== -1) {
            return {
                textNode,
                index: mapNormalizedIndexToOriginal(text, normText, normMatch),
                length: mapNormalizedLengthToOriginal(text, normMatch, normSearch.length),
                confidence: 0.95
            }
        }

        // Strategy 3: Best substring match
        const substringMatch = findBestSubstringMatch(text, searchText)
        if (substringMatch && substringMatch.score >= 0.8) {
            return {
                textNode,
                index: substringMatch.index,
                length: substringMatch.length,
                confidence: substringMatch.score
            }
        }

        // Strategy 4: Partial n-gram match
        const partialMatch = findPartialMatch(text, searchText)
        if (partialMatch && partialMatch.score >= 0.6) {
            return {
                textNode,
                index: partialMatch.index,
                length: partialMatch.length,
                confidence: partialMatch.score
            }
        }

        // Strategy 5: Anchored match (first/last words)
        const anchoredMatch = findAnchoredMatch(text, searchText)
        if (anchoredMatch) {
            return {
                textNode,
                index: anchoredMatch.index,
                length: anchoredMatch.length,
                confidence: anchoredMatch.score
            }
        }
    }

    return null
}

/**
 * Get all text nodes within an element
 */
function getTextNodesIn(node: Node): Text[] {
    const textNodes: Text[] = []
    const walker = document.createTreeWalker(
        node,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: (node) => {
                const parent = node.parentElement
                if (!parent) return NodeFilter.FILTER_REJECT

                const tagName = parent.tagName?.toLowerCase()
                if (tagName === "script" || tagName === "style") {
                    return NodeFilter.FILTER_REJECT
                }

                if (parent.closest('[data-veritas-ignore]') ||
                    parent.closest('[data-veritas-highlight]')) {
                    return NodeFilter.FILTER_REJECT
                }

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
 * Find all matching elements on the page
 */
export function findAllMatchingElements(searchText: string, maxMatches: number = 10): Array<{
    element: HTMLElement
    match: ReturnType<typeof findTextInElement>
}> {
    const results: Array<{ element: HTMLElement; match: ReturnType<typeof findTextInElement> }> = []
    const processedTextNodes = new Set<Text>()  // Track to avoid duplicates

    // Get all paragraph-like elements
    const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, div, span, td, th')

    for (const el of Array.from(elements)) {
        if (results.length >= maxMatches) break

        const element = el as HTMLElement

        // Skip if element is too small
        const text = element.textContent || ""
        if (text.length < searchText.length * 0.5) continue

        const match = findTextInElement(element, searchText)

        if (match && !processedTextNodes.has(match.textNode)) {
            results.push({ element, match })
            processedTextNodes.add(match.textNode)
        }
    }

    console.log(`[FUZZY-MATCHER] Found ${results.length} unique matches for "${searchText.substring(0, 50)}..."`)
    results.forEach((r, i) => {
        if (r.match) {
            console.log(`[FUZZY-MATCHER]   Match ${i + 1}: confidence=${r.match.confidence.toFixed(2)}, text="${r.match.textNode.textContent?.substring(r.match.index, r.match.index + 50)}..."`)
        }
    })

    return results
}
