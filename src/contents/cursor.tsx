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
import HolographicCard from "~src/components/HolographicCard"
import StatusOverlay from "~src/components/StatusOverlay"
import DeepDiveResults from "~src/components/DeepDiveResults"
import CommanderPanel from "~src/components/CommanderPanel"
import ResultWindow from "~src/components/ResultWindow"
import { HolographicEvidence } from "~src/components/HolographicEvidence"
import { FallacyCard } from "~src/components/FallacyCard"
import { EmotionalCard } from "~src/components/EmotionalCard"
import { highlightTextOnPage, markFallacyOnPage, annotateTextOnPage } from "~src/lib/dom-interactions"
import {
    injectGlobalStyles,
    markAsLowValue,
    markAsFallacy,
    enhanceVerificationDisplay,
    makeInteractive
} from "~src/lib/dom-painter"
import { highlightTextInElement } from "~src/lib/text-highlighter"
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
    const [hoverCard, setHoverCard] = useState<{
        xpath: string
        position: { x: number; y: number }
        locked?: boolean
    } | null>(null)

    const [deepDiveResults, setDeepDiveResults] = useState<VerifiedGraphData | null>(null)

    // === NEW: Interactive Card States ===
    const [evidenceCard, setEvidenceCard] = useState<{
        visible: boolean
        position: { x: number; y: number }
        data: any
    } | null>(null)

    const [fallacyCard, setFallacyCard] = useState<{
        visible: boolean
        position: { x: number; y: number }
        data: any
    } | null>(null)

    const [emotionalCard, setEmotionalCard] = useState<{
        visible: boolean
        position: { x: number; y: number }
        data: any
    } | null>(null)

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

    useEffect(() => {
        // Debug checks
        if (!NeonHalo) logger.error("NeonHalo component is undefined!")
        if (!HolographicCard) logger.error("HolographicCard component is undefined!")

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
                console.log(`[CURSOR]   - Low-value nodes: ${data.lowValueNodes?.length || 0}`)
                console.log(`[CURSOR]   - Fallacy nodes: ${data.fallacyNodes?.length || 0}`)

                if (data.fallacyNodes?.length > 0) {
                    console.log(`[CURSOR] 📋 Fallacy details:`, data.fallacyNodes.map((f: any) => ({
                        type: f.fallacyType,
                        xpath: f.xpath,
                        text: f.text?.substring(0, 30) + "..."
                    })))
                }

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

                console.log(`[CURSOR] 🗺️ Grouped into ${fallaciesByXpath.size} unique XPaths`)

                // Paint fallacy nodes (grouped)
                fallaciesByXpath.forEach((fallacies, xpath) => {
                    console.log(`[CURSOR] 🎨 Painting fallacy at xpath: ${xpath}`)
                    console.log(`[CURSOR]   - Fallacies at this location: ${fallacies.length}`)

                    // Use the first fallacy for the visual mark (or highest severity)
                    const primaryFallacy = fallacies.reduce((prev, current) =>
                        (current.severity === "high" && prev.severity !== "high") ? current : prev
                        , fallacies[0])

                    console.log(`[CURSOR]   - Primary fallacy: ${primaryFallacy.fallacyType}`)

                    const result = markAsFallacy(xpath, primaryFallacy.fallacyType, primaryFallacy.explanation, primaryFallacy.text)
                    console.log(`[CURSOR]   - markAsFallacy result: ${result}`)

                    // === RESTORE EMOTIONAL HIGHLIGHTING ===
                    if (primaryFallacy.fallacyType === "appeal-to-emotion") {
                        console.log(`[CURSOR] 💖 Applying emotional highlighting`)
                        const elementResult = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
                        const element = elementResult.singleNodeValue as HTMLElement
                        if (element) {
                            element.classList.add("veritas-emotional-text")
                            console.log(`[CURSOR] ✅ Added veritas-emotional-text class`)
                        } else {
                            console.warn(`[CURSOR] ⚠️ Could not find element for emotional highlighting`)
                        }
                    }

                    // Make interactive for fallacy card (CLICK instead of hover)
                    console.log(`[CURSOR] 🖱️ Adding click handler for fallacy card`)
                    makeInteractive(
                        xpath,
                        () => {
                            // No hover action
                        },
                        () => {
                            // No leave action
                        },
                        (targetXpath) => {
                            console.log(`[CURSOR] 👆 Fallacy clicked! XPath: ${targetXpath}`)
                            const elementResult = document.evaluate(targetXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
                            const element = elementResult.singleNodeValue as HTMLElement

                            if (element) {
                                const rect = element.getBoundingClientRect()
                                const text = element.textContent || ""

                                // Check if evidence card is already visible to stack
                                const yOffset = evidenceCard?.visible ? -150 : -10

                                console.log(`[CURSOR] 📋 Showing fallacy card for: ${text.substring(0, 50)}...`)
                                setFallacyCard({
                                    visible: true,
                                    position: {
                                        x: rect.left,
                                        y: rect.top + window.scrollY + yOffset
                                    },
                                    data: {
                                        text: text.substring(0, 150) + (text.length > 150 ? "..." : ""),
                                        fallacies: fallacies
                                    }
                                })
                            } else {
                                console.warn(`[CURSOR] ⚠️ Could not find element for click handler`)
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

                console.log(`[CURSOR] 📝 RATIO_COMPLETE: Highlighting ${data.claims.length} claims`)
                console.log(`[CURSOR] 📋 Claim IDs being created:`, data.claims.map((c: any) => c.id))

                // Highlight each claim's precise text
                data.claims.forEach((claim: any) => {
                    if (!claim.claimText || !claim.xpath) {
                        console.warn("[CURSOR] ⚠️ Claim missing claimText or xpath:", claim.id)
                        return
                    }

                    console.log(`[CURSOR] 🎯 Highlighting claim ${claim.id}: "${claim.claimText.substring(0, 30)}..."`)

                    // Highlight the text, but DON'T attach click handler yet
                    // We'll add the click handler in VERITAS_COMPLETE after verification
                    const success = highlightTextInElement(
                        claim.xpath,
                        claim.claimText,
                        "veritas-highlight", // Neutral highlight initially
                        { "claim-id": claim.id }, // highlightTextInElement adds "data-veritas-" prefix
                        undefined // NO onClick handler yet!
                    )

                    if (success) {
                        console.log(`[CURSOR] ✅ Successfully highlighted claim ${claim.id}`)
                        // Verify the span was created
                        const spans = document.querySelectorAll(`span[data-veritas-claim-id="${claim.id}"]`)
                        console.log(`[CURSOR] 🔍 Verification: Found ${spans.length} span(s) with data-veritas-claim-id="${claim.id}"`)
                    } else {
                        console.warn(`[CURSOR] ⚠️ Failed to highlight claim ${claim.id}`)
                    }
                })

                logger.info(`✓ Ratio layer painted: ${data.claims.length} claims highlighted`)
            }),

            // Veritas complete - Update text highlights with verification results
            messageBus.on("VERITAS_COMPLETE", async (message) => {
                if (message.type !== "VERITAS_COMPLETE") return

                const data = message.payload
                store.setVeritasData(data)

                const { verifications, graph, hiddenConnections } = message.payload
                console.log(`[CURSOR] 🔍 VERITAS_COMPLETE: Processing ${verifications.length} verifications`)
                console.log(`[CURSOR] 📋 Verification claim IDs received:`, verifications.map((v: any) => v.claimId))
                console.log(`[CURSOR] 📋 Available claim IDs in store:`, store.currentAnalysis?.ratio?.claims.map((c: any) => c.id))

                // Check if this is a Deep Dive result by looking at the claim IDs
                // Deep dive claims have IDs like "deep-dive-1", "deep-dive-commander-1", etc.
                const isDeepDive = verifications.some((v: any) =>
                    v.claimId?.includes('deep-dive')
                )

                console.log(`[CURSOR] 🔍 Is Deep Dive: ${isDeepDive}`)

                if (isDeepDive) {
                    console.log(`[CURSOR] 📊 Setting Deep Dive results with ${verifications.length} verifications`)
                    setDeepDiveResults({
                        verifications,
                        graph,
                        hiddenConnections: hiddenConnections || [],
                        timestamp: Date.now(),
                        summary: "Deep Dive Analysis Complete"
                    })
                }

                // Update each highlighted claim with verification results
                verifications.forEach((verification: any, index: number) => {
                    console.log(`[CURSOR] 🎯 Processing verification ${index}: claimId="${verification.claimId}", status="${verification.status}"`)

                    // CRITICAL FIX: Use getState() to get fresh state, as 'store' closure is stale
                    const currentAnalysis = useVeritasStore.getState().currentAnalysis
                    const claim = currentAnalysis?.ratio?.claims.find(
                        (c) => c.id === verification.claimId
                    )

                    if (!claim || !claim.claimText) {
                        console.error(`[CURSOR] ❌ CLAIM NOT FOUND!`)
                        console.error(`[CURSOR]   - Looking for: "${verification.claimId}"`)
                        const currentAnalysis = useVeritasStore.getState().currentAnalysis
                        console.error(`[CURSOR]   - Available claims:`, currentAnalysis?.ratio?.claims.map((c: any) => ({ id: c.id, text: c.text?.substring(0, 30) })))
                        console.warn("[CURSOR] ⚠️ Claim not found for verification:", verification.claimId)
                        return
                    }

                    console.log(`[CURSOR] ✅ Found claim ${claim.id}: "${claim.text?.substring(0, 30)}..."`)
                    console.log(`[CURSOR] 🔍 Searching for spans with: span[data-veritas-claim-id="${claim.id}"]`)

                    // Find ALL spans with this claim ID (there might be multiple if text appears multiple times)
                    const spans = document.querySelectorAll(`span[data-veritas-claim-id="${claim.id}"]`)

                    console.log(`[CURSOR] 📊 Query result: Found ${spans.length} span(s)`)

                    if (spans.length === 0) {
                        console.error(`[CURSOR] ❌ NO SPANS FOUND!`)
                        console.error(`[CURSOR]   - Searched for: span[data-veritas-claim-id="${claim.id}"]`)
                        console.error(`[CURSOR]   - Trying to find any veritas spans...`)
                        const allVeritasSpans = document.querySelectorAll('span[data-veritas-claim-id]')
                        console.error(`[CURSOR]   - Total veritas spans on page: ${allVeritasSpans.length}`)
                        if (allVeritasSpans.length > 0) {
                            console.error(`[CURSOR]   - First 5 span IDs:`, Array.from(allVeritasSpans).slice(0, 5).map(s => s.getAttribute('data-veritas-claim-id')))
                        }
                    }

                    spans.forEach((span, spanIndex) => {
                        const spanEl = span as HTMLElement
                        console.log(`[CURSOR] 🎨 Updating span ${spanIndex} for claim ${claim.id}`)

                        // Update CSS class based on verification status
                        spanEl.classList.remove("veritas-highlight", "veritas-verified-text", "veritas-false-text", "veritas-emotional-text")

                        if (verification.status === "verified") {
                            spanEl.classList.add("veritas-verified-text")
                            console.log(`[CURSOR]   - Applied: veritas-verified-text (green)`)
                        } else if (verification.status === "false") {
                            spanEl.classList.add("veritas-false-text")
                            console.log(`[CURSOR]   - Applied: veritas-false-text (strikethrough)`)
                        } else {
                            // Unverifiable - keep neutral or slightly dimmed
                            spanEl.classList.add("veritas-highlight")
                            spanEl.style.opacity = "0.7"
                            console.log(`[CURSOR]   - Applied: veritas-highlight (neutral)`)
                        }

                        // NOW attach the click handler with FULL verification data
                        const clickHandler = (event: MouseEvent) => {
                            event.stopPropagation()
                            console.log(`[CURSOR] 👆 Evidence card clicked for claim: ${claim.id}`)

                            const rect = (event.target as HTMLElement).getBoundingClientRect()
                            const yOffset = fallacyCard?.visible ? 150 : 0

                            setEvidenceCard({
                                visible: true,
                                position: {
                                    x: rect.right + 10,
                                    y: rect.top + window.scrollY + yOffset
                                },
                                data: {
                                    claim: claim.text,
                                    status: verification.status,
                                    confidence: verification.confidence || 0.8,
                                    evidence: verification.sources || [],
                                    reasoning: verification.reasoning || verification.evidenceSummary || "Analysis complete."
                                }
                            })
                        }

                        // Replace span to remove old listeners
                        const newSpan = span.cloneNode(true) as HTMLElement
                        newSpan.addEventListener("click", clickHandler)
                        span.parentNode?.replaceChild(newSpan, span)
                        console.log(`[CURSOR] ✅ Attached click handler to span ${spanIndex}`)
                    })

                    console.log(`[CURSOR] ✅ Completed update for claim: ${claim.id}`)
                })

                logger.info(`✓ Veritas layer painted: ${verifications.length} verifications applied`)

                // Turn off halo when complete
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
                console.log(`[CURSOR] 🎨 Highlighting text: "${text}" with ${color}`)
                highlightTextOnPage(text, color, reason)
            }),

            // NEW: ID-Based Highlighting - By XPath
            messageBus.on("HIGHLIGHT_BY_XPATH", (message) => {
                if (message.type !== "HIGHLIGHT_BY_XPATH") return
                const { xpath, text, color, reason } = message.payload
                console.log(`[CURSOR] 🎯 Highlighting by xpath: ${xpath.substring(0, 50)}...`)

                // Resolve XPath to element
                const result = document.evaluate(
                    xpath,
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                )
                const element = result.singleNodeValue as HTMLElement

                if (!element) {
                    console.error(`[CURSOR] ❌ XPath not found: ${xpath}`)
                    return
                }

                // Color mapping
                const colorMap: Record<string, { bg: string; border: string }> = {
                    green: { bg: "rgba(0, 255, 100, 0.3)", border: "#00ff80" },
                    red: { bg: "rgba(255, 50, 80, 0.3)", border: "#ff5080" },
                    yellow: { bg: "rgba(255, 200, 0, 0.3)", border: "#ffb400" },
                    blue: { bg: "rgba(0, 200, 255, 0.3)", border: "#00d9ff" }
                }
                const colors = colorMap[color] || colorMap.blue

                // ALWAYS highlight entire element for reliability
                // Text matching is too unreliable due to quote marks, word order, etc.
                console.log(`[CURSOR] ✅ Highlighting entire element (robust strategy)`)

                // Apply strong visible styles
                element.style.background = colors.bg
                element.style.borderLeft = `6px solid ${colors.border}`
                element.style.paddingLeft = "12px"
                element.style.marginLeft = "-6px"
                element.style.transition = "all 0.3s ease"
                element.style.boxShadow = `0 0 10px ${colors.border}`

                element.setAttribute("data-veritas-highlight", color)
                element.setAttribute("data-veritas-reason", reason)
                element.setAttribute("title", reason)

                // Add pulse animation for visibility
                element.style.animation = "veritasPulse 0.5s ease"
                setTimeout(() => {
                    element.style.animation = ""
                }, 500)

                // Scroll into view
                element.scrollIntoView({ behavior: "smooth", block: "center" })

                console.log(`[CURSOR] ✅ Element highlighted and scrolled into view`)
            }),

            // NEW: ID-Based Highlighting - By Element ID
            messageBus.on("HIGHLIGHT_BY_ELEMENT", (message) => {
                if (message.type !== "HIGHLIGHT_BY_ELEMENT") return
                const { elementId, color, reason } = message.payload
                console.log(`[CURSOR] 🎯 Highlighting by elementId: ${elementId}`)

                const element = document.querySelector(`[data-veritas-element-id="${elementId}"]`) as HTMLElement
                if (!element) {
                    console.error(`[CURSOR] ❌ Element not found: ${elementId}`)
                    return
                }

                // Color mapping
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

                console.log(`[CURSOR] ✅ Element highlighted successfully`)
            }),

            // Commander Page Interaction: Show Result Window
            messageBus.on("SHOW_RESULT_WINDOW", (message) => {
                if (message.type !== "SHOW_RESULT_WINDOW") return
                const { title, content, position, type } = message.payload
                console.log(`[CURSOR] 📊 Showing result window: "${title}"`)

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
                console.log(`[CURSOR] 🚀 Context menu triggered Deep Dive: "${selectionText}"`)

                // 1. Visual Feedback: Highlight the selected text
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
                    await messageBus.send({
                        type: "DEEP_DIVE",
                        payload: {
                            context: document.body.innerText.substring(0, 1000), // Limited context
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
                console.log("[CURSOR] 💬 Commander panel requested")

                setCommanderPanel({
                    visible: true,
                    position: {
                        x: Math.max(50, window.innerWidth / 2 - 200),
                        y: Math.max(50, window.innerHeight / 4)
                    },
                    context: {
                        type: "global"
                    }
                })

                logger.info("💬 Commander panel opened")
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
            {hoverCard && (
                <HolographicCard
                    xpath={hoverCard.xpath}
                    position={hoverCard.position}
                    onClose={() => setHoverCard(null)}
                    onPositionChange={(pos) => setHoverCard(prev => prev ? { ...prev, position: pos } : null)}
                />
            )}

            {/* Evidence Card for Verified Facts */}
            {evidenceCard && (
                <HolographicEvidence
                    visible={evidenceCard.visible}
                    position={evidenceCard.position}
                    data={evidenceCard.data}
                    onClose={() => setEvidenceCard(null)}
                    onChat={() => {
                        setCommanderPanel({
                            visible: true,
                            position: { x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 300 },
                            context: {
                                type: "card",
                                data: evidenceCard.data
                            }
                        })
                    }}
                    onPositionChange={(pos) => setEvidenceCard(prev => prev ? { ...prev, position: pos } : null)}
                />
            )}

            {/* Fallacy Card for Logical Fallacies */}
            {fallacyCard && (
                <FallacyCard
                    visible={fallacyCard.visible}
                    position={fallacyCard.position}
                    data={fallacyCard.data}
                    onClose={() => setFallacyCard(null)}
                    onPositionChange={(pos) => setFallacyCard(prev => prev ? { ...prev, position: pos } : null)}
                />
            )}

            {/* Emotional Card for Emotional Content */}
            {emotionalCard && (
                <EmotionalCard
                    visible={emotionalCard.visible}
                    position={emotionalCard.position}
                    data={emotionalCard.data}
                    onClose={() => setEmotionalCard(null)}
                    onPositionChange={(pos) => setEmotionalCard(prev => prev ? { ...prev, position: pos } : null)}
                />
            )}

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

// Helper to map claim types to visual categories
function getClaimType(rawType: string = ""): "fact" | "emotion" | "logic" {
    const type = rawType.toLowerCase()
    if (type.includes("emotion") || type.includes("opinion") || type.includes("subjective")) return "emotion"
    if (type.includes("logic") || type.includes("fallacy") || type.includes("reasoning")) return "logic"
    return "fact"
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
            console.log("[CURSOR] ✅ extractPageContent loaded:", typeof extractPageContent)

            const pageContent = extractPageContent()
            console.log("[CURSOR] 📦 Raw extracted content:", {
                nodeCount: pageContent.nodes.length,
                fullTextLength: pageContent.fullText.length,
                title: pageContent.title,
                url: pageContent.url
            })

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
