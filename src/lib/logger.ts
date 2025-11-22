
export interface LogEntry {
    id: string
    timestamp: number
    level: "info" | "warn" | "error" | "debug"
    message: string
    details?: any
    source: "content" | "background" | "sidepanel" | "popup"
}

class Logger {
    private logs: LogEntry[] = []
    private listeners: ((logs: LogEntry[]) => void)[] = []
    private source: "content" | "background" | "sidepanel" | "popup" = "content"

    constructor() {
        // Determine source context
        if (typeof chrome !== "undefined" && chrome.runtime) {
            const url = typeof window !== "undefined" ? window.location.href : ""
            if (url.includes("sidepanel")) this.source = "sidepanel"
            else if (url.includes("popup")) this.source = "popup"
            else if (typeof window === "undefined") this.source = "background"
            else this.source = "content"
        }
    }

    private addLog(level: LogEntry["level"], message: string, details?: any) {
        const entry: LogEntry = {
            id: Math.random().toString(36).substring(7),
            timestamp: Date.now(),
            level,
            message,
            details,
            source: this.source
        }

        this.logs.push(entry)
        this.notifyListeners()

        // Persist to storage for cross-context viewing
        this.persistLog(entry)

        // Console fallback
        const prefix = `[Veritas:${this.source}]`
        if (level === "error") console.error(prefix, message, details || "")
        else if (level === "warn") console.warn(prefix, message, details || "")
        else console.log(prefix, message, details || "")
    }

    private async persistLog(entry: LogEntry) {
        try {
            if (!chrome.storage || !chrome.storage.local) return

            const result = await chrome.storage.local.get(["veritas_logs"])
            const logs = result.veritas_logs || []
            logs.push(entry)
            // Keep last 1000 logs
            if (logs.length > 1000) logs.shift()
            await chrome.storage.local.set({ veritas_logs: logs })
        } catch (e) {
            // Suppress "No SW" errors which happen during context invalidation
            if (e.message && e.message.includes("No SW")) return
            console.error("Failed to persist log", e)
        }
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener(this.logs))
    }

    info(message: string, details?: any) { this.addLog("info", message, details) }
    warn(message: string, details?: any) { this.addLog("warn", message, details) }
    error(message: string, details?: any) { this.addLog("error", message, details) }
    debug(message: string, details?: any) { this.addLog("debug", message, details) }

    getLogs() { return this.logs }

    subscribe(listener: (logs: LogEntry[]) => void) {
        this.listeners.push(listener)
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener)
        }
    }
}

export const logger = new Logger()
