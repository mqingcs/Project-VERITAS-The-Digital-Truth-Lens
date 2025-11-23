/**
 * DOM Painter - Surgical, Non-Destructive DOM Manipulation
 * "Paint truth upon the canvas of deception"
 */

import { resolveXPath, getAllTextNodes } from "./xpath-utils"
import type { FallacyType, NoiseType, VerificationStatus } from "~src/types/agents"

// CSS custom properties for theming (injected globally)
const VERITAS_VARS = {
    lowValueOpacity: "0.4",
    fallacyColor: "#3B82F6", // Blue for logical fallacies
    verifiedColor: "#FFD700",
    falseColor: "#FF0000",
    glowCyan: "#00F0FF",
    glowGold: "#FFD700"
}

/**
 * Inject global CSS variables for consistent theming
 */
export function injectGlobalStyles(): void {
    const styleId = "veritas-global-styles"

    // Don't inject twice
    if (document.getElementById(styleId)) {
        console.log("[DOM-PAINTER] ✅ Styles already injected")
        return
    }

    const style = document.createElement("style")
    style.id = styleId
    style.setAttribute("data-veritas-styles", "true")  // Add for debugging
    style.textContent = `
    :root {
      --veritas-low-value-opacity: ${VERITAS_VARS.lowValueOpacity};
      --veritas-fallacy-color: ${VERITAS_VARS.fallacyColor};
      --veritas-verified-color: ${VERITAS_VARS.verifiedColor};
      --veritas-false-color: ${VERITAS_VARS.falseColor};
      --veritas-glow-cyan: ${VERITAS_VARS.glowCyan};
      --veritas-glow-gold: ${VERITAS_VARS.glowGold};
    }
    
    /* Low value content styling */
    .veritas-low-value {
      opacity: var(--veritas-low-value-opacity) !important;
      transition: opacity 0.3s ease;
    }
    
    .veritas-low-value:hover {
      opacity: 1 !important;
    }
    
    /* Fallacy highlighting */
    .veritas-fallacy {
      outline: 2px solid var(--veritas-fallacy-color) !important;
      outline-offset: 2px;
      position: relative;
      transition: outline 0.2s ease;
    }
    
    /* Verified facts */
    .veritas-verified {
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 215, 0, 0.2) 50%,
        transparent 100%
      ) !important;
      border-bottom: 2px solid var(--veritas-verified-color) !important;
      position: relative;
    }
    
    /* False claims */
    .veritas-false {
      text-decoration: line-through !important;
      text-decoration-color: var(--veritas-false-color) !important;
      text-decoration-thickness: 2px !important;
      opacity: 0.7;
      position: relative;
    }
    
    /* Hover highlight */
    .veritas-highlight {
      background: rgba(0, 240, 255, 0.1) !important;
      cursor: pointer;
    }
    
    /* === TEXT-LEVEL HIGHLIGHTING (NEW) === */
    
    /* Verified fact text - Green highlight + underline */
    .veritas-verified-text {
      background: linear-gradient(
        180deg,
        transparent 0%,
        rgba(16, 185, 129, 0.2) 100%
      );
      border-bottom: 2px solid #10b981;
      padding: 2px 4px;
      border-radius: 2px;
      transition: all 0.2s ease;
      cursor: help;
    }
    
    .veritas-verified-text:hover {
      background: rgba(16, 185, 129, 0.3);
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
    }
    
    /* False claim text - Red strikethrough */
    .veritas-false-text {
      text-decoration: line-through;
      text-decoration-color: #ef4444;
      text-decoration-thickness: 2px;
      background: rgba(239, 68, 68, 0.15);
      padding: 2px 4px;
      border-radius: 2px;
      opacity: 0.85;
      cursor: help;
      transition: all 0.2s ease;
    }
    
    .veritas-false-text:hover {
      background: rgba(239, 68, 68, 0.25);
      opacity: 1;
    }
    
    /* Emotional content text - Red highlight */
    .veritas-emotional-text {
      background: rgba(239, 68, 68, 0.2);
      border-bottom: 2px dashed #ef4444;
      padding: 2px 4px;
      border-radius: 2px;
      cursor: help;
      transition: all 0.2s ease;
    }
    
    .veritas-emotional-text:hover {
      background: rgba(239, 68, 68, 0.3);
      box-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
    }
    
    /* Logical fallacy text - Blue highlight */
    .veritas-fallacy-text {
      background: rgba(59, 130, 246, 0.2);
      border-bottom: 2px dotted #3b82f6;
      padding: 2px 4px;
      border-radius: 2px;
      cursor: help;
      transition: all 0.2s ease;
    }
    
    .veritas-fallacy-text:hover {
      background: rgba(59, 130, 246, 0.3);
      box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
    }
    
    /* Pulse animation for visibility */
    @keyframes veritasPulse {
        0% {
            transform: scale(1);
            opacity: 1;
        }
        50% {
            transform: scale(1.02);
            opacity: 0.8;
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }

    /* Verification highlight animation */
    @keyframes veritas-highlight-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; box-shadow: 0 0 20px currentColor; }
    }

    /* Thinking dots animation */
    .veritas-thinking-dots:after {
      content: '.';
      animation: veritas-dots 1.5s steps(5, end) infinite;
    }

    @keyframes veritas-dots {
      0%, 20% { content: '.'; }
      40% { content: '..'; }
      60% { content: '...'; }
      80%, 100% { content: ''; }
    }
  `

    document.head.appendChild(style)
    console.log("[DOM-PAINTER] ✅ Veritas styles injected successfully")
}

/**
 * Apply low-value styling to an element
 * Layer 1: Velox Analysis
 */
export function markAsLowValue(
    xpath: string,
    reason: NoiseType
): boolean {
    const element = resolveXPath(xpath)
    if (!element) {
        console.warn("Low value element not found:", xpath)
        return false
    }

    element.classList.add("veritas-low-value")
    element.setAttribute("data-veritas-low-value", reason)

    return true
}

/**
 * Apply fallacy highlighting to an element
 * Layer 1: Velox Analysis
 */
export function markAsFallacy(xpath: string, fallacyType: FallacyType, explanation: string, text?: string): boolean {
    console.log(`[DOM-PAINTER] 🎯 markAsFallacy called:`)
    console.log(`[DOM-PAINTER]   - XPath: ${xpath}`)
    console.log(`[DOM-PAINTER]   - Type: ${fallacyType}`)
    console.log(`[DOM-PAINTER]   - Has text fallback: ${!!text}`)

    let element: HTMLElement | null = null

    // Try XPath first
    if (xpath) {
        const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
        element = result.singleNodeValue as HTMLElement

        if (element) {
            console.log(`[DOM-PAINTER] ✅ Found element via XPath`)
        } else {
            console.warn(`[DOM-PAINTER] ⚠️ XPath resolution failed: "${xpath}"`)
        }
    }

    // Fallback: Try to find by text if XPath fails
    if (!element && text) {
        console.log(`[DOM-PAINTER] 🔍 Attempting text fallback: "${text.substring(0, 30)}..."`)
        const { findElementByText } = require("./xpath-utils")
        element = findElementByText(text)

        if (element) {
            console.log(`[DOM-PAINTER] ✅ Found element via text fallback`)
        }
    }

    if (!element) {
        console.error(`[DOM-PAINTER] ❌ FALLACY ELEMENT NOT FOUND!`)
        console.error(`[DOM-PAINTER]   - XPath failed: ${xpath}`)
        console.error(`[DOM-PAINTER]   - Text fallback failed: ${text ? text.substring(0, 50) : 'N/A'}`)
        console.error(`[DOM-PAINTER]   - Fallacy type: ${fallacyType}`)
        console.error(`[DOM-PAINTER]   - This fallacy will NOT be visible to user!`)
        return false
    }

    // Apply styling
    element.classList.add("veritas-fallacy")
    element.setAttribute("data-veritas-fallacy", fallacyType)
    element.setAttribute("data-veritas-explanation", explanation)
    console.log(`[DOM-PAINTER] 🎨 Applied fallacy class and attributes`)
    console.log(`[DOM-PAINTER]   - Element: ${element.tagName}`)
    console.log(`[DOM-PAINTER]   - Classes: ${element.className}`)

    // Inject warning badge (Shadow DOM for isolation)
    injectFallacyBadge(element, fallacyType)
    console.log(`[DOM-PAINTER] 🏷️ Injected fallacy badge`)

    return true
}

/**
 * Apply verification status to a claim
 * Layer 2: Veritas Analysis
 */
/**
 * Enhanced verification display with confidence badges and tooltips
 * Supports different styles for:
 * - Verified Facts (Green/Gold)
 * - False Claims (Strikethrough/Red)
 * - Emotional/Subjective (Red Highlight)
 * - Logical Fallacies (Blue Highlight)
 */
export function enhanceVerificationDisplay(
    xpath: string,
    data: {
        status: string
        confidence: number
        evidence: Array<{ source: string; url: string; snippet: string }>
        reasoning: string
        type?: string // 'fact', 'emotion', 'logic'
    }
) {
    const element = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
    ).singleNodeValue as HTMLElement

    if (!element) return

    // Base style
    element.style.position = "relative"
    element.style.transition = "all 0.3s ease"
    element.style.cursor = "help"
    element.setAttribute("data-veritas-processed", "true")

    // Determine style based on status and type
    if (data.status === "verified") {
        // Verified Fact: Green/Gold highlight
        element.style.backgroundColor = "rgba(16, 185, 129, 0.15)" // Green tint
        element.style.borderBottom = "2px solid #10b981"
    } else if (data.status === "false") {
        // False Claim: Strikethrough + Red
        element.style.textDecoration = "line-through"
        element.style.textDecorationColor = "#ef4444"
        element.style.textDecorationThickness = "2px"
        element.style.backgroundColor = "rgba(239, 68, 68, 0.1)"
    } else if (data.type === "emotion") {
        // Emotional Content: Red Highlight
        element.style.backgroundColor = "rgba(239, 68, 68, 0.15)"
        element.style.borderBottom = "2px dashed #ef4444"
    } else if (data.type === "logic") {
        // Logical Fallacy: Blue Highlight
        element.style.backgroundColor = "rgba(59, 130, 246, 0.15)"
        element.style.borderBottom = "2px dotted #3b82f6"
    } else {
        // Default/Unverifiable: Yellow/Orange
        element.style.backgroundColor = "rgba(245, 158, 11, 0.15)"
        element.style.borderBottom = "2px solid #f59e0b"
    }

    // Add confidence badge
    if (data.confidence >= 0.7) {
        injectConfidenceBadge(element, data.confidence, data.status as VerificationStatus)
    }

    // Add evidence tooltip
    if (data.evidence && data.evidence.length > 0) {
        injectEvidenceTooltip(element, data.evidence, data.reasoning)
    }

    element.title = data.reasoning // Simple tooltip fallback
    element.setAttribute("data-veritas-reasoning", data.reasoning)

    return true
}
/**
 * Inject confidence badge showing verification certainty
 */
function injectConfidenceBadge(
    element: Element,
    confidence: number,
    status: VerificationStatus
): void {
    const badgeId = `veritas-confidence-${Math.random().toString(36).substr(2, 9)}`

    const host = document.createElement("span")
    host.id = badgeId
    host.style.cssText = `
        position: absolute;
        right: -10px;
        top: -10px;
        z-index: 9999;
    `

    const shadow = host.attachShadow({ mode: "open" })

    const badge = document.createElement("div")
    const bgColor = status === "verified" ? VERITAS_VARS.verifiedColor : VERITAS_VARS.falseColor
    const percentage = Math.round(confidence * 100)

    badge.style.cssText = `
        min-width: 32px;
        height: 24px;
        background: ${bgColor};
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: bold;
        color: #000;
        padding: 0 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        cursor: help;
    `
    badge.textContent = `${percentage}%`
    badge.title = `Confidence: ${percentage}%`

    shadow.appendChild(badge)

    const position = window.getComputedStyle(element).position
    if (position === "static") {
        (element as HTMLElement).style.position = "relative"
    }

    element.appendChild(host)
}

/**
 * Inject evidence tooltip preview
 */
function injectEvidenceTooltip(
    element: Element,
    evidence: Array<{ source: string; url: string; snippet: string }>,
    reasoning: string
): void {
    const tooltipId = `veritas-tooltip-${Math.random().toString(36).substr(2, 9)}`

    element.setAttribute("data-veritas-tooltip-id", tooltipId)

    // Add hover event to show tooltip
    element.addEventListener("mouseenter", () => {
        showEvidenceTooltip(element, evidence, reasoning, tooltipId)
    })

    element.addEventListener("mouseleave", () => {
        hideEvidenceTooltip(tooltipId)
    })
}

/**
 * Show evidence tooltip
 */
function showEvidenceTooltip(
    element: Element,
    evidence: Array<{ source: string; url: string; snippet: string }>,
    reasoning: string,
    tooltipId: string
): void {
    // Remove existing tooltip if any
    hideEvidenceTooltip(tooltipId)

    const rect = element.getBoundingClientRect()
    const tooltip = document.createElement("div")
    tooltip.id = tooltipId
    tooltip.style.cssText = `
        position: fixed;
        left: ${rect.left}px;
        top: ${rect.bottom + 10}px;
        max-width: 400px;
        background: #1a1a2e;
        color: #fff;
        padding: 12px;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
        z-index: 999999;
        font-size: 13px;
        line-height: 1.4;
        pointer-events: none;
    `

    const content = `
        <div style="font-weight: bold; margin-bottom: 8px; color: ${VERITAS_VARS.verifiedColor};">
            Evidence (${evidence.length} sources)
        </div>
        <div style="margin-bottom: 8px; font-size: 12px; opacity: 0.9;">
            ${reasoning}
        </div>
        <div style="font-size: 11px; opacity: 0.7;">
            ${evidence.slice(0, 2).map(e => `
                <div style="margin-top: 4px;">
                    📎 <a href="${e.url}" style="color: #00F0FF;" target="_blank">${e.source}</a>
                </div>
            `).join('')}
        </div>
    `

    tooltip.innerHTML = content
    document.body.appendChild(tooltip)
}

/**
 * Hide evidence tooltip
 */
function hideEvidenceTooltip(tooltipId: string): void {
    const existing = document.getElementById(tooltipId)
    if (existing) {
        existing.remove()
    }
}

/**
 * Inject a fallacy warning badge using Shadow DOM
 */
function injectFallacyBadge(element: Element, fallacyType: FallacyType): void {
    const badgeId = `veritas-badge-${Math.random().toString(36).substr(2, 9)}`

    // Create shadow host
    const host = document.createElement("span")
    host.id = badgeId
    host.style.cssText = `
    position: absolute;
    right: -8px;
    top: -8px;
    z-index: 9999;
  `

    // Attach shadow DOM
    const shadow = host.attachShadow({ mode: "open" })

    // Create badge content
    const badge = document.createElement("div")
    badge.style.cssText = `
    width: 20px;
    height: 20px;
    background: ${VERITAS_VARS.fallacyColor};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    color: white;
    cursor: help;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  `
    badge.textContent = "!"
    badge.title = fallacyType

    shadow.appendChild(badge)

    // Position relative if not already
    const position = window.getComputedStyle(element).position
    if (position === "static") {
        (element as HTMLElement).style.position = "relative"
    }

    element.appendChild(host)
}

/**
 * Wrap specific text within an element with a span
 * Used for precise highlighting without breaking layout
 */
export function wrapText(
    element: Element,
    searchText: string,
    className: string
): boolean {
    const textNodes = getAllTextNodes(element)

    for (const textNode of textNodes) {
        const text = textNode.textContent || ""
        const index = text.indexOf(searchText)

        if (index !== -1) {
            const range = document.createRange()
            range.setStart(textNode, index)
            range.setEnd(textNode, index + searchText.length)

            const wrapper = document.createElement("span")
            wrapper.className = className

            try {
                range.surroundContents(wrapper)
                return true
            } catch (error) {
                console.warn("Failed to wrap text:", error)
                return false
            }
        }
    }

    return false
}

/**
 * Add hover interactivity to an element
 * Enables holographic card display
 */
export function makeInteractive(
    xpath: string,
    onHover: (xpath: string) => void,
    onLeave: () => void,
    onClick?: (xpath: string) => void
): boolean {
    const element = resolveXPath(xpath)
    if (!element) {
        return false
    }

    element.classList.add("veritas-highlight")

    element.addEventListener("mouseenter", () => onHover(xpath))
    element.addEventListener("mouseleave", onLeave)

    if (onClick) {
        element.addEventListener("click", (e) => {
            e.preventDefault()
            e.stopPropagation()
            onClick(xpath)
        })
            ; (element as HTMLElement).style.cursor = "pointer"
    }

    return true
}

/**
 * Remove all Veritas modifications from the page
 * Cleanup function
 */
export function cleanupPage(): void {
    // Remove all Veritas classes
    const elements = document.querySelectorAll(
        ".veritas-low-value, .veritas-fallacy, .veritas-verified, .veritas-false, .veritas-highlight"
    )

    elements.forEach((el) => {
        el.classList.remove(
            "veritas-low-value",
            "veritas-fallacy",
            "veritas-verified",
            "veritas-false",
            "veritas-highlight"
        )

        // Remove data attributes
        el.removeAttribute("data-veritas-low-value")
        el.removeAttribute("data-veritas-fallacy")
        el.removeAttribute("data-veritas-explanation")
        el.removeAttribute("data-veritas-status")
        el.removeAttribute("data-veritas-evidence")
    })

    // Remove badges
    const badges = document.querySelectorAll("[id^='veritas-badge-']")
    badges.forEach((badge) => badge.remove())

    // Remove global styles
    const globalStyles = document.getElementById("veritas-global-styles")
    if (globalStyles) {
        globalStyles.remove()
    }
}

/**
 * Get the current paint state of an element
 */
export function getElementState(xpath: string): {
    isLowValue: boolean
    isFallacy: boolean
    isVerified: boolean
    isFalse: boolean
    fallacyType?: FallacyType
    explanation?: string
    text?: string
} | null {
    const element = resolveXPath(xpath)
    if (!element) {
        return null
    }

    return {
        isLowValue: element.classList.contains("veritas-low-value"),
        isFallacy: element.classList.contains("veritas-fallacy"),
        isVerified: element.classList.contains("veritas-verified"),
        isFalse: element.classList.contains("veritas-false"),
        fallacyType: element.getAttribute("data-veritas-fallacy") as FallacyType | undefined,
        explanation: element.getAttribute("data-veritas-explanation") || undefined,
        text: element.textContent || undefined
    }
}
