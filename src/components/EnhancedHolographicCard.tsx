import React, { useEffect, useRef, useState, useMemo } from "react"
import { useVeritasStore } from "~src/store"
import { requestDeepDive } from "~src/lib/messaging"
import { aggregateCardData, type AggregatedCardData } from "~src/lib/card-data-aggregator"
import { enhancedCardStyles, animationKeyframes } from "~src/styles/holographic-card-styles"
import GraphView from "./GraphView"
import CommanderChat from "./CommanderChat"
import { useDraggable } from "~src/hooks/useDraggable"

interface EnhancedHolographicCardProps {
    xpath: string
    position: { x: number; y: number }
    isPinned?: boolean
    isMinimized?: boolean
    activeTab?: string
    onClose: () => void
    onPin: () => void
    onMinimize: () => void
    onPositionChange: (pos: { x: number; y: number }) => void
    onTabChange: (tab: string) => void
    onOpenGraph: (data: { nodes: any[], edges: any[] }) => void
}

type TabId = "overview" | "fallacies" | "claims" | "verification" | "graph" | "commander"

export default function EnhancedHolographicCard({
    xpath,
    position,
    isPinned = false,
    isMinimized = false,
    activeTab = "overview",
    onClose,
    onPin,
    onMinimize,
    onPositionChange,
    onTabChange,
    onOpenGraph
}: EnhancedHolographicCardProps) {
    const store = useVeritasStore()
    const { currentAnalysis } = store
    const [data, setData] = useState<AggregatedCardData | null>(null)
    const [glitchActive, setGlitchActive] = useState(false)
    const [graphFilters, setGraphFilters] = useState({ claim: true, entity: true, source: true })
    const tabsContainerRef = useRef<HTMLDivElement>(null)

    // Draggable hook
    const { handleMouseDown, isDragging } = useDraggable(position, onPositionChange)

    // Aggregate data on mount or when analysis changes
    useEffect(() => {
        if (currentAnalysis) {
            const aggregated = aggregateCardData(xpath, currentAnalysis)
            setData(aggregated)
        }
    }, [xpath, currentAnalysis])

    // Random glitch effect
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                setGlitchActive(true)
                setTimeout(() => setGlitchActive(false), 300)
            }
        }, 10000)
        return () => clearInterval(interval)
    }, [])

    // Inject keyframes
    useEffect(() => {
        const styleId = "veritas-keyframes"
        if (!document.getElementById(styleId)) {
            const style = document.createElement("style")
            style.id = styleId
            style.textContent = animationKeyframes
            // We need to append this to the shadow root, but since we are inside React,
            // we assume the parent container (Shadow DOM root) will handle global styles or we inject here if possible.
            // For now, let's assume global injection or scoped style block.
            // Actually, best to render a style tag inside the component if we are in Shadow DOM.
        }
    }, [])

    if (!data) return null

    // Risk Color
    const getRiskColor = (score: number) => {
        if (score < 30) return enhancedCardStyles.riskColors.low
        if (score < 70) return enhancedCardStyles.riskColors.medium
        return enhancedCardStyles.riskColors.high
    }

    const riskColor = getRiskColor(data.overallRisk)

    // Render Tabs
    // Render Tabs

    const scrollTabs = (direction: 'left' | 'right') => {
        if (tabsContainerRef.current) {
            const scrollAmount = 100
            tabsContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
        }
    }

    const renderTabs = () => (
        <div style={enhancedCardStyles.tabs.wrapper}>
            <button
                style={enhancedCardStyles.tabs.scrollBtn}
                onClick={() => scrollTabs('left')}
                title="Scroll Left"
            >
                ‹
            </button>

            <div
                ref={tabsContainerRef}
                style={enhancedCardStyles.tabs.container}
            >
                {(["overview", "fallacies", "claims", "verification", "graph", "commander"] as TabId[]).map(tab => (
                    <button
                        key={tab}
                        style={{
                            ...enhancedCardStyles.tabs.tab,
                            ...(activeTab === tab ? enhancedCardStyles.tabs.tabActive : {})
                        }}
                        onClick={() => {
                            onTabChange(tab)
                            // Auto-scroll to active tab
                            // This is a simple implementation, could be improved to center the tab
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <button
                style={enhancedCardStyles.tabs.scrollBtn}
                onClick={() => scrollTabs('right')}
                title="Scroll Right"
            >
                ›
            </button>
        </div>
    )

    // Render Content based on active tab
    const renderContent = () => {
        switch (activeTab) {
            case "overview":
                const radius = 36
                const circumference = 2 * Math.PI * radius
                const strokeDashoffset = circumference - (data.overallRisk / 100) * circumference

                return (
                    <div style={enhancedCardStyles.content}>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
                            <div style={enhancedCardStyles.gaugeContainer}>
                                {/* SVG Gauge */}
                                <svg width="80" height="80" style={{ transform: "rotate(-90deg)" }}>
                                    <circle
                                        cx="40"
                                        cy="40"
                                        r={radius}
                                        stroke="rgba(255,255,255,0.1)"
                                        strokeWidth="6"
                                        fill="transparent"
                                    />
                                    <circle
                                        cx="40"
                                        cy="40"
                                        r={radius}
                                        stroke={riskColor}
                                        strokeWidth="6"
                                        fill="transparent"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                                    />
                                </svg>
                                <div style={{
                                    position: "absolute",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    <span style={{ fontSize: "18px", fontWeight: "bold", color: riskColor }}>
                                        {data.overallRisk}
                                    </span>
                                    <span style={{ fontSize: "8px", opacity: 0.7, textTransform: "uppercase" }}>RISK</span>
                                </div>
                            </div>

                            <div style={{ marginLeft: "16px", flex: 1 }}>
                                <div style={enhancedCardStyles.label}>RISK ASSESSMENT</div>
                                <div style={{ fontSize: "14px", fontWeight: "bold", color: riskColor, marginBottom: "4px" }}>
                                    {data.overallRisk < 30 ? "LOW RISK" : data.overallRisk < 70 ? "MODERATE RISK" : "HIGH RISK"}
                                </div>
                                <div style={{ fontSize: "10px", opacity: 0.7, lineHeight: "1.4" }}>
                                    Confidence: {data.overallConfidence}% based on {data.verifications.length} checks and {data.fallacies.length} logic scans.
                                </div>
                            </div>
                        </div>

                        <div style={enhancedCardStyles.label}>SUMMARY</div>
                        <p style={{ ...enhancedCardStyles.text, marginBottom: "20px" }}>{data.summary}</p>

                        {/* Quick Actions */}
                        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                            <button
                                style={enhancedCardStyles.actionBtn}
                                onClick={() => onTabChange("commander")}
                            >
                                💬 Ask Commander
                            </button>
                            <button
                                style={enhancedCardStyles.actionBtn}
                                onClick={() => onTabChange("graph")}
                            >
                                🕸️ View Graph
                            </button>
                        </div>

                        <div style={{ marginTop: "auto" }}>
                            {data.fallacies.length > 0 && (
                                <span style={{ ...enhancedCardStyles.badge, background: enhancedCardStyles.riskColors.high, color: "white" }}>
                                    {data.fallacies.length} FALLACIES
                                </span>
                            )}
                            {data.verifications.some(v => v.status === 'false') && (
                                <span style={{ ...enhancedCardStyles.badge, background: enhancedCardStyles.riskColors.high, color: "white" }}>
                                    FALSE CLAIMS
                                </span>
                            )}
                            {data.verifications.some(v => v.status === 'verified') && (
                                <span style={{ ...enhancedCardStyles.badge, background: enhancedCardStyles.riskColors.low, color: "black" }}>
                                    VERIFIED FACTS
                                </span>
                            )}
                        </div>
                    </div>
                )

            case "fallacies":
                return (
                    <div style={enhancedCardStyles.content}>
                        {data.fallacies.length === 0 ? (
                            <div style={{ opacity: 0.6, fontStyle: "italic" }}>No logical fallacies detected.</div>
                        ) : (
                            data.fallacies.map((f, i) => (
                                <FallacyItem key={i} fallacy={f} />
                            ))
                        )}
                    </div>
                )

            case "claims":
                return (
                    <div style={enhancedCardStyles.content}>
                        {data.claims.length === 0 ? (
                            <div style={{ opacity: 0.6, fontStyle: "italic" }}>No specific claims extracted.</div>
                        ) : (
                            data.claims.map((c, i) => {
                                const isVerified = data.verifications.some(v => v.claimId === c.id)
                                return (
                                    <div key={i} style={{ marginBottom: "12px", background: "rgba(255,255,255,0.05)", padding: "8px", borderRadius: "4px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                            <div style={enhancedCardStyles.label}>CLAIM #{i + 1}</div>
                                            <div style={{ display: "flex", gap: "2px" }} title={`Importance: ${Math.round((c.importance || 0.5) * 100)}%`}>
                                                {[1, 2, 3].map(level => (
                                                    <div key={level} style={{
                                                        width: "3px",
                                                        height: "8px",
                                                        background: (c.importance || 0.5) * 3 >= level ? "#00F0FF" : "rgba(0, 240, 255, 0.2)",
                                                        borderRadius: "1px"
                                                    }} />
                                                ))}
                                            </div>
                                        </div>

                                        <p style={enhancedCardStyles.text}>"{c.text}"</p>

                                        <div style={{ marginTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                                {c.entities.map(e => (
                                                    <span key={e} style={{ fontSize: "9px", background: "rgba(0, 240, 255, 0.1)", color: "#00F0FF", padding: "2px 4px", borderRadius: "2px" }}>
                                                        {data.entities.find(ent => ent.id === e)?.name || e}
                                                    </span>
                                                ))}
                                            </div>

                                            {!isVerified && (
                                                <button
                                                    onClick={() => {
                                                        requestDeepDive(c.text, c.id, "Verify this claim")
                                                        onTabChange("commander") // Switch to commander to see progress/result
                                                    }}
                                                    style={{
                                                        background: "transparent",
                                                        border: "1px solid #FFD700",
                                                        color: "#FFD700",
                                                        fontSize: "9px",
                                                        padding: "2px 6px",
                                                        borderRadius: "2px",
                                                        cursor: "pointer",
                                                        textTransform: "uppercase"
                                                    }}
                                                >
                                                    Verify This
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                )

            case "verification":
                return (
                    <div style={enhancedCardStyles.content}>
                        {data.verifications.length === 0 ? (
                            <div style={{ opacity: 0.6, fontStyle: "italic" }}>No verification data available.</div>
                        ) : (
                            data.verifications.map((v, i) => (
                                <div key={i} style={{ marginBottom: "20px" }}>
                                    <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                                        <span style={{
                                            ...enhancedCardStyles.badge,
                                            background: v.status === 'verified' ? enhancedCardStyles.riskColors.low :
                                                v.status === 'false' ? enhancedCardStyles.riskColors.high :
                                                    enhancedCardStyles.riskColors.medium,
                                            color: v.status === 'false' ? 'white' : 'black'
                                        }}>
                                            {v.status}
                                        </span>
                                        <span style={{ fontSize: "10px", opacity: 0.7 }}>Confidence: {Math.round(v.confidence * 100)}%</span>
                                    </div>
                                    <p style={enhancedCardStyles.text}>{v.reasoning}</p>

                                    {v.sources && v.sources.length > 0 && (
                                        <div style={{ marginTop: "12px" }}>
                                            <div style={enhancedCardStyles.label}>SOURCES</div>
                                            {v.sources.map((s, j) => {
                                                const sourceType = getSourceType(s.url)
                                                return (
                                                    <div key={j} style={{ marginBottom: "6px" }}>
                                                        <a
                                                            href={s.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title={s.snippet || "No preview available"}
                                                            style={{ display: "flex", alignItems: "center", textDecoration: "none", gap: "6px" }}
                                                        >
                                                            <span style={{
                                                                fontSize: "8px",
                                                                padding: "1px 4px",
                                                                borderRadius: "2px",
                                                                background: sourceType.color,
                                                                color: "#000",
                                                                fontWeight: "bold"
                                                            }}>
                                                                {sourceType.label}
                                                            </span>
                                                            <span style={{
                                                                fontSize: "10px",
                                                                color: "#00F0FF",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: "nowrap",
                                                                flex: 1
                                                            }}>
                                                                {s.source}: {s.title || "Link"}
                                                            </span>
                                                        </a>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )

            case "graph":
                const filteredNodes = data.graphNodes.filter(n => {
                    if (n.type === 'claim' && !graphFilters.claim) return false
                    if (n.type === 'entity' && !graphFilters.entity) return false
                    if (n.type === 'source' && !graphFilters.source) return false
                    return true
                })

                const filteredEdges = data.graphEdges.filter(e => {
                    const sourceNode = data.graphNodes.find(n => n.id === e.from)
                    const targetNode = data.graphNodes.find(n => n.id === e.to)
                    if (!sourceNode || !targetNode) return false

                    // If either node is hidden, hide the edge
                    if (sourceNode.type === 'claim' && !graphFilters.claim) return false
                    if (sourceNode.type === 'entity' && !graphFilters.entity) return false
                    if (sourceNode.type === 'source' && !graphFilters.source) return false

                    if (targetNode.type === 'claim' && !graphFilters.claim) return false
                    if (targetNode.type === 'entity' && !graphFilters.entity) return false
                    if (targetNode.type === 'source' && !graphFilters.source) return false

                    return true
                })

                return (
                    <div style={{ height: "300px", background: "rgba(0,0,0,0.3)", display: "flex", flexDirection: "column" }}>
                        <div style={{ padding: "8px", display: "flex", gap: "12px", alignItems: "center", borderBottom: "1px solid rgba(0,240,255,0.1)" }}>
                            <label style={{ fontSize: "10px", color: "#FFD700", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    checked={graphFilters.claim}
                                    onChange={e => setGraphFilters({ ...graphFilters, claim: e.target.checked })}
                                /> CLAIMS
                            </label>
                            <label style={{ fontSize: "10px", color: "#00F0FF", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    checked={graphFilters.entity}
                                    onChange={e => setGraphFilters({ ...graphFilters, entity: e.target.checked })}
                                /> ENTITIES
                            </label>
                            <label style={{ fontSize: "10px", color: "#10b981", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    checked={graphFilters.source}
                                    onChange={e => setGraphFilters({ ...graphFilters, source: e.target.checked })}
                                /> SOURCES
                            </label>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onOpenGraph({ nodes: data.graphNodes || [], edges: data.graphEdges || [] })
                                }}
                                style={{
                                    marginLeft: 'auto',
                                    background: 'rgba(0, 240, 255, 0.1)',
                                    border: '1px solid rgba(0, 240, 255, 0.3)',
                                    color: '#00F0FF',
                                    fontSize: '10px',
                                    padding: '4px 8px',
                                    borderRadius: '2px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontFamily: 'inherit',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(0, 240, 255, 0.2)'
                                    e.currentTarget.style.boxShadow = '0 0 8px #00F0FF'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)'
                                    e.currentTarget.style.boxShadow = 'none'
                                }}
                                title="Open fullscreen 3D visualization"
                            >
                                ⛶ FULLSCREEN
                            </button>
                        </div>

                        <div style={{ flex: 1, position: "relative" }}>
                            {filteredNodes.length > 0 ? (
                                <GraphView
                                    data={{ nodes: filteredNodes, edges: filteredEdges }}
                                    width={320}
                                    height={260}
                                    onNodeClick={(node) => {
                                        console.log("Graph node clicked:", node)
                                    }}
                                />
                            ) : (
                                <div style={{ padding: "20px", opacity: 0.6, textAlign: "center" }}>No graph data available.</div>
                            )}
                        </div>
                    </div>
                )

            case "commander":
                const suggestions: string[] = []

                if (data.fallacies.length > 0) {
                    suggestions.push(`Explain the ${data.fallacies[0].fallacyType} fallacy`)
                }

                if (data.claims.length > 0) {
                    suggestions.push("Verify the main claim")
                    if (data.entities.length > 0) {
                        suggestions.push(`Who is ${data.entities[0].name}?`)
                    }
                }

                if (data.isLowValue) {
                    suggestions.push("Why is this low value?")
                }

                suggestions.push("Summarize this section")

                return (
                    <div style={{ height: "300px", display: "flex", flexDirection: "column" }}>
                        <CommanderChat
                            contextText={data.text || "Selected text"}
                            suggestedQuestions={suggestions}
                        />
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div
            style={{
                ...enhancedCardStyles.card,
                left: position.x,
                top: position.y,
                width: isMinimized ? "200px" : "320px",
                height: isMinimized ? "auto" : "auto",
                maxHeight: isMinimized ? "auto" : "500px",
                animation: `${enhancedCardStyles.neonBreath} 3s ease-in-out infinite, ${glitchActive ? enhancedCardStyles.glitch + " 0.3s" : "none"}`,
                transition: isDragging ? "none" : enhancedCardStyles.card.transition
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <style>{animationKeyframes}</style>

            {/* Header */}
            <div
                style={enhancedCardStyles.header}
                onMouseDown={handleMouseDown}
            >
                <div style={enhancedCardStyles.headerTitle}>
                    <span style={{ width: "8px", height: "8px", background: riskColor, borderRadius: "50%", boxShadow: `0 0 5px ${riskColor}` }}></span>
                    VERITAS // {activeTab}
                </div>
                <div style={enhancedCardStyles.headerControls}>
                    <button style={enhancedCardStyles.controlBtn} onClick={onPin} title={isPinned ? "Unpin" : "Pin"}>
                        {isPinned ? "📌" : "📍"}
                    </button>
                    <button style={enhancedCardStyles.controlBtn} onClick={onMinimize} title={isMinimized ? "Expand" : "Minimize"}>
                        {isMinimized ? "□" : "_"}
                    </button>
                    <button style={enhancedCardStyles.controlBtn} onClick={onClose} title="Close">
                        ×
                    </button>
                </div>
            </div>

            {/* Body (only if not minimized) */}
            {!isMinimized && (
                <>
                    {renderTabs()}
                    {renderContent()}
                </>
            )}
        </div>
    )
}

// --- Sub-components & Data ---

function getSourceType(url: string): { label: string, color: string } {
    if (!url) return { label: "UNKNOWN", color: "#9ca3af" }

    if (url.includes(".gov")) return { label: "OFFICIAL", color: "#10b981" }
    if (url.includes(".edu")) return { label: "ACADEMIC", color: "#60a5fa" }
    if (url.includes(".org")) return { label: "ORG", color: "#f59e0b" }
    if (url.includes("wikipedia")) return { label: "WIKI", color: "#d1d5db" }
    if (url.includes("twitter") || url.includes("x.com") || url.includes("facebook")) return { label: "SOCIAL", color: "#f472b6" }

    return { label: "WEB", color: "#9ca3af" }
}

const FALLACY_DEFINITIONS: Record<string, string> = {
    "ad-hominem": "Attacking the person making the argument rather than the argument itself.",
    "slippery-slope": "Asserting that a relatively small first step will inevitably lead to a chain of related (negative) events.",
    "appeal-to-emotion": "Manipulating an emotional response in place of a valid or compelling argument.",
    "strawman": "Misrepresenting an opponent's argument to make it easier to attack.",
    "false-dichotomy": "Presenting two opposing options as the only possibilities, when others exist.",
    "hasty-generalization": "Making a rushing conclusion without considering all of the variables.",
    "circular-reasoning": "The reasoner begins with what they are trying to end with."
}

function FallacyItem({ fallacy }: { fallacy: any }) {
    const [expanded, setExpanded] = useState(false)
    const type = (fallacy.fallacyType || "unknown") as string
    const definition = FALLACY_DEFINITIONS[type] || "A logical error in reasoning."

    return (
        <div style={{ marginBottom: "16px", borderLeft: "2px solid #ef4444", paddingLeft: "12px" }}>
            <div style={enhancedCardStyles.label}>{(type).replace(/-/g, " ")}</div>
            <p style={enhancedCardStyles.text}>{fallacy.explanation}</p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                <div style={{ fontSize: "9px", opacity: 0.6 }}>
                    SEVERITY: {String(fallacy.severity || "LOW").toUpperCase()}
                </div>
                <button
                    onClick={() => setExpanded(!expanded)}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: "#00F0FF",
                        fontSize: "9px",
                        cursor: "pointer",
                        textDecoration: "underline"
                    }}
                >
                    {expanded ? "Hide Info" : "What is this?"}
                </button>
            </div>

            {expanded && (
                <div style={{
                    marginTop: "8px",
                    padding: "8px",
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontStyle: "italic",
                    color: "rgba(255, 255, 255, 0.8)"
                }}>
                    <strong>Definition:</strong> {definition}
                </div>
            )}
        </div>
    )
}
