/**
 * Background Service Worker - The Orchestrator
 * Routes messages between content scripts and agent services
 */

import type { Message } from "~src/types/agents"
import { logger } from "~src/lib/logger"
import { analyzeWithVelox } from "~src/agents/velox"
import { analyzeWithRatio } from "~src/agents/ratio"
import { memoryManager } from "~src/lib/memory"
import { analyzeWithVeritas } from "~src/agents/veritas"
import { AutonomousExecutor } from "~src/lib/autonomous-executor"
import { askCommander } from "~src/agents/commander"

// Store active connections
const connections = new Map<number, chrome.runtime.Port>()

// Store active executors by tab ID
const activeExecutors = new Map<number, AutonomousExecutor>()

// Store active analysis cancellation tokens by tab ID
// true = cancelled
const activeAnalyses = new Map<number, boolean>()

// Listen for content script connections
chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== "veritas-content") {
        return
    }

    const senderId = port.sender?.tab?.id
    if (!senderId) {
        logger.error("Port has no sender tab ID")
        return
    }

    logger.info(`Veritas: Content script connected from tab ${senderId}`)
    connections.set(senderId, port)

    // Handle messages from content script
    port.onMessage.addListener(async (message: Message) => {
        logger.debug("Veritas: Received message", { type: message.type })

        try {
            await handleMessage(message, port)
        } catch (error) {
            logger.error("Veritas: Error handling message", { error })

            // Send error back to content script
            port.postMessage({
                type: "ERROR",
                payload: {
                    error: error instanceof Error ? error.message : "Unknown error"
                }
            })
        }
    })

    // Clean up on disconnect
    port.onDisconnect.addListener(() => {
        logger.info(`Veritas: Content script disconnected from tab ${senderId}`)
        connections.delete(senderId)
    })
})

/**
 * Handle incoming messages and route to appropriate agents
 */
async function handleMessage(message: Message, port: chrome.runtime.Port): Promise<void> {
    switch (message.type) {
        case "ANALYZE_PAGE": {
            const pageContent = message.payload
            const { url } = pageContent

            logger.info(`Veritas: Starting analysis for ${url}`)

            // Reset cancellation status for this tab
            if (port.sender?.tab?.id) {
                activeAnalyses.set(port.sender.tab.id, false)
            }

            // Execute the analysis pipeline with proper error handling
            // We wrap this in an immediately invoked async function to avoid blocking
            ; (async () => {
                try {
                    // === VELOX AGENT ===
                    console.log("[BACKGROUND] Starting Velox agent...")
                    console.log("[BACKGROUND] PageContent nodes:", pageContent.nodes?.length || 0)
                    console.log("[BACKGROUND] PageContent fullText length:", pageContent.fullText?.length || 0)

                    port.postMessage({
                        type: "UPDATE_PROGRESS",
                        payload: { agent: "velox", status: "Velox: Scanning for noise and fallacies..." }
                    })

                    const veloxData = await analyzeWithVelox(
                        pageContent,
                        pageContent.outputLanguage || "English"
                    )
                    console.log("[BACKGROUND] Velox complete, sending to content script")

                    // Store in memory for Commander access
                    memoryManager.add(
                        "result",
                        "analyze_fallacies",
                        veloxData,
                        `${veloxData.fallacyNodes?.length || 0} fallacies`,
                        undefined,
                        30  // 30 minute TTL for full-page analysis (expensive operation)
                    )

                    port.postMessage({
                        type: "VELOX_COMPLETE",
                        payload: veloxData
                    })

                    // Small delay for UI update
                    await new Promise(resolve => setTimeout(resolve, 500))

                    // Small delay for UI update
                    await new Promise(resolve => setTimeout(resolve, 500))

                    // CHECK CANCELLATION
                    if (port.sender?.tab?.id && activeAnalyses.get(port.sender.tab.id)) {
                        logger.warn("[BACKGROUND] Analysis cancelled by user after Velox")
                        return
                    }

                    // === RATIO AGENT ===
                    console.log("[BACKGROUND] Starting Ratio agent...")
                    port.postMessage({
                        type: "UPDATE_PROGRESS",
                        payload: { agent: "ratio", status: "Ratio: Extracting facts and claims..." }
                    })

                    const ratioData = await analyzeWithRatio(
                        pageContent,
                        veloxData,
                        pageContent.outputLanguage || "English"
                    )
                    console.log("[BACKGROUND] Ratio complete, sending to content script")

                    // Store in memory for Commander access
                    memoryManager.add(
                        "result",
                        "extract_claims",
                        ratioData,
                        `${ratioData.claims?.length || 0} claims`,
                        undefined,
                        30  // 30 minute TTL
                    )

                    port.postMessage({
                        type: "RATIO_COMPLETE",
                        payload: ratioData
                    })

                    // Small delay for UI update
                    await new Promise(resolve => setTimeout(resolve, 500))

                    // Small delay for UI update
                    await new Promise(resolve => setTimeout(resolve, 500))

                    // CHECK CANCELLATION
                    if (port.sender?.tab?.id && activeAnalyses.get(port.sender.tab.id)) {
                        logger.warn("[BACKGROUND] Analysis cancelled by user after Ratio")
                        return
                    }

                    // === VERITAS AGENT ===
                    console.log("[BACKGROUND] Starting Veritas agent...")
                    port.postMessage({
                        type: "UPDATE_PROGRESS",
                        payload: { agent: "veritas", status: "Veritas: Verifying claims with Google Search..." }
                    })

                    const veritasData = await analyzeWithVeritas(
                        ratioData,
                        pageContent.outputLanguage || "English"
                    )
                    console.log("[BACKGROUND] Veritas complete, sending to content script")

                    // Store in memory for Commander access
                    memoryManager.add(
                        "result",
                        "verify_claims",  // New source type for full verification
                        veritasData,
                        `${veritasData.verifications?.length || 0} verified`,
                        undefined,
                        30  // 30 minute TTL
                    )

                    port.postMessage({
                        type: "VERITAS_COMPLETE",
                        payload: veritasData
                    })

                    logger.info("✓ Veritas: Analysis pipeline complete")

                    // Cleanup
                    if (port.sender?.tab?.id) {
                        activeAnalyses.delete(port.sender.tab.id)
                    }

                } catch (error) {
                    console.error("[BACKGROUND] Analysis pipeline failed:", error)
                    logger.error("Analysis pipeline failed", { error })

                    // Send error to content script
                    port.postMessage({
                        type: "ERROR",
                        payload: {
                            error: error instanceof Error ? error.message : "Analysis failed"
                        }
                    })
                }
            })()

            break
        }

        case "FORCE_STOP": {
            // Emergency stop - halt all operations and clear state
            logger.warn("[Background] FORCE_STOP signal received")

            // Send stop signal to content script to remove all UI elements
            try {
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
                if (tabs[0]?.id) {
                    await chrome.tabs.sendMessage(tabs[0].id, {
                        type: "FORCE_STOP",
                        payload: {}
                    }).catch(() => {
                        // Ignore if content script is not available
                    })
                }
            } catch (error) {
                // Silently ignore
            }

            // Mark all active analyses as cancelled
            for (const key of activeAnalyses.keys()) {
                activeAnalyses.set(key, true)
            }

            // Clear all state
            await chrome.storage.local.remove("veritasState")

            logger.info("[Background] All operations stopped, state cleared")
            break
        }

        case "DEEP_DIVE": {
            const { context, target, query } = message.payload

            logger.info(`Veritas: Deep dive requested for ${target}: "${query}"`)

                // Execute deep dive with proper async handling
                ; (async () => {
                    try {
                        port.postMessage({
                            type: "UPDATE_PROGRESS",
                            payload: { agent: "veritas", status: `Deep diving: ${query}` }
                        })

                        console.log("[BACKGROUND] 🔍 Starting Deep Dive analysis...")
                        console.log(`[BACKGROUND] 📍 Target: ${target}`)
                        console.log(`[BACKGROUND] 💭 Query: ${query}`)
                        console.log(`[BACKGROUND] 📄 Context length: ${context.length} characters`)

                        // Create a focused FactJSON with the selected context
                        const focusedFact: any = {
                            claims: [{
                                id: "deep-dive-1",
                                text: query,
                                elementId: target,
                                entities: [],
                                importance: 1.0,
                                category: "factual-statement"
                            }],
                            data: [],
                            entities: [],
                            summary: `Deep dive query: ${query}`,
                            timestamp: Date.now()
                        }

                        // Call Veritas with focused context (already imported at top of file)
                        const deepDiveResults = await analyzeWithVeritas(
                            focusedFact,
                            message.payload.outputLanguage || "English"
                        )

                        console.log("[BACKGROUND] ✅ Deep dive complete")
                        console.log(`[BACKGROUND] 📊 Found ${deepDiveResults.verifications.length} verifications`)
                        console.log(`[BACKGROUND] 🕸️ Graph: ${deepDiveResults.graph.nodes.length} nodes, ${deepDiveResults.graph.edges.length} edges`)

                        // Store in memory for Commander access
                        const resultSummary = {
                            target,
                            query,
                            verification: deepDiveResults.verifications?.[0] || null,
                            sources: deepDiveResults.verifications?.[0]?.sources?.map(s => ({
                                title: s.title || "Unknown",
                                url: s.url,
                                snippet: s.snippet
                            })) || [],
                            status: deepDiveResults.verifications?.[0]?.status || "unknown"
                        }

                        memoryManager.add(
                            "result",
                            "deep_dive",
                            resultSummary,
                            `Dive: ${target.substring(0, 15)}`,
                            { target },
                            10  // 10 minute TTL for deep dive
                        )

                        // Send results back
                        port.postMessage({
                            type: "VERITAS_COMPLETE",
                            payload: deepDiveResults
                        })

                    } catch (error) {
                        console.error("[BACKGROUND] Deep dive failed:", error)
                        logger.error("Deep dive failed", { error })

                        port.postMessage({
                            type: "ERROR",
                            payload: {
                                agent: "veritas",
                                error: error instanceof Error ? error.message : "Deep dive failed"
                            }
                        })
                    }
                })()

            break
        }

        case "COMMANDER_MESSAGE": {
            const { text, context = {}, history = [], outputLanguage = "English" } = message.payload
            logger.info(`Veritas: Commander message received: "${text}"`)

            // Store user input in memory
            memoryManager.add("user_input", "user", text, text.substring(0, 15))

                // AUTONOMOUS EXECUTION MODE
                // Instead of single-shot execution, start autonomous loop
                ; (async () => {
                    try {
                        logger.info("[Background] Initializing autonomous execution...")

                        // Get the current active tab for page context
                        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

                        if (!tab || !tab.id) {
                            logger.warn("[Background] No active tab found")
                            port.postMessage({
                                type: "COMMANDER_RESPONSE",
                                payload: {
                                    text: outputLanguage === "Chinese"
                                        ? "错误：未找到活动标签页"
                                        : "Error: No active tab found",
                                    toolCalls: []
                                }
                            })
                            return
                        }

                        // Extract page content for Commander context
                        let pageContent = null
                        try {
                            const result = await chrome.scripting.executeScript({
                                target: { tabId: tab.id },
                                func: () => {
                                    const nodes: any[] = []
                                    const blockElements = document.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, blockquote, article, section")

                                    // Simple XPath generator
                                    const getSimpleXPath = (element: Element): string => {
                                        if (element.id) return `//*[@id="${element.id}"]`
                                        if (element === document.body) return "/html/body"

                                        const tagName = element.tagName.toLowerCase()
                                        const parent = element.parentElement
                                        if (!parent) return `/${tagName}`

                                        const siblings = Array.from(parent.children).filter(e => e.tagName === element.tagName)
                                        const index = siblings.indexOf(element) + 1

                                        return `${getSimpleXPath(parent)}/${tagName}${siblings.length > 1 ? `[${index}]` : ''}`
                                    }

                                    blockElements.forEach((el, index) => {
                                        const text = el.textContent?.trim()
                                        if (!text || text.length < 20) return
                                        if (el.closest('script, style, noscript')) return

                                        nodes.push({
                                            id: `[${el.tagName}:${index}]`,
                                            tagName: el.tagName,
                                            index: index,
                                            text: text.slice(0, 2000),
                                            xpath: getSimpleXPath(el)
                                        })
                                    })

                                    const fullText = nodes.map(n => n.text).join("\\n\\n")

                                    return {
                                        url: window.location.href,
                                        title: document.title,
                                        fullText: fullText,
                                        nodes: nodes.slice(0, 300)
                                    }
                                }
                            })

                            if (result && result[0] && result[0].result) {
                                pageContent = result[0].result
                                logger.info(`[Background] Extracted page: ${pageContent.nodes.length} nodes`)
                            }
                        } catch (extractError) {
                            logger.warn("[Background] Failed to extract page:", extractError)
                        }

                        // Build enhanced context
                        const enhancedContext = {
                            ...(context || {}),
                            pageContent: pageContent
                        }

                        // Create autonomous executor instance
                        const executor = new AutonomousExecutor()

                        // Store executor reference
                        if (port.sender?.tab?.id) {
                            activeExecutors.set(port.sender.tab.id, executor)
                        }

                        // Start autonomous execution loop
                        await executor.startExecution(
                            text,
                            enhancedContext,
                            port,
                            outputLanguage
                        )

                        // Cleanup after execution
                        if (port.sender?.tab?.id) {
                            activeExecutors.delete(port.sender.tab.id)
                        }

                        logger.info("[Background] Autonomous execution complete")

                    } catch (error) {
                        console.error("[Background] Autonomous execution failed:", error)
                        logger.error("Autonomous execution failed", {
                            error: error instanceof Error ? error.message : String(error),
                            stack: error instanceof Error ? error.stack : undefined
                        })

                        port.postMessage({
                            type: "COMMANDER_RESPONSE",
                            payload: {
                                text: outputLanguage === "Chinese"
                                    ? `抱歉，执行过程中出现错误：${error instanceof Error ? error.message : "未知错误"}`
                                    : `Sorry, an error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
                                toolCalls: []
                            }
                        })
                    }
                })()

            break
        }

        case "STOP_EXECUTION": {
            const tabId = port.sender?.tab?.id
            if (tabId && activeExecutors.has(tabId)) {
                logger.info(`[Background] Stopping execution for tab ${tabId}`)
                const executor = activeExecutors.get(tabId)
                executor?.requestStop()
            } else {
                logger.warn(`[Background] No active executor found for tab ${tabId}`)
            }
            break
        }

        default:
            logger.warn(`Veritas: Unknown message type ${(message as any).type}`)
    }
}

// Listen for one-off messages (e.g. from Side Panel or Popup)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    logger.debug("Veritas: Received runtime message", { type: message.type })

    if (message.type === "FORCE_STOP") {
        // Handle FORCE_STOP directly here since it doesn't require a port
        (async () => {
            try {
                logger.warn("[Background] FORCE_STOP signal received via runtime message")

                // 1. Send stop signal to all active tabs
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
                if (tabs[0]?.id) {
                    await chrome.tabs.sendMessage(tabs[0].id, {
                        type: "FORCE_STOP",
                        payload: {}
                    }).catch(() => {
                        // Ignore if content script is not available
                    })
                }

                // 2. Cancel all active analyses
                for (const key of activeAnalyses.keys()) {
                    activeAnalyses.set(key, true)
                    logger.info(`[Background] Cancelled analysis for tab ${key}`)
                }

                // 3. Stop all active executors
                for (const [tabId, executor] of activeExecutors.entries()) {
                    executor.requestStop()
                    logger.info(`[Background] Stopped executor for tab ${tabId}`)
                }

                // 4. Clear state
                await chrome.storage.local.remove("veritasState")

                logger.info("[Background] All operations stopped via runtime message")
                sendResponse({ success: true })
            } catch (error) {
                logger.error("Error handling FORCE_STOP", { error })
                sendResponse({ success: false, error: String(error) })
            }
        })()
        return true // Keep channel open for async response
    }
})

// Extension icon click - open side panel
chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return

    // Open side panel
    await chrome.sidePanel.open({ tabId: tab.id })
})

// ============================================================================
// PROGRAMMATIC CONTENT SCRIPT INJECTION
// ============================================================================

/**
 * Ensure content script is loaded in the tab
 * Uses ping mechanism to check if already loaded
 */
async function ensureContentScriptLoaded(tabId: number): Promise<void> {
    try {
        // Try to ping the content script
        await chrome.tabs.sendMessage(tabId, { type: "PING" })
        logger.info(`Content script already loaded in tab ${tabId}`)
    } catch (error) {
        // Content script not loaded, inject it
        logger.info(`Injecting content script into tab ${tabId}`)

        try {
            // Get content script files from manifest
            const manifest = chrome.runtime.getManifest()
            const contentScripts = manifest.content_scripts?.[0]?.js

            if (!contentScripts || contentScripts.length === 0) {
                throw new Error("No content scripts defined in manifest")
            }

            await chrome.scripting.executeScript({
                target: { tabId },
                files: contentScripts // Use files from manifest (e.g., ["cursor.bc8a6e0e.js"])
            })

            // Wait a moment for React to mount and connection to establish
            await new Promise(resolve => setTimeout(resolve, 150))

            logger.info(`Content script injected successfully in tab ${tabId}`)
        } catch (injectError) {
            logger.error(`Failed to inject content script in tab ${tabId}`, { error: injectError })
            throw injectError
        }
    }
}

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

chrome.commands.onCommand.addListener(async (command, tab) => {
    if (!tab?.id) {
        logger.warn(`Command ${command} triggered but no tab ID available`)
        return
    }

    try {
        // Ensure content script is loaded
        await ensureContentScriptLoaded(tab.id)

        // Get the active port for this tab
        const port = connections.get(tab.id)

        if (command === "veritas-analyze") {
            logger.info(`Triggering analysis in tab ${tab.id}`)

            if (port) {
                port.postMessage({
                    type: "TRIGGER_ANALYSIS",
                    payload: {}
                })
            } else {
                // Fallback: try direct message
                await chrome.tabs.sendMessage(tab.id, {
                    type: "TRIGGER_ANALYSIS",
                    payload: {}
                })
            }
        } else if (command === "veritas-commander") {
            logger.info(`Opening Commander in tab ${tab.id}`)

            if (port) {
                port.postMessage({
                    type: "OPEN_COMMANDER",
                    payload: {}
                })
            } else {
                // Fallback: try direct message
                await chrome.tabs.sendMessage(tab.id, {
                    type: "OPEN_COMMANDER",
                    payload: {}
                })
            }
        }
    } catch (error) {
        logger.error(`Failed to handle command ${command}`, { error })
    }
})

// ============================================================================
// CONTEXT MENU
// ============================================================================

// Context Menu Registration
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "veritas-deep-dive",
        title: "Veritas: Deep Dive",
        contexts: ["selection"]
    })
})

// Context Menu Click Handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "veritas-deep-dive" && tab?.id) {
        try {
            // Ensure content script is loaded
            await ensureContentScriptLoaded(tab.id)

            // Send message to content script to trigger deep dive
            // Use the existing long-lived connection for reliability
            const port = connections.get(tab.id)

            if (port) {
                try {
                    port.postMessage({
                        type: "TRIGGER_DEEP_DIVE",
                        payload: {
                            selectionText: info.selectionText
                        }
                    })
                    logger.info(`Triggered deep dive for tab ${tab.id}`)
                } catch (error) {
                    logger.error("Failed to send deep dive trigger via port", { error })
                }
            } else {
                logger.warn(`No active connection found for tab ${tab.id}, attempting fallback`)
                // Fallback: Try standard sendMessage (in case port is disconnected but script is alive)
                try {
                    await chrome.tabs.sendMessage(tab.id, {
                        type: "TRIGGER_DEEP_DIVE",
                        payload: {
                            selectionText: info.selectionText
                        }
                    })
                } catch (error) {
                    logger.error("Failed to trigger deep dive (fallback failed)", { error })
                }
            }
        } catch (error) {
            logger.error("Failed to ensure content script loaded for deep dive", { error })
        }
    }
})

logger.info("🔮 Veritas background service worker initialized")
