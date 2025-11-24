/**
 * API Settings Component
 * Allows users to input and save their Gemini API key
 */

import React, { useState, useEffect } from "react"
import { saveGeminiAPIKey, getGeminiAPIKey } from "~src/api/gemini-provider"
import { useVeritasStore } from "~src/store"
import "~src/styles/settings.css"

export default function Settings() {
    const store = useVeritasStore()
    const [apiKey, setApiKey] = useState("")
    const [saved, setSaved] = useState(false)
    const [testing, setTesting] = useState(false)

    useEffect(() => {
        loadApiKey()
    }, [])

    async function loadApiKey() {
        const key = await getGeminiAPIKey()
        if (key) {
            // Mask API key for security
            setApiKey(key.slice(0, 10) + "..." + key.slice(-4))
        }
    }

    async function handleSave() {
        if (!apiKey || apiKey.length < 20) {
            alert("Please enter a valid Gemini API key")
            return
        }

        try {
            await saveGeminiAPIKey(apiKey)
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (error) {
            alert("Failed to save API key: " + error.message)
        }
    }

    async function handleTest() {
        setTesting(true)
        try {
            const { GeminiProvider } = await import("~src/api/gemini-provider")
            const gemini = new GeminiProvider({
                apiKey,
                model: "gemini-2.5-flash-lite"
            })

            const response = await gemini.analyze(
                "You are a test. Respond with valid JSON: {\"status\": \"ok\", \"message\": \"API connection successful\"}",
                "Test"
            )

            const parsed = JSON.parse(response)
            if (parsed.status === "ok") {
                alert("✓ API Key Valid!\n\nGemini connection successful. Veritas is ready.")
            } else {
                alert("⚠ Unexpected response. Check your API key.")
            }
        } catch (error) {
            alert("✗ API Test Failed\n\n" + error.message)
        } finally {
            setTesting(false)
        }
    }

    return (
        <div className="veritas-settings">
            <div className="settings-header">
                <h1>⚙️ VERITAS Settings</h1>
                <p className="subtitle">Nox est norma, Lux per rationem reconstruitur</p>
            </div>

            <div className="settings-section">
                <h2>🔑 Gemini API Key</h2>
                <p className="help-text">
                    Get your free API key from{" "}
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">
                        Google AI Studio
                    </a>
                </p>

                <input
                    type="password"
                    className="api-key-input"
                    placeholder="AIza..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                />

                <div className="button-group">
                    <button onClick={handleSave} className="btn-primary">
                        {saved ? "✓ Saved" : "Save API Key"}
                    </button>
                    <button onClick={handleTest} disabled={testing || !apiKey} className="btn-secondary">
                        {testing ? "Testing..." : "Test Connection"}
                    </button>
                </div>
            </div>

            <div className="settings-section">
                <h2>🌐 Language Settings</h2>
                <p className="help-text">Choose the language for AI analysis output.</p>
                <div className="button-group">
                    <button
                        onClick={() => store.setOutputLanguage("English")}
                        className={`btn-secondary ${store.ui.outputLanguage === "English" ? "active" : ""}`}
                        style={{
                            background: store.ui.outputLanguage === "English" ? "rgba(0, 255, 242, 0.2)" : "transparent",
                            borderColor: store.ui.outputLanguage === "English" ? "#00fff2" : "rgba(255, 255, 255, 0.2)"
                        }}
                    >
                        English
                    </button>
                    <button
                        onClick={() => store.setOutputLanguage("Chinese")}
                        className={`btn-secondary ${store.ui.outputLanguage === "Chinese" ? "active" : ""}`}
                        style={{
                            background: store.ui.outputLanguage === "Chinese" ? "rgba(0, 255, 242, 0.2)" : "transparent",
                            borderColor: store.ui.outputLanguage === "Chinese" ? "#00fff2" : "rgba(255, 255, 255, 0.2)"
                        }}
                    >
                        Chinese (Simplified)
                    </button>
                </div>
            </div>

            <div className="settings-section">
                <h2>🤖 Agent Models</h2>
                <div className="model-info">
                    <div className="model-card">
                        <strong>Velox (Sentry)</strong>
                        <span className="model-name">gemini-2.5-flash-lite</span>
                        <p>Fastest model for initial screening</p>
                    </div>
                    <div className="model-card">
                        <strong>Ratio (Analyst)</strong>
                        <span className="model-name">gemini-2.5-flash</span>
                        <p>Balanced model for fact extraction</p>
                    </div>
                    <div className="model-card">
                        <strong>Veritas (Investigator)</strong>
                        <span className="model-name">gemini-2.5-flash</span>
                        <p>Advanced reasoning with search grounding</p>
                    </div>
                </div>
            </div>

            <div className="settings-section">
                <h2>ℹ️ Usage</h2>
                <ol className="usage-steps">
                    <li>Get your Gemini API key from Google AI Studio (free tier available)</li>
                    <li>Paste the key above and click "Save API Key"</li>
                    <li>Test the connection to verify it works</li>
                    <li>Browse any webpage and press <kbd>Alt+V</kbd> to activate</li>
                    <li>Watch the Neon Halo as agents analyze the page</li>
                    <li>Hover over highlighted content to see detailed analysis</li>
                </ol>
            </div>
        </div>
    )
}
