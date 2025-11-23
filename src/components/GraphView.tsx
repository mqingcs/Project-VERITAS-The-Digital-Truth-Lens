import React, { useEffect, useRef, useState, useCallback } from "react"
import ForceGraph2D from "react-force-graph-2d"
import type { KnowledgeGraph } from "~src/types/agents"

interface GraphViewProps {
    data: KnowledgeGraph
    width?: number
    height?: number
    onNodeClick?: (node: any) => void
}

export default function GraphView({ data, width = 280, height = 200, onNodeClick }: GraphViewProps) {
    const graphRef = useRef<any>()
    const [graphData, setGraphData] = useState({ nodes: [], links: [] })
    const [highlightNodes, setHighlightNodes] = useState(new Set())
    const [highlightLinks, setHighlightLinks] = useState(new Set())

    useEffect(() => {
        if (data) {
            const nodes = data.nodes.map(n => ({
                id: n.id,
                name: n.label,
                type: n.type,
                val: n.type === "claim" ? 5 : n.type === "entity" ? 3 : 2,
                color: getNodeColor(n.type)
            }))

            const links = data.edges.map(e => ({
                source: e.from,
                target: e.to,
                name: e.relationship,
                color: "#4b5563"
            }))

            setGraphData({ nodes, links })
        }
    }, [data])

    const getNodeColor = (type: string) => {
        switch (type) {
            case "claim": return "#FFD700" // Gold
            case "entity": return "#00F0FF" // Cyan
            case "source": return "#10b981" // Green
            default: return "#9ca3af" // Gray
        }
    }

    const handleNodeClick = useCallback((node) => {
        if (onNodeClick) onNodeClick(node)

        // Highlight connections
        const connectedNodeIds = new Set()
        const connectedLinkIds = new Set()

        // Find connected links
        // Note: react-force-graph modifies links to be objects, not just IDs
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
        graphRef.current?.centerAt(node.x, node.y, 1000)
        graphRef.current?.zoom(2, 1000)
    }, [graphData, onNodeClick])

    const handleZoomIn = () => {
        graphRef.current?.zoom(graphRef.current.zoom() * 1.2, 400)
    }

    const handleZoomOut = () => {
        graphRef.current?.zoom(graphRef.current.zoom() / 1.2, 400)
    }

    const handleReset = () => {
        graphRef.current?.zoomToFit(400)
        setHighlightNodes(new Set())
        setHighlightLinks(new Set())
    }

    return (
        <div className="veritas-graph-container" style={{
            position: "relative",
            border: "1px solid rgba(0, 240, 255, 0.2)",
            borderRadius: "4px",
            overflow: "hidden",
            background: "rgba(0, 0, 0, 0.6)"
        }}>
            <div style={{
                position: "absolute",
                top: 8,
                right: 8,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                zIndex: 10
            }}>
                <button onClick={handleZoomIn} style={btnStyle}>+</button>
                <button onClick={handleZoomOut} style={btnStyle}>-</button>
                <button onClick={handleReset} style={btnStyle}>⟲</button>
            </div>

            <ForceGraph2D
                ref={graphRef}
                width={width}
                height={height}
                graphData={graphData}
                nodeLabel="name"
                nodeColor={(node: any) => {
                    if (highlightNodes.size > 0 && !highlightNodes.has(node.id)) {
                        return "rgba(255,255,255,0.1)"
                    }
                    return node.color
                }}
                linkColor={(link: any) => highlightLinks.has(link) ? "#FFD700" : "rgba(255, 255, 255, 0.15)"}
                backgroundColor="rgba(0, 0, 0, 0)"
                nodeRelSize={4}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                onNodeClick={handleNodeClick}
                cooldownTicks={100}
            />
        </div>
    )
}

const btnStyle: React.CSSProperties = {
    background: "rgba(0, 240, 255, 0.1)",
    border: "1px solid rgba(0, 240, 255, 0.3)",
    color: "#00F0FF",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "14px",
    borderRadius: "4px",
    transition: "all 0.2s"
}
