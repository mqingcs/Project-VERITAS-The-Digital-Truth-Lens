/**
 * Gemini API Provider - Official Google GenAI SDK Integration
 * 
 * Note: Google Search grounding is achieved through prompt engineering
 * The SDK will automatically use search when the model determines it's needed
 */

import { GoogleGenAI } from "@google/genai"
import type { IModelProvider } from "~src/types/api"

export class GeminiProvider implements IModelProvider {
    private client: GoogleGenAI
    private model: string
    private temperature: number
    private maxTokens: number
    private useSearchGrounding: boolean
    private responseSchema?: any
    private cachedContent?: string // Store cache name if using context caching

    constructor(config: {
        apiKey?: string
        model?: string
        temperature?: number
        maxTokens?: number
        useSearchGrounding?: boolean
        responseSchema?: any
    }) {
        // Initialize Gemini client
        this.client = new GoogleGenAI(config.apiKey ? { apiKey: config.apiKey } : {})

        this.model = config.model || "gemini-2.5-flash"
        this.temperature = config.temperature || 0.3
        this.maxTokens = config.maxTokens || 8192
        this.useSearchGrounding = config.useSearchGrounding || false
        this.responseSchema = config.responseSchema
    }

    /**
     * Create a cached system instruction for reuse
     * Only call this if the system instruction is large (>4096 tokens for 2.5 Pro)
     */
    async createCache(systemInstruction: string, ttlSeconds: number = 3600): Promise<void> {
        try {
            const cacheConfig: any = {
                model: this.model,
                config: {
                    systemInstruction,
                    ttl: `${ttlSeconds}s`
                }
            }

            // CRITICAL: Add tools to cache, not to generateContent
            if (this.useSearchGrounding) {
                cacheConfig.config.tools = [{ googleSearch: {} }]
                console.log("[Gemini Provider] Adding search grounding to cache")
            }

            const cache = await this.client.caches.create(cacheConfig)
            this.cachedContent = cache.name
            console.log(`[Gemini Provider] Cache created: ${cache.name} (TTL: ${ttlSeconds}s)`)
        } catch (error) {
            console.error("[Gemini Provider] Failed to create cache:", error)
            // Continue without cache
        }
    }

    /**
     * Analyze content with Gemini
     * @param systemInstruction - System prompt/instruction (will be cached if large)
     * @param userContent - User content to analyze
     * @param useCache - Whether to create/use cache for system instruction
     * @returns JSON response from model
     */
    async analyze(
        systemInstruction: string,
        userContent: string,
        useCache: boolean = false
    ): Promise<string> {
        try {
            // If caching is requested and cache doesn't exist, create it
            if (useCache && !this.cachedContent) {
                await this.createCache(systemInstruction)
            }

            // Configure generation
            const config: any = {
                temperature: this.temperature,
                maxOutputTokens: this.maxTokens
            }

            // Use cached content if available
            if (this.cachedContent) {
                config.cachedContent = this.cachedContent
                console.log("[Gemini Provider] Using cached system instruction")
                // CRITICAL: Do NOT set systemInstruction or tools when using cache
                // They are already in the cached content
            } else {
                // Only set these if NOT using cache
                if (systemInstruction) {
                    config.systemInstruction = systemInstruction
                }

                // Add Google Search tool if enabled (only when not using cache)
                if (this.useSearchGrounding) {
                    config.tools = [{ googleSearch: {} }]
                    console.log("[Gemini Provider] Search grounding enabled")
                }
            }

            // CRITICAL: Add safety settings to prevent RECITATION blocks
            // This allows the AI to cite sources and provide factual information
            config.safetySettings = [
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "OFF"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "OFF"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "OFF"
                },
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "OFF"
                },
                {
                    category: "HARM_CATEGORY_CIVIC_INTEGRITY",
                    threshold: "OFF"
                }
            ]

            // CRITICAL: Gemini API limitation
            // Search Grounding (tools) is INCOMPATIBLE with responseMimeType: "application/json"
            // When using search, we must rely on prompt engineering to get JSON output
            if (this.useSearchGrounding) {
                // Do NOT set responseMimeType when using search grounding
                // The AI will return natural language containing JSON based on the prompt
                console.log("[Gemini Provider] Search Grounding enabled - relying on prompt for JSON format")
            } else if (this.responseSchema) {
                // When NOT using search: Use strict schema enforcement
                config.responseMimeType = "application/json"
                config.responseSchema = this.responseSchema
                console.log("[Gemini Provider] Using responseSchema for structured output")
            } else if (!this.cachedContent) {
                // Fallback: Request JSON without schema
                config.responseMimeType = "application/json"
                console.log("[Gemini Provider] Requesting JSON without schema (fallback)")
            }

            // Log request details for debugging
            console.log("[Gemini Provider] Request config:", {
                model: this.model,
                temperature: config.temperature,
                maxOutputTokens: config.maxOutputTokens,
                hasSearchGrounding: !!config.tools,
                hasCachedContent: !!config.cachedContent,
                hasResponseSchema: !!config.responseSchema,
                responseMimeType: config.responseMimeType,
                contentLength: userContent.length,
                contentPreview: userContent.substring(0, 200)
            })

            // Call API with proper structure and retry logic
            let response;
            let retries = 2;
            while (retries >= 0) {
                try {
                    response = await this.client.models.generateContent({
                        model: this.model,
                        contents: userContent, // User content only, not mixed with system instruction
                        config
                    })
                    break; // Success, exit loop
                } catch (error) {
                    if (retries === 0) throw error; // Throw last error

                    // Check if it's a fetch error (network issue)
                    const isFetchError = error instanceof Error &&
                        (error.message.includes("Failed to fetch") || error.message.includes("network"));

                    if (isFetchError) {
                        console.warn(`[Gemini Provider] Network error, retrying... (${retries} attempts left)`)
                        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
                        retries--;
                    } else {
                        throw error; // Non-network error, throw immediately
                    }
                }
            }

            // Extract text from response
            let responseText = ""

            // Log raw response structure for debugging
            console.log("[Gemini Provider] Raw response structure:", {
                hasCandidates: !!response.candidates,
                candidatesCount: response.candidates?.length || 0,
                firstCandidateFinishReason: response.candidates?.[0]?.finishReason,
                hasContent: !!response.candidates?.[0]?.content,
                hasParts: !!response.candidates?.[0]?.content?.parts,
                partsCount: response.candidates?.[0]?.content?.parts?.length || 0,
                hasGroundingMetadata: !!response.candidates?.[0]?.groundingMetadata
            })

            if (response.candidates && response.candidates.length > 0) {
                const candidate = response.candidates[0]

                // Check for grounding metadata (if search was used)
                if (candidate.groundingMetadata) {
                    const metadata = candidate.groundingMetadata
                    console.log("[Gemini Provider] Search queries used:", metadata.webSearchQueries?.length || 0)
                    console.log("[Gemini Provider] Search queries:", metadata.webSearchQueries || [])
                    console.log("[Gemini Provider] Sources found:", metadata.groundingChunks?.length || 0)
                    if (metadata.groundingChunks && metadata.groundingChunks.length > 0) {
                        console.log("[Gemini Provider] First source:", metadata.groundingChunks[0])
                    }
                }

                if (candidate.content && candidate.content.parts) {
                    console.log("[Gemini Provider] Processing parts:", candidate.content.parts.map((p, i) => ({
                        index: i,
                        hasText: !!p.text,
                        textLength: p.text?.length || 0,
                        textPreview: p.text?.substring(0, 100)
                    })))
                    responseText = candidate.content.parts
                        .map(part => part.text || "")
                        .join("")
                    console.log("[Gemini Provider] Extracted text length:", responseText.length)
                } else {
                    // No parts found - log the full candidate for debugging
                    console.error("[Gemini Provider] No content.parts found in candidate!")
                    console.error("[Gemini Provider] Full candidate object:", JSON.stringify(candidate, null, 2))
                }
            }

            // Fallback to response.text if available
            if (!responseText && response.text) {
                responseText = response.text
            }

            if (!responseText) {
                console.error("[Gemini Provider] No text in response")
                console.error("[Gemini Provider] Token usage:", {
                    prompt: response.usageMetadata?.promptTokenCount,
                    cached: response.usageMetadata?.cachedContentTokenCount,
                    output: response.usageMetadata?.candidatesTokenCount,
                    total: response.usageMetadata?.totalTokenCount
                })
                console.error("[Gemini Provider] Finish reason:", response.candidates?.[0]?.finishReason)

                // CRITICAL: Handle RECITATION specifically
                if (response.candidates?.[0]?.finishReason === "RECITATION") {
                    console.error("[Gemini Provider] RECITATION block detected")
                    console.error("[Gemini Provider] The model refused to generate content to avoid plagiarism")
                    console.error("[Gemini Provider] This typically means:")
                    console.error("  1. Query was too specific or matched training data exactly")
                    console.error("  2. The response would have verbatim copied source material")
                    console.error("  3. Search grounding found copyrighted content")

                    // Throw specific error to trigger retry with different strategy
                    throw new Error("RECITATION_BLOCK: Content generation blocked to prevent plagiarism. Try rephrasing the query or using more generic search terms.")
                }

                if (this.useSearchGrounding) {
                    console.warn("[Gemini Provider] Search grounding returned no content")
                    console.warn("[Gemini Provider] This may indicate:")
                    console.warn("  1. Search was blocked or unavailable")
                    console.warn("  2. Query was too broad or unclear")
                    console.warn("  3. No relevant results found")
                }

                return "{}"
            }

            // Log token usage for optimization
            if (response.usageMetadata) {
                const usage = response.usageMetadata
                console.log("[Gemini Provider] Token usage:", {
                    prompt: usage.promptTokenCount,
                    cached: usage.cachedContentTokenCount || 0,
                    output: usage.candidatesTokenCount || 0,
                    total: usage.totalTokenCount
                })
            }

            return responseText
        } catch (error) {
            console.error("Gemini API error:", error)
            throw new Error(`Gemini analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`)
        }
    }

    /**
     * Stream analysis for real-time updates
     */
    async analyzeStream(
        prompt: string,
        context: string,
        onChunk: (chunk: string) => void
    ): Promise<void> {
        try {
            const fullPrompt = `${prompt}\n\n${context}`

            const stream = await this.client.models.generateContentStream({
                model: this.model,
                contents: fullPrompt,
                config: {
                    temperature: this.temperature,
                    maxOutputTokens: this.maxTokens
                }
            })

            for await (const chunk of stream) {
                const text = chunk.text
                if (text) {
                    onChunk(text)
                }
            }
        } catch (error) {
            console.error("Gemini streaming error:", error)
            throw new Error(`Gemini streaming failed: ${error instanceof Error ? error.message : "Unknown error"}`)
        }
    }
}

/**
 * Get API key from Chrome storage
 */
export async function getGeminiAPIKey(): Promise<string> {
    try {
        const result = await chrome.storage.local.get(["geminiApiKey"])
        return result.geminiApiKey || process.env.GEMINI_API_KEY || ""
    } catch (error) {
        // Fallback to environment variable
        return process.env.GEMINI_API_KEY || ""
    }
}

/**
 * Save API key to Chrome storage
 */
export async function saveGeminiAPIKey(apiKey: string): Promise<void> {
    await chrome.storage.local.set({ geminiApiKey: apiKey })
}

