import React, { useEffect, useRef, useState } from "react"
import ForceGraph2D from "react-force-graph-2d"
import type { KnowledgeGraph } from "~src/types/agents"

interface GraphViewProps {
    data: KnowledgeGraph
    width?: number
    height?: number
}

export default function GraphView({ data, width = 280, height = 200 }: GraphViewProps) {
    const graphRef = useRef<any>()
    const [graphData, setGraphData] = useState({ nodes: [], links: [] })

    useEffect(() => {
        if (data) {
            // Transform data for react-force-graph
            const nodes = data.nodes.map(n => ({
                id: n.id,
                name: n.label,
                val: n.type === "claim" ? 2 : 1,
                color: n.type === "claim" ? "#FFD700" : "#00F0FF"
            }))

            const links = data.edges.map(e => ({
                source: e.from,
                target: e.to,
                name: e.relationship
            }))

            setGraphData({ nodes, links })
        }
    }, [data])

    return (
        <div className="veritas-graph-container" style={{ border: "1px solid rgba(0, 240, 255, 0.2)", borderRadius: "4px", overflow: "hidden" }}>
            <ForceGraph2D
                ref={graphRef}
                width={width}
                height={height}
                graphData={graphData}
                nodeLabel="name"
                nodeColor="color"
                linkColor={() => "rgba(255, 255, 255, 0.2)"}
                backgroundColor="rgba(0, 0, 0, 0.3)"
                nodeRelSize={4}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
            />
        </div>
    )
}
