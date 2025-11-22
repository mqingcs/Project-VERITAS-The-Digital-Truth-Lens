/**
 * JSON Schemas for Veritas Agents
 * These schemas enforce structured output from Gemini models
 */

/**
 * Ratio Agent Output Schema
 * Enforces strict structure for fact extraction
 * Note: Simplified to avoid Gemini API "too many states" error
 */
export const RATIO_OUTPUT_SCHEMA = {
    type: "object",
    properties: {
        claims: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    text: { type: "string" },
                    claimText: { type: "string" },
                    elementId: { type: "string" },
                    entities: {
                        type: "array",
                        items: { type: "string" }
                    },
                    importance: { type: "number" },
                    category: { type: "string" }
                },
                required: ["id", "text", "claimText", "elementId", "entities", "importance", "category"]
            }
        },
        data: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    type: { type: "string" },
                    value: { type: "string" },
                    context: { type: "string" },
                    elementId: { type: "string" }
                },
                required: ["type", "value", "context", "elementId"]
            }
        },
        entities: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    type: { type: "string" },
                    mentions: {
                        type: "array",
                        items: { type: "string" }
                    }
                },
                required: ["id", "name", "type", "mentions"]
            }
        },
        summary: { type: "string" }
    },
    required: ["claims", "data", "entities", "summary"]
}

/**
 * Velox Agent Output Schema
 * Enforces structure for content analysis
 * Note: Simplified to avoid Gemini API "too many states" error
 */
export const VELOX_OUTPUT_SCHEMA = {
    type: "object",
    properties: {
        lowValueNodes: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    elementId: { type: "string" },
                    reason: { type: "string" },
                    confidence: { type: "number" }
                },
                required: ["elementId", "reason", "confidence"]
            }
        },
        fallacyNodes: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    elementId: { type: "string" },
                    fallacyType: { type: "string" },
                    explanation: { type: "string" },
                    severity: { type: "number" }
                },
                required: ["elementId", "fallacyType", "explanation", "severity"]
            }
        }
    },
    required: ["lowValueNodes", "fallacyNodes"]
}
