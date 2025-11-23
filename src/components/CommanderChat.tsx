import React, { useEffect, useState, useRef } from "react"
import { sendCommanderMessage, messageBus } from "~src/lib/messaging"
import type { CommanderResponse } from "~src/types/agents"

interface CommanderChatProps {
  contextText: string
  suggestedQuestions?: string[]
}

export default function CommanderChat({ contextText, suggestedQuestions = [] }: CommanderChatProps) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<{ role: "user" | "agent", text: string }[]>([
    { role: "agent", text: "Commander online. How can I assist with this content?" }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Listen for responses
  useEffect(() => {
    const unsubscribe = messageBus.on("COMMANDER_RESPONSE", (message) => {
      const payload = (message as any).payload as CommanderResponse["payload"]
      setMessages(prev => [...prev, { role: "agent", text: payload.text }])
      setIsTyping(false)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleSend = (text: string = input) => {
    if (!text.trim()) return

    const userText = text
    const newMessages = [...messages, { role: "user" as const, text: userText }]
    setMessages(newMessages)
    setInput("")
    setIsTyping(true)

    // Send to background
    sendCommanderMessage(userText, contextText, newMessages)
  }

  return (
    <div className="veritas-chat">
      <style>
        {`
          .veritas-chat {
            display: flex;
            flex-direction: column;
            height: 250px;
          }
          .veritas-chat-history {
            flex: 1;
            overflow-y: auto;
            margin-bottom: 8px;
            padding-right: 4px;
          }
          .veritas-message {
            margin-bottom: 8px;
            padding: 6px 8px;
            border-radius: 4px;
            font-size: 10px;
            line-height: 1.4;
          }
          .veritas-message.agent {
            background: rgba(0, 240, 255, 0.1);
            border-left: 2px solid #00F0FF;
            color: #E0E0E0;
          }
          .veritas-message.user {
            background: rgba(255, 215, 0, 0.1);
            border-right: 2px solid #FFD700;
            color: #fff;
            text-align: right;
          }
          .veritas-chat-input-area {
            display: flex;
            gap: 4px;
          }
          .veritas-chat-input {
            flex: 1;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(0, 240, 255, 0.3);
            color: #fff;
            padding: 6px;
            border-radius: 2px;
            font-family: inherit;
            font-size: 10px;
          }
          .veritas-chat-input:focus {
            outline: none;
            border-color: #00F0FF;
          }
          .veritas-send-btn {
            background: rgba(0, 240, 255, 0.2);
            border: 1px solid #00F0FF;
            color: #00F0FF;
            cursor: pointer;
            padding: 0 8px;
            font-size: 10px;
            text-transform: uppercase;
          }
          .veritas-send-btn:hover {
            background: rgba(0, 240, 255, 0.4);
          }
          .veritas-typing {
            font-size: 9px;
            color: rgba(0, 240, 255, 0.5);
            margin-bottom: 4px;
            font-style: italic;
          }
          .veritas-suggestion-chip {
            background: rgba(0, 240, 255, 0.05);
            border: 1px solid rgba(0, 240, 255, 0.2);
            color: #00F0FF;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 9px;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
            margin-right: 4px;
            margin-bottom: 4px;
            display: inline-block;
          }
          .veritas-suggestion-chip:hover {
            background: rgba(0, 240, 255, 0.15);
            border-color: #00F0FF;
          }
        `}
      </style>

      <div className="veritas-chat-history">
        {messages.map((msg, i) => (
          <div key={i} className={`veritas-message ${msg.role}`}>
            {msg.text}
          </div>
        ))}

        {/* Suggested Questions (only show if last message was from agent) */}
        {messages.length > 0 && messages[messages.length - 1].role === 'agent' && suggestedQuestions.length > 0 && (
          <div style={{ marginTop: "8px", paddingLeft: "4px" }}>
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                className="veritas-suggestion-chip"
                onClick={() => handleSend(q)}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {isTyping && <div className="veritas-typing">Commander is thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="veritas-chat-input-area">
        <input
          className="veritas-chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask Commander..."
          disabled={isTyping}
        />
        <button className="veritas-send-btn" onClick={() => handleSend()} disabled={isTyping}>SEND</button>
      </div>
    </div>
  )
}
