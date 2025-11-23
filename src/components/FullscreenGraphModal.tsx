
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
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
                id: `${e.from} -${e.to} `,
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

    // State for interaction
    const [filters, setFilters] = useState({ claim: true, entity: true, source: true })
    const [searchQuery, setSearchQuery] = useState("")
    const [focusNode, setFocusNode] = useState<string | null>(null)
    const [searchMatches, setSearchMatches] = useState<string[]>([])
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0)

    // Filter Data
    const filteredData = useMemo(() => {
        let nodes = graphData.nodes // Use graphData from props/state, not a generic 'data'
        let links = graphData.links // Use graphData from props/state, not a generic 'data'

        // 1. Type Filtering
        nodes = nodes.filter(n => {
            if (n.type === 'claim' && !filters.claim) return false
            if (n.type === 'entity' && !filters.entity) return false
            if (n.type === 'source' && !filters.source) return false
            return true
        })

        // 2. Focus Mode
        if (focusNode) {
            const focused = nodes.find(n => n.id === focusNode)
            if (focused) {
                const connectedNodeIds = new Set<string>()
                connectedNodeIds.add(focusNode)
                links.forEach(e => {
                    const sourceId = typeof e.source === 'object' ? e.source.id : e.source
                    const targetId = typeof e.target === 'object' ? e.target.id : e.target
                    if (sourceId === focusNode) connectedNodeIds.add(targetId)
                    if (targetId === focusNode) connectedNodeIds.add(sourceId)
                })
                nodes = nodes.filter(n => connectedNodeIds.has(n.id))
            }
        }

        // 3. Edge Filtering (must connect two visible nodes)
        const nodeIds = new Set(nodes.map(n => n.id))
        links = links.filter(e => {
            const sourceId = typeof e.source === 'object' ? e.source.id : e.source
            const targetId = typeof e.target === 'object' ? e.target.id : e.target
            return nodeIds.has(sourceId) && nodeIds.has(targetId)
        })

        return { nodes, links } // Return links, not edges
    }, [graphData, filters, focusNode]) // Depend on graphData

    // Search Handler
    const handleSearch = (query: string) => {
        setSearchQuery(query)
        if (!query) {
            setHighlightNodes(new Set()) // Clear highlight if search is empty
            setSearchMatches([])
            setCurrentMatchIndex(0)
            return
        }

        // Find all matching nodes
        const matches = graphData.nodes.filter(n =>
            n.name.toLowerCase().includes(query.toLowerCase()) ||
            (n.val && n.val.toString().includes(query))
        )

        const matchIds = matches.map(n => n.id)
        setSearchMatches(matchIds)
        setCurrentMatchIndex(0)

        if (matchIds.length > 0) {
            // Highlight all matches
            setHighlightNodes(new Set(matchIds))

            // Zoom to first match
            const firstMatch = matches[0]
            if (graphRef.current) {
                graphRef.current.centerAt(firstMatch.x, firstMatch.y, 1000)
                graphRef.current.zoom(4, 2000)
            }
        } else {
            setHighlightNodes(new Set()) // Clear highlight if no match
        }
    }

    // Navigation Handlers
    const handleNextMatch = () => {
        if (searchMatches.length === 0) return
        const nextIndex = (currentMatchIndex + 1) % searchMatches.length
        setCurrentMatchIndex(nextIndex)
        zoomToMatch(searchMatches[nextIndex])
    }

    const handlePrevMatch = () => {
        if (searchMatches.length === 0) return
        const prevIndex = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length
        setCurrentMatchIndex(prevIndex)
        zoomToMatch(searchMatches[prevIndex])
    }

    const zoomToMatch = (nodeId: string) => {
        const node = graphData.nodes.find(n => n.id === nodeId)
        if (node && graphRef.current) {
            graphRef.current.centerAt(node.x, node.y, 1000)
            graphRef.current.zoom(4, 2000)
        }
    }

    // Node Double Click (Focus Mode)
    const handleNodeDoubleClick = (node: any) => {
        if (focusNode === node.id) {
            setFocusNode(null) // Exit focus
        } else {
            setFocusNode(node.id) // Enter focus
            // Zoom to focused node
            if (graphRef.current) {
                graphRef.current.centerAt(node.x, node.y, 1000)
                graphRef.current.zoom(3, 1000)
            }
        }
    }



    const handleZoomIn = useCallback(() => {
        if (graphRef.current) {
            graphRef.current.zoom(graphRef.current.zoom() * 1.2, 400)
        }
    }, [])

    const handleZoomOut = useCallback(() => {
        if (graphRef.current) {
            graphRef.current.zoom(graphRef.current.zoom() / 1.2, 400)
        }
    }, [])

    const handleResetZoom = useCallback(() => {
        if (graphRef.current) {
            graphRef.current.zoomToFit(400)
        }
    }, [])

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
                    left: `${modalPos.x} px`,
                    top: `${modalPos.y} px`,
                    position: 'fixed', // Ensure fixed positioning relative to viewport
                    width: '90vw',
                    height: '90vh',
                    transform: 'none', // Prevent flex centering interference
                    animation: glitchActive
                        ? 'glitchIn 0.6s, neonBreath 4s ease-in-out infinite'
                        : 'neonBreath 4s ease-in-out infinite',
                    cursor: isDragging ? 'grabbing' : 'default'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header (Title Only) */}
                <div
                    style={{
                        ...modalStyles.header,
                        cursor: isDragging ? 'grabbing' : 'grab',
                        background: 'transparent', // Make header transparent
                        borderBottom: 'none', // Remove border
                        pointerEvents: 'none' // Let clicks pass through
                    }}
                    onMouseDown={handleMouseDown}
                >
                    <div style={{ ...modalStyles.title, pointerEvents: 'auto' }}>
                        <div style={modalStyles.glowDot}></div>
                        VERITAS // KNOWLEDGE GRAPH {focusNode ? "(FOCUS MODE)" : ""}
                    </div>
                </div>

                {/* Top Right: Close Button */}
                <button
                    style={{
                        ...controlStyles.closeButton,
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        zIndex: 30
                    }}
                    onClick={onClose}
                    title="Close (ESC)"
                >
                    ✕
                </button>

                {/* Top Left: Filters */}
                <div style={controlStyles.filterContainer}>
                    <div
                        style={{
                            ...controlStyles.filterButton,
                            ...(filters.claim ? controlStyles.filterButtonActive : {})
                        }}
                        onClick={() => setFilters({ ...filters, claim: !filters.claim })}
                    >
                        <div style={{ ...controlStyles.filterDot, background: filters.claim ? neonColors.gold : 'transparent', borderColor: neonColors.gold }}></div>
                        <span style={{ ...controlStyles.filterText, color: filters.claim ? neonColors.gold : neonColors.gray }}>CLAIMS</span>
                    </div>
                    <div
                        style={{
                            ...controlStyles.filterButton,
                            ...(filters.entity ? controlStyles.filterButtonActive : {})
                        }}
                        onClick={() => setFilters({ ...filters, entity: !filters.entity })}
                    >
                        <div style={{ ...controlStyles.filterDot, background: filters.entity ? neonColors.cyan : 'transparent', borderColor: neonColors.cyan }}></div>
                        <span style={{ ...controlStyles.filterText, color: filters.entity ? neonColors.cyan : neonColors.gray }}>ENTITIES</span>
                    </div>
                    <div
                        style={{
                            ...controlStyles.filterButton,
                            ...(filters.source ? controlStyles.filterButtonActive : {})
                        }}
                        onClick={() => setFilters({ ...filters, source: !filters.source })}
                    >
                        <div style={{ ...controlStyles.filterDot, background: filters.source ? neonColors.green : 'transparent', borderColor: neonColors.green }}></div>
                        <span style={{ ...controlStyles.filterText, color: filters.source ? neonColors.green : neonColors.gray }}>SOURCES</span>
                    </div>
                </div>

                {/* Top Center: Search */}
                <div style={controlStyles.searchContainer}>
                    <input
                        type="text"
                        placeholder="SEARCH NODES..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={controlStyles.searchBar}
                        onFocus={(e) => {
                            e.target.style.background = 'rgba(0, 240, 255, 0.05)'
                        }}
                        onBlur={(e) => {
                            e.target.style.background = 'transparent'
                        }}
                    />

                    {/* Search Navigation */}
                    {searchMatches.length > 0 && (
                        <div style={controlStyles.searchNav}>
                            <span style={controlStyles.matchCount}>
                                {currentMatchIndex + 1} / {searchMatches.length}
                            </span>
                            <button
                                style={controlStyles.navButton}
                                onClick={handlePrevMatch}
                                title="Previous Match"
                            >
                                &lt;
                            </button>
                            <button
                                style={controlStyles.navButton}
                                onClick={handleNextMatch}
                                title="Next Match"
                            >
                                &gt;
                            </button>
                        </div>
                    )}
                </div>

                {/* Bottom Left: Zoom Controls */}
                <div style={controlStyles.zoomContainer}>
                    <button style={controlStyles.zoomButton} onClick={handleZoomIn} title="Zoom In">+</button>
                    <button style={controlStyles.zoomButton} onClick={handleZoomOut} title="Zoom Out">-</button>
                    <button style={controlStyles.zoomButton} onClick={handleResetZoom} title="Reset View">⟲</button>
                </div>

                {/* Graph Area */}
                <div
                    ref={containerRef}
                    style={{
                        width: '100%',
                        height: '100%', // Full height
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 0, // Behind controls
                        background: neonColors.black
                    }}
                >
                    {filteredData.nodes.length > 0 ? (
                        <ForceGraph2D
                            ref={graphRef}
                            graphData={filteredData}
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
                            onNodeRightClick={handleNodeDoubleClick}
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
            </div>
        </div>
    )
}
