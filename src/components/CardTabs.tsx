import React from "react"

interface CardTabsProps {
    activeTab: string
    onTabChange: (tab: string) => void
}

export const TABS = [
    { id: "analysis", label: "ANALYSIS", icon: "🔍" },
    { id: "evidence", label: "EVIDENCE", icon: "⚖️" },
    { id: "graph", label: "GRAPH", icon: "🕸️" },
    { id: "commander", label: "COMMANDER", icon: "💬" }
]

export default function CardTabs({ activeTab, onTabChange }: CardTabsProps) {
    return (
        <div className="veritas-tabs">
            <style>
                {`
          .veritas-tabs {
            display: flex;
            border-bottom: 1px solid rgba(0, 240, 255, 0.2);
            margin-bottom: 12px;
          }
          
          .veritas-tab-btn {
            flex: 1;
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.5);
            padding: 8px 4px;
            font-size: 9px;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.2s;
            border-bottom: 2px solid transparent;
            font-family: 'JetBrains Mono', monospace;
          }
          
          .veritas-tab-btn:hover {
            color: #fff;
            background: rgba(0, 240, 255, 0.05);
          }
          
          .veritas-tab-btn.active {
            color: #00F0FF;
            border-bottom: 2px solid #00F0FF;
            text-shadow: 0 0 8px rgba(0, 240, 255, 0.5);
          }
        `}
            </style>
            {TABS.map(tab => (
                <button
                    key={tab.id}
                    className={`veritas-tab-btn ${activeTab === tab.id ? "active" : ""}`}
                    onClick={() => onTabChange(tab.id)}
                    title={tab.label}
                >
                    {tab.icon} {tab.label}
                </button>
            ))}
        </div>
    )
}
