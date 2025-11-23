/**
 * AGENT IV: CURSOR - The Painter & Commander
 * "The only interface. The final word."
 * 
 * This content script is the conductor of the entire Veritas system.
 * It receives data from all three agents and paints truth upon the page.
 */

import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

import NeonHalo from "~src/components/NeonHalo"
import EnhancedHolographicCard from "~src/components/EnhancedHolographicCard"
import StatusOverlay from "~src/components/StatusOverlay"
import DeepDiveResults from "~src/components/DeepDiveResults"
import CommanderPanel from "~src/components/CommanderPanel"
import ResultWindow from "~src/components/ResultWindow"
import { highlightTextOnPage, markFallacyOnPage, annotateTextOnPage } from "~src/lib/dom-interactions"
import {
    injectGlobalStyles,
    markAsLowValue,
    markAsFallacy,
    enhanceVerificationDisplay,
    makeInteractive
} from "~src/lib/dom-painter"
import { highlightTextInElement } from "~src/lib/text-highlighter"
import { areXpathsRelated } from "~src/lib/xpath-utils"
import { messageBus } from "~src/lib/messaging"
import { useVeritasStore } from "~src/store"
import type { Message, VerifiedGraphData } from "~src/types/agents"
import { logger } from "~src/lib/logger"

// Configure Plasmo for this content script
export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"],
    run_at: "document_end"
}

// ============================================================================
// MAIN CONTENT SCRIPT COMPONENT
// ============================================================================

function CursorOverlay() {
    const store = useVeritasStore()

    // Unified Card State
    const [cards, setCards] = useState<Array<{
        id: string
        xpath: string
        position: { x: number; y: number }
        isPinned: boolean
        isMinimized: boolean
        activeTab: string
    }>>([])

    const [deepDiveResults, setDeepDiveResults] = useState<VerifiedGraphData | null>(null)

    const [commanderPanel, setCommanderPanel] = useState<{
        visible: boolean
        position: { x: number; y: number }
        context?: {
            type: "global" | "card" | "deepdive"
            data?: any
        }
    }>({
        visible: false,
        position: { x: 0, y: 0 }
    })

    const [resultWindows, setResultWindows] = useState<Array<{
        id: string
        title: string
        content: string
        position?: "center" | "top-right" | "bottom-right"
        type?: "info" | "warning" | "success" | "error"
    }>>([])

    // Smart Stacking Algorithm
    const calculateSmartPosition = (
        triggerPosition: { x: number; y: number },
        existingCards: Array<{ position: { x: number; y: number } }>
    ): { x: number; y: number } => {
        const CARD_WIDTH = 320
        const CARD_HEIGHT = 500
        const STACK_OFFSET = 30

        let x = triggerPosition.x
        let y = triggerPosition.y

        // Simple collision detection and stacking
        for (const card of existingCards) {
            const overlapsX = Math.abs(x - card.position.x) < 50
            const overlapsY = Math.abs(y - card.position.y) < 50

            if (overlapsX && overlapsY) {
                x += STACK_OFFSET
                y += STACK_OFFSET
            }
        }

        // Screen bounds
        x = Math.min(x, window.innerWidth - CARD_WIDTH - 20)
        y = Math.min(y, window.innerHeight - CARD_HEIGHT - 20)

        return { x, y }
    }

    // Show Enhanced Card
    const showEnhancedCard = (xpath: string, position: { x: number; y: number }, initialTab: string = "overview") => {
        setCards(prev => {
            // Check if already open (fuzzy match)
            const existing = prev.find(c => areXpathsRelated(c.xpath, xpath))
            if (existing) {
                // Bring to front / update tab
                return prev.map(c => c.id === existing.id ? { ...c, activeTab: initialTab, isMinimized: false } : c)
            }

            const smartPos = calculateSmartPosition(position, prev)

            return [...prev, {
                id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                xpath,
                position: smartPos,
                isPinned: false,
                isMinimized: false,
                activeTab: initialTab
            }]
        })
    }

    const removeCard = (id: string) => {
        setCards(prev => prev.filter(c => c.id !== id))
    }

    const updateCard = (id: string, updates: Partial<typeof cards[0]>) => {
        setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
    }

    useEffect(() => {
        // Inject global styles on mount
        injectGlobalStyles()

        // Initialize message bus
        messageBus.initialize()

        // Register message handlers
        const unsubscribers = [
            // Velox complete - Layer 1 painting
            messageBus.on("VELOX_COMPLETE", async (message) => {
                if (message.type !== "VELOX_COMPLETE") return

                const data = message.payload
                store.setVeloxData(data)

                console.log(`[CURSOR] 🎯 VELOX_COMPLETE received:`)

                // Paint low-value nodes
                data.lowValueNodes.forEach((node) => {
                    markAsLowValue(node.xpath, node.reason)
                })

                // Group fallacies by XPath
                const fallaciesByXpath = new Map<string, any[]>()
                data.fallacyNodes.forEach((node) => {
                    if (!fallaciesByXpath.has(node.xpath)) {
                        fallaciesByXpath.set(node.xpath, [])
                    }
                    fallaciesByXpath.get(node.xpath)?.push(node)
                })

                // Paint fallacy nodes (grouped)
                fallaciesByXpath.forEach((fallacies, xpath) => {
                    // Use the first fallacy for the visual mark (or highest severity)
                    const primaryFallacy = fallacies.reduce((prev, current) =>
                        (current.severity === "high" && prev.severity !== "high") ? current : prev
                        , fallacies[0])

                    markAsFallacy(xpath, primaryFallacy.fallacyType, primaryFallacy.explanation, primaryFallacy.text)

                    // Emotional highlighting
                    if (primaryFallacy.fallacyType === "appeal-to-emotion") {
                        const elementResult = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
                        const element = elementResult.singleNodeValue as HTMLElement
                        if (element) {
                            element.classList.add("veritas-emotional-text")
                        }
                    }

                    // Make interactive for Enhanced Card (CLICK instead of hover)
                    makeInteractive(
                        xpath,
                        () => { }, // No hover
                        () => { }, // No leave
                        (targetXpath) => {
                            const elementResult = document.evaluate(targetXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
                            const element = elementResult.singleNodeValue as HTMLElement

                            if (element) {
                                const rect = element.getBoundingClientRect()
                                showEnhancedCard(xpath, {
                                    x: rect.left,
                                    y: rect.top + window.scrollY
                                }, "fallacies")
                            }
                        }
                    )
                })

                logger.info(`✓ Velox layer painted: ${fallaciesByXpath.size} fallacy groups`)
            }),

            // Ratio complete - Highlight claims at text level
            messageBus.on("RATIO_COMPLETE", (message) => {
                if (message.type !== "RATIO_COMPLETE") return

                const data = message.payload
                store.setRatioData(data)

                // Highlight each claim's precise text
                data.claims.forEach((claim: any) => {
                    if (!claim.claimText || !claim.xpath) return

                    // Highlight the text, but DON'T attach click handler yet
                    highlightTextInElement(
                        claim.xpath,
                        claim.claimText,
                        "veritas-highlight", // Neutral highlight initially
                        { "claim-id": claim.id },
                        undefined // NO onClick handler yet!
                    )
                })

                logger.info(`✓ Ratio layer painted: ${data.claims.length} claims highlighted`)
            }),

            // Veritas complete - Update text highlights with verification results
            messageBus.on("VERITAS_COMPLETE", async (message) => {
                if (message.type !== "VERITAS_COMPLETE") return

                const data = message.payload
                store.setVeritasData(data)

                const { verifications, graph, hiddenConnections } = message.payload

                // Check if Deep Dive
                const isDeepDive = verifications.some((v: any) => v.claimId?.includes('deep-dive'))

                if (isDeepDive) {
                    setDeepDiveResults({
                        verifications,
                        graph,
                        hiddenConnections: hiddenConnections || [],
                        timestamp: Date.now(),
                        summary: "Deep Dive Analysis Complete"
                    })
                }

                // Update each highlighted claim with verification results
                verifications.forEach((verification: any) => {
                    // Get fresh state
                    const currentAnalysis = useVeritasStore.getState().currentAnalysis
                    const claim = currentAnalysis?.ratio?.claims.find(
                        (c) => c.id === verification.claimId
                    )

                    if (!claim || !claim.claimText) return

                    // Find ALL elements with this claim ID
                    const spans = document.querySelectorAll(`[data-veritas-claim-id="${claim.id}"]`)

                    spans.forEach((span) => {
                        const spanEl = span as HTMLElement

                        // Update CSS class based on verification status
                        spanEl.classList.remove("veritas-highlight", "veritas-verified-text", "veritas-false-text", "veritas-emotional-text")

                        if (verification.status === "verified") {
                            spanEl.classList.add("veritas-verified-text")
                        } else if (verification.status === "false") {
                            spanEl.classList.add("veritas-false-text")
                        } else {
                            spanEl.classList.add("veritas-highlight")
                            spanEl.style.opacity = "0.7"
                        }

                        // Attach click handler for Enhanced Card
                        const clickHandler = (event: MouseEvent) => {
                            event.stopPropagation()
                            const rect = (event.target as HTMLElement).getBoundingClientRect()

                            showEnhancedCard(claim.xpath, {
                                x: rect.right + 10,
                                y: rect.top + window.scrollY
                            }, "verification")
                        }

                        // Replace span to remove old listeners
                        const newSpan = span.cloneNode(true) as HTMLElement
                        newSpan.addEventListener("click", clickHandler)
                        span.parentNode?.replaceChild(newSpan, span)
                    })
                })

                logger.info(`✓ Veritas layer painted: ${verifications.length} verifications applied`)
                store.setHaloActive(false)
            }),

            // Progress updates
            messageBus.on("UPDATE_PROGRESS", (message) => {
                if (message.type !== "UPDATE_PROGRESS") return
                const { agent, status } = message.payload
                logger.info(`⟳ ${agent}: ${status}`)
                store.updateProgress(agent, status)
            }),

            // Commander Page Interaction: Highlight Text
            messageBus.on("HIGHLIGHT_TEXT", (message) => {
                if (message.type !== "HIGHLIGHT_TEXT") return
                const { text, color, reason } = message.payload
                highlightTextOnPage(text, color, reason)
            }),

            // NEW: ID-Based Highlighting - By XPath
            messageBus.on("HIGHLIGHT_BY_XPATH", (message) => {
                if (message.type !== "HIGHLIGHT_BY_XPATH") return
                const { xpath, text, color, reason } = message.payload

                const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
                const element = result.singleNodeValue as HTMLElement

                if (!element) return

                const colorMap: Record<string, { bg: string; border: string }> = {
                    green: { bg: "rgba(0, 255, 100, 0.3)", border: "#00ff80" },
                    red: { bg: "rgba(255, 50, 80, 0.3)", border: "#ff5080" },
                    yellow: { bg: "rgba(255, 200, 0, 0.3)", border: "#ffb400" },
                    blue: { bg: "rgba(0, 200, 255, 0.3)", border: "#00d9ff" }
                }
                const colors = colorMap[color] || colorMap.blue

                element.style.background = colors.bg
                element.style.borderLeft = `6px solid ${colors.border}`
                element.style.paddingLeft = "12px"
                element.style.marginLeft = "-6px"
                element.style.transition = "all 0.3s ease"
                element.style.boxShadow = `0 0 10px ${colors.border}`

                element.setAttribute("data-veritas-highlight", color)
                element.setAttribute("data-veritas-reason", reason)
                element.setAttribute("title", reason)

                element.style.animation = "veritasPulse 0.5s ease"
                setTimeout(() => { element.style.animation = "" }, 500)
                element.scrollIntoView({ behavior: "smooth", block: "center" })
            }),

            // NEW: ID-Based Highlighting - By Element ID
            messageBus.on("HIGHLIGHT_BY_ELEMENT", (message) => {
                if (message.type !== "HIGHLIGHT_BY_ELEMENT") return
                const { elementId, color, reason } = message.payload

                const element = document.querySelector(`[data-veritas-element-id="${elementId}"]`) as HTMLElement
                if (!element) return

                const colorMap: Record<string, { bg: string; border: string }> = {
                    green: { bg: "rgba(0, 255, 100, 0.25)", border: "#00ff80" },
                    red: { bg: "rgba(255, 50, 80, 0.25)", border: "#ff5080" },
                    yellow: { bg: "rgba(255, 200, 0, 0.25)", border: "#ffb400" },
                    blue: { bg: "rgba(0, 200, 255, 0.25)", border: "#00d9ff" }
                }
                const colors = colorMap[color] || colorMap.blue

                element.style.background = colors.bg
                element.style.borderLeft = `4px solid ${colors.border}`
                element.style.paddingLeft = "8px"
                element.setAttribute("data-veritas-highlight", color)
                element.setAttribute("data-veritas-reason", reason)
                element.title = reason
            }),

            // Commander Page Interaction: Show Result Window
            messageBus.on("SHOW_RESULT_WINDOW", (message) => {
                if (message.type !== "SHOW_RESULT_WINDOW") return
                const { title, content, position, type } = message.payload

                const windowId = `result-${Date.now()}`
                setResultWindows(prev => [...prev, {
                    id: windowId,
                    title,
                    content,
                    position,
                    type
                }])
            }),

            // NEW: Context Menu Deep Dive Trigger
            messageBus.on("TRIGGER_DEEP_DIVE", async (message) => {
                if (message.type !== "TRIGGER_DEEP_DIVE") return
                const { selectionText } = message.payload

                // Visual Feedback
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
                    } catch (err) { }
                }

                // Send message to background
                try {
                    await messageBus.send({
                        type: "DEEP_DIVE",
                        payload: {
                            context: document.body.innerText.substring(0, 1000),
                            target: "user-selection",
                            query: selectionText,
                            outputLanguage: store.ui.outputLanguage || "English"
                        }
                    })
                } catch (error) {
                    console.error("Deep Dive failed:", error)
                }
            })
        ]

        // Commander hotkey: Ctrl+Shift+C
        const handleCommanderHotkey = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === "C") {
                e.preventDefault()
                setCommanderPanel({
                    visible: true,
                    position: {
                        x: Math.max(50, window.innerWidth / 2 - 200),
                        y: Math.max(50, window.innerHeight / 4)
                    },
                    context: { type: "global" }
                })
            }
        }

        document.addEventListener("keydown", handleCommanderHotkey)

        // Cleanup on unmount
        return () => {
            unsubscribers.forEach((unsub) => unsub())
            document.removeEventListener("keydown", handleCommanderHotkey)
        }
    }, [])

    return (
        <>
            <StatusOverlay />
            <NeonHalo />

            {/* Enhanced Holographic Cards */}
            {cards.map(card => (
                <EnhancedHolographicCard
                    key={card.id}
                    xpath={card.xpath}
                    position={card.position}
                    isPinned={card.isPinned}
                    isMinimized={card.isMinimized}
                    activeTab={card.activeTab}
                    onClose={() => removeCard(card.id)}
                    onPin={() => updateCard(card.id, { isPinned: !card.isPinned })}
                    onMinimize={() => updateCard(card.id, { isMinimized: !card.isMinimized })}
                    onPositionChange={(pos) => updateCard(card.id, { position: pos })}
                    onTabChange={(tab) => updateCard(card.id, { activeTab: tab })}
                />
            ))}

            <DeepDiveResults
                results={deepDiveResults}
                onClose={() => setDeepDiveResults(null)}
                onChat={() => {
                    setCommanderPanel({
                        visible: true,
                        position: { x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 300 },
                        context: {
                            type: "deepdive",
                            data: deepDiveResults
                        }
                    })
                }}
            />
            <CommanderPanel
                visible={commanderPanel.visible}
                position={commanderPanel.position}
                context={commanderPanel.context}
                onClose={() => setCommanderPanel({ visible: false, position: { x: 0, y: 0 } })}
                onPositionChange={(pos) => setCommanderPanel(prev => ({ ...prev, position: pos }))}
            />

            {/* Result Windows from Commander */}
            {resultWindows.map(window => (
                <ResultWindow
                    key={window.id}
                    title={window.title}
                    content={window.content}
                    position={window.position || "center"}
                    type={window.type || "info"}
                    onClose={() => setResultWindows(prev => prev.filter(w => w.id !== window.id))}
                />
            ))}
        </>
    )
}

// ============================================================================
// SHADOW DOM MOUNTING
// ============================================================================

// Create shadow host for isolated UI
const shadowHost = document.createElement("div")
shadowHost.id = "veritas-shadow-host"
shadowHost.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 2147483647;
`

// Attach shadow DOM
const shadow = shadowHost.attachShadow({ mode: "open" })

// Create root container within shadow
const shadowRoot = document.createElement("div")
shadowRoot.id = "veritas-root"
shadowRoot.style.cssText = `
  width: 100%;
  height: 100%;
`
shadow.appendChild(shadowRoot)

// Inject shadow DOM into page
if (document.body) {
    document.body.appendChild(shadowHost)
} else {
    document.addEventListener("DOMContentLoaded", () => {
        document.body.appendChild(shadowHost)
    })
}

// Render React app into shadow DOM
const root = createRoot(shadowRoot)
root.render(<CursorOverlay />)

// ============================================================================
// GLOBAL LISTENERS (Outside Shadow DOM)
// ============================================================================

// Listen for keyboard shortcut to trigger analysis
document.addEventListener("keydown", (e) => {
    // Ctrl+Shift+V (V for Veritas)
    if (e.ctrlKey && e.shiftKey && e.key === "V") {
        e.preventDefault()

        const store = useVeritasStore.getState()

        if (store.currentAnalysis?.status === "analyzing") {
            logger.warn("Analysis already in progress")
            return
        }

        // Start analysis
        store.startAnalysis(window.location.href, document.title)

        console.log("[CURSOR] 🔍 About to extract page content...")

        // Extract content in content script context
        try {
            const { extractPageContent } = require("~src/lib/content-extractor")

            const pageContent = extractPageContent()

            // Send structured content to background
            messageBus.send({
                type: "ANALYZE_PAGE",
                payload: {
                    ...pageContent,
                    outputLanguage: store.ui.outputLanguage || "English"
                }
            })

            console.log("[CURSOR] 📨 Content sent to background for analysis")
        } catch (error) {
            console.error("[CURSOR] ❌ Failed to extract content:", error)
            logger.error("Content extraction failed", error)
            return
        }

        logger.info("🔍 Veritas analysis initiated")
    }
})

    // Export for debugging
    ; (window as any).__VERITAS__ = {
        store: useVeritasStore,
        messageBus
    }
