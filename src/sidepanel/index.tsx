import { useEffect, useState } from "react"
import { useCurrentAnalysis, useVeritasStore } from "~src/store"
import Settings from "~src/tabs/settings"
import Logs from "~src/tabs/logs"

import "~src/styles/sidepanel.css"

function SidePanel() {
    const currentAnalysis = useCurrentAnalysis()
    const [view, setView] = useState<"main" | "settings" | "logs">("main")

    useEffect(() => {
        // Listen for analysis updates to switch back to main view
        if (currentAnalysis?.status === "analyzing") {
            setView("main")
        }
    }, [currentAnalysis?.status])

    const renderContent = () => {
        switch (view) {
            case "settings":
                return <Settings />
            case "logs":
                return <Logs />
            default:
                return <MainView />
        }
    }

    return (
        <div className="side-panel">
            <div className="panel-header">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h1 className="panel-title">VERITAS</h1>
                        <div className="panel-subtitle">Truth Augmentation System</div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <EmergencyStopButton />
                        <button
                            onClick={() => setView(view === "logs" ? "main" : "logs")}
                            title="Logs"
                            style={{
                                background: "none",
                                border: "none",
                                fontSize: "18px",
                                cursor: "pointer",
                                opacity: view === "logs" ? 1 : 0.7,
                                color: view === "logs" ? "#00F0FF" : "inherit"
                            }}
                        >
                            📋
                        </button>
                        <button
                            onClick={() => setView(view === "settings" ? "main" : "settings")}
                            title="Settings"
                            style={{
                                background: "none",
                                border: "none",
                                fontSize: "18px",
                                cursor: "pointer",
                                opacity: view === "settings" ? 1 : 0.7,
                                color: view === "settings" ? "#00F0FF" : "inherit"
                            }}
                        >
                            ⚙️
                        </button>
                    </div>
                </div>
            </div>

            <div className="panel-content">
                {renderContent()}
            </div>
        </div>
    )
}

function MainView() {
    const currentAnalysis = useCurrentAnalysis()

    if (!currentAnalysis) {
        return (
            <>
                <div className="empty-state">
                    <div className="empty-icon">�</div>
                    <h2>System Standby</h2>
                    <p>Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd> to activate</p>
                </div>

                <div className="info-section">
                    <h3>System Status</h3>
                    <ul>
                        <li><strong>Velox:</strong> Ready</li>
                        <li><strong>Ratio:</strong> Ready</li>
                        <li><strong>Veritas:</strong> Ready</li>
                    </ul>
                </div>
            </>
        )
    }

    return (
        <div>
            <div className="result-section" style={{ borderLeft: "none", padding: 0, background: "transparent" }}>
                <div className="stat-row" style={{ justifyContent: "center", marginBottom: "20px" }}>
                    <div className={`stat ${currentAnalysis.status === "analyzing" ? "pulse" : ""} `} style={{ width: "100%" }}>
                        <div className="stat-value" style={{ fontSize: "16px" }}>{currentAnalysis.status.toUpperCase()}</div>
                        <div className="stat-label">CURRENT STATUS</div>
                    </div>
                </div>
            </div>

            <div className="progress-section">
                <ProgressItem
                    label="Velox"
                    status={currentAnalysis.progress.velox ? "complete" : "pending"}
                />
                <ProgressItem
                    label="Ratio"
                    status={currentAnalysis.progress.ratio ? "complete" : "pending"}
                />
                <ProgressItem
                    label="Veritas"
                    status={currentAnalysis.progress.veritas ? "complete" : "pending"}
                />
            </div>

            {currentAnalysis.status === "complete" && (
                <div className="result-section" style={{ marginTop: "24px" }}>
                    <h3>Analysis Summary</h3>
                    <div className="stat-row">
                        <div className="stat">
                            <div className="stat-value">{currentAnalysis.ratio?.claims.length || 0}</div>
                            <div className="stat-label">Claims</div>
                        </div>
                        <div className="stat">
                            <div className="stat-value" style={{ color: "#FFD700" }}>
                                {currentAnalysis.veritas?.verifications.filter(v => v.status === "verified").length || 0}
                            </div>
                            <div className="stat-label">Verified</div>
                        </div>
                    </div>
                    <div className="summary">
                        {currentAnalysis.ratio?.summary || "Analysis complete. Hover over highlighted elements to view details."}
                    </div>
                </div>
            )}
        </div>
    )
}

function ProgressItem({ label, status }: { label: string; status: "pending" | "complete" }) {
    return (
        <div className={`progress - item ${status} `}>
            <div className="progress-icon">{status === "complete" ? "✓" : "○"}</div>
            <div className="progress-label">{label}</div>
        </div>
    )
}

function EmergencyStopButton() {
    const { forceStop, resetAnalysis } = useVeritasStore()
    const currentAnalysis = useCurrentAnalysis()
    const isActive = currentAnalysis?.status === "analyzing"

    const handleForceStop = () => {
        if (confirm("⚠️ 强制停止所有操作？\n\nForce stop all operations?")) {
            forceStop()
            resetAnalysis()
        }
    }

    return (
        <button
            onClick={handleForceStop}
            title="Emergency Stop - Force stop all operations and close halo"
            style={{
                background: isActive ? "#FF0000" : "rgba(255, 0, 0, 0.3)",
                border: "2px solid #FF0000",
                borderRadius: "4px",
                padding: "6px 12px",
                fontSize: "14px",
                fontWeight: "bold",
                cursor: "pointer",
                color: "#FFFFFF",
                transition: "all 0.3s ease",
                animation: isActive ? "pulse-red 2s infinite" : "none"
            }}
        >
            🛑 STOP
        </button>
    )
}

export default SidePanel
