import { useState, useEffect, useCallback } from "react"

export function useDraggable(
    position: { x: number; y: number },
    onDrag: (pos: { x: number; y: number }) => void
) {
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [initialPos, setInitialPos] = useState({ x: 0, y: 0 })

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Only left click
        if (e.button !== 0) return

        setIsDragging(true)
        setDragStart({ x: e.clientX, y: e.clientY })
        setInitialPos(position)
        e.preventDefault() // Prevent text selection
        e.stopPropagation()
    }, [position])

    useEffect(() => {
        if (!isDragging) return

        const handleMouseMove = (e: MouseEvent) => {
            const dx = e.clientX - dragStart.x
            const dy = e.clientY - dragStart.y
            onDrag({
                x: initialPos.x + dx,
                y: initialPos.y + dy
            })
        }

        const handleMouseUp = () => {
            setIsDragging(false)
        }

        // Add to window/document to catch movements outside the element
        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("mouseup", handleMouseUp)

        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
        }
    }, [isDragging, dragStart, initialPos, onDrag])

    return {
        isDragging,
        handleMouseDown
    }
}
