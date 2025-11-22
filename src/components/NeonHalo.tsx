/**
 * Neon Halo - The Activation Ritual Visual
 * "When Truth scans Reality, the borders glow"
 */

import { useEffect, useRef, type CSSProperties } from "react"
import { useHaloActive } from "~src/store"

export default function NeonHalo() {
    const isActive = useHaloActive()
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (!isActive || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Set canvas to full viewport
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        let animationId: number
        let phase = 0

        const animate = () => {
            phase += 0.02

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Draw breathing glow effect
            const glowIntensity = 0.5 + Math.sin(phase) * 0.3
            const thickness = 8

            // Create gradient (Cyan → Gold)
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
            gradient.addColorStop(0, `rgba(0, 240, 255, ${glowIntensity})`) // Cyan
            gradient.addColorStop(0.5, `rgba(0, 240, 255, ${glowIntensity * 0.8})`)
            gradient.addColorStop(1, `rgba(255, 215, 0, ${glowIntensity})`) // Gold

            ctx.strokeStyle = gradient
            ctx.lineWidth = thickness
            ctx.shadowBlur = 20
            ctx.shadowColor = "#00F0FF"

            // Draw border
            ctx.strokeRect(
                thickness / 2,
                thickness / 2,
                canvas.width - thickness,
                canvas.height - thickness
            )

            // Scanline effect (subtle)
            ctx.globalAlpha = 0.05
            for (let y = 0; y < canvas.height; y += 4) {
                ctx.fillStyle = y % 8 === 0 ? "rgba(0, 240, 255, 0.1)" : "transparent"
                ctx.fillRect(0, y, canvas.width, 2)
            }
            ctx.globalAlpha = 1

            animationId = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            cancelAnimationFrame(animationId)
        }
    }, [isActive])

    if (!isActive) return null

    return (
        <canvas
            ref={canvasRef}
            style={canvasStyle}
            className="veritas-neon-halo"
        />
    )
}

const canvasStyle: CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: 9998,
    mixBlendMode: "screen"
}
