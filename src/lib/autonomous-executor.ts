/**
 * Autonomous Task Executor
 * Enables Commander to execute multi-step task chains automatically
 * 
 * Key Capabilities:
 * - Executes Commander in a loop until task completion
 * - Feeds tool results back to Commander via memory
 * - Provides real-time progress updates to UI
 * - Handles errors and interruptions gracefully
 */

import { logger } from "~src/lib/logger"
import { memoryManager } from "~src/lib/memory"
import { askCommander } from "~src/agents/commander"
import { analyzeWithVelox } from "~src/agents/velox"
import { analyzeWithRatio } from "~src/agents/ratio"
import { analyzeWithVeritas } from "~src/agents/veritas"
import type { OutputLanguage } from "~src/lib/language-utils"

interface ToolCall {
    tool: string
    args: string | Record<string, any>
}

interface ExecutionState {
    taskId: string
    isRunning: boolean
    currentStep: number
    userRequest: string
    context: any
    history: Array<{ role: "user" | "agent" | "system", text: string }>
    port: chrome.runtime.Port
    outputLanguage: OutputLanguage
    maxIterations: number
}

export class AutonomousExecutor {
    private state: ExecutionState | null = null
    private stopRequested: boolean = false

    /**
     * Start autonomous execution loop
     * @param userMessage - User's initial request
     * @param context - Enhanced context with memory and page content
     * @param port - Communication port for progress updates
     * @param outputLanguage - Language for responses
     */
    async startExecution(
        userMessage: string,
        context: any,
        port: chrome.runtime.Port,
        outputLanguage: OutputLanguage = "English"
    ): Promise<void> {
        // Initialize execution state
        this.state = {
            taskId: crypto.randomUUID(),
            isRunning: true,
            currentStep: 0,
            userRequest: userMessage,
            context: context,
            history: [],
            port: port,
            outputLanguage: outputLanguage,
            maxIterations: 20 // Safety limit to prevent infinite loops
        }

        this.stopRequested = false

        logger.info(`[AutonomousExecutor] Starting execution for task: "${userMessage}"`)

        // Notify UI that execution has started
        this.state.port.postMessage({
            type: "EXECUTION_STARTED",
            payload: {
                taskId: this.state.taskId,
                userRequest: this.state.userRequest,
                maxSteps: this.state.maxIterations
            }
        })

        this.sendProgress("Initializing autonomous execution...", 0, this.state.maxIterations)

        try {
            await this.executionLoop()
        } catch (error) {
            logger.error("[AutonomousExecutor] Execution failed:", error)
            this.sendError(error instanceof Error ? error.message : "Unknown error")
        } finally {
            this.state.isRunning = false
            this.state = null
        }
    }

    /**
     * Main execution loop - keeps calling Commander until task is complete
     */
    private async executionLoop(): Promise<void> {
        if (!this.state) return

        let iteration = 0

        while (this.state.isRunning && iteration < this.state.maxIterations) {
            iteration++
            this.state.currentStep = iteration

            logger.info(`[AutonomousExecutor] Iteration ${iteration}/${this.state.maxIterations}`)

            // Check if user requested stop
            if (this.stopRequested) {
                logger.warn("[AutonomousExecutor] Execution stopped by user")
                this.sendProgress("⏹ Task interrupted by user", iteration, this.state.maxIterations)

                // Send stop notification
                this.state.port.postMessage({
                    type: "EXECUTION_COMPLETE",
                    payload: {
                        taskId: this.state.taskId,
                        totalSteps: iteration,
                        success: false,
                        reason: "user_stopped"
                    }
                })

                break
            }

            // Get updated context with latest memory
            const enhancedContext = {
                ...this.state.context,
                memory: memoryManager.getExecutionContext()
            }

            // Call Commander to get next action
            this.sendProgress("Analyzing next step...", iteration, this.state.maxIterations)

            const commanderResponse = await askCommander(
                iteration === 1 ? this.state.userRequest : "Continue with the plan based on the latest results.",
                enhancedContext,
                this.state.history,
                this.state.outputLanguage
            )

            logger.info(`[AutonomousExecutor] Commander response:`, commanderResponse)

            // Store Commander's response in history
            this.state.history.push({
                role: "agent",
                text: commanderResponse.text
            })

            // Send Commander's plan/response to UI
            this.state.port.postMessage({
                type: "COMMANDER_RESPONSE",
                payload: commanderResponse
            })

            // Check if Commander wants to execute tools
            if (!commanderResponse.toolCalls || commanderResponse.toolCalls.length === 0) {
                logger.info("[AutonomousExecutor] No more tool calls - task complete")
                this.sendProgress("✅ Task completed successfully!", iteration, this.state.maxIterations)

                // Send completion notification
                this.state.port.postMessage({
                    type: "EXECUTION_COMPLETE",
                    payload: {
                        taskId: this.state.taskId,
                        totalSteps: iteration,
                        success: true
                    }
                })

                this.state.isRunning = false
                break
            }

            // Execute all tool calls from this iteration
            for (let i = 0; i < commanderResponse.toolCalls.length; i++) {
                const toolCall = commanderResponse.toolCalls[i]

                logger.info(`[AutonomousExecutor] Executing tool ${i + 1}/${commanderResponse.toolCalls.length}: ${toolCall.tool}`)

                this.sendProgress(`Executing: ${toolCall.tool}...`, iteration, this.state.maxIterations)

                try {
                    const result = await this.executeTool(toolCall)

                    // Add tool result to history for Commander's next iteration
                    this.state.history.push({
                        role: "system",
                        text: `Tool "${toolCall.tool}" executed successfully. Result stored in memory with index: "${result.memoryIndex}"`
                    })

                    logger.info(`[AutonomousExecutor] Tool ${toolCall.tool} completed: ${result.memoryIndex}`)
                } catch (error) {
                    logger.error(`[AutonomousExecutor] Tool ${toolCall.tool} failed:`, error)

                    // Add error to history so Commander can adjust strategy
                    this.state.history.push({
                        role: "system",
                        text: `Tool "${toolCall.tool}" failed with error: ${error instanceof Error ? error.message : "Unknown error"}`
                    })

                    // Continue to next iteration - let Commander decide how to handle the error
                }
            }

            // Small delay between iterations for stability
            await new Promise(resolve => setTimeout(resolve, 500))
        }

        // Check if we hit max iterations
        if (iteration >= this.state.maxIterations) {
            logger.warn("[AutonomousExecutor] Max iterations reached - task may be incomplete")
            this.sendProgress("⚠️ Maximum steps reached. Task may be incomplete.", iteration, this.state.maxIterations)

            // Send incomplete notification
            this.state.port.postMessage({
                type: "EXECUTION_COMPLETE",
                payload: {
                    taskId: this.state.taskId,
                    totalSteps: iteration,
                    success: false,
                    reason: "max_iterations_reached"
                }
            })
        }
    }

    /**
     * Execute a single tool and store result in memory
     */
    private async executeTool(toolCall: ToolCall): Promise<any> {
        if (!this.state) throw new Error("No active execution state")

        const args = typeof toolCall.args === 'string'
            ? JSON.parse(toolCall.args)
            : toolCall.args

        let toolResult: any

        switch (toolCall.tool) {
            case "read_page": {
                toolResult = {
                    status: "success",
                    content: this.state.context.pageContent || {},
                    memoryIndex: "Page Read"
                }
                memoryManager.add("result", "read_page", toolResult.content, "Page Read")
                break
            }

            case "analyze_fallacies": {
                const pageContent = this.state.context.pageContent || {
                    url: "",
                    title: "",
                    fullText: args.text || "",
                    nodes: []
                }
                const result = await analyzeWithVelox(pageContent, this.state.outputLanguage)

                toolResult = {
                    status: "success",
                    fallacies: result.fallacyNodes || [],
                    lowValueNodes: result.lowValueNodes || [],
                    memoryIndex: `${result.fallacyNodes?.length || 0} fallacies`
                }

                memoryManager.add(
                    "result",
                    "analyze_fallacies",
                    result,
                    `${result.fallacyNodes?.length || 0} fallacies`,
                    undefined,
                    5  // 5 minute TTL for fallacy analysis
                )
                break
            }

            case "extract_claims": {
                const pageContent = this.state.context.pageContent || {
                    url: "",
                    title: "",
                    fullText: args.text || "",
                    nodes: []
                }
                const veloxResult = await analyzeWithVelox(pageContent, this.state.outputLanguage)
                const result = await analyzeWithRatio(pageContent, veloxResult, this.state.outputLanguage)

                toolResult = {
                    status: "success",
                    claims: result.claims || [],
                    entities: result.entities || [],
                    memoryIndex: `${result.claims?.length || 0} claims`
                }

                memoryManager.add(
                    "result",
                    "extract_claims",
                    result,
                    `${result.claims?.length || 0} claims`,
                    undefined,
                    5  // 5 minute TTL for claim extraction
                )
                break
            }

            case "deep_dive": {
                const { target, query } = args

                const focusedFact: any = {
                    claims: [{
                        id: "deep-dive-auto-1",
                        text: query,
                        elementId: target,
                        entities: [],
                        importance: 1.0,
                        category: "factual-statement"
                    }],
                    data: [],
                    entities: [],
                    summary: `Deep dive: ${query}`,
                    timestamp: Date.now()
                }

                const result = await analyzeWithVeritas(focusedFact, this.state.outputLanguage)

                const resultSummary = {
                    target,
                    query,
                    verification: result.verifications?.[0] || null,
                    sources: result.verifications?.[0]?.sources?.map(s => ({
                        title: s.title || "Unknown",
                        url: s.url,
                        snippet: s.snippet
                    })) || [],
                    status: result.verifications?.[0]?.status || "unknown"
                }

                toolResult = {
                    status: "success",
                    ...resultSummary,
                    memoryIndex: `Dive: ${target.substring(0, 15)}`
                }

                memoryManager.add(
                    "result",
                    "deep_dive",
                    resultSummary,
                    `Dive: ${target.substring(0, 15)}`,
                    { target },
                    10  // 10 minute TTL for deep dive results (longer because they're expensive)
                )

                // Send verification results to UI
                this.state.port.postMessage({
                    type: "VERITAS_COMPLETE",
                    payload: result
                })
                break
            }

            case "read_memory": {
                let memoryItem

                // Support source parameter for precise retrieval
                if (args.source) {
                    console.log(`[AutonomousExecutor] read_memory with source: ${args.source}`)
                    const sourceMemory = memoryManager.getBySource(args.source)

                    if (sourceMemory) {
                        // Return fullContent to preserve xpaths and IDs
                        memoryItem = sourceMemory.fullContent || sourceMemory.content
                        console.log(`[AutonomousExecutor] ✅ Found memory for source: ${args.source}`)

                        // Special logging for fallacies
                        if (args.source === "analyze_fallacies" && memoryItem) {
                            const fallacies = memoryItem.fallacies || memoryItem.fallacyNodes
                            console.log(`[AutonomousExecutor] Fallacies count: ${fallacies?.length || 0}`)
                            if (fallacies && fallacies.length > 0) {
                                console.log(`[AutonomousExecutor] First fallacy has xpath: ${!!fallacies[0]?.xpath}`)
                            }
                        }
                    } else {
                        console.log(`[AutonomousExecutor] ❌ No memory found for source: ${args.source}`)
                    }
                } else if (args.id === "latest" || args.id === "最新" || !args.id) {
                    const recent = memoryManager.getRecentWorkingMemory(1)
                    // Return fullContent, not compressed content
                    memoryItem = recent.length > 0 ? (recent[0].fullContent || recent[0].content) : null
                } else {
                    memoryItem = memoryManager.getMemoryContent(args.id)
                }

                toolResult = {
                    status: memoryItem ? "success" : "error",
                    content: memoryItem || null,
                    memoryIndex: memoryItem ? "Memory Retrieved" : "Not Found"
                }
                break
            }

            case "highlight_claim": {
                const { claimId, color, reason } = args

                // Get claim data from memory
                const claimsMemory = memoryManager.getBySource("extract_claims")
                const claim = claimsMemory?.fullContent?.claims?.find((c: any) => c.id === claimId)

                if (!claim) {
                    toolResult = {
                        status: "error",
                        message: `Claim ${claimId} not found in memory. Run extract_claims first.`
                    }
                    break
                }

                // Send highlight command with xpath ONLY (no text for reliability)
                this.state.port.postMessage({
                    type: "HIGHLIGHT_BY_XPATH",
                    payload: {
                        xpath: claim.xpath,
                        text: null,  // ALWAYS null - highlight entire element
                        color,
                        reason: `${reason} | ${(claim.text || claim.claimText || '').substring(0, 50)}...`
                    }
                })

                toolResult = {
                    status: "success",
                    memoryIndex: `Highlighted claim ${claimId}: \"${(claim.text || claim.claimText || '').substring(0, 30)}...\"`
                }
                break
            }

            case "highlight_element": {
                const { elementId, color, reason } = args

                // Send highlight command to content script
                this.state.port.postMessage({
                    type: "HIGHLIGHT_BY_ELEMENT",
                    payload: { elementId, color, reason }
                })

                toolResult = {
                    status: "success",
                    memoryIndex: `Highlighted element ${elementId}`
                }
                break
            }

            case "highlight_xpath": {
                const { xpath, color, reason } = args

                // Send highlight command to content script
                this.state.port.postMessage({
                    type: "HIGHLIGHT_BY_XPATH",
                    payload: {
                        xpath,
                        text: null,  // Highlight whole element
                        color,
                        reason
                    }
                })

                toolResult = {
                    status: "success",
                    memoryIndex: `Highlighted xpath: ${xpath.substring(0, 50)}`
                }
                break
            }

            case "highlight_text": {
                const { text, color, reason } = args

                // DEPRECATED: Log warning
                console.warn("[AutonomousExecutor] ⚠️ highlight_text is deprecated. Use highlight_claim, highlight_element, or highlight_xpath instead.")

                // Send highlight command to content script
                this.state.port.postMessage({
                    type: "HIGHLIGHT_TEXT",
                    payload: { text, color, reason }
                })

                toolResult = {
                    status: "success",
                    memoryIndex: `Highlighted (deprecated): ${text.substring(0, 15)}`
                }
                break
            }

            case "show_result_window": {
                const { title, content, position, type } = args

                // Send window command to content script
                this.state.port.postMessage({
                    type: "SHOW_RESULT_WINDOW",
                    payload: { title, content, position, type }
                })

                toolResult = {
                    status: "success",
                    memoryIndex: `Window: ${title}`
                }
                break
            }

            default:
                throw new Error(`Unknown tool: ${toolCall.tool}`)
        }

        return toolResult
    }

    /**
     * Send progress update to UI
     */
    private sendProgress(status: string, currentStep: number, totalSteps: number): void {
        if (!this.state) return

        this.state.port.postMessage({
            type: "UPDATE_PROGRESS",
            payload: {
                agent: "commander",
                status: status,
                currentStep: currentStep,
                totalSteps: totalSteps,
                progress: currentStep / totalSteps
            }
        })
    }

    /**
     * Send error message to UI
     */
    private sendError(message: string): void {
        if (!this.state) return

        this.state.port.postMessage({
            type: "COMMANDER_RESPONSE",
            payload: {
                text: this.state.outputLanguage === "Chinese"
                    ? `❌ 执行失败：${message}`
                    : `❌ Execution failed: ${message}`,
                toolCalls: []
            }
        })
    }

    /**
     * Request execution stop (called externally)
     */
    requestStop(): void {
        logger.warn("[AutonomousExecutor] Stop requested")
        this.stopRequested = true
    }
}

// Export singleton instance
export const autonomousExecutor = new AutonomousExecutor()
