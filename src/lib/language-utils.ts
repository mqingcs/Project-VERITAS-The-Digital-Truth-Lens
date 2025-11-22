/**
 * Language Instruction Generator
 * Enforces strict output language for AI agents.
 */

export type OutputLanguage = "English" | "Chinese"

export function getLanguageInstruction(language: OutputLanguage = "English"): string {
    if (language === "Chinese") {
        return `
CRITICAL INSTRUCTION: OUTPUT LANGUAGE MUST BE CHINESE (SIMPLIFIED)
- You MUST translate your entire response into Simplified Chinese (简体中文).
- All explanations, reasoning, summaries, and descriptions MUST be in Chinese.
- Do NOT output English unless it is a proper noun, code, or a direct quote that should not be translated.
- If the source text is English, you MUST translate the analysis into Chinese.
- This instruction overrides all previous language instructions.
`
    } else {
        return `
CRITICAL INSTRUCTION: OUTPUT LANGUAGE MUST BE ENGLISH
- You MUST provide your response in English.
- If the source text is in another language, translate your analysis into English.
- This instruction overrides all previous language instructions.
`
    }
}
