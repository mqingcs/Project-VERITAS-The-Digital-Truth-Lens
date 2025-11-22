/**
 * Centralized Memory System for Veritas Commander
 * Manages short-term conversation history and working memory for agent results.
 * 
 * OPTIMIZATION: Compressed storage + auto-pruning to reduce token usage
 * FIXED: Preserve critical verification details for deep_dive results
 */

export type MemoryType = "observation" | "analysis" | "result" | "user_input" | "plan"

export interface MemoryEntry {
    id: string
    timestamp: number
    type: MemoryType
    source: string // e.g., "user", "velox", "ratio", "deep_dive"
    content: any  // Compressed summary for context injection
    fullContent?: any  // Full data, only retrieved via read_memory
    index: string // Short summary (max 15 chars)
    metadata?: Record<string, any>
    expiry?: number // Timestamp when this memory should be pruned (ms since epoch)
}

export class MemoryManager {
    private shortTerm: MemoryEntry[] = [] // Conversation history
    private working: MemoryEntry[] = []   // Active analysis results
    private limit: number = 20            // Limit for short-term memory
    private defaultTTLMinutes: number = 5 // Default time-to-live for results

    constructor() {
        console.log("[Memory] Initialized Optimized Memory System with auto-pruning")
    }

    /**
     * Add a new memory entry with optional compression and TTL
     */
    add(
        type: MemoryType,
        source: string,
        content: any,
        index: string,
        metadata?: Record<string, any>,
        ttlMinutes?: number
    ): string {
        const compressed = this.compressContent(source, content)

        const entry: MemoryEntry = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type,
            source,
            content: compressed.summary,
            fullContent: content,  // Store full version separately
            index: index.substring(0, 15), // Enforce limit
            metadata,
            expiry: ttlMinutes !== undefined
                ? Date.now() + (ttlMinutes * 60 * 1000)
                : (type === "result" ? Date.now() + (this.defaultTTLMinutes * 60 * 1000) : undefined)
        }

        if (type === "user_input" || type === "plan") {
            this.shortTerm.push(entry)
            if (this.shortTerm.length > this.limit) {
                this.shortTerm.shift() // Prune oldest
            }
        } else {
            // Working memory (analysis results)
            // Check if we should replace existing memory from same source
            const existingIndex = this.working.findIndex(m => m.source === source && m.type === type)
            if (existingIndex !== -1) {
                this.working[existingIndex] = entry
            } else {
                this.working.push(entry)
            }
        }

        console.log(`[Memory] Added ${type} from ${source} (Index: ${entry.index}, TTL: ${ttlMinutes || this.defaultTTLMinutes}min)`)
        return entry.id
    }

    /**
     * Compress content based on source to reduce token usage
     * CRITICAL: Preserve essential information for Commander to make decisions
     */
    private compressContent(source: string, content: any): { summary: any } {
        if (source === "extract_claims") {
            // CRITICAL: Preserve ALL claims with complete information
            // Commander needs this to reference specific claims for verification
            return {
                summary: {
                    claimCount: content.claims?.length || 0,
                    entityCount: content.entities?.length || 0,
                    claims: content.claims?.map((c: any) => ({
                        id: c.id,
                        text: c.text || c.claimText,  // Full text, not truncated
                        elementId: c.elementId,
                        importance: c.importance,
                        category: c.category,
                        entities: c.entities || []  // Entity IDs for this claim
                    })) || [],
                    entities: content.entities?.map((e: any) => ({
                        id: e.id,
                        name: e.name,
                        type: e.type,
                        mentions: e.mentions || []  // Claim IDs where this entity appears
                    })) || []
                }
            }
        } else if (source === "analyze_fallacies") {
            // Store counts + detailed fallacy information
            return {
                summary: {
                    fallacyCount: content.fallacyNodes?.length || 0,
                    lowValueCount: content.lowValueNodes?.length || 0,
                    fallacies: content.fallacyNodes?.map((f: any) => ({
                        type: f.fallacyType,
                        snippet: f.snippet?.substring(0, 100) || "",
                        elementId: f.elementId,
                        explanation: f.explanation?.substring(0, 150) || "",
                        severity: f.severity,
                        confidence: f.confidence
                    })) || []
                }
            }
        } else if (source === "deep_dive") {
            // CRITICAL: Store essential verification details
            // Commander needs this to provide accurate conclusions to user
            const verification = content.verification || {}
            return {
                summary: {
                    target: content.target?.substring(0, 80) || "",
                    query: content.query?.substring(0, 60) || "",
                    status: content.status || verification.status || "unknown",
                    confidence: verification.confidence || 0,
                    reasoning: verification.reasoning?.substring(0, 250) || "",
                    evidenceSummary: verification.evidenceSummary?.substring(0, 400) || "",
                    sourceCount: content.sources?.length || 0,
                    topSources: content.sources?.slice(0, 3).map((s: any) => ({
                        title: s.title?.substring(0, 80) || "",
                        url: s.url
                    })) || []
                }
            }
        } else if (source === "verify_claims") {
            // Full-page verification - store overview + key findings WITH sources
            return {
                summary: {
                    verificationCount: content.verifications?.length || 0,
                    verified: content.verifications?.filter((v: any) => v.status === "verified").length || 0,
                    disputed: content.verifications?.filter((v: any) => v.status === "disputed").length || 0,
                    false: content.verifications?.filter((v: any) => v.status === "false").length || 0,
                    topVerifications: content.verifications?.slice(0, 3).map((v: any) => ({
                        claimText: v.claimText?.substring(0, 60),
                        status: v.status,
                        confidence: v.confidence,
                        sources: v.sources?.slice(0, 2).map((s: any) => ({
                            title: s.title,
                            url: s.url
                        })) || []
                    })) || []
                }
            }
        }

        // For other sources, store as-is (should be small already)
        return { summary: content }
    }

    /**
     * Prune expired memories
     */
    private pruneExpired(): void {
        const now = Date.now()
        const beforeCount = this.working.length
        this.working = this.working.filter(m => !m.expiry || m.expiry > now)
        const pruned = beforeCount - this.working.length
        if (pruned > 0) {
            console.log(`[Memory] Pruned ${pruned} expired memories`)
        }
    }

    /**
     * Retrieve recent context for LLM (Indices ONLY)
     */
    getRecentContext(limit: number = 5): string {
        this.pruneExpired()  // Auto-prune

        // Combine short-term and working memory
        const contextParts: string[] = []

        // 1. Add Working Memory (Current State)
        if (this.working.length > 0) {
            contextParts.push("=== CURRENT KNOWLEDGE STATE (Indices) ===")
            this.working.forEach(entry => {
                contextParts.push(`[ID: ${entry.id}] [${entry.source.toUpperCase()}]: ${entry.index}`)
            })
        }

        // 2. Add Short Term Memory (Conversation)
        if (this.shortTerm.length > 0) {
            contextParts.push("=== RECENT INTERACTION HISTORY ===")
            const recent = this.shortTerm.slice(-limit)
            recent.forEach(entry => {
                contextParts.push(`[${entry.source.toUpperCase()}]: ${entry.index}`)
            })
        }

        return contextParts.join("\n\n")
    }

    /**
     * Get execution context for autonomous loop
     * ENHANCED: Returns compressed summaries with critical information
     * Commander can see key details without full content
     */
    getExecutionContext(): string {
        this.pruneExpired()  // Auto-prune before building context

        const contextParts: string[] = []

        // 1. Add Working Memory with Compressed Summaries
        if (this.working.length > 0) {
            contextParts.push("=== AVAILABLE KNOWLEDGE ===")
            this.working.forEach(entry => {
                contextParts.push(`\n[ID: ${entry.id}] [${entry.source.toUpperCase()}]: ${entry.index}`)

                // Add compressed summary for immediate context
                if (entry.content && typeof entry.content === 'object') {
                    const formatted = this.formatCompressedContent(entry.source, entry.content)
                    if (formatted) {
                        contextParts.push(formatted)
                    }
                }
            })
        }

        // 2. Add Short Term Memory (Recent User Interactions)
        if (this.shortTerm.length > 0) {
            contextParts.push("\n=== RECENT INTERACTION HISTORY ===")
            const recent = this.shortTerm.slice(-3)
            recent.forEach(entry => {
                contextParts.push(`[${entry.source.toUpperCase()}]: ${entry.index}`)
            })
        }

        return contextParts.join("\n")
    }

    /**
     * Format compressed content for display in context
     */
    private formatCompressedContent(source: string, content: any): string {
        if (source === "deep_dive") {
            // Format verification result for Commander to see
            return `  Status: ${content.status} (${Math.round(content.confidence * 100)}% confidence)
  Reasoning: ${content.reasoning || "N/A"}
  Evidence: ${content.evidenceSummary || "N/A"}
  Sources: ${content.sourceCount} (Top: ${content.topSources?.map((s: any) => s.title).join(", ") || "None"})`
        } else if (source === "extract_claims") {
            const claimList = content.claims?.slice(0, 5).map((c: any, i: number) =>
                `    ${i + 1}. [${c.category}] ${c.text.substring(0, 60)}... (importance: ${c.importance})`
            ).join("\n") || "    None"

            return `  Found ${content.claimCount} claims, ${content.entityCount} entities
  Top Claims:
${claimList}
  Entities: ${content.entities?.slice(0, 5).map((e: any) => `${e.name} (${e.type})`).join(", ") || "None"}`
        } else if (source === "analyze_fallacies") {
            const fallacies = content.fallacies || []
            const formattedFallacies = fallacies.map((f: any, i: number) =>
                `    ${i + 1}. [${f.type}] "${f.snippet}" (${f.severity} severity, ${Math.round(f.confidence * 100)}%)\n       ${f.explanation}`
            ).join("\n")

            return `  Found ${content.fallacyCount} fallacies, ${content.lowValueCount} low-value nodes
  Fallacies:
${formattedFallacies || "    None"}`
        } else if (source === "verify_claims") {
            // Format full-page verification results with sources
            const verifications = content.topVerifications || []
            const formattedVerifications = verifications.map((v: any, i: number) => {
                const sourcesStr = v.sources?.map((s: any) => `${s.title} (${s.url})`).join(", ") || "No sources"
                return `    ${i + 1}. [${v.status.toUpperCase()}] ${v.claimText} (${Math.round(v.confidence * 100)}%)\n       Sources: ${sourcesStr}`
            }).join("\n")

            return `  Total: ${content.verificationCount} claims verified
  Results: ✓${content.verified} verified, ?${content.disputed} disputed, ✗${content.false} false
  Top Verifications:
${formattedVerifications || "    None"}`
        }
        return ""
    }

    /**
     * Retrieve specific memory content by ID
     * Returns FULL content, not compressed summary
     */
    getMemoryContent(id: string): any | undefined {
        const entry = this.working.find(m => m.id === id) ||
            this.shortTerm.find(m => m.id === id)
        return entry ? (entry.fullContent || entry.content) : undefined
    }

    /**
     * Retrieve specific memory by Source
     */
    getBySource(source: string): MemoryEntry | null { // Changed return type to MemoryEntry | null
        console.log(`[Memory] 🔍 getBySource called with source: "${source}"`)
        // Assuming 'this.memories' is a combined array of 'this.working' and 'this.shortTerm'
        // Or, if it's meant to search only working memory, then use 'this.working'
        // For this change, I will assume it should search 'this.working' as it's the primary source for analysis results.
        const memoriesToSearch = this.working; // Or this.memories if it exists and is a combined array
        console.log(`[Memory] Current working memory items: ${memoriesToSearch.length}`)

        // Find most recent memory with matching source
        for (let i = memoriesToSearch.length - 1; i >= 0; i--) {
            const memory = memoriesToSearch[i]
            console.log(`[Memory]   Checking memory ${i}: source="${memory.source}"`)

            if (memory.source === source) {
                console.log(`[Memory] ✅ Found matching memory:`)
                console.log(`[Memory]   - ID: ${memory.id}`)
                console.log(`[Memory]   - Source: ${memory.source}`)
                console.log(`[Memory]   - Has fullContent: ${!!memory.fullContent}`)

                // CRITICAL: Check if this is fallacy data and preserve xpaths
                if (source === "analyze_fallacies" && memory.fullContent) {
                    const fallacies = memory.fullContent.fallacies || memory.fullContent.fallacyNodes
                    if (fallacies && Array.isArray(fallacies)) {
                        console.log(`[Memory]   - Fallacies count: ${fallacies.length}`)
                        console.log(`[Memory]   - First fallacy has xpath: ${!!fallacies[0]?.xpath}`)
                        console.log(`[Memory]   - First fallacy xpath: ${fallacies[0]?.xpath}`)

                        // Ensure we return with proper structure
                        return {
                            ...memory,
                            fullContent: {
                                ...memory.fullContent,
                                fallacies: fallacies  // Preserve complete fallacy data
                            }
                        }
                    }
                }

                // For claims, ensure IDs and xpaths are preserved
                if (source === "extract_claims" && memory.fullContent) {
                    const claims = memory.fullContent.claims
                    if (claims && Array.isArray(claims)) {
                        console.log(`[Memory]   - Claims count: ${claims.length}`)
                        console.log(`[Memory]   - First claim has id: ${!!claims[0]?.id}`)
                        console.log(`[Memory]   - First claim has xpath: ${!!claims[0]?.xpath}`)
                    }
                }

                return memory
            }
        }

        console.log(`[Memory] ❌ No memory found with source: "${source}"`)
        return null
    }

    /**
     * Get recent working memory (analysis results)
     */
    getRecentWorkingMemory(limit: number = 5): MemoryEntry[] {
        this.pruneExpired()  // Auto-prune
        return this.working.slice(-limit)
    }

    /**
     * Clear all memory
     */
    clear(): void {
        this.shortTerm = []
        this.working = []
        console.log("[Memory] Memory cleared")
    }

    /**
     * Manual cleanup of old memories (can be called externally)
     */
    cleanup(): void {
        this.pruneExpired()
    }
}

// Export singleton instance
export const memoryManager = new MemoryManager()
