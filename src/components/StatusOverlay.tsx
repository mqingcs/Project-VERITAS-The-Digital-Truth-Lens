import React, { useState } from "react"
import { useVeritasStore } from "~src/store"
import { useDraggable } from "~src/hooks/useDraggable"

export default function StatusOverlay() {
    const store = useVeritasStore()
    const analysis = store.currentAnalysis
    const [pos, setPos] = useState<{ x: number, y: number } | null>(null)

    const initialPos = { x: window.innerWidth - 350, y: window.innerHeight - 100 }
    const { handleMouseDown, isDragging } = useDraggable(pos || initialPos, setPos)

    // Show if analyzing OR if we have results (to allow toggling language for next run)
    // But per requirements, maybe only show when analyzing? 
    // The original code was: if (!analysis || analysis.status !== "analyzing") return null
    // We'll keep it simple for now, but maybe we want the toggle always available?
    // Let's stick to the original behavior for visibility, but add the toggle.

    // Actually, if we want to toggle language BEFORE analysis, we might need it visible.
    // But typically this overlay is for "Status". 
    // Let's just show it when analyzing for now, as requested.

    if (!analysis || analysis.status !== "analyzing") {
        return null
    }

    return (
        <div
            onMouseDown={handleMouseDown}
            style={{
                position: "fixed",
                left: pos ? `${pos.x}px` : undefined,
                top: pos ? `${pos.y}px` : undefined,
                bottom: pos ? undefined : "30px",
                right: pos ? undefined : "30px",
                cursor: isDragging ? "grabbing" : "grab",
                zIndex: 999999,
                background: "rgba(10, 10, 10, 0.9)",
                border: "1px solid rgba(0, 255, 242, 0.3)",
                padding: "15px 25px",
                borderRadius: "4px",
                fontFamily: "'JetBrains Mono', monospace",
                color: "#e0e0e0",
                boxShadow: "0 0 20px rgba(0, 255, 242, 0.1)",
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                maxWidth: "400px",
                animation: "slideIn 0.3s ease-out"
            }}>
            <div className="scan-line" style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "2px",
                background: "rgba(0, 255, 242, 0.5)",
                animation: "scan 2s linear infinite"
            }} />

            <div style={{
                width: "10px",
                height: "10px",
                background: "#00fff2",
                borderRadius: "50%",
                boxShadow: "0 0 10px #00fff2",
                animation: "pulse 1s infinite"
            }} />

            <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{
                    fontSize: "10px",
                    color: "#00fff2",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: "4px"
                }}>
                    Veritas System
                </span>
                <span style={{ fontSize: "13px" }}>
                    {analysis.statusMessage || "Initializing..."}
                </span>
            </div>



            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.8); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes scan {
                    0% { top: 0; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                @keyframes slideIn {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    )
}
