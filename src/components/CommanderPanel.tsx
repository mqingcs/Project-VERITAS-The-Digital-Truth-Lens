/**
 * CommanderPanel - Floating AI Commander Interface
 * Accessible via Ctrl+Shift+C for global orchestration
 */

import { useState, useRef, useEffect } from "react"
import { useVeritasStore } from "~src/store"
import { sendCommanderMessage } from "~src/lib/messaging"
import { messageBus } from "~src/lib/messaging"
import type { CommanderResponse } from "~src/types/agents"
import { ProgressBar } from "~src/components/ProgressBar"
import { StopButton } from "~src/components/StopButton"
import { ExecutionHistory } from "~src/components/ExecutionHistory"
import { addExecutionToHistory } from "~src/components/ExecutionHistory"
import { autonomousExecutor } from "~src/lib/autonomous-executor"
import { useDraggable } from "~src/hooks/useDraggable"

interface CommanderPanelProps {
    visible: boolean
    position: { x: number; y: number }
    context?: {
        type: "global" | "card" | "deepdive"
        data?: any
    }
    onClose: () => void
    onPositionChange?: (pos: { x: number; y: number }) => void
}

interface Message {
    role: "user" | "agent"
    text: string
    plan?: Array<{
        agent: string
        action: string
        reasoning: string
    }>
}

export default function CommanderPanel({ visible, position, context, onClose, onPositionChange }: CommanderPanelProps) {
    const { handleMouseDown, isDragging } = useDraggable(position, (newPos) => {
        onPositionChange?.(newPos)
    })
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [progress, setProgress] = useState<string | null>(null)

    // New: Autonomous execution state
    const [isExecuting, setIsExecuting] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [totalSteps, setTotalSteps] = useState(0)
    const [executionStatus, setExecutionStatus] = useState("")

    // Use refs to avoid stale closure in event listeners
    const executionStartTimeRef = useRef<number>(0)
    const messagesRef = useRef<Message[]>([])

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const store = useVeritasStore()

    // Keep messagesRef in sync with messages state
    useEffect(() => {
        messagesRef.current = messages
    }, [messages])

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, progress])

    // Listen for Commander responses and progress
    useEffect(() => {
        const unsubscribeResponse = messageBus.on("COMMANDER_RESPONSE", (message) => {
            if (message.type !== "COMMANDER_RESPONSE") return

            const { text, toolCalls } = message.payload
            setMessages(prev => [...prev, { role: "agent", text }])
            setIsProcessing(false)
            setProgress(null)

            // If there are tool calls, show them as a plan
            if (toolCalls && toolCalls.length > 0) {
                console.log("[Commander Panel] Tool calls received:", toolCalls)
            }
        })

        const unsubscribeProgress = messageBus.on("UPDATE_PROGRESS", (message) => {
            if (message.type !== "UPDATE_PROGRESS") return
            const { agent, status, currentStep, totalSteps } = message.payload

            // Only show relevant progress
            if (agent === "commander" || agent === "veritas" || agent === "velox" || agent === "ratio") {
                setProgress(`${agent.toUpperCase()}: ${status}`)
                setExecutionStatus(status)

                // Update step progress if provided
                if (currentStep !== undefined) setCurrentStep(currentStep)
                if (totalSteps !== undefined) setTotalSteps(totalSteps)
            }
        })

        // New: Listen for execution lifecycle events
        const unsubscribeStarted = messageBus.on("EXECUTION_STARTED", (message) => {
            if (message.type !== "EXECUTION_STARTED") return
            const { maxSteps, userRequest } = message.payload

            setIsExecuting(true)
            setCurrentStep(0)
            setTotalSteps(maxSteps)
            setExecutionStatus("Starting autonomous execution...")
            executionStartTimeRef.current = Date.now()  // Use ref
            console.log("[CommanderPanel] EXECUTION_STARTED received, start time:", executionStartTimeRef.current)
        })

        const unsubscribeComplete = messageBus.on("EXECUTION_COMPLETE", (message) => {
            if (message.type !== "EXECUTION_COMPLETE") return
            const { totalSteps, success, reason } = message.payload

            console.log("[CommanderPanel] EXECUTION_COMPLETE received:", { totalSteps, success, reason })
            console.log("[CommanderPanel] Start time from ref:", executionStartTimeRef.current)
            console.log("[CommanderPanel] Messages from ref:", messagesRef.current.length)

            setIsExecuting(false)
            setProgress(null)

            // Add to execution history - use refs to get latest values
            const duration = Date.now() - executionStartTimeRef.current
            const lastUserMessage = messagesRef.current.filter(m => m.role === "user").pop()

            console.log("[CommanderPanel] Duration:", duration, "Last user message:", lastUserMessage?.text)

            if (lastUserMessage) {
                console.log("[CommanderPanel] Calling addExecutionToHistory...")
                addExecutionToHistory({
                    timestamp: executionStartTimeRef.current,
                    userRequest: lastUserMessage.text,
                    totalSteps,
                    duration,
                    success,
                    reason
                })
                console.log("[CommanderPanel] addExecutionToHistory called successfully")
            } else {
                console.warn("[CommanderPanel] No user message found, cannot add to history")
            }
        })

        return () => {
            unsubscribeResponse()
            unsubscribeProgress()
            unsubscribeStarted()
            unsubscribeComplete()
        }
    }, [])  // Empty array - listeners use refs for latest values

    // Add welcome message on first open
    useEffect(() => {
        if (visible && messages.length === 0) {
            const welcomeMessage = context?.type === "global"
                ? "我是 CURSOR，VERITAS 的指挥官。我可以帮你分析页面内容、验证事实、或深入调查特定声明。请问有什么需要？"
                : context?.type === "card"
                    ? "我已经读取了这张卡片的内容。你想了解什么？"
                    : "Deep Dive 分析已完成。有什么发现需要我解释的吗？"

            setMessages([{ role: "agent", text: welcomeMessage }])
        }
    }, [visible])

    const handleSend = async () => {
        if (!input.trim() || isProcessing) return

        const userMessage = input.trim()
        setInput("")
        setMessages(prev => [...prev, { role: "user", text: userMessage }])
        setIsProcessing(true)

        // Gather context for Commander
        const pageContext = {
            url: window.location.href,
            title: document.title,
            selectedText: window.getSelection()?.toString() || "",
            analysisResults: {
                velox: store.currentAnalysis?.velox || null,
                ratio: store.currentAnalysis?.ratio || null,
                veritas: store.currentAnalysis?.veritas || null
            },
            focusedContext: context?.data || null
        }

        // Detect language from user input (simple heuristic: if contains Chinese characters)
        const containsChinese = /[\u4e00-\u9fa5]/.test(userMessage)
        const outputLanguage = containsChinese ? "Chinese" : "English"

        try {
            await sendCommanderMessage(
                userMessage,
                JSON.stringify(pageContext),
                messages,
                outputLanguage
            )
        } catch (error) {
            console.error("[Commander Panel] Failed to send message:", error)
            setMessages(prev => [...prev, {
                role: "agent",
                text: outputLanguage === "Chinese"
                    ? "抱歉，我遇到了技术问题。请稍后再试。"
                    : "Sorry, I encountered a technical issue. Please try again."
            }])
            setIsProcessing(false)
        }
    }

    if (!visible) return null

    if (isMinimized) {
        return (
            <div
                style={{
                    position: "fixed",
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    width: "200px",
                    background: "linear-gradient(135deg, rgba(0,255,255,0.1), rgba(255,0,255,0.1))",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(0,255,255,0.3)",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    cursor: isDragging ? "grabbing" : "grab",
                    pointerEvents: "auto",
                    zIndex: 10000,
                    boxShadow: "0 8px 32px rgba(0,255,255,0.2)"
                }}
                onClick={() => setIsMinimized(false)}
                onMouseDown={handleMouseDown}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "cyan", fontWeight: "bold", fontSize: "14px" }}>💬 CURSOR</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onClose()
                        }}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#ff0080",
                            cursor: "pointer",
                            fontSize: "16px",
                            padding: "0"
                        }}
                    >
                        ✕
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div
            style={{
                position: "fixed",
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: "400px",
                maxHeight: "600px",
                background: "linear-gradient(135deg, rgba(10,10,30,0.95), rgba(30,10,40,0.95))",
                backdropFilter: "blur(20px)",
                border: "2px solid rgba(0,255,255,0.4)",
                borderRadius: "12px",
                boxShadow: "0 16px 48px rgba(0,255,255,0.3), 0 0 100px rgba(255,0,255,0.2)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                pointerEvents: "auto",
                zIndex: 10001,
                fontFamily: "'Inter', -apple-system, sans-serif"
            }}
        >
            {/* Header */}
            <div
                onMouseDown={handleMouseDown}
                style={{
                    background: "linear-gradient(90deg, rgba(0,255,255,0.2), rgba(255,0,255,0.2))",
                    borderBottom: "1px solid rgba(0,255,255,0.3)",
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: isDragging ? "grabbing" : "grab"
                }}
            >
                <div>
                    <div style={{ color: "cyan", fontWeight: "bold", fontSize: "16px", marginBottom: "4px" }}>
                        💬 COMMANDER
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }}>
                        {context?.type === "global" ? "全局模式" : context?.type === "card" ? "卡片上下文" : "Deep Dive 模式"}
                    </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        onClick={() => setIsMinimized(true)}
                        style={{
                            background: "rgba(255,255,255,0.1)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            borderRadius: "4px",
                            color: "#fff",
                            cursor: "pointer",
                            padding: "4px 8px",
                            fontSize: "12px"
                        }}
                    >
                        _
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            background: "rgba(255,0,128,0.2)",
                            border: "1px solid rgba(255,0,128,0.4)",
                            borderRadius: "4px",
                            color: "#ff0080",
                            cursor: "pointer",
                            padding: "4px 8px",
                            fontSize: "12px"
                        }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* New: Execution Status Panel */}
            {(isExecuting || currentStep > 0) && (
                <div style={{
                    padding: "12px 16px",
                    background: "rgba(0, 255, 255, 0.05)",
                    borderBottom: "1px solid rgba(0, 255, 255, 0.2)"
                }}>
                    <ProgressBar
                        currentStep={currentStep}
                        totalSteps={totalSteps}
                        status={executionStatus}
                    />
                    <div style={{ marginTop: "8px", display: "flex", justifyContent: "flex-end" }}>
                        <StopButton
                            isExecuting={isExecuting}
                            onStop={() => {
                                console.log("[Commander Panel] Requesting stop...")
                                autonomousExecutor.requestStop()
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Messages */}
            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                }}
            >
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        style={{
                            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                            maxWidth: "80%"
                        }}
                    >
                        <div
                            style={{
                                background: msg.role === "user"
                                    ? "linear-gradient(135deg, rgba(0,255,255,0.2), rgba(0,200,255,0.2))"
                                    : "linear-gradient(135deg, rgba(255,0,255,0.2), rgba(255,0,128,0.2))",
                                border: `1px solid ${msg.role === "user" ? "rgba(0,255,255,0.4)" : "rgba(255,0,255,0.4)"}`,
                                borderRadius: "8px",
                                padding: "10px 14px",
                                color: "#fff",
                                fontSize: "13px",
                                lineHeight: "1.5",
                                wordWrap: "break-word"
                            }}
                        >
                            {msg.text}
                        </div>
                        {msg.plan && (
                            <div style={{ marginTop: "8px", fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>
                                📋 执行计划: {msg.plan.length} 步
                            </div>
                        )}
                    </div>
                ))}
                {isProcessing && (
                    <div style={{ alignSelf: "flex-start", color: "cyan", fontSize: "13px" }}>
                        <span className="veritas-thinking-dots">Commander 正在思考</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
                style={{
                    borderTop: "1px solid rgba(0,255,255,0.3)",
                    padding: "16px",
                    background: "rgba(0,0,0,0.3)"
                }}
            >
                <div style={{ display: "flex", gap: "8px" }}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSend()}
                        placeholder="输入指令... (例如: 分析这个页面的可信度)"
                        disabled={isProcessing}
                        style={{
                            flex: 1,
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(0,255,255,0.3)",
                            borderRadius: "6px",
                            padding: "10px 12px",
                            color: "#fff",
                            fontSize: "13px",
                            outline: "none"
                        }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isProcessing || !input.trim()}
                        style={{
                            background: isProcessing || !input.trim()
                                ? "rgba(100,100,100,0.3)"
                                : "linear-gradient(135deg, rgba(0,255,255,0.3), rgba(0,200,255,0.3))",
                            border: "1px solid rgba(0,255,255,0.5)",
                            borderRadius: "6px",
                            color: isProcessing || !input.trim() ? "#666" : "cyan",
                            cursor: isProcessing || !input.trim() ? "not-allowed" : "pointer",
                            padding: "10px 20px",
                            fontSize: "13px",
                            fontWeight: "bold"
                        }}
                    >
                        {isProcessing ? "⏳" : "发送"}
                    </button>
                </div>
            </div>

            {/* New: Execution History */}
            <div style={{
                borderTop: "1px solid rgba(0, 255, 255, 0.3)",
                padding: "0 16px 16px 16px",
                background: "rgba(0, 0, 0, 0.2)"
            }}>
                <ExecutionHistory />
            </div>
        </div>
    )
}
