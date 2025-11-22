/**
 * ResultWindow - Floating window for displaying Commander results
 */

import { useState } from "react"

interface ResultWindowProps {
    title: string
    content: string
    position?: "center" | "top-right" | "bottom-right"
    type?: "info" | "warning" | "success" | "error"
    onClose: () => void
}

export default function ResultWindow({
    title,
    content,
    position = "top-right",
    type = "info",
    onClose
}: ResultWindowProps) {
    const [isMinimized, setIsMinimized] = useState(false)

    // Position styling
    const positionStyles = {
        "center": {
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)"
        },
        "top-right": {
            right: "20px",
            top: "80px"
        },
        "bottom-right": {
            right: "20px",
            bottom: "20px"
        }
    }

    // Type colors
    const typeColors = {
        "info": { border: "rgba(0, 150, 255, 0.6)", bg: "rgba(0, 100, 200, 0.15)" },
        "warning": { border: "rgba(255, 180, 0, 0.6)", bg: "rgba(255, 150, 0, 0.15)" },
        "success": { border: "rgba(0, 255, 100, 0.6)", bg: "rgba(0, 200, 80, 0.15)" },
        "error": { border: "rgba(255, 50, 80, 0.6)", bg: "rgba(255, 30, 50, 0.15)" }
    }

    const colors = typeColors[type]

    // Simple markdown to HTML (basic support)
    const renderMarkdown = (md: string) => {
        return md
            .replace(/## (.*)/g, '<h2 style="color: cyan; font-size: 16px; margin: 12px 0 8px 0;">$1</h2>')
            .replace(/### (.*)/g, '<h3 style="color: #00d9ff; font-size: 14px; margin: 10px 0 6px 0;">$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #fff;">$1</strong>')
            .replace(/\n- (.*)/g, '<li style="margin-left: 20px; margin-bottom: 4px;">$1</li>')
            .replace(/\n\n/g, '<br/><br/>')
            .replace(/✅/g, '<span style="color: #00ff80;">✅</span>')
            .replace(/❌/g, '<span style="color: #ff5080;">❌</span>')
            .replace(/⚠️/g, '<span style="color: #ffb400;">⚠️</span>')
    }

    if (isMinimized) {
        return (
            <div
                style={{
                    position: "fixed",
                    ...positionStyles[position],
                    width: "200px",
                    background: "linear-gradient(135deg, rgba(20,20,40,0.95), rgba(40,20,50,0.95))",
                    backdropFilter: "blur(15px)",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    padding: "10px 14px",
                    cursor: "pointer",
                    pointerEvents: "auto",
                    zIndex: 10002,
                    boxShadow: `0 4px 20px ${colors.border}`,
                    fontFamily: "'Inter', -apple-system, sans-serif"
                }}
                onClick={() => setIsMinimized(false)}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "cyan", fontWeight: "600", fontSize: "13px" }}>
                        {title}
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onClose()
                        }}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#ff5080",
                            cursor: "pointer",
                            fontSize: "14px"
                        }}
                    >
                        ✕
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div
            style={{
                position: "fixed",
                ...positionStyles[position],
                width: "450px",
                maxHeight: "600px",
                background: "linear-gradient(135deg, rgba(15,15,35,0.97), rgba(35,15,45,0.97))",
                backdropFilter: "blur(25px)",
                border: `2px solid ${colors.border}`,
                borderRadius: "12px",
                boxShadow: `0 20px 60px ${colors.border}, 0 0 120px rgba(0, 255, 255, 0.1)`,
                overflow: "hidden",
                pointerEvents: "auto",
                zIndex: 10002,
                fontFamily: "'Inter', -apple-system, sans-serif",
                animation: "fadeInScale 0.3s ease-out"
            }}
        >
            {/* Header */}
            <div
                style={{
                    background: `linear-gradient(90deg, ${colors.bg}, rgba(0,0,0,0.2))`,
                    borderBottom: `1px solid ${colors.border}`,
                    padding: "14px 18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}
            >
                <div style={{ color: "cyan", fontWeight: "bold", fontSize: "15px" }}>
                    {title}
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                    <button
                        onClick={() => setIsMinimized(true)}
                        style={{
                            background: "rgba(255,255,255,0.1)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            borderRadius: "4px",
                            color: "#fff",
                            cursor: "pointer",
                            padding: "3px 8px",
                            fontSize: "11px"
                        }}
                    >
                        _
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            background: "rgba(255,50,80,0.2)",
                            border: "1px solid rgba(255,50,80,0.4)",
                            borderRadius: "4px",
                            color: "#ff5080",
                            cursor: "pointer",
                            padding: "3px 8px",
                            fontSize: "11px"
                        }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Content */}
            <div
                style={{
                    padding: "18px",
                    maxHeight: "520px",
                    overflowY: "auto",
                    color: "rgba(255,255,255,0.9)",
                    fontSize: "13px",
                    lineHeight: "1.6"
                }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            />

            <style>{`
                @keyframes fadeInScale {
                    from {
                        opacity: 0;
                        transform: scale(0.9) ${position === "center" ? "translate(-50%, -50%)" : ""};
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) ${position === "center" ? "translate(-50%, -50%)" : ""};
                    }
                }
            `}</style>
        </div>
    )
}
