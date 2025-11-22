/**
 * Knowledge Graph Visualization Component
 * Using vis-network for interactive graph rendering
 */

import React, { useEffect, useRef } from "react"
import { Network } from "vis-network"
import { DataSet } from "vis-data"
import type { GraphNode, GraphEdge } from "~src/types/agents"

interface KnowledgeGraphProps {
    nodes: GraphNode[]
    edges: GraphEdge[]
    focusNodeId?: string
    onNodeClick?: (nodeId: string) => void
}

export default function KnowledgeGraph({ nodes, edges, focusNodeId, onNodeClick }: KnowledgeGraphProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const networkRef = useRef<Network | null>(null)

    useEffect(() => {
        if (!containerRef.current || nodes.length === 0) return

        // Convert to vis-network format
        const visNodes = new DataSet(
            nodes.map(node => ({
                id: node.id,
                label: node.label,
                title: node.type,
                color: getNodeColor(node.type),
                shape: getNodeShape(node.type),
                font: {
                    color: "#ffffff",
                    size: 14
                }
            })) as any
        )

        const visEdges = new DataSet(
            edges.map(edge => ({
                from: edge.from,
                to: edge.to,
                label: edge.relationship,
                width: Math.max(1, edge.strength * 5),
                color: {
                    color: "#888",
                    highlight: "#FFD700"
                },
                font: {
                    color: "#aaa",
                    size: 10,
                    align: "middle"
                }
            })) as any
        )

        const data = { nodes: visNodes, edges: visEdges }

        const options = {
            physics: {
                enabled: true,
                barnesHut: {
                    gravitationalConstant: -2000,
                    springLength: 150,
                    springConstant: 0.04
                },
                stabilization: {
                    iterations: 200
                }
            },
            interaction: {
                hover: true,
                tooltipDelay: 200,
                zoomView: true,
                dragView: true
            },
            nodes: {
                borderWidth: 2,
                size: 25,
                font: {
                    size: 14,
                    face: "Tahoma"
                }
            },
            edges: {
                width: 2,
                smooth: {
                    type: "continuous",
                    enabled: true,
                    roundness: 0.5
                }
            }
        }

        // Create network
        const network = new Network(containerRef.current, data, options)
        networkRef.current = network

        // Handle node clicks
        network.on("click", (params) => {
            if (params.nodes.length > 0 && onNodeClick) {
                onNodeClick(params.nodes[0])
            }
        })

        // Focus on specific node if provided
        if (focusNodeId) {
            network.focus(focusNodeId, {
                scale: 1.5,
                animation: {
                    duration: 1000,
                    easingFunction: "easeInOutQuad"
                }
            })
            network.selectNodes([focusNodeId])
        }

        return () => {
            network.destroy()
        }
    }, [nodes, edges, focusNodeId, onNodeClick])

    if (nodes.length === 0) {
        return (
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "400px",
                color: "#888",
                fontSize: "14px"
            }}>
                No knowledge graph data available. Run analysis first.
            </div>
        )
    }

    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "500px",
                    background: "#0a0a0a",
                    borderRadius: "8px",
                    border: "1px solid #333"
                }}
            />
            <div style={{
                position: "absolute",
                bottom: "10px",
                left: "10px",
                background: "rgba(0,0,0,0.8)",
                padding: "10px",
                borderRadius: "4px",
                fontSize: "11px",
                color: "#aaa"
            }}>
                <div><span style={{ color: "#4CAF50" }}>●</span> Entity</div>
                <div><span style={{ color: "#2196F3" }}>●</span> Claim</div>
                <div><span style={{ color: "#FF9800" }}>●</span> Source</div>
            </div>
        </div>
    )
}

/**
 * Get node color based on type
 */
function getNodeColor(type: string): string {
    switch (type) {
        case "entity":
            return "#4CAF50" // Green
        case "claim":
            return "#2196F3" // Blue
        case "source":
            return "#FF9800" // Orange
        case "connection":
            return "#9C27B0" // Purple
        default:
            return "#757575" // Gray
    }
}

/**
 * Get node shape based on type
 */
function getNodeShape(type: string): string {
    switch (type) {
        case "entity":
            return "dot"
        case "claim":
            return "box"
        case "source":
            return "diamond"
        case "connection":
            return "star"
        default:
            return "dot"
    }
}
