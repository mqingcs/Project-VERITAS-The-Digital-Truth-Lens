import React, { useEffect, useRef, useState, useCallback } from "react"
import ForceGraph2D from "react-force-graph-2d"
import type { KnowledgeGraph } from "~src/types/agents"
import { modalStyles, controlStyles, animationKeyframes, neonColors } from "~src/styles/fullscreen-graph-styles"
import { useDraggable } from "~src/hooks/useDraggable"

interface FullscreenGraphModalProps {
    data: KnowledgeGraph
    onClose: () => void
}

export default function FullscreenGraphModal({ data, onClose }: FullscreenGraphModalProps) {
    const graphRef = useRef<any>()
    const containerRef = useRef<HTMLDivElement>(null)
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
    const [graphData, setGraphData] = useState({ nodes: [], links: [] })
    const [glitchActive, setGlitchActive] = useState(false)
    const [modalPos, setModalPos] = useState({ x: window.innerWidth * 0.025, y: window.innerHeight * 0.025 })
    const { handleMouseDown, isDragging } = useDraggable(modalPos, setModalPos)

    const [highlightNodes, setHighlightNodes] = useState(new Set())
    const [highlightLinks, setHighlightLinks] = useState(new Set())

    // Resize Observer to fit graph to container
    useEffect(() => {
        if (!containerRef.current) return

        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                })
            }
        }

        const observer = new ResizeObserver(updateDimensions)
        observer.observe(containerRef.current)
        updateDimensions() // Initial size

        return () => observer.disconnect()
    }, [])

    // Transform data for 2D graph
    useEffect(() => {
        if (data && data.nodes) {
            const nodes = data.nodes.map(n => ({
                id: n.id,
                name: n.label || n.id || "UNKNOWN",
                type: n.type,
                val: n.type === "claim" ? 8 : n.type === "entity" ? 6 : 4, // Smaller radius for 2D
                color: getNodeColor(n.type)
            }))

            const links = data.edges.map(e => ({
                id: `${e.from}-${e.to}`,
                source: e.from,
                target: e.to,
                name: e.relationship || "CONNECTED", // Fallback label
                strength: e.strength
            }))

            console.log("[GRAPH] Transformed Links:", links) // Debug log
            setGraphData({ nodes, links })
        }
    }, [data])

    // Glitch effect on mount
    useEffect(() => {
        setGlitchActive(true)
        setTimeout(() => setGlitchActive(false), 600)
    }, [])

    const getNodeColor = (type: string): string => {
        switch (type) {
            case "claim": return neonColors.gold
            case "entity": return neonColors.cyan
            case "source": return neonColors.green
            default: return neonColors.gray
        }
    }

    const handleNodeClick = useCallback((node: any) => {
        // Highlight connections
        const connectedNodeIds = new Set()
        const connectedLinkIds = new Set()

        // Add clicked node
        connectedNodeIds.add(node.id)

        // Find connected links
        graphData.links.forEach((link: any) => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source
            const targetId = typeof link.target === 'object' ? link.target.id : link.target

            if (sourceId === node.id || targetId === node.id) {
                connectedLinkIds.add(link)
                connectedNodeIds.add(sourceId)
                connectedNodeIds.add(targetId)
            }
        })

        setHighlightNodes(connectedNodeIds)
        setHighlightLinks(connectedLinkIds)

        // Center view on node
        if (graphRef.current) {
            graphRef.current.centerAt(node.x, node.y, 1000)
            graphRef.current.zoom(2, 1000)
        }
    }, [graphData])

    const handleBackgroundClick = useCallback(() => {
        setHighlightNodes(new Set())
        setHighlightLinks(new Set())
        if (graphRef.current) {
            graphRef.current.zoomToFit(400)
        }
    }, [])

    // Custom Node Rendering
    const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const label = node.name
        const fontSize = 10 / globalScale // Slightly smaller base font
        const radius = node.val

        // Determine opacity based on highlight state
        const isHighlighted = highlightNodes.size === 0 || highlightNodes.has(node.id)
        const opacity = isHighlighted ? 1 : 0.1

        ctx.globalAlpha = opacity

        // 1. Draw Glow
        if (isHighlighted) {
            ctx.shadowColor = node.color
            ctx.shadowBlur = 15
        } else {
            ctx.shadowBlur = 0
        }

        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false)
        ctx.fillStyle = node.color
        ctx.fill()

        // 2. Draw Core
        ctx.shadowBlur = 0
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius * 0.7, 0, 2 * Math.PI, false)
        ctx.fillStyle = "#000" // Black core for contrast
        ctx.fill()
        ctx.strokeStyle = node.color
        ctx.lineWidth = 1.5 / globalScale
        ctx.stroke()

        // 3. Draw Label
        // Only draw label if highlighted or no selection active
        if (isHighlighted) {
            // Background for label to ensure readability
            ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`
            const textWidth = ctx.measureText(label).width
            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.5) // padding

            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
            ctx.strokeStyle = node.color
            ctx.lineWidth = 1 / globalScale

            // Label Box
            ctx.beginPath()
            ctx.rect(
                node.x - bckgDimensions[0] / 2,
                node.y - radius - bckgDimensions[1] - (2 / globalScale), // Position above node
                bckgDimensions[0],
                bckgDimensions[1]
            )
            ctx.fill()
            ctx.stroke()

            // Text
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = node.color
            ctx.fillText(
                label,
                node.x,
                node.y - radius - (bckgDimensions[1] / 2) - (2 / globalScale)
            )
        }

        // Reset shadow and alpha
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
    }, [highlightNodes])

    // Custom Link Rendering
    const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const start = link.source
        const end = link.target

        if (typeof start !== 'object' || typeof end !== 'object') return

        const isHighlighted = highlightLinks.size === 0 || highlightLinks.has(link)
        const opacity = isHighlighted ? 0.8 : 0.05 // Lower opacity for non-highlighted

        ctx.globalAlpha = opacity

        // Draw Line
        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)

        if (highlightLinks.has(link)) {
            // Highlighted link style
            ctx.strokeStyle = neonColors.gold
            ctx.lineWidth = 2 / globalScale // Slightly thinner
            ctx.shadowColor = neonColors.gold
            ctx.shadowBlur = 5
        } else {
            // Normal link style
            const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y)
            gradient.addColorStop(0, start.color || neonColors.gray)
            gradient.addColorStop(1, end.color || neonColors.gray)
            ctx.strokeStyle = gradient
            ctx.lineWidth = 1 / globalScale // Thinner normal lines
            ctx.shadowBlur = 0
        }

        ctx.stroke()
        ctx.shadowBlur = 0

        // Draw Label (Only if highlighted or no selection active)
        if (isHighlighted) {
            const midX = (start.x + end.x) / 2
            const midY = (start.y + end.y) / 2
            const label = link.name || "RELATION"

            // Much smaller font, no bold
            const fontSize = Math.max(3.5 / globalScale, 2)

            ctx.font = `${fontSize}px "JetBrains Mono", monospace`
            const textWidth = ctx.measureText(label).width
            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2) // Tighter padding

            // Label Background (More transparent)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
            ctx.fillRect(
                midX - bckgDimensions[0] / 2,
                midY - bckgDimensions[1] / 2,
                bckgDimensions[0],
                bckgDimensions[1]
            )

            // Border for label
            ctx.strokeStyle = highlightLinks.has(link) ? neonColors.gold : neonColors.gray
            ctx.lineWidth = 1 / globalScale
            ctx.strokeRect(
                midX - bckgDimensions[0] / 2,
                midY - bckgDimensions[1] / 2,
                bckgDimensions[0],
                bckgDimensions[1]
            )

            // Label Text
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = highlightLinks.has(link) ? neonColors.gold : neonColors.cyan
            ctx.fillText(label, midX, midY)
        }

        ctx.globalAlpha = 1.0
    }, [highlightLinks])

    return (
        <div
            style={modalStyles.overlay}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <style>{animationKeyframes}</style>

            <div
                style={{
                    ...modalStyles.container,
                    left: `${modalPos.x}px`,
                    top: `${modalPos.y}px`,
                    position: 'fixed',
                    animation: glitchActive
                        ? 'glitchIn 0.6s, neonBreath 3s ease-in-out infinite'
                        : 'neonBreath 3s ease-in-out infinite',
                    cursor: isDragging ? 'grabbing' : 'default'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    style={{
                        ...modalStyles.header,
                        cursor: isDragging ? 'grabbing' : 'grab'
                    }}
                    onMouseDown={handleMouseDown}
                >
                    <div style={modalStyles.title}>
                        <div style={modalStyles.glowDot}></div>
                        VERITAS // KNOWLEDGE GRAPH
                    </div>
                    <button
                        style={controlStyles.closeButton}
                        onClick={onClose}
                        title="Close (ESC)"
                    >
                        ✕
                    </button>
                </div>

                {/* Graph Container */}
                <div
                    ref={containerRef}
                    style={{
                        width: '100%',
                        height: 'calc(100% - 50px)',
                        marginTop: '50px',
                        position: 'relative',
                        overflow: 'hidden',
                        background: neonColors.black
                    }}
                >
                    {graphData.nodes.length > 0 ? (
                        <ForceGraph2D
                            ref={graphRef}
                            graphData={graphData}
                            width={dimensions.width}
                            height={dimensions.height}

                            // Rendering
                            nodeCanvasObject={nodeCanvasObject}
                            linkCanvasObject={linkCanvasObject}
                            backgroundColor={neonColors.black}

                            // Physics
                            d3AlphaDecay={0.02}
                            d3VelocityDecay={0.3}
                            cooldownTicks={100}

                            // Interaction
                            onNodeClick={handleNodeClick}
                            onBackgroundClick={handleBackgroundClick}
                            onNodeDragEnd={node => {
                                node.fx = node.x;
                                node.fy = node.y;
                            }}
                        />
                    ) : (
                        <div style={modalStyles.emptyState}>
                            NO GRAPH DATA AVAILABLE
                        </div>
                    )}
                </div>

                {/* Control Panel */}
                <div style={controlStyles.controlPanel}>
                    <button
                        style={controlStyles.controlButton}
                        onClick={() => {
                            if (graphRef.current) {
                                graphRef.current.zoom(graphRef.current.zoom() * 1.2, 400)
                            }
                        }}
                        title="Zoom In"
                    >
                        +
                    </button>
                    <button
                        style={controlStyles.controlButton}
                        onClick={() => {
                            if (graphRef.current) {
                                graphRef.current.zoom(graphRef.current.zoom() / 1.2, 400)
                            }
                        }}
                        title="Zoom Out"
                    >
                        -
                    </button>
                    <button
                        style={controlStyles.controlButton}
                        onClick={() => {
                            if (graphRef.current) {
                                graphRef.current.zoomToFit(400)
                            }
                        }}
                        title="Fit View"
                    >
                        ⟲
                    </button>
                </div>

                {/* Legend */}
                <div style={controlStyles.legend}>
                    <div style={controlStyles.legendTitle}>NODE TYPES</div>
                    <div style={controlStyles.legendItem}>
                        <div style={{ ...controlStyles.legendDot, background: neonColors.gold }}></div>
                        <span style={{ color: neonColors.gold }}>CLAIM</span>
                    </div>
                    <div style={controlStyles.legendItem}>
                        <div style={{ ...controlStyles.legendDot, background: neonColors.cyan }}></div>
                        <span style={{ color: neonColors.cyan }}>ENTITY</span>
                    </div>
                    <div style={controlStyles.legendItem}>
                        <div style={{ ...controlStyles.legendDot, background: neonColors.green }}></div>
                        <span style={{ color: neonColors.green }}>SOURCE</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
