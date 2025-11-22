/**
 * Holographic Evidence Card Component
 * Displays verification evidence with clickable sources
 */

import React from "react"
import type { Evidence } from "~src/types/agents"

export interface HolographicEvidenceProps {
    visible: boolean
    position: { x: number; y: number }
    data: {
        claim: string
        status: "verified" | "false" | "unverifiable"
        confidence: number
        evidence: Evidence[]
        reasoning: string
    }
    onClose: () => void
    onChat: () => void
}

export function HolographicEvidence({
    visible,
    position,
    data,
    onClose,
    onChat
}: HolographicEvidenceProps) {
    if (!visible) return null

    // Adjust position to avoid screen edges
    const adjustedPosition = {
        x: Math.min(position.x, window.innerWidth - 420),
        y: Math.min(position.y, window.innerHeight - 400)
    }

    // Status colors
    const statusColors = {
        verified: { bg: "rgba(16, 185, 129, 0.95)", border: "#10b981", icon: "✓" },
        false: { bg: "rgba(239, 68, 68, 0.95)", border: "#ef4444", icon: "✗" },
        unverifiable: { bg: "rgba(245, 158, 11, 0.95)", border: "#f59e0b", icon: "?" }
    }

    const statusStyle = statusColors[data.status]

    return (
        <div
            style={{
                position: "fixed",
                left: `${adjustedPosition.x}px`,
                top: `${adjustedPosition.y}px`,
                width: "400px",
                maxHeight: "500px",
                background: "rgba(10, 10, 30, 0.97)",
                backdropFilter: "blur(12px)",
                border: `2px solid ${statusStyle.border}`,
                borderRadius: "12px",
                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px ${statusStyle.border}40`,
                zIndex: 999999,
                padding: "20px",
                color: "#fff",
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontSize: "14px",
                overflow: "auto",
                pointerEvents: "auto" // Enable interaction
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
                            width: "28px",
                            height: "28px",
                            background: statusStyle.bg,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "16px",
                            fontWeight: "bold",
                            color: "#000"
                        }}>
                        {statusStyle.icon}
                    </span>
                    <span
                        style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            textTransform: "capitalize"
                        }}>
                        {data.status}
                    </span>
                    <span
                        style={{
                            fontSize: "12px",
                            padding: "2px 8px",
                            background: "rgba(255, 255, 255, 0.1)",
                            borderRadius: "4px"
                        }}>
                        {Math.round(data.confidence * 100)}%
                    </span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        onClick={onChat}
                        style={{
                            background: "rgba(0, 240, 255, 0.1)",
                            border: "1px solid rgba(0, 240, 255, 0.3)",
                            borderRadius: "6px",
                            padding: "4px 12px",
                            color: "#00F0FF",
                            cursor: "pointer",
                            fontSize: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0, 240, 255, 0.2)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0, 240, 255, 0.1)"}
                    >
                        💬 Chat
                    </button>
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
            </div>

            {/* Claim */}
            <div
                style={{
                    marginBottom: "16px",
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "8px",
                    borderLeft: `3px solid ${statusStyle.border}`
                }}>
                <div
                    style={{
                        fontSize: "11px",
                        textTransform: "uppercase",
                        opacity: 0.6,
                        marginBottom: "4px"
                    }}>
                    Claim
                </div>
                <div style={{ lineHeight: "1.5" }}>{data.claim}</div>
            </div>

            {/* Reasoning */}
            <div
                style={{
                    marginBottom: "16px",
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.03)",
                    borderRadius: "8px"
                }}>
                <div
                    style={{
                        fontSize: "11px",
                        textTransform: "uppercase",
                        opacity: 0.6,
                        marginBottom: "4px"
                    }}>
                    Analysis
                </div>
                <div style={{ lineHeight: "1.5", fontSize: "13px" }}>{data.reasoning}</div>
            </div>

            {/* Evidence */}
            {data.evidence && data.evidence.length > 0 && (
                <div>
                    <div
                        style={{
                            fontSize: "11px",
                            textTransform: "uppercase",
                            opacity: 0.6,
                            marginBottom: "8px"
                        }}>
                        Evidence ({data.evidence.length} sources)
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {data.evidence.slice(0, 3).map((ev, idx) => (
                            <a
                                key={idx}
                                href={ev.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: "block",
                                    padding: "10px",
                                    background: "rgba(0, 240, 255, 0.08)",
                                    border: "1px solid rgba(0, 240, 255, 0.2)",
                                    borderRadius: "6px",
                                    textDecoration: "none",
                                    color: "#00F0FF",
                                    transition: "all 0.2s ease"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "rgba(0, 240, 255, 0.15)"
                                    e.currentTarget.style.borderColor = "rgba(0, 240, 255, 0.4)"
                                    e.currentTarget.style.transform = "translateX(4px)"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "rgba(0, 240, 255, 0.08)"
                                    e.currentTarget.style.borderColor = "rgba(0, 240, 255, 0.2)"
                                    e.currentTarget.style.transform = "translateX(0)"
                                }}>
                                <div
                                    style={{
                                        fontWeight: "500",
                                        marginBottom: "4px",
                                        fontSize: "13px"
                                    }}>
                                    📎 {ev.source}
                                </div>
                                <div
                                    style={{
                                        fontSize: "11px",
                                        opacity: 0.7,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis"
                                    }}>
                                    {ev.url}
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
