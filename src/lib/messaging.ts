/**
 * Messaging Infrastructure - Type-Safe Communication
 */

import type { Message } from "~src/types/agents"

type MessageHandler = (message: Message) => void | Promise<void>

class MessageBus {
    private handlers: Map<string, Set<MessageHandler>> = new Map()
    private port: chrome.runtime.Port | null = null

    /**
     * Initialize long-lived connection to background script
     */
    initialize(): void {
        if (this.port) {
            return // Already connected
        }

        this.port = chrome.runtime.connect({ name: "veritas-content" })

        this.port.onMessage.addListener((message: Message) => {
            this.dispatch(message)
        })

        this.port.onDisconnect.addListener(() => {
            console.log("Veritas: Connection to background script lost")
            this.port = null

            // Attempt reconnection after delay
            setTimeout(() => this.initialize(), 1000)
        })
    }

    /**
     * Send a message through the connection
     */
    send(message: Message): Promise<void> {
        if (!this.port) {
            console.error("Veritas: Cannot send message, no connection")
            this.initialize()
            return Promise.resolve()
        }

        try {
            this.port.postMessage(message)
            return Promise.resolve()
        } catch (error) {
            console.error("Veritas: Failed to send message", error)
            return Promise.reject(error)
        }
    }

    /**
     * Register a handler for a specific message type
     */
    on(messageType: string, handler: MessageHandler): () => void {
        if (!this.handlers.has(messageType)) {
            this.handlers.set(messageType, new Set())
        }

        this.handlers.get(messageType)!.add(handler)

        // Return unsubscribe function
        return () => {
            this.handlers.get(messageType)?.delete(handler)
        }
    }

    /**
     * Dispatch a message to all registered handlers
     */
    private dispatch(message: Message): void {
        const handlers = this.handlers.get(message.type)

        if (!handlers || handlers.size === 0) {
            console.warn(`Veritas: No handlers for message type: ${message.type}`)
            return
        }

        handlers.forEach((handler) => {
            try {
                handler(message)
            } catch (error) {
                console.error(`Veritas: Handler error for ${message.type}`, error)
            }
        })
    }

    /**
     * Send a one-time message (not through long-lived connection)
     */
    sendOneTime(message: Message): Promise<any> {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError)
                } else {
                    resolve(response)
                }
            })
        })
    }
}

// Singleton instance
export const messageBus = new MessageBus()

/**
 * Helper functions for common message types
 */
export function requestPageAnalysis(pageContent: import("~src/lib/content-extractor").PageContent): void {
    messageBus.send({
        type: "ANALYZE_PAGE",
        payload: pageContent
    })
}

export function requestDeepDive(context: string, target: string, query: string): void {
    messageBus.send({
        type: "DEEP_DIVE",
        payload: { context, target, query }
    })
}

export function sendCommanderMessage(
    text: string,
    context: string,
    history: Array<{ role: "user" | "agent", text: string }>,
    outputLanguage: "English" | "Chinese" = "English"
): Promise<void> {
    return messageBus.send({
        type: "COMMANDER_MESSAGE",
        payload: { text, context, history, outputLanguage }
    })
}
