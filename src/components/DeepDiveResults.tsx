/**
 * Deep Dive Results Panel
 * Beautiful floating panel to display Deep Dive analysis results
 */

import { useState, useEffect } from "react"
import type { VerifiedGraphData } from "~src/types/agents"

interface DeepDiveResultsProps {
    results: VerifiedGraphData | null
    onClose: () => void
    onChat: () => void
}

export default function DeepDiveResults({ results, onClose, onChat }: DeepDiveResultsProps) {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (results) {
            setVisible(true)
        }
    }, [results])

    if (!results || !visible) return null

    const { verifications, graph } = results
    const hasResults = verifications.length > 0 || graph.nodes.length > 0

    return (
        <div
            className="veritas-deep-dive-results"
            style={{
                position: "fixed",
                bottom: "20px",
                right: "20px",
                width: "420px",
                maxHeight: "600px",
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                borderRadius: "16px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(102, 126, 234, 0.3)",
                zIndex: 999998,
                overflow: "hidden",
                animation: "slideInUp 0.3s ease-out",
                pointerEvents: "auto"
            }}
        >
            {/* Header */}
            <div style={{
                padding: "20px",
                borderBottom: "1px solid rgba(102, 126, 234, 0.2)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
            }}>
                <div>
                    <div style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}>
                        🔍 Deep Dive Results
                        <span style={{
                            fontSize: "12px",
                            fontWeight: 400,
                            color: "#00F0FF",
                            background: "rgba(0, 240, 255, 0.1)",
                            padding: "2px 8px",
                            borderRadius: "4px"
                        }}>
                            {verifications.length} verifications
                        </span>
                    </div>
                    <div style={{
                        fontSize: "12px",
                        color: "#888",
                        marginTop: "4px"
                    }}>
                        {graph.nodes.length} entities · {graph.edges.length} connections
                    </div>
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
                        onClick={() => {
                            setVisible(false)
                            setTimeout(onClose, 300)
                        }}
                        style={{
                            background: "rgba(255, 255, 255, 0.1)",
                            border: "none",
                            color: "#fff",
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "18px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"
                        }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Content */}
            <div style={{
                maxHeight: "500px",
                overflowY: "auto",
                padding: "20px"
            }}>
                {!hasResults ? (
                    <div style={{
                        textAlign: "center",
                        padding: "40px 20px",
                        color: "#888"
                    }}>
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🤔</div>
                        <div style={{ fontSize: "14px" }}>
                            No verifications found.<br />
                            The content may be too vague or unverifiable.
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Verifications */}
                        {verifications.map((v, i) => (
                            <div
                                key={i}
                                style={{
                                    background: v.status === "verified"
                                        ? "rgba(76, 175, 80, 0.1)"
                                        : v.status === "false"
                                            ? "rgba(244, 67, 54, 0.1)"
                                            : "rgba(255, 152, 0, 0.1)",
                                    border: `1px solid ${v.status === "verified"
                                        ? "rgba(76, 175, 80, 0.3)"
                                        : v.status === "false"
                                            ? "rgba(244, 67, 54, 0.3)"
                                            : "rgba(255, 152, 0, 0.3)"
                                        }`,
                                    borderRadius: "12px",
                                    padding: "16px",
                                    marginBottom: "12px"
                                }}
                            >
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "start",
                                    marginBottom: "8px"
                                }}>
                                    <div style={{
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        color: v.status === "verified"
                                            ? "#4CAF50"
                                            : v.status === "false"
                                                ? "#F44336"
                                                : "#FF9800"
                                    }}>
                                        {v.status === "verified" ? "✓ VERIFIED" : v.status === "false" ? "✕ FALSE" : "? UNVERIFIABLE"}
                                    </div>
                                    <div style={{
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        color: "#fff",
                                        background: "rgba(102, 126, 234, 0.3)",
                                        padding: "4px 8px",
                                        borderRadius: "4px"
                                    }}>
                                        {Math.round(v.confidence * 100)}%
                                    </div>
                                </div>

                                <div style={{
                                    fontSize: "13px",
                                    color: "#ccc",
                                    lineHeight: "1.6",
                                    marginBottom: "12px"
                                }}>
                                    {v.reasoning || v.evidenceSummary}
                                </div>

                                {v.sources && v.sources.length > 0 && (
                                    <div style={{
                                        fontSize: "11px",
                                        color: "#888"
                                    }}>
                                        <div style={{ marginBottom: "6px", fontWeight: 600 }}>
                                            Sources ({v.sources.length}):
                                        </div>
                                        {v.sources.slice(0, 2).map((s, si) => (
                                            <div key={si} style={{ marginBottom: "4px" }}>
                                                <a
                                                    href={s.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        color: "#00F0FF",
                                                        textDecoration: "none"
                                                    }}
                                                >
                                                    📎 {s.source || s.title || "Source"}
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Graph Summary */}
                        {graph.nodes.length > 0 && (
                            <div style={{
                                marginTop: "16px",
                                padding: "16px",
                                background: "rgba(102, 126, 234, 0.1)",
                                border: "1px solid rgba(102, 126, 234, 0.2)",
                                borderRadius: "12px"
                            }}>
                                <div style={{
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    color: "#00F0FF",
                                    marginBottom: "12px"
                                }}>
                                    🌐 Knowledge Graph
                                </div>
                                <div style={{
                                    fontSize: "12px",
                                    color: "#ccc",
                                    lineHeight: "1.6"
                                }}>
                                    Discovered {graph.nodes.length} entities and {graph.edges.length} relationships.
                                    {graph.edges.length > 0 && (
                                        <div style={{ marginTop: "8px" }}>
                                            Key connections: {graph.edges.slice(0, 3).map(e => e.relationship).join(", ")}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <style>{`
                @keyframes slideInUp {
                    from {
                        transform: translateY(100px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .veritas-deep-dive-results::-webkit-scrollbar {
                    width: 6px;
                }
                .veritas-deep-dive-results::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                }
                .veritas-deep-dive-results::-webkit-scrollbar-thumb {
                    background: rgba(102, 126, 234, 0.5);
                    border-radius: 3px;
                }
            `}</style>
        </div>
    )
}
