import { aggregateCardData, calculateRiskScore, generateCardSummary } from "./card-data-aggregator"
import type { VeritasAnalysis } from "~src/types/agents"

describe("Multi-Dimensional Risk Scoring", () => {
    // Test 1: Verified content with minor fallacy → LOW risk
    it("should show LOW RISK for verified facts with minor fallacies", () => {
        const analysis: VeritasAnalysis = {
            url: "http://test.com",
            pageTitle: "Test",
            status: "complete",
            progress: { velox: true, ratio: true, veritas: true },
            velox: {
                lowValueNodes: [],
                fallacyNodes: [{
                    elementId: "1",
                    xpath: "/html/body/p[1]",
                    fallacyType: "appeal-to-emotion",
                    explanation: "Emotional language",
                    confidence: 0.8,
                    severity: "low"
                }],
                timestamp: 123
            },
            ratio: {
                claims: [{
                    id: "c1",
                    text: "Claim text",
                    claimText: "Claim text",
                    xpath: "/html/body/p[1]",
                    entities: [],
                    importance: 0.8
                }],
                data: [],
                entities: [],
                summary: "Summary",
                timestamp: 123
            },
            veritas: {
                verifications: [{
                    claimId: "c1",
                    status: "verified",
                    confidence: 0.95,
                    sources: [],
                    reasoning: "Verified"
                }],
                graph: { nodes: [], edges: [] },
                hiddenConnections: [],
                timestamp: 123
            }
        }

        const result = aggregateCardData("/html/body/p[1]", analysis)

        expect(result.overallRisk).toBeLessThan(30) // Should be LOW RISK
        expect(result.summary).toContain("VERIFIED FACTUAL CONTENT")
        expect(result.summary).toContain("MINOR LOGIC ISSUE")
    })

    // Test 2: False claim with high confidence → HIGH risk
    it("should show HIGH RISK for high-confidence false claims", () => {
        const analysis: VeritasAnalysis = {
            url: "http://test.com",
            pageTitle: "Test",
            status: "complete",
            progress: { velox: true, ratio: true, veritas: true },
            velox: {
                lowValueNodes: [],
                fallacyNodes: [],
                timestamp: 123
            },
            ratio: {
                claims: [{
                    id: "c1",
                    text: "False claim",
                    claimText: "False claim",
                    xpath: "/html/body/p[1]",
                    entities: [],
                    importance: 0.9
                }],
                data: [],
                entities: [],
                summary: "Summary",
                timestamp: 123
            },
            veritas: {
                verifications: [{
                    claimId: "c1",
                    status: "false",
                    confidence: 0.9,
                    sources: [],
                    reasoning: "Debunked"
                }],
                graph: { nodes: [], edges: [] },
                hiddenConnections: [],
                timestamp: 123
            }
        }

        const result = aggregateCardData("/html/body/p[1]", analysis)

        expect(result.overallRisk).toBeGreaterThan(70) // Should be HIGH RISK
        expect(result.summary).toContain("FALSE CLAIM")
        expect(result.summary).toContain("EXERCISE CAUTION")
    })

    // Test 3: Unverified fallacy → MODERATE risk
    it("should show MODERATE RISK for unverified content with fallacies", () => {
        const analysis: VeritasAnalysis = {
            url: "http://test.com",
            pageTitle: "Test",
            status: "complete",
            progress: { velox: true, ratio: true, veritas: true },
            velox: {
                lowValueNodes: [],
                fallacyNodes: [{
                    elementId: "1",
                    xpath: "/html/body/p[1]",
                    fallacyType: "strawman",
                    explanation: "Misrepresentation",
                    confidence: 0.7,
                    severity: "medium"
                }],
                timestamp: 123
            },
            ratio: {
                claims: [],
                data: [],
                entities: [],
                summary: "Summary",
                timestamp: 123
            },
            veritas: {
                verifications: [],
                graph: { nodes: [], edges: [] },
                hiddenConnections: [],
                timestamp: 123
            }
        }

        const result = aggregateCardData("/html/body/p[1]", analysis)

        expect(result.overallRisk).toBeGreaterThanOrEqual(30)
        expect(result.overallRisk).toBeLessThan(70)
        expect(result.summary).toContain("LOGIC FAULT")
    })

    // Test 4: Multi-agent confidence aggregation
    it("should aggregate Velox + Veritas confidence", () => {
        const analysis: VeritasAnalysis = {
            url: "http://test.com",
            pageTitle: "Test",
            status: "complete",
            progress: { velox: true, ratio: true, veritas: true },
            velox: {
                lowValueNodes: [],
                fallacyNodes: [{
                    elementId: "1",
                    xpath: "/html/body/p[1]",
                    fallacyType: "ad-hominem",
                    explanation: "Test",
                    confidence: 0.8,
                    severity: "low"
                }],
                timestamp: 123
            },
            ratio: {
                claims: [{
                    id: "c1",
                    text: "Claim",
                    claimText: "Claim",
                    xpath: "/html/body/p[1]",
                    entities: [],
                    importance: 0.5
                }],
                data: [],
                entities: [],
                summary: "Summary",
                timestamp: 123
            },
            veritas: {
                verifications: [{
                    claimId: "c1",
                    status: "verified",
                    confidence: 0.9,
                    sources: [],
                    reasoning: "Verified"
                }],
                graph: { nodes: [], edges: [] },
                hiddenConnections: [],
                timestamp: 123
            }
        }

        const result = aggregateCardData("/html/body/p[1]", analysis)

        // Should weight Veritas higher: (0.8 * 0.30) + (0.9 * 0.70) = 0.87 = 87%
        expect(result.overallConfidence).toBeGreaterThan(85)
    })

    // Test 5: Empty analysis
    it("should handle empty analysis gracefully", () => {
        const result = aggregateCardData("/html/body/p[2]", null)

        expect(result.hasData).toBe(false)
        expect(result.overallRisk).toBe(0)
        expect(result.summary).toContain("No analysis data available")
    })

    // Test 6: Very low risk with high credibility
    it("should add HIGH CREDIBILITY suffix for very low risk", () => {
        const analysis: VeritasAnalysis = {
            url: "http://test.com",
            pageTitle: "Test",
            status: "complete",
            progress: { velox: true, ratio: true, veritas: true },
            velox: {
                lowValueNodes: [],
                fallacyNodes: [],
                timestamp: 123
            },
            ratio: {
                claims: [{
                    id: "c1",
                    text: "Claim",
                    claimText: "Claim",
                    xpath: "/html/body/p[1]",
                    entities: [],
                    importance: 0.9
                }],
                data: [],
                entities: [],
                summary: "Summary",
                timestamp: 123
            },
            veritas: {
                verifications: [{
                    claimId: "c1",
                    status: "verified",
                    confidence: 0.95,
                    sources: [],
                    reasoning: "Highly verified"
                }],
                graph: { nodes: [], edges: [] },
                hiddenConnections: [],
                timestamp: 123
            }
        }

        const result = aggregateCardData("/html/body/p[1]", analysis)

        expect(result.overallRisk).toBeLessThan(20)
        expect(result.summary).toContain("HIGH CREDIBILITY")
    })
})
