/**
 * API Integration Layer - Decoupled for Future WebGPU Migration
 */

// ============================================================================
// MODEL PROVIDER INTERFACE (Abstraction for Cloud → Local Migration)
// ============================================================================

export interface ModelConfig {
    apiKey?: string
    baseUrl?: string
    model?: string
    temperature?: number
    maxTokens?: number
}

export interface IModelProvider {
    /**
     * Analyze content with a given prompt
     * @param prompt - The instruction prompt
     * @param context - The content to analyze
     * @returns The model's response
     */
    analyze(prompt: string, context: string): Promise<string>

    /**
     * Stream analysis for real-time updates
     * @param prompt - The instruction prompt
     * @param context - The content to analyze
     * @param onChunk - Callback for each chunk
     */
    analyzeStream?(
        prompt: string,
        context: string,
        onChunk: (chunk: string) => void
    ): Promise<void>
}

// ============================================================================
// SEARCH TOOL INTERFACE
// ============================================================================

export interface SearchResult {
    title: string
    url: string
    snippet: string
    score?: number // Relevance score if available
    publishedDate?: string
}

export interface ISearchTool {
    /**
     * Perform a web search
     * @param query - The search query
     * @param limit - Maximum number of results
     * @returns Array of search results
     */
    search(query: string, limit?: number): Promise<SearchResult[]>
}

// ============================================================================
// API CONFIGURATION
// ============================================================================

export interface APIConfig {
    velox: {
        provider: "openai" | "anthropic" | "gemini" | "local"
        config: ModelConfig
    }
    ratio: {
        provider: "openai" | "anthropic" | "gemini" | "local"
        config: ModelConfig
    }
    search: {
        provider: "tavily" | "serper"
        apiKey: string
    }
}

export const DEFAULT_API_CONFIG: Partial<APIConfig> = {
    velox: {
        provider: "openai",
        config: {
            model: "gpt-4o-mini",
            temperature: 0.3,
            maxTokens: 2000
        }
    },
    ratio: {
        provider: "openai",
        config: {
            model: "gpt-4o",
            temperature: 0.1,
            maxTokens: 3000
        }
    }
}
