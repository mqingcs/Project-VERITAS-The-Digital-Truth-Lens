import type {
    VeritasAnalysis,
    FallacyNode,
    Claim,
    Entity,
    Verification,
    GraphNode,
    GraphEdge,
    NoiseType
} from "~src/types/agents"
import { areXpathsRelated } from "./xpath-utils"

export interface AggregatedCardData {
    // Identification
    xpath: string
    text: string

    // Element Classification
    elementType: 'fallacy' | 'claim' | 'low-value' | 'emotional' | 'verified' | 'false' | 'normal'

    // Velox Data
    fallacies: FallacyNode[]
    isLowValue: boolean
    lowValueReason?: NoiseType

    // Ratio Data  
    claims: Claim[]
    entities: Entity[]
    relatedClaims: Claim[] // Claims that share entities

    // Veritas Data
    verifications: Verification[]
    graphNodes: GraphNode[] // Filtered to relevant nodes
    graphEdges: GraphEdge[] // Filtered to relevant edges
    hiddenConnections: string[]

    // Computed Scores
    overallRisk: number // 0-100 (high fallacy/false = high risk)
    overallConfidence: number // 0-100 (avg of all confidences)
    summary: string // AI-generated 1-2 sentence summary

    // Metadata
    timestamp: number
    hasData: boolean // At least one data source available
}

/**
 * Aggregates data from all three agents for a specific XPath
 */
export function aggregateCardData(
    xpath: string,
    analysis: VeritasAnalysis | null
): AggregatedCardData {
    const timestamp = Date.now()

    // Default empty state
    const result: AggregatedCardData = {
        xpath,
        text: "",
        elementType: 'normal',
        fallacies: [],
        isLowValue: false,
        claims: [],
        entities: [],
        relatedClaims: [],
        verifications: [],
        graphNodes: [],
        graphEdges: [],
        hiddenConnections: [],
        overallRisk: 0,
        overallConfidence: 0,
        summary: "No analysis data available for this segment.",
        timestamp,
        hasData: false
    }

    if (!analysis) return result

    // 1. Velox Data (Fallacies & Low Value)
    if (analysis.velox) {
        // Find fallacies at this xpath (fuzzy match)
        const fallacies = analysis.velox.fallacyNodes
            .filter(f => areXpathsRelated(f.xpath, xpath))
            .map(f => ({
                ...f,
                severity: (typeof f.severity === 'string' ? f.severity : 'medium') as "low" | "medium" | "high",
                fallacyType: (typeof f.fallacyType === 'string' ? f.fallacyType : 'unknown') as any
            }))
        result.fallacies = fallacies

        // Find low value status
        const lowValue = analysis.velox.lowValueNodes.find(n => areXpathsRelated(n.xpath, xpath))
        if (lowValue) {
            result.isLowValue = true
            result.lowValueReason = lowValue.reason
        }

        // Set text from fallacy if available
        if (fallacies.length > 0 && fallacies[0].explanation) {
            // We don't have the raw text in FallacyNode usually, but we might have it in context
            // For now, we'll rely on the caller or Ratio to provide text if possible
        }
    }

    // 2. Ratio Data (Claims & Entities)
    if (analysis.ratio) {
        // Find claims at this xpath (fuzzy match)
        const claims = analysis.ratio.claims.filter(c => areXpathsRelated(c.xpath, xpath))
        result.claims = claims

        if (claims.length > 0) {
            result.text = claims[0].text || result.text
        }

        // Find entities mentioned in these claims
        const claimEntityIds = new Set(claims.flatMap(c => c.entities))
        result.entities = analysis.ratio.entities.filter(e => claimEntityIds.has(e.id))

        // Find related claims (share at least one entity)
        if (claimEntityIds.size > 0) {
            result.relatedClaims = analysis.ratio.claims.filter(c =>
                c.xpath !== xpath && // Not the current one
                c.entities.some(id => claimEntityIds.has(id))
            )
        }
    }

    // 3. Veritas Data (Verifications & Graph)
    if (analysis.veritas) {
        // Find verifications for our claims
        const claimIds = new Set(result.claims.map(c => c.id))
        result.verifications = analysis.veritas.verifications.filter(v => claimIds.has(v.claimId))

        // Filter Graph: Include nodes for our claims, entities, and verification sources
        // Plus immediate neighbors
        if (analysis.veritas.graph) {
            const relevantNodeIds = new Set<string>()

            // Add claim nodes
            result.claims.forEach(c => relevantNodeIds.add(c.id))
            // Add entity nodes
            result.entities.forEach(e => relevantNodeIds.add(e.id))

            // Add 1-hop neighbors
            analysis.veritas.graph.edges.forEach((edge: any) => {
                if (relevantNodeIds.has(edge.from)) relevantNodeIds.add(edge.to)
                if (relevantNodeIds.has(edge.to)) relevantNodeIds.add(edge.from)
            })

            result.graphNodes = analysis.veritas.graph.nodes.filter(n => relevantNodeIds.has(n.id))
            result.graphEdges = analysis.veritas.graph.edges
                .filter(e => relevantNodeIds.has(e.from) && relevantNodeIds.has(e.to))
                .map((e: any) => ({
                    ...e,
                    // Ensure relationship is set (handle potential schema mismatch from raw AI data)
                    relationship: e.relationship || e.type || "related-to"
                }))

            // FALLBACK: Ensure all Claims are connected to their Entities
            // If Veritas failed to generate an edge, we create a synthetic "mentions" edge
            result.claims.forEach(claim => {
                claim.entities.forEach(entityId => {
                    // Check if edge already exists (direction agnostic)
                    const exists = result.graphEdges.some(e =>
                        (e.from === claim.id && e.to === entityId) ||
                        (e.from === entityId && e.to === claim.id)
                    )

                    if (!exists && relevantNodeIds.has(entityId)) {
                        result.graphEdges.push({
                            from: claim.id,
                            to: entityId,
                            relationship: "mentions",
                            strength: 0.8
                        })
                    }
                })
            })
        }

        result.hiddenConnections = analysis.veritas.hiddenConnections || []
    }

    // 4. Determine Element Type
    if (result.isLowValue) {
        result.elementType = 'low-value'
    } else if (result.verifications.some(v => v.status === 'false')) {
        result.elementType = 'false'
    } else if (result.fallacies.some(f => f.fallacyType === 'appeal-to-emotion')) {
        result.elementType = 'emotional'
    } else if (result.fallacies.length > 0) {
        result.elementType = 'fallacy'
    } else if (result.verifications.some(v => v.status === 'verified')) {
        result.elementType = 'verified'
    } else if (result.claims.length > 0) {
        result.elementType = 'claim'
    }

    // 5. Calculate Scores
    result.overallRisk = calculateRiskScore(result)
    result.overallConfidence = calculateConfidenceScore(result)

    // 6. Generate Summary
    result.summary = generateCardSummary(result)

    result.hasData = result.fallacies.length > 0 || result.claims.length > 0 || result.isLowValue

    return result
}

/**
 * Calculates Velox contribution to risk score (logical quality assessment).
 * Returns a score where higher = more risk from logical issues.
 */
function calculateVeloxScore(data: AggregatedCardData): number {
    let score = 0

    // Fallacies weighted by severity
    if (data.fallacies.length > 0) {
        for (const fallacy of data.fallacies) {
            const severityWeight = fallacy.severity === 'high' ? 25 :
                fallacy.severity === 'medium' ? 15 : 8
            score += severityWeight
        }

        // Emotional manipulation adds extra penalty (but softer than before)
        if (data.fallacies.some(f => f.fallacyType === 'appeal-to-emotion')) {
            score += 10
        }
    }

    // Low-value content penalty
    if (data.isLowValue) {
        score += 15
    }

    return score
}

/**
 * Calculates Ratio contribution to risk score (content quality).
 * Returns a BONUS (negative score) for high-quality content analysis.
 * Note: Per user feedback, this has minimal impact.
 */
function calculateRatioScore(data: AggregatedCardData): number {
    let bonus = 0

    // High-importance claims indicate substantive content (small bonus)
    const highImportanceClaims = data.claims.filter(c => (c.importance || 0) > 0.7)
    bonus += Math.min(highImportanceClaims.length * 3, 9) // Max -9

    return bonus
}

/**
 * Calculates Veritas contribution to risk score (verification credibility).
 * This is the DOMINANT factor per user requirements.
 * Returns positive score for false/unverifiable, negative for verified.
 */
function calculateVeritasScore(data: AggregatedCardData): number {
    let score = 0

    if (data.verifications.length === 0) {
        // No verification data - neutral (slight penalty if claims exist)
        return data.claims.length > 0 ? 5 : 0
    }

    for (const verification of data.verifications) {
        const confidence = verification.confidence

        if (verification.status === 'verified') {
            // VERIFIED CLAIMS REDUCE RISK (this is the key fix!)
            if (confidence > 0.8) {
                score -= 30 // High-confidence verification = major credibility boost
            } else if (confidence > 0.5) {
                score -= 18 // Medium-confidence verification
            } else {
                score -= 8 // Low-confidence verification
            }
        } else if (verification.status === 'false') {
            // FALSE CLAIMS INCREASE RISK
            if (confidence > 0.8) {
                score += 40 // High-confidence false = critical risk
            } else if (confidence > 0.5) {
                score += 28 // Medium-confidence false
            } else {
                score += 18 // Low-confidence false
            }
        } else if (verification.status === 'context-missing' || verification.status === 'unverifiable') {
            // Uncertainty penalty
            score += 8
        }
    }

    return score
}

/**
 * Multi-dimensional risk scoring that considers ALL agent outputs.
 * 
 * Scoring Philosophy:
 * - Base Score: 50 (neutral starting point)
 * - Veritas (ABSOLUTELY DOMINANT): 70% weight - verification truth is primary signal
 * - Velox (Important): 30% weight - logical fallacies are secondary
 * - Ratio (Minimal): REMOVED - per user feedback, not important
 * 
 * Returns 0-100 where:
 * - 0-29: LOW RISK (verified, factual, minor/no fallacies)
 * - 30-69: MODERATE RISK (mixed signals, unverified claims, medium fallacies)
 * - 70-100: HIGH RISK (false claims, severe fallacies, manipulation)
 */
export function calculateRiskScore(data: AggregatedCardData): number {
    // Start from a moderately-low baseline
    // Why 35? Allows verified facts to easily reach LOW (<30) even with minor fallacies,
    // while unverified fallacies still land in MODERATE range.
    const baseScore = 35

    // Calculate component scores
    const veloxScore = calculateVeloxScore(data)      // Logical issues (positive = risk)
    const ratioScore = calculateRatioScore(data)      // Content quality (not used)
    const veritasScore = calculateVeritasScore(data)  // Verification (ABSOLUTELY DOMINANT)

    // Weighted combination (Veritas is ABSOLUTELY DOMINANT)
    let finalScore = baseScore
    finalScore += veloxScore * 0.30      // 30% weight for logical quality
    finalScore += veritasScore * 0.70    // 70% weight for verification (ABSOLUTELY DOMINANT)
    // Ratio removed per user feedback

    // Clamp to 0-100 range
    return Math.max(0, Math.min(100, Math.round(finalScore)))
}

/**
 * Enhanced confidence score that aggregates ALL agent confidence data.
 * Veritas confidence is weighted higher (70%) than Velox (30%).
 * Returns 0-100 representing overall analysis confidence.
 */
function calculateConfidenceScore(data: AggregatedCardData): number {
    const confidences: Array<{ value: number, weight: number }> = []

    // Velox confidence (from fallacy detection)
    if (data.fallacies.length > 0) {
        const veloxAvg = data.fallacies.reduce((sum, f) => sum + f.confidence, 0) / data.fallacies.length
        confidences.push({ value: veloxAvg, weight: 0.30 })
    }

    // Veritas confidence (from verification) - ABSOLUTELY DOMINANT
    if (data.verifications.length > 0) {
        const veritasAvg = data.verifications.reduce((sum, v) => sum + v.confidence, 0) / data.verifications.length
        confidences.push({ value: veritasAvg, weight: 0.70 })
    }

    // If no confidence data available, return 0
    if (confidences.length === 0) return 0

    // Weighted average
    const totalWeight = confidences.reduce((sum, c) => sum + c.weight, 0)
    const weightedSum = confidences.reduce((sum, c) => sum + (c.value * c.weight), 0)

    return Math.round((weightedSum / totalWeight) * 100)
}

/**
 * Generates an intelligent, adaptive summary based on multi-dimensional analysis.
 * Summary reflects the balanced risk assessment from all agents.
 * Style: "Digital Brutalism" - concise, factual, high-impact.
 */
export function generateCardSummary(data: AggregatedCardData): string {
    // Special case: Low-value content (noise)
    if (data.isLowValue) {
        return `DETECTED LOW-ENTROPY CONTENT: ${data.lowValueReason?.toUpperCase() || "NOISE"}.`
    }

    // Build summary parts based on analysis results
    const parts: string[] = []

    // 1. VERITAS ASSESSMENT (Most Important)
    const verifiedCount = data.verifications.filter(v => v.status === 'verified').length
    const falseCount = data.verifications.filter(v => v.status === 'false').length
    const unverifiableCount = data.verifications.filter(v =>
        v.status === 'context-missing' || v.status === 'unverifiable'
    ).length

    if (falseCount > 0) {
        // FALSE CLAIMS - Critical warning
        parts.push(`CRITICAL: ${falseCount} FALSE CLAIM${falseCount > 1 ? 'S' : ''} DETECTED.`)
    } else if (verifiedCount > 0) {
        // VERIFIED FACTS - Positive signal
        if (data.fallacies.length === 0) {
            // Perfect: verified and no fallacies
            parts.push("VERIFIED FACTUAL CONTENT.")
        } else {
            // Good but with caveats: verified but has logical issues
            parts.push("VERIFIED FACTUAL CONTENT.")
        }
    } else if (unverifiableCount > 0) {
        // Some claims couldn't be verified
        parts.push(`${unverifiableCount} CLAIM${unverifiableCount > 1 ? 'S' : ''} UNVERIFIABLE.`)
    }

    // 2. VELOX ASSESSMENT (Secondary Importance)
    if (data.fallacies.length > 0) {
        // List unique fallacy types
        const fallacyTypes = Array.from(new Set(data.fallacies.map(f => f.fallacyType)))
            .map(type => type.replace(/-/g, ' '))
            .join(', ')
            .toUpperCase()

        // Severity context
        const hasSevere = data.fallacies.some(f => f.severity === 'high')
        const prefix = hasSevere ? "SEVERE LOGIC FAULT" :
            verifiedCount > 0 ? "MINOR LOGIC ISSUE" : "LOGIC FAULT"

        parts.push(`${prefix}: ${fallacyTypes}.`)
    }

    // 3. RATIO CONTEXT (Minimal Importance)
    // Only add if no other significant findings
    if (parts.length === 0 && data.claims.length > 0) {
        parts.push(`${data.claims.length} CLAIM${data.claims.length > 1 ? 'S' : ''} EXTRACTED FOR ANALYSIS.`)
    }

    // 4. NO DATA CASE
    if (parts.length === 0) {
        return "NO ANOMALIES DETECTED. STANDARD CONTENT."
    }

    // 5. ADAPTIVE RISK CONTEXT
    // Add risk assessment hint if score is extreme
    if (data.overallRisk < 20) {
        // Very low risk - optionally add confidence
        return parts.join(" ") + " HIGH CREDIBILITY."
    } else if (data.overallRisk > 80) {
        // Very high risk - add warning
        return "⚠️ " + parts.join(" ") + " EXERCISE CAUTION."
    }

    return parts.join(" ")
}
