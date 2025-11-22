/**
 * Fallacy Card Component
 * Displays logical fallacy analysis
 */

import React from "react"
import type { FallacyType } from "~src/types/agents"

export interface FallacyCardProps {
    visible: boolean
    position: { x: number; y: number }
    data: {
        text: string
        fallacies: {
            fallacyType: FallacyType
            explanation: string
            confidence: number
            severity: "low" | "medium" | "high"
        }[]
    }
    onClose: () => void
}

export function FallacyCard({ visible, position, data, onClose }: FallacyCardProps) {
    if (!visible) return null

    // Adjust position to avoid screen edges
    const adjustedPosition = {
        x: Math.min(position.x, window.innerWidth - 380),
        y: Math.min(position.y, window.innerHeight - 350)
    }

    // Severity colors
    const severityColors = {
        low: "#3b82f6",
        medium: "#f59e0b",
        high: "#ef4444"
    }

    // Fallacy type labels
    const fallacyLabels: Record<FallacyType, string> = {
        "ad-hominem": "Ad Hominem Attack",
        "slippery-slope": "Slippery Slope",
        "appeal-to-emotion": "Appeal to Emotion",
        "strawman": "Straw Man Argument",
        "false-dichotomy": "False Dichotomy",
        "hasty-generalization": "Hasty Generalization",
        "circular-reasoning": "Circular Reasoning"
    }

    return (
        <div
            style={{
                position: "fixed",
                left: `${adjustedPosition.x}px`,
                top: `${adjustedPosition.y}px`,
                width: "360px",
                maxHeight: "500px",
                background: "rgba(10, 10, 30, 0.97)",
                backdropFilter: "blur(12px)",
                border: "2px solid #3b82f6",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(239, 68, 68, 0.3)",
                zIndex: 999999,
                padding: "16px",
                color: "#fff",
                fontFamily: "system-ui, -apple-system, sans-serif",
                pointerEvents: "auto", // Enable interaction
                fontSize: "14px",
                overflow: "auto"
            }}
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px"
                }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}>
                    <span
                        style={{
                            fontSize: "24px"
                        }}>
                        🧠
                    </span>
                    <span
                        style={{
                            fontSize: "16px",
                            fontWeight: "600"
                        }}>
                        Logical Fallacies ({data.fallacies.length})
                    </span>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "6px",
                        padding: "4px 12px",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: "14px"
                    }}>
                    ×
                </button>
            </div>

            {/* Problematic Text */}
            <div
                style={{
                    marginBottom: "20px",
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "8px",
                    borderLeft: "3px solid #3b82f6"
                }}>
                <div
                    style={{
                        fontSize: "11px",
                        textTransform: "uppercase",
                        opacity: 0.6,
                        marginBottom: "4px"
                    }}>
                    Problematic Text
                </div>
                <div style={{ lineHeight: "1.5", fontStyle: "italic" }}>"{data.text}"</div>
            </div>

            {/* Fallacies List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {data.fallacies.map((fallacy, index) => {
                    const severityColor = severityColors[fallacy.severity] || severityColors.medium
                    return (
                        <div key={index} style={{
                            padding: "12px",
                            background: "rgba(255, 255, 255, 0.03)",
                            borderRadius: "8px",
                            border: "1px solid rgba(255, 255, 255, 0.1)"
                        }}>
                            {/* Fallacy Type Header */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "8px"
                                }}>
                                <span
                                    style={{
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        color: "#60a5fa"
                                    }}>
                                    {fallacyLabels[fallacy.fallacyType] || fallacy.fallacyType}
                                </span>
                                <span
                                    style={{
                                        fontSize: "10px",
                                        padding: "2px 6px",
                                        background: severityColor,
                                        borderRadius: "4px",
                                        textTransform: "uppercase",
                                        fontWeight: "600"
                                    }}>
                                    {fallacy.severity}
                                </span>
                            </div>

                            {/* Explanation */}
                            <div style={{ lineHeight: "1.5", fontSize: "13px", marginBottom: "8px" }}>
                                {fallacy.explanation}
                            </div>

                            {/* Confidence */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    fontSize: "11px",
                                    opacity: 0.7
                                }}>
                                <span>Confidence:</span>
                                <div
                                    style={{
                                        flex: 1,
                                        height: "4px",
                                        background: "rgba(255, 255, 255, 0.1)",
                                        borderRadius: "2px",
                                        overflow: "hidden"
                                    }}>
                                    <div
                                        style={{
                                            width: `${fallacy.confidence * 100}%`,
                                            height: "100%",
                                            background: "#3b82f6",
                                            transition: "width 0.3s ease"
                                        }}
                                    />
                                </div>
                                <span>{Math.round(fallacy.confidence * 100)}%</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
