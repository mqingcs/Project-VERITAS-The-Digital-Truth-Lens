/**
 * Project VERITAS - Type Definitions for Multi-Agent System
 * "Nox est norma, Lux per rationem reconstruitur"
 */

// ============================================================================
// AGENT I: VELOX (The Sentry) - Output Schema
// ============================================================================

export type NoiseType = "noise" | "advertisement" | "boilerplate"
export type FallacyType =
    | "ad-hominem"
    | "slippery-slope"
    | "appeal-to-emotion"
    | "strawman"
    | "false-dichotomy"
    | "hasty-generalization"
    | "circular-reasoning"

export interface LowValueNode {
    elementId: string
    xpath: string
    reason: "advertisement" | "noise" | "boilerplate"
    confidence: number
    explanation?: string
}

export interface FallacyNode {
    elementId: string
    xpath: string
    fallacyType: FallacyType
    explanation: string
    confidence: number
    severity: "low" | "medium" | "high"
}

export interface RawAnalysisMap {
    lowValueNodes: LowValueNode[]
    fallacyNodes: FallacyNode[]
    memoryIndex?: string // Short summary for memory optimization
    timestamp: number
}

// ============================================================================
// AGENT II: RATIO (The Analyst) - Output Schema
// ============================================================================

export type DataType = "statistic" | "date" | "measurement" | "quote"
export type EntityType = "person" | "organization" | "location" | "product" | "event"

export interface Claim {
    id: string
    text: string // Full claim text for context
    claimText: string // Precise 10-50 char snippet to highlight
    xpath: string
    entities: string[] // Entity IDs
    importance: number // 0-1
    type?: string // 'factual', 'emotional', 'logical', etc.
}

export interface DataPoint {
    type: DataType
    value: string
    context: string
    xpath: string
}

export interface Entity {
    id: string
    name: string
    type: EntityType
    mentions: string[] // XPaths where mentioned
}

export interface FactJSON {
    claims: Claim[]
    data: DataPoint[]
    entities: Entity[]
    summary: string // Ultra-compressed essence
    memoryIndex?: string // Short summary for memory optimization
    timestamp: number
}

// ============================================================================
// AGENT III: VERITAS (The Investigator) - Output Schema
// ============================================================================

export type VerificationStatus =
    | "verified"
    | "false"
    | "context-missing"
    | "unverifiable"

export interface Evidence {
    source: string
    url: string
    snippet: string
    title?: string  // Optional title for display purposes
}

export interface VerificationResult {
    claimId: string
    status: VerificationStatus
    confidence: number
    evidence: Evidence[]
    reasoning: string
    searchQuery?: string
    timestamp: number
}

export interface Verification {
    claimId: string
    status: VerificationStatus
    confidence: number // 0-1
    sources: Evidence[] // Renamed from 'evidence' to match Veritas output
    reasoning: string
    evidenceSummary?: string // Added for compatibility
    searchQueries?: string[] // Added for transparency
    contradictions?: string[] // Added for completeness
    caveats?: string[] // Added for completeness
}

export interface GraphNode {
    id: string
    label: string
    type: "entity" | "claim" | "source" | "connection"
    metadata?: Record<string, any>
}

export interface GraphEdge {
    from: string
    to: string
    relationship: string
    strength: number // 0-1
}

export interface KnowledgeGraph {
    nodes: GraphNode[]
    edges: GraphEdge[]
}

export interface VerifiedGraphData {
    verifications: Verification[]
    graph: KnowledgeGraph
    hiddenConnections: string[] // Surprising relationships discovered
    summary?: string // Optional summary for Deep Dive results
    memoryIndex?: string // Short summary for memory optimization
    timestamp: number
}

// ============================================================================
// UNIFIED STATE FOR AGENT IV: CURSOR (The Commander)
// ============================================================================

export interface VeritasAnalysis {
    url: string
    pageTitle: string
    velox: RawAnalysisMap | null
    ratio: FactJSON | null
    veritas: VerifiedGraphData | null
    status: "analyzing" | "complete" | "failed"
    statusMessage?: string
    progress: {
        velox: boolean
        ratio: boolean
        veritas: boolean
    }
}

// ============================================================================
// MESSAGING PROTOCOL
// ============================================================================

export type MessageType =
    | "ANALYZE_PAGE"
    | "VELOX_COMPLETE"
    | "RATIO_COMPLETE"
    | "VERITAS_COMPLETE"
    | "DEEP_DIVE"
    | "UPDATE_PROGRESS"
    | "EXECUTION_STARTED"
    | "EXECUTION_COMPLETE"
    | "ERROR"
    | "TRIGGER_DEEP_DIVE"

export interface AnalyzePageMessage {
    type: "ANALYZE_PAGE"
    payload: import("~src/lib/content-extractor").PageContent
}

export interface VeloxCompleteMessage {
    type: "VELOX_COMPLETE"
    payload: RawAnalysisMap
}

export interface RatioCompleteMessage {
    type: "RATIO_COMPLETE"
    payload: FactJSON
}

export interface VeritasCompleteMessage {
    type: "VERITAS_COMPLETE"
    payload: VerifiedGraphData
}

export interface DeepDiveMessage {
    type: "DEEP_DIVE"
    payload: {
        context: string
        target: string // XPath or entity ID
        query: string
        outputLanguage?: "English" | "Chinese"
    }
}

export interface UpdateProgressMessage {
    type: "UPDATE_PROGRESS"
    payload: {
        agent: "velox" | "ratio" | "veritas" | "commander"
        status: string
        currentStep?: number  // New: current step in execution
        totalSteps?: number   // New: total expected steps
        progress?: number     // New: 0-1 progress percentage
    }
}

export interface ExecutionStartedMessage {
    type: "EXECUTION_STARTED"
    payload: {
        taskId: string
        userRequest: string
        maxSteps: number
    }
}

export interface ExecutionCompleteMessage {
    type: "EXECUTION_COMPLETE"
    payload: {
        taskId: string
        totalSteps: number
        duration?: number
        success: boolean
        reason?: string  // "user_stopped" | "max_iterations_reached"
    }
}

export interface ErrorMessage {
    type: "ERROR"
    payload: {
        agent?: string
        error: string
    }
}

export interface CommanderMessage {
    type: "COMMANDER_MESSAGE"
    payload: {
        text: string
        context: string
        history: Array<{ role: "user" | "agent", text: string }>
        outputLanguage?: "English" | "Chinese"
    }
}

export interface CommanderResponse {
    type: "COMMANDER_RESPONSE"
    payload: {
        text: string
        toolCalls?: Array<{ tool: string, args: any }>
    }
}

// Commander Page Interaction Messages
export interface HighlightText {
    type: "HIGHLIGHT_TEXT"
    payload: {
        text: string
        color: "green" | "red" | "yellow" | "blue"
        reason: string
    }
}

export interface HighlightByXPath {
    type: "HIGHLIGHT_BY_XPATH"
    payload: {
        xpath: string
        text: string | null
        color: "green" | "red" | "yellow" | "blue"
        reason: string
    }
}

export interface HighlightByElement {
    type: "HIGHLIGHT_BY_ELEMENT"
    payload: {
        elementId: string
        color: "green" | "red" | "yellow" | "blue"
        reason: string
    }
}

export interface ShowResultWindow {
    type: "SHOW_RESULT_WINDOW"
    payload: {
        title: string
        content: string
        position?: "center" | "top-right" | "bottom-right"
        type?: "info" | "warning" | "success" | "error"
    }
}

export interface ForceStopMessage {
    type: "FORCE_STOP"
    payload: {}
}

export interface TriggerDeepDiveMessage {
    type: "TRIGGER_DEEP_DIVE"
    payload: {
        selectionText: string
    }
}

export interface StopExecutionMessage {
    type: "STOP_EXECUTION"
    payload: {}
}

export type Message =
    | AnalyzePageMessage
    | VeloxCompleteMessage
    | RatioCompleteMessage
    | VeritasCompleteMessage
    | DeepDiveMessage
    | HighlightText
    | HighlightByXPath
    | HighlightByElement
    | ShowResultWindow
    | UpdateProgressMessage
    | ExecutionStartedMessage
    | ExecutionCompleteMessage
    | ErrorMessage
    | CommanderMessage
    | CommanderResponse
    | ForceStopMessage
    | TriggerDeepDiveMessage
    | StopExecutionMessage
