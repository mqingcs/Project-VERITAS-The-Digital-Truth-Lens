/**
 * AGENT II: RATIO - The Analyst  
 * Entropy reduction and fact extraction
 * 
 * NOW POWERED BY: Gemini 2.5 Flash (balanced model with strong reasoning)
 */

import type { FactJSON, RawAnalysisMap } from "~src/types/agents"
import { GeminiProvider, getGeminiAPIKey } from "~src/api/gemini-provider"
import { parseAIResponse } from "~src/lib/json-parser"
import { RATIO_OUTPUT_SCHEMA } from "~src/lib/schemas"

/**
 * Extract facts, claims, and entities from HTML content
 * Uses Velox's filtered results to focus on high-value content
 */
import type { PageContent } from "~src/lib/content-extractor"

/**
 * Extract facts, claims, and entities from HTML content
 * Uses Velox's filtered results to focus on high-value content
 */
import { type OutputLanguage } from "~src/lib/language-utils"

/**
 * Extract facts, claims, and entities from HTML content
 * Uses Velox's filtered results to focus on high-value content
 */
export async function analyzeWithRatio(
  content: PageContent,
  veloxData: RawAnalysisMap,
  outputLanguage: OutputLanguage = "English"
): Promise<FactJSON> {
  console.log("[RATIO] 🚀 Starting AI-powered fact extraction...")

  try {
    // Get API key
    console.log("[RATIO] 🔑 Retrieving API key...")
    const apiKey = await getGeminiAPIKey()

    if (!apiKey) {
      console.warn("[RATIO] ⚠️ No Gemini API key found, using mock data")
      return getMockRatioData()
    }

    // Initialize Gemini provider with balanced model and JSON schema
    console.log("[RATIO] 🤖 Initializing Gemini 2.5 Flash model with JSON schema...")
    const gemini = new GeminiProvider({
      apiKey,
      model: "gemini-2.5-flash",
      temperature: 0.2, // Very low for factual extraction
      maxTokens: 32768, // INCREASED: Prevent truncation with Chinese content
      responseSchema: RATIO_OUTPUT_SCHEMA // Enforce structured output
    })

    // Extract and filter content
    console.log("[RATIO] 📄 Filtering high-value text (removing Velox low-value nodes)...")
    const textContent = extractHighValueText(content, veloxData)
    console.log(`[RATIO] 📝 High-value content size: ${textContent.length} characters`)

    if (textContent.length === 0) {
      console.warn("[RATIO] ⚠️ No text content extracted. Skipping AI analysis.")
      return getMockRatioData()
    }

    // CRITICAL: Ratio should PRESERVE the original language of the content
    // Do NOT translate - if input is English, output English claims
    // If input is Chinese, output Chinese claims
    // This ensures search queries use the correct language
    const languagePreservationInstruction = `
⚠️ CRITICAL LANGUAGE INSTRUCTION ⚠️
- You MUST preserve the ORIGINAL LANGUAGE of the input text
- If the input text is in English, output your JSON with English text
- If the input text is in Chinese, output your JSON with Chinese text
- DO NOT translate content from one language to another
- This ensures accurate search and verification downstream
`
    const fullPrompt = `${RATIO_PROMPT}\n\n${languagePreservationInstruction}`

    // DEBUG: Log sample of input content
    console.log(`[RATIO] 🔍 Input content sample (first 500 chars):\n${textContent.substring(0, 500)}...`)

    // Call Gemini with structured prompt and timeout
    console.log(`[RATIO] 🌐 Calling Gemini API (120s timeout) - PRESERVING original language...`)
    const analysisPromise = gemini.analyze(fullPrompt, textContent)

    // 120 second timeout for Ratio (complex pages need more time)
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error("Ratio analysis timed out after 120s")), 120000)
    )

    const response = await Promise.race([analysisPromise, timeoutPromise])
    console.log("[RATIO] ✅ Response received, parsing JSON...")
    console.log(`[RATIO] 📏 Response length: ${response.length} characters`)

    // DEBUG: Log actual response if it's short (likely empty or error)
    if (response.length < 500) {
      console.log("[RATIO] 🐛 SHORT RESPONSE - Full content:", response)
    }

    // Use robust parser instead of direct JSON.parse
    const parsed = parseAIResponse(response, {
      claims: [],
      data: [],
      entities: [],
      summary: "Failed to parse AI response",
      timestamp: Date.now()
    })

    console.log(`[RATIO] ❌ Extraction complete - ${parsed.claims?.length || 0} claims, ${parsed.entities?.length || 0} entities, ${parsed.data?.length || 0} data points`)

    // Helper to find node with robust ID matching (copied from Velox)
    const findNode = (id: string) => {
      // Try exact match first
      let match = content.nodes.find((n) => n.id === id)

      // Try with brackets added (AI might return "P:2" but we have "[P:2]")
      if (!match && !id.startsWith('[')) {
        const withBrackets = `[${id}]`
        match = content.nodes.find((n) => n.id === withBrackets)
        if (match) {
          console.log(`[RATIO] 🔧 Matched "${id}" → "${withBrackets}"`)
        }
      }

      // Try without brackets (AI might return "[P:2]" but we need "P:2")
      if (!match && id.startsWith('[')) {
        const withoutBrackets = id.slice(1, -1)
        match = content.nodes.find((n) => n.id === withoutBrackets)
        if (match) {
          console.log(`[RATIO] 🔧 Matched "${id}" → "${withoutBrackets}"`)
        }
      }

      // Try case-insensitive match if failed (e.g. [P:1] vs [p:1])
      if (!match) {
        match = content.nodes.find((n) => n.id.toLowerCase() === id.toLowerCase())
        if (match) {
          console.log(`[RATIO] 🔧 Matched "${id}" → "${match.id}" (case-insensitive)`)
        }
      }

      if (!match) {
        console.warn(`[RATIO] ⚠️ Could not find node for ID: "${id}"`)
      }

      return match
    }

    // CRITICAL FIX: Don't filter out claims/data without XPaths
    // XPath is optional - Commander may call extract_claims without DOM context
    // Claims are still valuable for semantic analysis even without DOM manipulation
    const enrichedClaims = (parsed.claims || []).map(claim => {
      const node = findNode(claim.elementId)
      return {
        ...claim,
        elementId: node ? node.id : claim.elementId, // Normalize ID if found
        xpath: node ? node.xpath : "" // Empty string is OK
      }
    })

    const enrichedData = (parsed.data || []).map(d => {
      const node = findNode(d.elementId)
      return {
        ...d,
        elementId: node ? node.id : d.elementId, // Normalize ID if found
        xpath: node ? node.xpath : "" // Empty string is OK
      }
    })

    return {
      claims: enrichedClaims,
      data: enrichedData,
      entities: parsed.entities || [],
      summary: parsed.summary || "Analysis incomplete",
      memoryIndex: (parsed as any).memoryIndex || `Extracted ${enrichedClaims.length} claims`,
      timestamp: Date.now()
    }
  } catch (error) {
    console.error("[RATIO] ❌ AI analysis failed:", error)
    console.log("[RATIO] 🔄 Using fallback mock data")
    return getMockRatioData()
  }
}

/**
 * Extract high-value text, filtering out Velox-identified noise
 */
function extractHighValueText(content: PageContent, veloxData: RawAnalysisMap): string {
  const elements: string[] = []

  // Build set of low-value element IDs from Velox
  // Note: Velox returns IDs like "[P:0]", which matches our content.nodes[i].id
  const lowValueIds = new Set(veloxData.lowValueNodes.map(n => n.elementId))

  content.nodes.forEach(node => {
    // Skip if Velox marked as low-value
    if (lowValueIds.has(node.id)) {
      return
    }

    if (node.text && node.text.length > 30) {
      elements.push(`${node.id} ${node.text}`)
    }
  })

  return elements.slice(0, 150).join("\n\n")
}

/**
 * Ratio Detailed AI Prompt - Optimized for fact extraction
 */
const RATIO_PROMPT = `# SYSTEM: You are Ratio, the Analyst Agent of Project VERITAS

## ⚠️ CRITICAL MISSION: EXTRACT, DO NOT JUDGE

**Your ONLY job is to EXTRACT claims, NOT to evaluate their truthfulness.**

Even if you strongly suspect a claim is FALSE or MISLEADING, you MUST extract it. The Veritas agent will verify it later.

### ❌ WRONG APPROACH (DO NOT DO THIS):
- "This content contains misleading information, so I won't extract claims"
- "These statements appear false, so I'll return empty results"
- "This is propaganda/misinformation, I should ignore it"

### ✅ CORRECT APPROACH (DO THIS):
- "I extract ALL statements that sound factual, even if obviously false"
- "Even 'the moon is made of cheese' gets extracted as a factual-statement"
- "My job is extraction, not verification - Veritas handles truth"

**Example of CORRECT behavior**:
Input: "中国在公元前3000年就发明了互联网技术"
Output: ✅ Extract as claim (even though obviously false)

Input: "喝醋可以治愈所有癌症，这是科学界公认的事实"  
Output: ✅ Extract as claim (even though dangerously false)

## MISSION STATEMENT
Extract ONLY factual, verifiable information through entropy reduction. You are a precision instrument that separates signal from noise, fact from opinion, and data from speculation.

## CORE PRINCIPLES
1. **Objectivity is Sacred**: NO opinions, only facts
2. **Verifiability is Required**: Every claim must be checkable
3. **Precision Over Volume**: One perfect fact beats ten vague statements
4. **Context Preservation**: Never lose important qualifiers
5. **Multilingual Intelligence**: Handle Chinese, English, and mixed content seamlessly

## CHINESE TEXT HANDLING ⚠️

**When processing Chinese content:**
- Preserve original Chinese text EXACTLY as written
- Do NOT translate Chinese to English
- Count Chinese punctuation correctly (，。！？)
- Handle Chinese quotes properly (「」『』"")
- Recognize Chinese entity names (人名、地名、机构名)
- Extract numerical data with Chinese units (万、亿、千克、米)

**Example Chinese extraction:**
Input: "毛宁称，叙利亚有55%的人面临粮食不安全"
Claim: { "text": "毛宁称，叙利亚有55%的人面临粮食不安全", "category": "attribution" }

## INPUT FORMAT
You receive high-value text pre-filtered by Velox:
[TAG_NAME:INDEX] <text content>

Example:
[P:0] The FDA approved the drug in March 2024 based on phase 3 trials.
[P:1] 外交部发言人毛宁于7月3日对该新闻正式回应
[H2:2] Economic Impact: GDP Growth Reaches 3.2%

## ⚠️ CRITICAL OUTPUT REQUIREMENTS ⚠️

**YOU MUST RETURN VALID, WELL-FORMED JSON. NO EXCEPTIONS.**

### Mandatory JSON Rules:
1. **All strings MUST be properly escaped**: Use \\" for quotes inside strings
2. **All strings MUST be terminated**: Every opening quote needs a closing quote
3. **All objects MUST be closed**: Every { needs a matching }
4. **All arrays MUST be closed**: Every [ needs a matching ]
5. **Trailing commas are FORBIDDEN**: No comma before } or ]
6. **No line breaks in string values**: Use \\n instead
7. **Numbers must be raw**: Use 0.95, not "0.95"
8. **Booleans must be raw**: Use true/false, not "true"/"false"

### If Content is Too Long:
If you're running out of space, **STOP CLEANLY**:
- Complete the current object/array
- Close all open structures
- DO NOT leave strings unterminated
- Better to return 5 complete claims than 10 broken ones

### ⚠️ OUTPUT LIMITS (STRICTLY ENFORCED) ⚠️

**You MUST respect these limits to ensure complete JSON:**

- **Maximum 15 claims** (quality over quantity)
- **Maximum 15 entities** (focus on key players)
- **Maximum 30 data points** (most important stats/quotes)

**If the content contains more:**
1. Prioritize by importance score
2. Select the most verifiable and significant items
3. Ensure all selected items are COMPLETE
4. Close all JSON structures properly

### JSON Schema:
{
  "claims": [
    {
      "id": string,              // REQUIRED: "claim-1", "claim-2", etc.
      "text": string,            // REQUIRED: The full claim for context (max 200 chars)
      "claimText": string,      // REQUIRED: Precise 10-50 char snippet to highlight
      "elementId": string,       // REQUIRED: Source element e.g., "[P:15]"
      "entities": array,         // REQUIRED: Entity IDs mentioned (may be empty)
      "importance": number,      // REQUIRED: 0.0-1.0 (relevance to page topic)
      "category": enum,          // REQUIRED: see CLAIM CATEGORIES
      "temporal": object | null  // OPTIONAL: Time information if present
    }
  ],
  "data": [
    {
      "type": enum,              // REQUIRED: "statistic" | "date" | "measurement" | "quote"
      "value": string,           // REQUIRED: The actual data value
      "context": string,         // REQUIRED: Brief context (max 100 chars)
      "elementId": string,       // REQUIRED: Source element
      "unit": string | null,     // OPTIONAL: Unit of measurement if applicable
      "source": string | null    // OPTIONAL: Attribution if mentioned
    }
  ],
  "entities": [
    {
      "id": string,              // REQUIRED: "entity-1", "entity-2", etc.
      "name": string,            // REQUIRED: Canonical name
      "type": enum,              // REQUIRED: see ENTITY TYPES
      "mentions": array,         // REQUIRED: All elementIds where mentioned
      "aliases": array,          // OPTIONAL: Alternative names used
      "attributes": object       // OPTIONAL: Key facts about entity
    }
  ],
  "summary": string,           // REQUIRED: 2-3 sentence ultra-compressed essence
  "memoryIndex": string        // REQUIRED: Max 15 chars summary (e.g. "Extracted 5 claims")
}

## CLAIM CATEGORIES (Exhaustive List)
- "factual-statement": Objective fact about the world
- "attribution": Something someone said/wrote
- "prediction": Future-oriented claim
- "comparison": Relative relationship between things
- "causation": X caused Y relationship
- "correlation": X associated with Y (not causal)
- "definition": What something is/means
- "procedure": How something is done

## ENTITY TYPES (Exhaustive List)
- "person": Individual human beings
- "organization": Companies, institutions, governments
- "location": Physical places (cities, countries, buildings)
- "product": Goods, services, software, drugs
- "event": Specific occurrences in time
- "concept": Abstract ideas, theories, methodologies
- "publication": Books, papers, articles, reports

## DATA TYPE RULES

### "statistic":
- Must include numerical value
- Requires context (what it measures)
- Examples: "GDP growth of 3.2%", "500 participants"

### "date":
- Specific temporal points
- Format: ISO 8601 when possible
- Examples: "March 15, 2024", "Q2 2023"

### "measurement":
- Quantified physical measurements
- Must include unit
- Examples: "150 mg dosage", "2.5 meter length"

### "quote":
- Direct statements from sources
- Include speaker attribution
- Use original wording (verbatim if possible)

## EXTRACTION RULES

### CLAIM EXTRACTION:
✓ DO extract:
- Specific, verifiable assertions
- Statements with clear truth values
- Claims that can be checked against evidence

✗ DO NOT extract:
- Opinions without factual basis
- Questions (unless rhetorical claims)
- Obvious truths ("water is wet")
- Author's meta-commentary

### ENTITY EXTRACTION:
✓ DO extract:
- Named entities (proper nouns)
- Significant actors in the narrative
- Referenced organizations/places

✗ DO NOT extract:
- Generic references ("some people", "researchers")
- Pronouns without clear antecedents
- Common nouns unless specific instance

### IMPORTANCE SCORING:
- 0.9-1.0: Core thesis or main finding
- 0.7-0.8: Supporting major points
- 0.5-0.6: Relevant details
- 0.3-0.4: Background context
- 0.0-0.2: Tangential information

## TEMPORAL EXTRACTION

If claim mentions time, include temporal object:
{
  "type": "point" | "range" | "recurring",
  "value": string,           // ISO 8601 or natural language
  "precision": "year" | "month" | "day" | "hour",
  "relative": boolean        // Is it relative to publication?
}

Examples:
- "in March 2024" → {"type": "point", "value": "2024-03", "precision": "month"}
- "between 2020-2023" → {"type": "range", "value": "2020/2023", "precision": "year"}

## ENTITY LINKING

Link entities to claims via entity IDs:
1. Extract all entities first
2. Assign sequential IDs ("entity-1", "entity-2"...)
3. Reference these IDs in claims' "entities" arrays

Example:
\`\`\`json
{
  "entities": [
    {
      "id": "entity-1",
      "name": "FDA",
      "type": "organization"
    }
  ],
  "claims": [
    {
      "id": "claim-1",
      "text": "FDA approved the drug",
      "entities": ["entity-1"]
    }
  ]
}
\`\`\`

## SUMMARY GENERATION RULES

Your summary MUST:
1. Be exactly 2-3 sentences
2. Capture ONLY the core essence
3. Use present tense
4. Be maximally information-dense
5. Avoid meta-language ("This article discusses...")

Template: "[Main actor] [key action/state] [key object/result]. [Supporting detail]. [Implication/significance]."

Example:
"Stanford researchers discovered a new Alzheimer's biomarker in spinal fluid. The marker appears 5 years before symptoms in 89% of cases. This could enable early intervention before irreversible damage."

## CONSTRAINT ENFORCEMENT

CRITICAL: Violations will cause rejection:

1. **Verifiability**:
   - Every claim must be checkable against external evidence
   - If you can't verify it, don't include it

2. **Element ID Matching**:
   - Must exactly match input format ("[P:5]")
   - No modifications, no inventions

3. **No Speculation**:
   - Only extract what is explicitly stated
   - No inferences beyond clear implications

4. **ID Uniqueness**:
   - claim-1, claim-2... (sequential)
   - entity-1, entity-2... (sequential)
   - No duplicates, no skipping numbers

## EXAMPLES

### Example Input:
[P:0] The FDA approved Leqembi in January 2023 for treating Alzheimer's disease.
[P:1] Dr. Maria Santos, lead researcher at Johns Hopkins, stated the drug reduced cognitive decline by 27% in phase 3 trials.
[P:2] The treatment costs approximately $26,500 per year.

### Example Output:
{
  "claims": [
    {
      "id": "claim-1",
      "text": "FDA approved Leqembi for Alzheimer's in January 2023",
      "elementId": "[P:0]",
      "entities": ["entity-1", "entity-2"],
      "importance": 0.95,
      "category": "factual-statement",
      "temporal": {"type": "point", "value": "2023-01", "precision": "month"}
    },
    {
      "id": "claim-2",
      "text": "Leqembi reduced cognitive decline by 27% in phase 3 trials",
      "elementId": "[P:1]",
      "entities": ["entity-2", "entity-3"],
      "importance": 0.90,
      "category": "attribution"
    `



/**
 * Fallback mock data if AI fails
 */
function getMockRatioData(): FactJSON {
  return {
    claims: [],
    data: [],
    entities: [],
    summary: "AI analysis unavailable - using fallback data",
    memoryIndex: "Mock Data",
    timestamp: Date.now()
  }
}
