/**
 * Execution History Component
 * Tracks and displays past autonomous executions for debugging
 */

import React, { useState, useEffect } from "react"

interface ExecutionRecord {
    id: string
    timestamp: number
    userRequest: string
    totalSteps: number
    duration?: number
    success: boolean
    reason?: string
}

const STORAGE_KEY = "veritas-execution-history"
const MAX_HISTORY_ITEMS = 20

export function ExecutionHistory() {
    const [history, setHistory] = useState<ExecutionRecord[]>([])
    const [expanded, setExpanded] = useState(false)

    // Load history from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                const parsed = JSON.parse(saved)
                setHistory(Array.isArray(parsed) ? parsed : [])
            }
        } catch (error) {
            console.error("[ExecutionHistory] Failed to load history:", error)
        }
    }, [])

    // Save new execution to history
    const addExecution = (record: ExecutionRecord) => {
        setHistory((prev) => {
            const updated = [record, ...prev].slice(0, MAX_HISTORY_ITEMS)
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
            } catch (error) {
                console.error("[ExecutionHistory] Failed to save history:", error)
            }
            return updated
        })
    }

    const clearHistory = () => {
        setHistory([])
        try {
            localStorage.removeItem(STORAGE_KEY)
        } catch (error) {
            console.error("[ExecutionHistory] Failed to clear history:", error)
        }
    }

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins < 1) return "刚刚"
        if (diffMins < 60) return `${diffMins}分钟前`
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`
        return date.toLocaleDateString("zh-CN")
    }

    const formatDuration = (ms?: number) => {
        if (!ms) return "N/A"
        const seconds = Math.floor(ms / 1000)
        if (seconds < 60) return `${seconds}秒`
        return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
    }

    return (
        <div className="execution-history">
            <div className="history-header" onClick={() => setExpanded(!expanded)}>
                <div className="header-left">
                    <span className="header-icon">📜</span>
                    <span className="header-title">Execution History</span>
                    <span className="header-count">({history.length})</span>
                </div>
                <span className="expand-icon">{expanded ? "▼" : "▶"}</span>
            </div>

            {expanded && (
                <div className="history-content">
                    {history.length === 0 ? (
                        <div className="history-empty">No executions yet</div>
                    ) : (
                        <>
                            <div className="history-list">
                                {history.map((record) => (
                                    <div key={record.id} className="history-item">
                                        <div className="item-header">
                                            <span
                                                className={`status-badge ${record.success ? "success" : "failed"}`}
                                            >
                                                {record.success ? "✓" : "✗"}
                                            </span>
                                            <span className="item-time">{formatTimestamp(record.timestamp)}</span>
                                        </div>
                                        <div className="item-request">{record.userRequest}</div>
                                        <div className="item-stats">
                                            <span>{record.totalSteps} steps</span>
                                            {record.duration && <span>· {formatDuration(record.duration)}</span>}
                                            {record.reason && (
                                                <span className="item-reason">· {record.reason}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="clear-button" onClick={clearHistory}>
                                Clear All History
                            </button>
                        </>
                    )}
                </div>
            )}

            <style jsx>{`
                .execution-history {
                    margin-top: 12px;
                    border-top: 1px solid rgba(0, 255, 255, 0.2);
                    font-family: "JetBrains Mono", monospace;
                }

                .history-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 0;
                    cursor: pointer;
                    user-select: none;
                    transition: opacity 0.2s;
                }

                .history-header:hover {
                    opacity: 0.8;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .header-icon {
                    font-size: 14px;
                }

                .header-title {
                    color: #00f0ff;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .header-count {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 11px;
                }

                .expand-icon {
                    color: #ffd700;
                    font-size: 10px;
                    transition: transform 0.2s;
                }

                .history-content {
                    max-height: 300px;
                    overflow-y: auto;
                    animation: slideDown 0.2s ease-out;
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .history-empty {
                    text-align: center;
                    padding: 24px;
                    color: rgba(255, 255, 255, 0.4);
                    font-size: 12px;
                }

                .history-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .history-item {
                    background: rgba(0, 255, 255, 0.05);
                    border: 1px solid rgba(0, 255, 255, 0.2);
                    border-radius: 6px;
                    padding: 10px 12px;
                    transition: all 0.2s;
                }

                .history-item:hover {
                    background: rgba(0, 255, 255, 0.1);
                    border-color: rgba(0, 255, 255, 0.3);
                    box-shadow: 0 0 8px rgba(0, 255, 255, 0.2);
                }

                .item-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 6px;
                }

                .status-badge {
                    width: 18px;
                    height: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 3px;
                    font-size: 10px;
                    font-weight: bold;
                }

                .status-badge.success {
                    background: rgba(0, 255, 0, 0.2);
                    color: #00ff00;
                    border: 1px solid rgba(0, 255, 0, 0.4);
                }

                .status-badge.failed {
                    background: rgba(255, 0, 0, 0.2);
                    color: #ff4444;
                    border: 1px solid rgba(255, 0, 0, 0.4);
                }

                .item-time {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 10px;
                }

                .item-request {
                    color: #fff;
                    font-size: 11px;
                    line-height: 1.4;
                    margin-bottom: 6px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                }

                .item-stats {
                    display: flex;
                    gap: 4px;
                    color: #ffd700;
                    font-size: 10px;
                    opacity: 0.7;
                }

                .item-reason {
                    color: #ff4444;
                }

                .clear-button {
                    width: 100%;
                    margin-top: 12px;
                    padding: 8px;
                    background: rgba(255, 0, 0, 0.1);
                    border: 1px solid rgba(255, 0, 0, 0.3);
                    border-radius: 4px;
                    color: #ff4444;
                    font-family: "JetBrains Mono", monospace;
                    font-size: 10px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .clear-button:hover {
                    background: rgba(255, 0, 0, 0.2);
                    border-color: #ff4444;
                }

                /* Custom scrollbar */
                .history-content::-webkit-scrollbar {
                    width: 6px;
                }

                .history-content::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 3px;
                }

                .history-content::-webkit-scrollbar-thumb {
                    background: rgba(0, 255, 255, 0.3);
                    border-radius: 3px;
                }

                .history-content::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 255, 255, 0.5);
                }
            `}</style>
        </div>
    )
}

// Export helper to add execution to history from outside
export function addExecutionToHistory(record: Omit<ExecutionRecord, "id">) {
    const fullRecord: ExecutionRecord = {
        ...record,
        id: crypto.randomUUID()
    }

    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        const history: ExecutionRecord[] = saved ? JSON.parse(saved) : []
        const updated = [fullRecord, ...history].slice(0, MAX_HISTORY_ITEMS)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (error) {
        console.error("[ExecutionHistory] Failed to add to history:", error)
    }
}
