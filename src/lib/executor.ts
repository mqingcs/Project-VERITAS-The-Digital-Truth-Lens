/**
 * Task Executor - The Engine of Agency
 * Handles the "Plan -> Execute -> Observe -> Repeat" loop for Commander
 */

import { askCommander } from "~src/agents/commander"
import { memoryManager } from "~src/lib/memory"
import { logger } from "~src/lib/logger"
import type { CommanderResponse } from "~src/types/agents"
import { analyzeWithVeritas } from "~src/agents/veritas"
import type { OutputLanguage } from "~src/lib/language-utils"

export interface ExecutionContext {
    pageContent: any
    outputLanguage: OutputLanguage
    port: chrome.runtime.Port
}

export class TaskExecutor {
    private maxTurns = 5
    private context: ExecutionContext

    constructor(context: ExecutionContext) {
        this.context = context
    }

    /**
     * Execute a high-level user request through the agent loop
     */
    async execute(userRequest: string): Promise<void> {
        let currentTurn = 0
        let isComplete = false

        // Initial conversation history for this session
        const sessionHistory: Array<{ role: "user" | "agent" | "system", text: string }> = []

        logger.info(`[Executor] Starting task execution for: "${userRequest}"`)

        while (currentTurn < this.maxTurns && !isComplete) {
            currentTurn++
            logger.info(`[Executor] Turn ${currentTurn}/${this.maxTurns}`)

            // 1. Get Plan from Commander
            // We pass the session history so it knows what it has already done
            const response = await askCommander(
                userRequest,
                {
                    pageContent: this.context.pageContent,
                    memory: memoryManager.getRecentContext()
                },
                sessionHistory,
                this.context.outputLanguage
            )

            // Log Commander's thought process
            logger.info(`[Executor] Commander plan: ${response.text}`)

            // Send the text response to the UI immediately
            this.context.port.postMessage({
                type: "COMMANDER_RESPONSE",
                payload: {
                    text: response.text,
                    toolCalls: [] // Don't show tool calls in the chat bubble, just the text
                }
            })

            // Add to history
            sessionHistory.push({ role: "agent", text: response.text })
            memoryManager.add("plan", "commander", response, "Execution Plan")

            // 2. Check for Tool Calls
            if (!response.toolCalls || response.toolCalls.length === 0) {
                logger.info("[Executor] No tool calls. Task complete.")
                isComplete = true
                break
            }

            // 3. Execute Tools
            for (const toolCall of response.toolCalls) {
                logger.info(`[Executor] Executing tool: ${toolCall.tool}`)

                try {
                    const result = await this.executeTool(toolCall)

                    // 4. Observe Results (Feed back into memory/history)
                    const observation = `Tool '${toolCall.tool}' output: ${JSON.stringify(result)}`
                    sessionHistory.push({ role: "system", text: observation })

                    // Store detailed result in memory
                    memoryManager.add("result", toolCall.tool, result, result.memoryIndex || "Tool Result", { args: toolCall.args })
                } catch (error) {
                    const errorMsg = `Tool '${toolCall.tool}' failed: ${error instanceof Error ? error.message : String(error)}`
                    logger.error(`[Executor] ${errorMsg}`)
                    sessionHistory.push({ role: "system", text: errorMsg })
                }
            }
        }

        if (currentTurn >= this.maxTurns) {
            logger.warn("[Executor] Max turns reached. Stopping execution.")
            this.context.port.postMessage({
                type: "COMMANDER_RESPONSE",
                payload: {
                    text: this.context.outputLanguage === "Chinese"
                        ? "任务执行达到最大步数限制，已停止。"
                        : "Task execution reached maximum steps limit and has stopped.",
                    toolCalls: []
                }
            })
        }
    }

    /**
     * Execute a single tool
     */
    private async executeTool(toolCall: { tool: string, args: string | any }): Promise<any> {
        const args = typeof toolCall.args === 'string' ? JSON.parse(toolCall.args) : toolCall.args
        const { tool } = toolCall

        // Notify UI of progress
        this.context.port.postMessage({
            type: "UPDATE_PROGRESS",
            payload: { agent: "commander", status: `Executing: ${tool}` }
        })

        switch (tool) {
            case "deep_dive":
                return await this.handleDeepDive(args)

            case "read_memory":
                return await this.handleReadMemory(args)

            case "read_page":
                return await this.handleReadPage(args)

            case "highlight_text":
                return await this.handleHighlight(args)

            case "show_result_window":
                return await this.handleShowResult(args)

            case "extract_claims":
                return await this.handleExtractClaims(args)

            case "analyze_fallacies":
                return await this.handleAnalyzeFallacies(args)

            default:
                throw new Error(`Unknown tool: ${tool}`)
        }
    }

    /**
     * Tool Handlers
     */

    private async handleDeepDive(args: { target: string, query: string }) {
        const { target, query } = args

        // Construct minimal FactJSON for Veritas
        const focusedFact: any = {
            claims: [{
                id: `deep-dive-${Date.now()}`,
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

        const result = await analyzeWithVeritas(
            focusedFact,
            this.context.outputLanguage
        )

        // Send results to UI for Deep Dive card
        this.context.port.postMessage({
            type: "VERITAS_COMPLETE",
            payload: result
        })

        // Return summary for the agent
        return {
            status: "success",
            verification: result.verifications?.[0]?.status || "unknown",
            sourceCount: result.verifications?.[0]?.sources?.length || 0,
            summary: result.verifications?.[0]?.evidenceSummary || "No explanation provided",
            memoryIndex: result.memoryIndex || "Veritas Analysis"
        }
    }

    private async handleHighlight(args: { text: string, color: string, reason: string }) {
        this.context.port.postMessage({
            type: "HIGHLIGHT_TEXT",
            payload: args
        })
        return { status: "success", message: "Highlight command sent to UI" }
    }

    private async handleShowResult(args: { title: string, content: string, position?: any, type?: string }) {
        this.context.port.postMessage({
            type: "SHOW_RESULT_WINDOW",
            payload: args
        })
        return { status: "success", message: "Window command sent to UI" }
    }

    /**
     * Handle Read Page - Extract current page content
     */
    private async handleReadPage(args: any): Promise<any> {
        logger.info(`[Executor] Reading current page content`)

        // Get page content from context (should be injected by background handler)
        const pageContent = this.context.pageContent || {}

        if (!pageContent || !pageContent.url) {
            return {
                status: "error",
                message: "No page content available. Page context not injected.",
                memoryIndex: "Page Read Fail"
            }
        }

        return {
            status: "success",
            content: {
                url: pageContent.url || "unknown",
                title: pageContent.title || "Untitled",
                text: pageContent.text || "",
                elements: pageContent.elements || []
            },
            memoryIndex: "Page Read"
        }
    }

    /**
     * Handle Extract Claims - Call Ratio agent
     */
    private async handleExtractClaims(args: any): Promise<any> {
        const { text } = args
        if (!text) {
            throw new Error("Missing 'text' argument for extract_claims")
        }

        logger.info(`[Executor] Extracting claims from text (${text.length} chars)`)

        // Import agents
        const { analyzeWithRatio } = await import("~src/agents/ratio")
        const { analyzeWithVelox } = await import("~src/agents/velox")

        // Create a minimal PageContent object from the text
        // This allows Ratio to work with plain text input from Commander
        const pageContent = {
            url: "command://text",
            title: "Commander Text Input",
            fullText: text,
            nodes: [{
                id: "commander-text",
                xpath: "/html/body",
                tagName: "div",
                tag: "div",
                text: text,
                index: 0
            }]
        }

        // Call Velox first to get fallacy analysis (Ratio needs this)
        const veloxResult = await analyzeWithVelox(pageContent, this.context.outputLanguage)

        // Then call Ratio with Velox results
        const result = await analyzeWithRatio(pageContent, veloxResult, this.context.outputLanguage)

        // Return summary with memoryIndex
        return {
            status: "success",
            claimCount: result.claims?.length || 0,
            entityCount: result.entities?.length || 0,
            summary: result.summary,
            claims: result.claims,
            memoryIndex: result.memoryIndex || `Found ${result.claims?.length || 0} claims`
        }
    }

    /**
     * Handle Analyze Fallacies - Call Velox agent
     */
    private async handleAnalyzeFallacies(args: any): Promise<any> {
        const { text } = args
        if (!text) {
            throw new Error("Missing 'text' argument for analyze_fallacies")
        }

        logger.info(`[Executor] Analyzing fallacies in text (${text.length} chars)`)

        // Import Velox agent
        const { analyzeWithVelox } = await import("~src/agents/velox")

        // Create a minimal PageContent object from the text
        const pageContent = {
            url: "command://text",
            title: "Commander Text Input",
            fullText: text,
            nodes: [{
                id: "commander-text",
                xpath: "/html/body",
                tagName: "div",
                tag: "div",
                text: text,
                index: 0
            }]
        }

        // Call Velox with the page content
        const result = await analyzeWithVelox(pageContent, this.context.outputLanguage)

        // Return summary with memoryIndex
        return {
            status: "success",
            fallacyCount: result.fallacyNodes?.length || 0,
            lowValueCount: result.lowValueNodes?.length || 0,
            fallacies: result.fallacyNodes,
            memoryIndex: result.memoryIndex || `Found ${result.fallacyNodes?.length || 0} fallacies`
        }
    }

    /**
     * Handle Read Memory
     */
    private async handleReadMemory(args: any): Promise<any> {
        const { id } = args
        if (!id) {
            throw new Error("Missing 'id' argument for read_memory")
        }

        logger.info(`[Executor] Reading memory: ${id}`)
        const content = memoryManager.getMemoryContent(id)

        if (!content) {
            return {
                status: "error",
                message: "Memory not found",
                memoryIndex: "Mem Not Found"
            }
        }

        return {
            status: "success",
            content: content,
            memoryIndex: "Read Success"
        }
    }
}
