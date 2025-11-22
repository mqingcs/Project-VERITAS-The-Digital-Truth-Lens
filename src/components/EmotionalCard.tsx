/**
 * Emotional Card Component
 * Displays emotional manipulation analysis
 */

import React from "react"

export interface EmotionalCardProps {
    visible: boolean
    position: { x: number; y: number }
    data: {
        text: string
        type: "fear" | "anger" | "joy" | "sadness" | "disgust" | "surprise"
        explanation: string
        confidence: number
        manipulation_level: "low" | "medium" | "high"
    }
    onClose: () => void
}

export function EmotionalCard({ visible, position, data, onClose }: EmotionalCardProps) {
    if (!visible) return null

    // Adjust position to avoid screen edges
    const adjustedPosition = {
        x: Math.min(position.x, window.innerWidth - 380),
        y: Math.min(position.y, window.innerHeight - 350)
    }

    // Emotion type labels and icons
    const emotionData: Record<string, { label: string; icon: string }> = {
        fear: { label: "Fear Appeal", icon: "😨" },
        anger: { label: "Anger Trigger", icon: "😡" },
        joy: { label: "Joy Manipulation", icon: "😃" },
        sadness: { label: "Sadness Appeal", icon: "😢" },
        disgust: { label: "Disgust Trigger", icon: "🤢" },
        surprise: { label: "Shock Value", icon: "😲" }
    }

    // Manipulation level colors
    const manipulationColors = {
        low: "#f59e0b",
        medium: "#ef4444",
        high: "#dc2626"
    }

    const emotion = emotionData[data.type] || { label: "Emotional Content", icon: "💭" }
    const manipulationColor = manipulationColors[data.manipulation_level] || manipulationColors.medium

    return (
        <div
            style={{
                position: "fixed",
                left: `${adjustedPosition.x}px`,
                top: `${adjustedPosition.y}px`,
                width: "360px",
                maxHeight: "400px",
                background: "rgba(10, 10, 30, 0.97)",
                backdropFilter: "blur(12px)",
                border: "2px solid #ef4444",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(239, 68, 68, 0.3)",
                zIndex: 999999,
                padding: "20px",
                color: "#fff",
                fontFamily: "system-ui, -apple-system, sans-serif",
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
                        {emotion.icon}
                    </span>
                    <span
                        style={{
                            fontSize: "16px",
                            fontWeight: "600"
                        }}>
                        Emotional Content
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

            {/* Emotion Type */}
            <div
                style={{
                    marginBottom: "16px",
                    padding: "12px",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "8px"
                }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "4px"
                    }}>
                    <span
                        style={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "#fca5a5"
                        }}>
                        {emotion.label}
                    </span>
                    <span
                        style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            background: manipulationColor,
                            borderRadius: "4px",
                            textTransform: "uppercase",
                            fontWeight: "600"
                        }}>
                        {data.manipulation_level}
                    </span>
                </div>
            </div>

            {/* Text */}
            <div
                style={{
                    marginBottom: "16px",
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "8px",
                    borderLeft: "3px solid #ef4444"
                }}>
                <div
                    style={{
                        fontSize: "11px",
                        textTransform: "uppercase",
                        opacity: 0.6,
                        marginBottom: "4px"
                    }}>
                    Emotional Text
                </div>
                <div style={{ lineHeight: "1.5" }}>{data.text}</div>
            </div>

            {/* Explanation */}
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
                    Why This Is Problematic
                </div>
                <div style={{ lineHeight: "1.5", fontSize: "13px" }}>{data.explanation}</div>
            </div>

            {/* Confidence */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                    opacity: 0.7
                }}>
                <span>Confidence:</span>
                <div
                    style={{
                        flex: 1,
                        height: "6px",
                        background: "rgba(255, 255, 255, 0.1)",
                        borderRadius: "3px",
                        overflow: "hidden"
                    }}>
                    <div
                        style={{
                            width: `${data.confidence * 100}%`,
                            height: "100%",
                            background: "#ef4444",
                            transition: "width 0.3s ease"
                        }}
                    />
                </div>
                <span>{Math.round(data.confidence * 100)}%</span>
            </div>
        </div>
    )
}
