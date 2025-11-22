/**
 * Zustand State Management - The Central Nervous System
 */

import { create } from "zustand"
import type {
    RawAnalysisMap,
    FactJSON,
    VerifiedGraphData,
    VeritasAnalysis
} from "~src/types/agents"
import { logger } from "~src/lib/logger"

interface UIState {
    haloActive: boolean
    currentHover: string | null
    selectedClaim: string | null
    sidePanelOpen: boolean
    outputLanguage: "English" | "Chinese"
}

interface VeritasStore {
    currentAnalysis: VeritasAnalysis | null
    ui: UIState

    // Actions
    setVeloxData: (data: RawAnalysisMap) => void
    setRatioData: (data: FactJSON) => void
    setVeritasData: (data: VerifiedGraphData) => void
    setHaloActive: (active: boolean) => void
    setCurrentHover: (xpath: string | null) => void
    setSelectedClaim: (claimId: string | null) => void
    setSidePanelOpen: (open: boolean) => void
    setOutputLanguage: (lang: "English" | "Chinese") => void
    startAnalysis: (url: string, title: string) => void
    setStatusMessage: (message: string) => void
    updateProgress: (agent: "velox" | "ratio" | "veritas" | "commander", message?: string) => void
    resetAnalysis: () => void
    forceStop: () => void  // NEW: Emergency stop
    triggerDeepDive: (context: string, target: string) => void

    // Sync
    syncFromStorage: (state: Partial<VeritasStore>) => void
}

const initialState = {
    currentAnalysis: null,
    ui: {
        haloActive: false,
        currentHover: null,
        selectedClaim: null,
        sidePanelOpen: false,
        outputLanguage: "English" as "English" | "Chinese"
    }
}

export const useVeritasStore = create<VeritasStore>((set, get) => {
    // Initialize from storage
    chrome.storage.local.get(["veritasState"], (result) => {
        if (result.veritasState) {
            set(result.veritasState)
        }
    })

    // Listen for storage changes (Cross-context sync)
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "local" && changes.veritasState) {
            const newState = changes.veritasState.newValue
            if (newState) {
                set(newState)
            }
        }
    })

    const saveToStorage = (state: Partial<VeritasStore>) => {
        const currentState = get()
        const newState = { ...currentState, ...state }
        // Don't save functions
        const {
            setVeloxData, setRatioData, setVeritasData, setHaloActive,
            setCurrentHover, setSelectedClaim, setSidePanelOpen, startAnalysis,
            updateProgress, setStatusMessage, resetAnalysis, triggerDeepDive, syncFromStorage,
            setOutputLanguage, forceStop,  // Add forceStop here
            ...stateToSave
        } = newState as any

        chrome.storage.local.set({ veritasState: stateToSave })
    }

    return {
        ...initialState,

        syncFromStorage: (state) => set(state),

        setVeloxData: (data) => {
            const state = get()
            if (state.currentAnalysis) {
                const newState = {
                    currentAnalysis: {
                        ...state.currentAnalysis,
                        velox: data,
                        progress: { ...state.currentAnalysis.progress, velox: true }
                    }
                }
                set(newState)
                saveToStorage(newState)
            }
        },

        setRatioData: (data) => {
            const state = get()
            if (state.currentAnalysis) {
                const newState = {
                    currentAnalysis: {
                        ...state.currentAnalysis,
                        ratio: data,
                        progress: { ...state.currentAnalysis.progress, ratio: true }
                    }
                }
                set(newState)
                saveToStorage(newState)
            }
        },

        setVeritasData: (data) => {
            const state = get()
            if (state.currentAnalysis) {
                const newState = {
                    currentAnalysis: {
                        ...state.currentAnalysis,
                        veritas: data,
                        progress: { ...state.currentAnalysis.progress, veritas: true },
                        status: "complete" as const,
                        statusMessage: "Analysis Complete"
                    }
                }
                set(newState)
                saveToStorage(newState)
            }
        },

        setHaloActive: (active) => {
            const newState = { ui: { ...get().ui, haloActive: active } }
            set(newState)
            saveToStorage(newState)
        },

        setCurrentHover: (xpath) => {
            const newState = { ui: { ...get().ui, currentHover: xpath } }
            set(newState)
            // Hover state might be too frequent to sync, but for now let's sync it
            // saveToStorage(newState) 
        },

        setSelectedClaim: (claimId) => {
            const newState = { ui: { ...get().ui, selectedClaim: claimId } }
            set(newState)
            saveToStorage(newState)
        },

        setSidePanelOpen: (open) => {
            const newState = { ui: { ...get().ui, sidePanelOpen: open } }
            set(newState)
            saveToStorage(newState)
        },

        setOutputLanguage: (lang) => {
            const newState = { ui: { ...get().ui, outputLanguage: lang } }
            set(newState)
            saveToStorage(newState)
        },

        startAnalysis: (url, title) => {
            logger.info("Starting analysis", { url, title })
            const newState = {
                currentAnalysis: {
                    url,
                    pageTitle: title,
                    velox: null,
                    ratio: null,
                    veritas: null,
                    status: "analyzing" as const,
                    statusMessage: "Initializing Agents...",
                    progress: {
                        velox: false,
                        ratio: false,
                        veritas: false,
                        commander: false
                    }
                },
                ui: {
                    ...get().ui,
                    haloActive: true
                }
            }
            set(newState)
            saveToStorage(newState)
        },

        setStatusMessage: (message) => {
            const state = get()
            if (state.currentAnalysis) {
                const newState = {
                    currentAnalysis: {
                        ...state.currentAnalysis,
                        statusMessage: message
                    }
                }
                set(newState)
                saveToStorage(newState)
            }
        },

        updateProgress: (agent, message) => {
            const state = get()
            if (state.currentAnalysis) {
                const newState = {
                    currentAnalysis: {
                        ...state.currentAnalysis,
                        statusMessage: message || state.currentAnalysis.statusMessage,
                        progress: { ...state.currentAnalysis.progress, [agent]: true }
                    }
                }
                set(newState)
                saveToStorage(newState)
            }
        },

        resetAnalysis: () => {
            const newState = {
                currentAnalysis: null,
                ui: {
                    ...get().ui,
                    haloActive: false,
                    currentHover: null,
                    selectedClaim: null
                }
            }
            set(newState)
            saveToStorage(newState)
        },

        forceStop: () => {
            logger.warn("FORCE STOP activated by user")
            // Immediately stop all operations and clear analysis
            const newState = {
                currentAnalysis: null,
                ui: {
                    ...get().ui,
                    haloActive: false,  // Turn off halo
                    currentHover: null,
                    selectedClaim: null
                }
            }
            set(newState)
            saveToStorage(newState)

            // Send force stop message to background
            chrome.runtime.sendMessage({ type: "FORCE_STOP" }).catch(() => {
                // Ignore errors if background is not available
            })
        },

        triggerDeepDive: (context, target) => {
            logger.info("Deep dive triggered", { context, target })
            const newState = { ui: { ...get().ui, selectedClaim: target } }
            set(newState)
            saveToStorage(newState)
        }
    }
})

export const useHaloActive = () => useVeritasStore((state) => state.ui.haloActive)
export const useCurrentAnalysis = () => useVeritasStore((state) => state.currentAnalysis)
export const useSidePanelOpen = () => useVeritasStore((state) => state.ui.sidePanelOpen)
