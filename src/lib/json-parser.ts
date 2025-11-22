/**
 * Robust JSON Parser for AI Responses
 * Handles common issues with LLM-generated JSON
 */

/**
 * Attempt to parse JSON with automatic error recovery
 */
export function parseAIResponse<T>(response: string, fallback: T): T {
    // Step 1: Try direct parsing first
    try {
        return JSON.parse(response)
    } catch (firstError) {
        console.warn("[JSON Parser] Initial parse failed, attempting recovery...")
    }

    // Step 2: Clean the response
    let cleaned = response.trim()

    // Remove markdown code fences if present
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/, "")

    // Try parsing cleaned version
    try {
        return JSON.parse(cleaned)
    } catch (secondError) {
        console.warn("[JSON Parser] Cleaned parse failed, attempting advanced recovery...")
    }

    // Step 3: Advanced recovery - fix common issues
    try {
        // Fix common escape sequence issues
        cleaned = fixEscapeSequences(cleaned)

        // Fix unterminated strings at end of JSON
        cleaned = fixUnterminatedStrings(cleaned)

        // Try parsing after fixes
        return JSON.parse(cleaned)
    } catch (thirdError) {
        console.warn("[JSON Parser] Advanced recovery failed, attempting truncation recovery...")
    }

    // Step 4: Truncation recovery - try to extract valid portion
    try {
        const recovered = recoverTruncatedJSON(cleaned)
        if (recovered !== cleaned) {
            console.log(`[JSON Parser] Truncated from ${cleaned.length} to ${recovered.length} characters`)
        }
        return JSON.parse(recovered)
    } catch (fourthError) {
        console.error("[JSON Parser] All recovery attempts failed:", fourthError)

        // Log the problematic area
        const errorMatch = fourthError.message.match(/position (\d+)/)
        if (errorMatch) {
            const position = parseInt(errorMatch[1])
            const start = Math.max(0, position - 100)
            const end = Math.min(cleaned.length, position + 100)
            console.error("[JSON Parser] Problematic section:", cleaned.substring(start, end))
            console.error("[JSON Parser] Error at position:", position, "char:", cleaned[position])
        }

        console.error("[JSON Parser] Original response (first 500 chars):", response.substring(0, 500))
        console.error("[JSON Parser] Original response (last 500 chars):", response.substring(Math.max(0, response.length - 500)))
        return fallback
    }
}

/**
 * Fix common escape sequence issues in JSON strings
 */
function fixEscapeSequences(json: string): string {
    // Replace common problematic sequences
    return json
        .replace(/\\'/g, "'")  // Unnecessary escaped single quotes
        .replace(/([^\\])\\([^"\\\/bfnrtu])/g, "$1$2")  // Invalid escape sequences
}

/**
 * Attempt to fix unterminated strings at the end of JSON
 */
function fixUnterminatedStrings(json: string): string {
    // Check if the JSON ends with an unterminated string
    const lastQuoteIndex = json.lastIndexOf('"')
    if (lastQuoteIndex === -1) return json

    // Count quotes to see if we have an odd number (unterminated)
    const beforeQuote = json.substring(0, lastQuoteIndex)
    const quoteCount = (beforeQuote.match(/(?<!\\)"/g) || []).length

    if (quoteCount % 2 === 0) {
        // Odd total number of quotes (even before + 1 last) = unterminated
        // Try to close it intelligently
        let fixed = json.substring(0, lastQuoteIndex + 1)

        // Add closing quote if needed
        if (!json.substring(lastQuoteIndex + 1).includes('"')) {
            fixed += '"'
        }

        // Try to close any open objects/arrays
        const openBraces = (fixed.match(/\{/g) || []).length
        const closeBraces = (fixed.match(/\}/g) || []).length
        const openBrackets = (fixed.match(/\[/g) || []).length
        const closeBrackets = (fixed.match(/\]/g) || []).length

        // Close arrays first, then objects
        fixed += ']'.repeat(Math.max(0, openBrackets - closeBrackets))
        fixed += '}'.repeat(Math.max(0, openBraces - closeBraces))

        return fixed
    }

    return json
}

/**
 * Attempt to recover truncated JSON by finding the last valid closing brace
 */
function recoverTruncatedJSON(json: string): string {
    // Strategy 1: Find all positions where depth becomes 0
    const validPositions: number[] = []
    let depth = 0
    let inString = false
    let escape = false

    for (let i = 0; i < json.length; i++) {
        const char = json[i]

        if (escape) {
            escape = false
            continue
        }

        if (char === '\\') {
            escape = true
            continue
        }

        if (char === '"') {
            inString = !inString
            continue
        }

        if (inString) continue

        if (char === '{' || char === '[') {
            depth++
        } else if (char === '}' || char === ']') {
            depth--
            if (depth === 0) {
                validPositions.push(i + 1)
            }
        }
    }

    // Try each valid position from the end
    for (let i = validPositions.length - 1; i >= 0; i--) {
        const position = validPositions[i]
        const candidate = json.substring(0, position)

        try {
            JSON.parse(candidate)
            console.log(`[JSON Parser] Found valid JSON at position ${position}/${json.length}`)
            return candidate
        } catch (e) {
            // This position didn't work, try the next one
            continue
        }
    }

    // Strategy 2: If no valid position found, try aggressive cleanup
    console.log("[JSON Parser] No valid position found, attempting aggressive cleanup")

    // Remove trailing commas, incomplete tokens, etc.
    let cleaned = json.trim()

    // Remove any trailing incomplete JSON
    cleaned = cleaned.replace(/,\s*$/, '') // trailing comma
    cleaned = cleaned.replace(/:\s*$/, '') // trailing colon
    cleaned = cleaned.replace(/,\s*[}\]]/, '}') // comma before closing

    // Count braces and brackets
    const openBraces = (cleaned.match(/\{/g) || []).length
    const closeBraces = (cleaned.match(/\}/g) || []).length
    const openBrackets = (cleaned.match(/\[/g) || []).length
    const closeBrackets = (cleaned.match(/\]/g) || []).length

    // Close arrays and objects
    cleaned += ']'.repeat(Math.max(0, openBrackets - closeBrackets))
    cleaned += '}'.repeat(Math.max(0, openBraces - closeBraces))

    return cleaned
}
