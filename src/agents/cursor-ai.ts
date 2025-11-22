/**
 * Cursor AI Agent - Instruction Understanding
 * Model: gemini-2.5-flash
 * Purpose: Understand user intent and route to appropriate agent
 */

import { GeminiProvider, getGeminiAPIKey } from "~src/api/gemini-provider"

export type UserIntent = "deep_dive" | "verify_claim" | "explain" | "search" | "analyze"
export type TargetAgent = "veritas" | "ratio" | "velox" | "all"

export interface IntentAnalysis {
    intent: UserIntent
    targetAgent: TargetAgent
    confidence: number
    parameters: {
        query: string
        context?: string
        focusArea?: string
    }
}

/**
 * Analyze user's natural language query to determine intent
 */
export async function understandUserIntent(
    query: string,
    context: string
): Promise<IntentAnalysis> {
    try {
        const apiKey = await getGeminiAPIKey()
        if (!apiKey) {
            // Fallback: simple keyword-based intent
            return basicIntentAnalysis(query)
        }

        const cursorAI = new GeminiProvider({
            apiKey,
            model: "gemini-2.5-flash",
            temperature: 0.3,
            maxTokens: 500
        })

        const prompt = `You are Cursor, the command AI for Project VERITAS.

Analyze this user query and determine their intent:

Query: "${query}"
Context: "${context.substring(0, 200)}..."

Classify the intent as ONE of:
- "deep_dive": User wants detailed investigation of a topic/entity
- "verify_claim": User wants to fact-check a specific claim
- "explain": User wants explanation of something
- "search": User wants to find information
- "analyze": User wants comprehensive analysis

Choose the best agent:
- "veritas": For fact-checking, verification, evidence gathering
- "ratio": For extracting facts, claims, entities from text
- "velox": For analyzing logical fallacies and noise
- "all": For comprehensive full-pipeline analysis

Output ONLY valid JSON:
{
  "intent": "<intent>",
  "targetAgent": "<agent>",
  "confidence": 0.0-1.0,
  "parameters": {
    "query": "refined query for the agent",
    "focusArea": "optional focus area"
  }
}`

        const response = await cursorAI.analyze(prompt, "")
        const parsed = JSON.parse(response)

        return {
            intent: parsed.intent || "deep_dive",
            targetAgent: parsed.targetAgent || "veritas",
            confidence: parsed.confidence || 0.8,
            parameters: {
                query: parsed.parameters?.query || query,
                context,
                focusArea: parsed.parameters?.focusArea
            }
        }
    } catch (error) {
        console.error("[Cursor AI] Failed to analyze intent:", error)
        return basicIntentAnalysis(query)
    }
}

/**
 * Fallback: Basic keyword-based intent analysis
 */
function basicIntentAnalysis(query: string): IntentAnalysis {
    const q = query.toLowerCase()

    // Deep dive keywords
    if (q.includes("deep dive") || q.includes("investigate") || q.includes("tell me more")) {
        return {
            intent: "deep_dive",
            targetAgent: "veritas",
            confidence: 0.9,
            parameters: { query }
        }
    }

    // Verification keywords
    if (q.includes("true") || q.includes("false") || q.includes("verify") || q.includes("fact check")) {
        return {
            intent: "verify_claim",
            targetAgent: "veritas",
            confidence: 0.9,
            parameters: { query }
        }
    }

    // Explanation keywords
    if (q.includes("explain") || q.includes("what is") || q.includes("how does")) {
        return {
            intent: "explain",
            targetAgent: "ratio",
            confidence: 0.8,
            parameters: { query }
        }
    }

    // Default: deep dive
    return {
        intent: "deep_dive",
        targetAgent: "veritas",
        confidence: 0.7,
        parameters: { query }
    }
}

/**
 * Generate agent-specific task description based on intent
 */
export function generateAgentTask(intent: IntentAnalysis): string {
    const { intent: intentType, parameters } = intent

    switch (intentType) {
        case "deep_dive":
            return `Conduct a comprehensive deep dive investigation into: ${parameters.query}. Find hidden connections, verify relationships, and build a knowledge graph.`

        case "verify_claim":
            return `Verify the following claim: "${parameters.query}". Provide evidence, sources, and confidence score.`

        case "explain":
            return `Extract and explain the key facts about: ${parameters.query}. Focus on clarity and accuracy.`

        case "search":
            return `Search for information about: ${parameters.query}. Return relevant facts and entities.`

        case "analyze":
            return `Perform full analysis on: ${parameters.query}. Include fallacy detection, fact extraction, and verification.`

        default:
            return parameters.query
    }
}
