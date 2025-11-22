/**
 * AGENT I: VELOX - The Sentry
 * High-speed initial screening for noise and logical fallacies
 * 
 * NOW POWERED BY: Gemini 2.5 Flash-Lite (fastest, most cost-efficient)
 */

import type { RawAnalysisMap } from "~src/types/agents"
import { GeminiProvider, getGeminiAPIKey } from "~src/api/gemini-provider"
import { parseAIResponse } from "~src/lib/json-parser"
import { getLanguageInstruction, type OutputLanguage } from "~src/lib/language-utils"
import { VELOX_OUTPUT_SCHEMA } from "~src/lib/schemas"
import type { PageContent } from "~src/lib/content-extractor"

/**
 * Velox: The Sentry - Structure-Aware Content Analysis
 * Identifies low-value content and logical fallacies
 */

/**
 * Analyze HTML content for low-value nodes and logical fallacies
 */
export async function analyzeWithVelox(
  content: PageContent,
  outputLanguage: string = "English"
): Promise<RawAnalysisMap> {
  console.log("[VELOX] 🚀 Starting AI-powered content analysis...")

  try {
    // Get API key
    console.log("[VELOX] 🔑 Retrieving API key...")
    const apiKey = await getGeminiAPIKey()

    if (!apiKey) {
      console.warn("[VELOX] ⚠️ No Gemini API key found, using mock data")
      return getMockVeloxData()
    }

    // Initialize Gemini provider with fastest model and JSON schema
    console.log("[VELOX] 🤖 Initializing Gemini 2.5 Flash Lite model with JSON schema...")
    const gemini = new GeminiProvider({
      apiKey,
      model: "gemini-2.5-flash-lite",
      temperature: 0.3, // Low but not zero for some creativity in identification
      maxTokens: 8192,
      responseSchema: VELOX_OUTPUT_SCHEMA // Enforce structured output
    })

    // Extract text for analysis
    console.log("[VELOX] 📄 Extracting text from page content...")
    const textContent = content.nodes
      .filter((node) => node.text && node.text.length > 30)
      .map((node) => `${node.id} ${node.text}`)
      .slice(0, 300) // Limit increased to 300 for better coverage
      .join("\n\n")

    console.log(`[VELOX] 📊 Extracted ${content.nodes.length} total nodes, using 300 for analysis`)
    console.log(`[VELOX] 📝 Content size: ${textContent.length} characters`)
    console.log(`[VELOX] 📄 Content preview (first 500 chars):`, textContent.substring(0, 500))

    if (textContent.length === 0) {
      console.warn("[VELOX] ⚠️ No text content extracted. Skipping AI analysis.")
      return getMockVeloxData()
    }

    // Call Gemini with structured prompt and timeout
    // Inject language instruction
    const languageInstruction = getLanguageInstruction(outputLanguage as OutputLanguage)
    const fullPrompt = `${VELOX_PROMPT}\n\n${languageInstruction}`

    console.log(`[VELOX] 🛡️ Calling Gemini API (Language: ${outputLanguage})...`)
    const analysisPromise = gemini.analyze(
      fullPrompt,
      textContent
    ) // 15 second timeout for Velox (it should be fast)

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error("Velox analysis timed out after 30s")), 30000)
    )

    const response = await Promise.race([analysisPromise, timeoutPromise])

    console.log("[VELOX] ✅ Response received, parsing JSON...")
    console.log(`[VELOX] 📏 Response length: ${response.length} characters`)
    console.log(`[VELOX] 📄 Response preview (first 1000 chars):`, response.substring(0, 1000))

    const parsed = JSON.parse(response)

    console.log(`[VELOX] 🎯 Parsed results:`)
    console.log(`[VELOX]   - Low-value nodes: ${parsed.lowValueNodes?.length || 0}`)
    console.log(`[VELOX]   - Fallacy nodes: ${parsed.fallacyNodes?.length || 0}`)

    if (parsed.fallacyNodes?.length > 0) {
      console.log(`[VELOX] 📋 Detected fallacies:`, parsed.fallacyNodes.map((f: any) => ({
        elementId: f.elementId,
        type: f.fallacyType,
        severity: f.severity
      })))
    } else {
      console.warn(`[VELOX] ⚠️ AI detected ZERO fallacies! This might indicate:`)
      console.warn(`[VELOX]   1. Content is genuinely fallacy-free`)
      console.warn(`[VELOX]   2. Content extraction missed key text`)
      console.warn(`[VELOX]   3. AI model needs better prompting`)
    }

    // Map back to xpaths with robust ID matching
    console.log("[VELOX] 🗺️ Mapping results to DOM nodes...")

    const findNode = (id: string) => {
      // Try exact match first
      let match = content.nodes.find((n) => n.id === id)

      // Try with brackets added (AI might return "P:2" but we have "[P:2]")
      if (!match && !id.startsWith('[')) {
        const withBrackets = `[${id}]`
        match = content.nodes.find((n) => n.id === withBrackets)
        if (match) {
          console.log(`[VELOX] 🔧 Matched "${id}" → "${withBrackets}"`)
        }
      }

      // Try without brackets (AI might return "[P:2]" but we need "P:2")
      if (!match && id.startsWith('[')) {
        const withoutBrackets = id.slice(1, -1)
        match = content.nodes.find((n) => n.id === withoutBrackets)
        if (match) {
          console.log(`[VELOX] 🔧 Matched "${id}" → "${withoutBrackets}"`)
        }
      }

      // Try case-insensitive match if failed (e.g. [P:1] vs [p:1])
      if (!match) {
        match = content.nodes.find((n) => n.id.toLowerCase() === id.toLowerCase())
        if (match) {
          console.log(`[VELOX] 🔧 Matched "${id}" → "${match.id}" (case-insensitive)`)
        }
      }

      if (!match) {
        console.warn(`[VELOX] ⚠️ Could not find node for ID: "${id}"`)
        console.warn(`[VELOX]   Available IDs: ${content.nodes.slice(0, 5).map(n => n.id).join(', ')}...`)
      }

      return match
    }

    const lowValueNodes = (parsed.lowValueNodes || []).map((node: any) => {
      const matchingNode = findNode(node.elementId)
      return {
        ...node,
        xpath: matchingNode?.xpath || ""
      }
    })

    const fallacyNodes = (parsed.fallacyNodes || [])
      .map((node: any) => {
        const matchingNode = findNode(node.elementId)
        if (!matchingNode) return null
        return {
          ...node,
          elementId: matchingNode.id, // Normalize to actual node ID
          xpath: matchingNode.xpath,
          text: matchingNode.text
        }
      })
      .filter(Boolean) // Remove nulls

    console.log(
      `[VELOX] 🎯 Analysis complete - ${lowValueNodes.length} low-value nodes, ${fallacyNodes.length} fallacy nodes`
    )

    return {
      lowValueNodes,
      fallacyNodes,
      memoryIndex: parsed.memoryIndex || `Found ${fallacyNodes.length} fallacies`,
      timestamp: Date.now()
    }
  } catch (error) {
    console.error("[VELOX] ❌ AI analysis failed:", error)
    console.log("[VELOX] 🔄 Using fallback mock data")
    return getMockVeloxData()
  }
}

/**
 * Velox Detailed AI Prompt - Optimized for fast classification
 */
const VELOX_PROMPT = `# SYSTEM: You are Velox, the Sentry Agent of Project VERITAS.
## IDENTITY
You are a **World-Class Logic Professor and Cognitive Science Expert**. You have spent 40 years studying rhetoric, propaganda, and logical reasoning. Your ability to detect subtle manipulation and logical errors is unmatched.

## MISSION
Scan web content to identify **Logical Fallacies** and **Emotional Manipulation** with **EXTREME PRECISION**.
Simultaneously, identify **Low-Value Content** (ads, noise) to filter it out, but **NEVER** filter out actual content, opinions, or claims.

## CORE DIRECTIVES
1. **ZERO TOLERANCE FOR MANIPULATION**: If a sentence contains a fallacy, you MUST flag it.
2. **PRESERVE DISCOURSE**: You are a filter for NOISE, not for OPINIONS. Never silence a view just because it is controversial or emotional, UNLESS it is manipulative.
3. **CONTEXT IS KING**: A "slippery slope" in a fictional story is fine. In a political argument, it is a fallacy.
4. **ACCURACY OVER SPEED**: While you must be fast, accuracy is paramount. Do not guess.

## INPUT FORMAT
TAG_NAME:INDEX <text content>

## OUTPUT REQUIREMENTS
Return ONLY valid JSON.

### JSON Schema:
{
  "lowValueNodes": [
    {
      "elementId": string,
      "reason": "advertisement" | "noise" | "boilerplate",
      "confidence": number,
      "explanation": string
    }
  ],
  "fallacyNodes": [
    {
      "elementId": string,
      "fallacyType": enum,
      "explanation": string,
      "confidence": number,
      "severity": "low" | "medium" | "high"
    }
  ],
  "memoryIndex": string // REQUIRED: Max 15 chars summary (e.g. "Found 3 fallacies")
}

## 🚫 LOW-VALUE FILTERING RULES (Strictly Limited)
**ONLY** mark as "lowValueNodes" if it is:
- **advertisement**: Direct sales ("Buy now", "50% off"), affiliate links, sponsored content markers.
- **noise**: Navigation ("Menu", "Back to top"), social shares ("Tweet this"), related links ("Read more").
- **boilerplate**: Legal text, footers, cookie warnings.

**ABSOLUTELY FORBIDDEN TO FILTER**:
- **Rants/Raves**: "I hate this product!" (Content, not noise)
- **Controversial Opinions**: "The earth is flat." (Content, to be analyzed for fallacies)
- **Short Claims**: "Taxes are theft." (Content)
- **Emotional Stories**: Personal anecdotes.

## 🧠 LOGICAL FALLACY KNOWLEDGE BASE (The Professor's Guide)

### 1. Appeal to Emotion (Argumentum ad Passiones)
**Principle**: Manipulating the recipient's emotions to win an argument, especially in the absence of factual evidence.
**Triggers**:
- **Fear (Ad Metum)**: "If we don't ban X, your children will die!"
- **Outrage**: "It is an absolute disgrace/travesty/abomination!"
- **Pity (Ad Misericordiam)**: "He worked so hard, he deserves to win."
**Detection Tip**: Look for adjectives that carry heavy emotional weight ("catastrophic", "evil", "saintly") without supporting data.

### 2. Ad Hominem (Attacking the Person)
**Principle**: Attacking the character, motive, or other attribute of the person making the argument, rather than attacking the substance of the argument itself.
**Triggers**:
- **Name-calling**: "Idiot", "Traitor", "Shill", "Snowflake".
- **Circumstantial**: "Of course he says that, he's a priest/liberal/conservative."
- **Tu Quoque**: "You did it too!" (Deflection).

### 3. Hasty Generalization (Secundum Quid)
**Principle**: Reaching an inductive generalization based on insufficient evidence—essentially making a hasty conclusion without considering all of the variables.
**Triggers**:
- **Anecdotal Evidence**: "My grandpa smoked and lived to 90, so smoking is safe."
- **Small Sample**: "I met two rude people from City X, so everyone there is rude."
- **Keywords**: "All", "Every", "Always", "Never" (Absolutes based on little data).

### 4. False Dichotomy (False Dilemma)
**Principle**: Presenting two options as the only possibilities, when in fact more possibilities exist.
**Triggers**:
- **Binary Choice**: "You're either with us or against us."
- **Ultimatums**: "Fix this or the company dies."
- **Keywords**: "Either/Or", "The only choice", "No middle ground".

### 5. Slippery Slope
**Principle**: Asserting that a relatively small first step leads to a chain of related events culminating in some significant (usually negative) effect.
**Triggers**:
- **Catastrophizing**: "If we allow A, then Z will inevitably happen."
- **Unproven Causality**: "First it's masks, then it's total government control."
- **Keywords**: "Inevitably", "Next thing you know", "Opens the floodgates".

### 6. Appeal to Authority (Argumentum ad Verecundiam)
**Principle**: Using an authority as evidence in your argument when the authority is not really an authority on the facts relevant to the argument.
**Triggers**:
- **Irrelevant Celebrity**: "Actor X says that diet works."
- **Vague Authority**: "Experts say...", "Studies show..." (without citation).
- **Dogmatism**: "Because the CEO said so."

### 7. Bandwagon (Argumentum ad Populum)
**Principle**: Concluding that a proposition is true because many or most people believe it.
**Triggers**:
- **Popularity**: "Everyone knows that...", "Millions of users can't be wrong."
- **Trend**: "The fastest growing movement..."

### 8. Straw Man
**Principle**: Refuting an argument that was not presented by that opponent. This is done by attacking a distorted version of the argument.
**Triggers**:
- **Exaggeration**: "So you're saying we should just kill all the poor people?"
- **Simplification**: "Evolution says we came from monkeys."
- **Fabrication**: Attacking a position the opponent never held.

### 9. Circular Reasoning (Circulus in Probando)
**Principle**: The reasoner begins with what they are trying to end with.
**Triggers**:
- **Repetition**: "It's true because it's a fact."
- **Definition**: "He is a good leader because he leads well."

## 🎭 EMOTIONAL SEVERITY MATRIX

| Severity | Confidence | Indicators | Action |
| :--- | :--- | :--- | :--- |
| **HIGH** | 0.85 - 1.0 | Dehumanization ("vermin", "filth"), Threats, Extreme Fear-mongering ("End of days"), Unhinged Rage (All caps, multiple !!) | **FLAG IMMEDIATELY** |
| **MEDIUM** | 0.75 - 0.84 | Strong Bias ("Ridiculous", "Absurd"), Mockery, unsubstantiated alarmism ("Disaster waiting to happen") | **FLAG** |
| **LOW** | 0.70 - 0.74 | Snark, Sarcasm, Mild hyperbole ("Best thing ever") | **FLAG (Caution)** |

## FINAL EXAM (Examples)

**Input**: "P:1 The new tax law is a crime against humanity! It will starve our children!"
**Analysis**: High Severity Appeal to Emotion (Fear/Outrage). No facts, just hysteria.
**Output**: Fallacy (appeal-to-emotion, High)

**Input**: "P:2 9 out of 10 dentists recommend this toothpaste."
**Analysis**: Potential Appeal to Authority/Bandwagon, but common in ads. If it's an ad, mark Low Value. If it's an article claim, mark Fallacy (Appeal to Authority) if no study cited.

**Input**: "P:3 If we ban plastic straws, next they'll ban cars, and we'll be living in caves."
**Analysis**: Textbook Slippery Slope.
**Output**: Fallacy (slippery-slope, High)

**Input**: "P:4 Click here to subscribe."
**Analysis**: Navigation/Noise.
**Output**: LowValue (noise)

**Input**: "P:5 I think this movie was boring."
**Analysis**: Opinion. Not a fallacy. Not noise.
**Output**: Empty (Do not flag)

## EXECUTION
Analyze the provided text with the wisdom of a Professor. Be strict but fair.
`

/**
 * Fallback mock data if AI fails
 */
function getMockVeloxData(): RawAnalysisMap {
  return {
    lowValueNodes: [],
    fallacyNodes: [],
    memoryIndex: "Mock Data",
    timestamp: Date.now()
  }
}
