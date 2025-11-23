/**
 * AGENT: SEARCH - General Information Retrieval
 * 
 * Powered by: Gemini 2.5 Flash + Google Search Grounding
 */

import { GeminiProvider, getGeminiAPIKey } from "~src/api/gemini-provider"
import { parseAIResponse } from "~src/lib/json-parser"
import { getLanguageInstruction } from "~src/lib/language-utils"

export interface SearchResult {
    answer: string
    sources: Array<{
        title: string
        url: string
        snippet: string
    }>
    memoryIndex?: string
    timestamp: number
}

/**
 * Perform a general web search using Gemini with Search Grounding
 */
export async function performWebSearch(
    query: string,
    outputLanguage: "English" | "Chinese" = "English"
): Promise<SearchResult> {
    console.log(`[SEARCH] 🔍 Starting web search for: "${query}"`)

    try {
        const apiKey = await getGeminiAPIKey()
        if (!apiKey) {
            throw new Error("No Gemini API key found")
        }

        const gemini = new GeminiProvider({
            apiKey,
            model: "gemini-2.5-flash",
            temperature: 1,
            maxTokens: 4096,
            useSearchGrounding: true
        })

        const languageInstruction = getLanguageInstruction(outputLanguage)

        const userPrompt = `
${languageInstruction}

USER QUERY: "${query}"

INSTRUCTIONS:
1. Search the web to answer the user's query.
2. Synthesize the information into a clear, concise answer.
3. Cite your sources.
4. DO NOT copy text verbatim. You must paraphrase and summarize.
5. Return the result in the following JSON format ONLY:

{
  "answer": "Your synthesized answer here...",
  "sources": [
    {
      "title": "Source Title",
      "url": "https://example.com",
      "snippet": "Relevant excerpt..."
    }
  ]
}
`

        console.log("[SEARCH] 🌐 Calling Gemini API with Search Grounding...")
        const response = await gemini.analyze(
            SEARCH_SYSTEM_PROMPT,
            userPrompt,
            false // No caching for simple search
        )

        console.log("[SEARCH] ✅ Response received")

        // Clean response
        const cleanResponse = response.replace(/```json\n?|\n?```/g, "").trim()

        let parsed: SearchResult

        // Strategy: Check if it looks like JSON
        if (cleanResponse.startsWith("{")) {
            try {
                parsed = parseAIResponse(cleanResponse, {
                    answer: "Failed to parse search results.",
                    sources: [],
                    memoryIndex: "Search Failed",
                    timestamp: Date.now()
                })
            } catch (e) {
                console.warn("[SEARCH] JSON parse failed despite starting with {, falling back to raw text")
                parsed = {
                    answer: cleanResponse,
                    sources: [],
                    memoryIndex: `Search: ${query.substring(0, 15)}...`,
                    timestamp: Date.now()
                }
            }
        } else {
            console.log("[SEARCH] Response is not JSON, treating as raw text answer")
            parsed = {
                answer: cleanResponse,
                sources: [],
                memoryIndex: `Search: ${query.substring(0, 15)}...`,
                timestamp: Date.now()
            }
        }

        // Enrich with grounding metadata if sources are missing
        if ((!parsed.sources || parsed.sources.length === 0) && gemini.lastGroundingMetadata) {
            console.log("[SEARCH] 🧩 Enriching results with Grounding Metadata sources")
            const chunks = gemini.lastGroundingMetadata.groundingChunks || []

            parsed.sources = chunks
                .filter((chunk: any) => chunk.web)
                .map((chunk: any) => ({
                    title: chunk.web.title || "Web Source",
                    url: chunk.web.uri || "",
                    snippet: "Source from Google Search Grounding"
                }))
        }

        return {
            answer: parsed.answer || "No answer found.",
            sources: parsed.sources || [],
            memoryIndex: parsed.memoryIndex || `Search: ${query.substring(0, 15)}...`,
            timestamp: Date.now()
        }

    } catch (error) {
        console.error("[SEARCH] ❌ Search failed:", error)
        return {
            answer: `Search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            sources: [],
            memoryIndex: "Search Failed",
            timestamp: Date.now()
        }
    }
}

const SEARCH_SYSTEM_PROMPT = `# SYSTEM: You are a Search Agent.
Your goal is to find accurate information from the web to answer user queries.

⚠️ CRITICAL: ANTI-PLAGIARISM & RECITATION PROTOCOL ⚠️
The "RECITATION" safety filter is ACTIVE. To avoid triggering it, you MUST follow these rules:

1.  **NO VERBATIM COPYING**: Never copy sentences or paragraphs directly from search results.
2.  **SYNTHESIZE & REWRITE**: Read the search results, understand the facts, and then write the answer *completely in your own words*.
3.  **STRUCTURAL CHANGE**: Do not just swap synonyms. Change the sentence structure and paragraph organization entirely.
4.  **SUMMARIZE**: Prefer concise summaries over long detailed excerpts.
5.  **QUOTES**: If you must quote, keep it under 10 words and use quotation marks.

If you trigger the RECITATION filter, the user gets NO ANSWER. Better to be brief and original than detailed and blocked.

Always return your response in valid JSON format.
`
