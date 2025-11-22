/**
 * Holographic Card - The Truth Overlay
 * Displays multi-agent analysis on hover
 */

import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { useVeritasStore } from "~src/store"
import { getElementState } from "~src/lib/dom-painter"
import CardTabs from "./CardTabs"
import GraphView from "./GraphView"
import CommanderChat from "./CommanderChat"
import { useDraggable } from "~src/hooks/useDraggable"

interface HolographicCardProps {
  xpath: string
  position: { x: number; y: number }
  onClose?: () => void
  onPositionChange?: (pos: { x: number; y: number }) => void
}

export default function HolographicCard({ xpath, position, onClose, onPositionChange }: HolographicCardProps) {
  const { handleMouseDown, isDragging } = useDraggable(position, (newPos) => {
    onPositionChange?.(newPos)
  })
  const store = useVeritasStore()
  const { currentAnalysis } = store
  const [elementState, setElementState] = useState<ReturnType<typeof getElementState>>(null)
  const [activeTab, setActiveTab] = useState("analysis")
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const state = getElementState(xpath)
    setElementState(state)
  }, [xpath])

  if (!elementState || !currentAnalysis) return null

  // Find specific verification data
  const claim = currentAnalysis.ratio?.claims.find(c => c.xpath === xpath)
  const verification = claim && currentAnalysis.veritas?.verifications.find(v => v.claimId === claim.id)
  const graphData = currentAnalysis.veritas?.graph

  return (
    <div ref={cardRef} style={getCardStyle(position)} className="veritas-holographic-card">
      <style>
        {`
          .veritas-holographic-card {
            font-family: 'JetBrains Mono', 'Courier New', monospace;
          }
          
          .veritas-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #00F0FF;
            margin-bottom: 8px;
            font-weight: bold;
          }

          .veritas-close-btn {
            background: none;
            border: none;
            color: #00F0FF;
            cursor: pointer;
            font-size: 14px;
            padding: 0 4px;
          }
          .veritas-close-btn:hover {
            color: white;
          }
          
          .veritas-card-section {
            margin-bottom: 12px;
          }
          
          .veritas-card-label {
            font-size: 9px;
            color: #FFD700;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .veritas-card-content {
            font-size: 11px;
            color: #E0E0E0;
            line-height: 1.5;
          }

          .veritas-source-link {
            display: block;
            color: #00F0FF;
            text-decoration: none;
            margin-top: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .veritas-source-link:hover {
            text-decoration: underline;
          }
          
          .veritas-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
            margin-right: 6px;
            color: #000;
          }
          .badge-verified { background: #10b981; }
          .badge-false { background: #ef4444; color: white; }
          .badge-fallacy { background: #3b82f6; color: white; }
          .badge-emotion { background: #f59e0b; }
          
          .veritas-glitch {
            animation: glitch 0.3s ease-in-out;
          }
          
          @keyframes glitch {
            0%, 100% { transform: translate(0); }
            20% { transform: translate(-2px, 2px); }
            40% { transform: translate(2px, -2px); }
            60% { transform: translate(-2px, -2px); }
            80% { transform: translate(2px, 2px); }
          }

          .veritas-tab-content {
            min-height: 150px;
          }
        `}
      </style>

      <div
        className="veritas-card-header veritas-glitch"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <span>TRUTH OVERLAY // {activeTab.toUpperCase()}</span>
        {onClose && <button className="veritas-close-btn" onClick={onClose}>×</button>}
      </div>

      <CardTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="veritas-tab-content">
        {/* TAB 1: ANALYSIS */}
        {activeTab === "analysis" && (
          <>
            {/* Velox Fallacy */}
            {elementState.isFallacy && (
              <div className="veritas-card-section">
                <div className="veritas-card-label">⚠ Logical Fallacy</div>
                <div className="veritas-card-content">
                  <span className="veritas-badge badge-fallacy">{elementState.fallacyType}</span>
                  <p>{elementState.explanation}</p>
                </div>
              </div>
            )}

            {/* Ratio Claim Info */}
            {claim && (
              <div className="veritas-card-section">
                <div className="veritas-card-label">Extracted Claim</div>
                <div className="veritas-card-content">
                  <p>"{claim.text}"</p>
                  <div style={{ marginTop: "4px", opacity: 0.7, fontSize: "9px" }}>
                    Importance: {Math.round(claim.importance * 100)}% | Entities: {claim.entities.join(", ") || "None"}
                  </div>
                </div>
              </div>
            )}

            {!elementState.isFallacy && !claim && (
              <div className="veritas-card-content" style={{ opacity: 0.6, fontStyle: "italic" }}>
                No specific anomalies detected in this segment.
              </div>
            )}
          </>
        )}

        {/* TAB 2: EVIDENCE */}
        {activeTab === "evidence" && (
          <>
            {verification ? (
              <>
                <div className="veritas-card-section">
                  <div className="veritas-card-label">
                    {verification.status === "verified" ? "✓ Verified Fact" :
                      verification.status === "false" ? "✗ Debunked" : "⚠ Analysis"}
                  </div>
                  <div className="veritas-card-content">
                    <span className={`veritas-badge badge-${verification.status === 'verified' ? 'verified' : 'false'}`}>
                      {verification.status.toUpperCase()}
                    </span>
                    <span style={{ marginLeft: "8px", opacity: 0.8 }}>
                      Confidence: {Math.round(verification.confidence * 100)}%
                    </span>
                    <p style={{ marginTop: "8px" }}>{verification.reasoning}</p>
                  </div>
                </div>

                {verification.sources && verification.sources.length > 0 && (
                  <div className="veritas-card-section">
                    <div className="veritas-card-label">Sources</div>
                    <div className="veritas-card-content">
                      {verification.sources.map((source, i) => (
                        <a key={i} href={source.url} target="_blank" rel="noopener noreferrer" className="veritas-source-link">
                          🔗 {source.source}: {source.title || "Link"}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="veritas-card-content" style={{ opacity: 0.6 }}>
                No verification data available for this segment.
              </div>
            )}
          </>
        )}

        {/* TAB 3: GRAPH */}
        {activeTab === "graph" && (
          <div className="veritas-card-section">
            {graphData ? (
              <GraphView data={graphData} width={280} height={200} />
            ) : (
              <div className="veritas-card-content" style={{ opacity: 0.6 }}>
                No knowledge graph data available.
              </div>
            )}
          </div>
        )}

        {/* TAB 4: COMMANDER */}
        {activeTab === "commander" && (
          <CommanderChat contextText={claim?.text || elementState.text || "Selected text"} />
        )}
      </div>
    </div>
  )
}

function getCardStyle(position: { x: number; y: number }): CSSProperties {
  return {
    position: "fixed",
    left: `${Math.min(position.x + 20, window.innerWidth - 320)}px`, // Prevent overflow
    top: `${Math.min(position.y, window.innerHeight - 400)}px`,
    width: "320px",
    maxHeight: "500px",
    overflowY: "auto",
    background: "rgba(10, 10, 15, 0.95)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(0, 240, 255, 0.3)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 240, 255, 0.3)",
    zIndex: 999999,
    padding: "16px",
    color: "#fff",
    fontFamily: "system-ui, -apple-system, sans-serif",
    pointerEvents: "auto" // Enable interaction
  }
}
