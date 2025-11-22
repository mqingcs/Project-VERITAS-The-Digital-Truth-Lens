import React, { useEffect, useState } from "react"
import { logger, type LogEntry } from "~src/lib/logger"

export default function Logs() {
    const [logs, setLogs] = useState<LogEntry[]>([])

    useEffect(() => {
        // Load initial logs
        setLogs(logger.getLogs())

        // Subscribe to new logs
        const unsubscribe = logger.subscribe((newLogs) => {
            setLogs([...newLogs])
        })

        // Also load from storage to see logs from other contexts
        chrome.storage.local.get(["veritas_logs"], (result) => {
            if (result.veritas_logs) {
                // Merge and sort
                const allLogs = [...logger.getLogs(), ...result.veritas_logs]
                // Deduplicate by ID
                const uniqueLogs = Array.from(new Map(allLogs.map(item => [item.id, item])).values())
                // Sort by timestamp desc
                uniqueLogs.sort((a, b) => b.timestamp - a.timestamp)
                setLogs(uniqueLogs)
            }
        })

        return unsubscribe
    }, [])

    return (
        <div className="veritas-logs-container" style={{ padding: "16px", color: "#E0E0E0", fontFamily: "monospace", fontSize: "10px" }}>
            <h2 style={{ color: "#00F0FF", borderBottom: "1px solid #00F0FF", paddingBottom: "8px" }}>SYSTEM LOGS</h2>
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {logs.map((log) => (
                    <div key={log.id} style={{
                        borderLeft: `2px solid ${getColor(log.level)}`,
                        paddingLeft: "8px",
                        background: "rgba(255,255,255,0.05)",
                        padding: "4px"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.7 }}>
                            <span>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                            <span style={{ color: getColor(log.level) }}>{log.level.toUpperCase()}</span>
                            <span>{log.source}</span>
                        </div>
                        <div style={{ marginTop: "4px" }}>{log.message}</div>
                        {log.details && (
                            <pre style={{ marginTop: "4px", overflowX: "auto", opacity: 0.6 }}>
                                {JSON.stringify(log.details, null, 2)}
                            </pre>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

function getColor(level: string) {
    switch (level) {
        case "error": return "#FF4444"
        case "warn": return "#FFD700"
        case "info": return "#00F0FF"
        case "debug": return "#888"
        default: return "#FFF"
    }
}
