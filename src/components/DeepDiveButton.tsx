/**
 * Deep Dive Button Component
 * Appears when user selects text on the page
 */

import { useState } from "react"
import { messageBus } from "~src/lib/messaging"
import { useVeritasStore } from "~src/store"

interface DeepDiveButtonProps {
    visible: boolean
    position: { x: number; y: number }
    selectedText: string
    onClose: () => void
}

export default function DeepDiveButton({ visible, position, selectedText, onClose }: DeepDiveButtonProps) {
    const [loading, setLoading] = useState(false)
    const store = useVeritasStore()

    const handleDeepDive = async (e: React.MouseEvent) => {
        e.stopPropagation()
        setLoading(true) // Set loading state immediately

        // 1. Immediate Visual Feedback: Highlight the selected text
        // We need to find the range and apply a temporary highlight class
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            const span = document.createElement("span")
            span.className = "veritas-deep-dive-processing"
            span.style.cssText = `
                background: linear-gradient(90deg, rgba(147, 51, 234, 0.2), rgba(79, 70, 229, 0.2));
                border-bottom: 2px solid #9333ea;
                animation: veritas-pulse 1.5s infinite;
                padding: 2px 0;
                border-radius: 2px;
            `
            try {
                range.surroundContents(span)
            } catch (err) {
                console.warn("[Deep Dive] Could not wrap selection for processing highlight:", err)
            }
        }

        // 2. Send message to background
        try {
            // Assuming messageBus.send is the equivalent of sendToBackground
            await messageBus.send({
                type: "DEEP_DIVE",
                payload: {
                    context: document.body.innerText.substring(0, 1000), // Limited context
                    target: "user-selection",
                    query: selectedText,
                    outputLanguage: store.ui.outputLanguage || "English"
                }
            })

            // Button will be hidden by parent component, but highlight remains until results arrive
            onClose()
        } catch (error) {
            console.error("Deep Dive failed:", error)
            setLoading(false)
        }
    }

    /**
     * Highlight the selected text with animated glow
     */
    const highlightSelection = () => {
        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) return

        const range = selection.getRangeAt(0)
        const span = document.createElement("span")
        span.className = "veritas-deep-dive-highlight"
        span.style.cssText = `
            background: linear-gradient(90deg, 
                rgba(102, 126, 234, 0.3) 0%, 
                rgba(118, 75, 162, 0.3) 100%);
            animation: veritas-pulse 1.5s ease-in-out infinite;
            padding: 2px 0;
            border-radius: 2px;
        `

        try {
            range.surroundContents(span)
        } catch (err) {
            console.warn("[Deep Dive] Could not wrap selection:", err)
        }
    }

    if (!visible) return null

    return (
        <div
            className="veritas-deep-dive-button"
            style={{
                position: "fixed",
                left: `${position.x}px`,
                top: `${position.y}px`,
                zIndex: 999999,
                opacity: visible ? 1 : 0,
                transition: "opacity 0.2s ease",
                pointerEvents: visible ? "auto" : "none" // CRITICAL: Override parent's pointer-events: none
            }}
        >
            <button
                onClick={handleDeepDive}
                disabled={loading}
                style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    opacity: loading ? 0.6 : 1,
                    transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                    if (!loading) {
                        e.currentTarget.style.transform = "translateY(-2px)"
                        e.currentTarget.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.6)"
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)"
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)"
                }}
            >
                {loading ? (
                    <>
                        <span className="spinner" />
                        Analyzing...
                    </>
                ) : (
                    <>
                        🔍
                        Deep Dive
                    </>
                )}
            </button>
            <style>{`
                .veritas-deep-dive-button .spinner {
                    width: 14px;
                    height: 14px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.6s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes veritas-pulse {
                    0%, 100% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.02); }
                }
            `}</style>
        </div>
    )
}

/**
 * Get XPath of current selection
 */
function getSelectionXPath(): string {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return ""

    const range = selection.getRangeAt(0)
    const container = range.commonAncestorContainer

    // Get element (not text node)
    const element = container.nodeType === 3 ? container.parentElement : container as Element

    if (!element) return ""

    // Generate simple XPath
    const tagName = element.tagName.toLowerCase()
    const siblings = Array.from(element.parentElement?.children || []).filter(
        (el) => el.tagName === element.tagName
    )
    const index = siblings.indexOf(element) + 1

    return `//${tagName}[${index}]`
}
