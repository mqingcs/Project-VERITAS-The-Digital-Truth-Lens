# Project VERITAS

**Nox est norma, Lux per rationem reconstruitur**  
*"Darkness is the norm, Light is reconstructed through reason"*

## Overview

Project VERITAS is a quad-agent browser reality augmentation system powered by **Google Gemini AI** that analyzes, verifies, and augments web content in real-time using a cyberpunk-themed, digital brutalism aesthetic.

### The Four Agents

1.  **Velox** (The Sentry) - `gemini-2.5-flash-lite` - Fastest AI for noise filtering
2.  **Ratio** (The Analyst) - `gemini-2.5-flash` - Balanced AI for fact extraction
3.  **Veritas** (The Investigator) - `gemini-2.5-pro` - Advanced AI with Google Search
4.  **Cursor** (The Painter) - DOM manipulation and visual augmentation

### Core Philosophy

-   **AI-Powered Analysis**: Real Gemini models, not mock data
-   **Technical Nihilism**: Trust nothing by default
-   **Decoupled Architecture**: Cloud APIs now, local WebGPU later
-   **Non-Destructive**: Surgical DOM modifications, full cleanup
-   **Shadow DOM Isolation**: UI components never interfere with host pages

---

## ✨ Features

### Visual Augmentation
- **Neon Halo**: Breathing cyan/gold border animation during analysis
- **In-Page Highlighting**:
  - Low-value content dimmed to 40% opacity
  - Logical fallacies outlined in red with warning badges
  - Verified facts highlighted in gold
  - False claims shown with strikethrough
- **Holographic Cards**: Hover over any highlighted element for detailed analysis

### Interaction
- **Keyboard Activation**: Press `Ctrl+Shift+V` to trigger analysis
- **Deep Dive**: Select text and command the system to investigate further
- **Side Panel**: View full analysis results and knowledge graph

### Architecture
- **Shadow DOM Isolation**: UI components don't interfere with page functionality
- **Non-Destructive Modifications**: All changes are reversible
- **Decoupled API Layer**: Ready for migration from cloud to local WebGPU models

---

## 🚀 Quick Start

### Prerequisites

-   Node.js 18+
-   Chrome/Edge browser
-   **Gemini API key** (free tier available at [Google AI Studio](https://aistudio.google.com/apikey))

### Installation

1.  **Clone and Install**

```bash
cd veritas
npm install
```

2.  **Build the Extension**

```bash
npm run build
# Production build in build/chrome-mv3-prod
```

3.  **Load in Chrome**

    -   Open `chrome://extensions/`
    -   Enable "Developer mode"
    -   Click "Load unpacked"
    -   Select `build/chrome-mv3-prod`

4.  **Configure Gemini API**

    -   Get your free API key from [Google AI Studio](https://aistudio.google.com/apikey)
    -   Click the Veritas extension icon
    -   Go to Settings tab
    -   Paste your API key and click "Save"
    -   Test the connections

---

## 📖 Usage

### Basic Workflow

1.  **Navigate to any web page** (e.g. news article, blog post)

2.  **Activate VERITAS** by pressing:
    ```
    Ctrl + Shift + V
    ```

3.  **Watch the ritual unfold:**
    -   Neon halo appears around viewport
    -   Velox scans for noise and fallacies
    -   Ratio extracts facts
    -   Veritas verifies claims
    -   Cursor paints the results

4.  **Interact with results:**
    -   Hover over highlighted elements for details
    -   Click the extension icon to open the side panel
    -   Select text and issue deep dive commands

---

## 🛠️ Development

### Directory Structure

```
veritas/
├── src/
│   ├── agents/          # AI agent implementations
│   │   ├── velox.ts     # Sentry (fallacy detection)
│   │   ├── ratio.ts     # Analyst (fact extraction)
│   │   └── veritas.ts   # Investigator (verification)
│   ├── api/             # API abstraction layer
│   ├── background/      # Service worker
│   ├── components/      # React UI components
│   │   ├── NeonHalo.tsx
│   │   └── HolographicCard.tsx
│   ├── contents/        # Content scripts
│   │   └── cursor.tsx   # Main content script (Agent IV)
│   ├── lib/             # Utilities
│   │   ├── dom-painter.ts
│   │   ├── xpath-utils.ts
│   │   └── messaging.ts
│   ├── sidepanel/       # Side panel UI
│   ├── store/           # Zustand state management
│   ├── styles/          # CSS
│   └── types/           # TypeScript definitions
```

### Commands

```bash
# Development mode (hot reload)
npm run dev

# Production build
npm run build

# Package extension (.zip)
npm run package
```

```

---

## 🎨 Design Philosophy

### Digital Brutalism
- **Sharp corners**, not rounded
- **High contrast** - black backgrounds, neon accents
- **JetBrains Mono** typography
- **Glitch animations** for state transitions

### Color Palette
- **Cyan**: `#00F0FF` - Primary accent, represents "scanning"
- **Gold**: `#FFD700` - Secondary accent, represents "truth"
- **Red**: `#FF4444` - Fallacies and false claims
- **Black**: `#0a0a0a` - Background

### Interaction Metaphor
Activation is a **ritual**, not just a button click. The Neon Halo represents the system "taking over" your viewport to reveal hidden truth.

---

## 🔬 Technical Details

### How Cursor Paints the DOM

1. **XPath Generation**: Each element gets a unique XPath identifier
2. **CSS Class Injection**: Non-destructive styling via class additions
3. **Shadow DOM Badges**: Warning icons injected in isolated shadow roots
4. **Event Preservation**: Original event listeners remain intact
5. **Cleanup**: All modifications can be reversed with `cleanupPage()`

### State Management

Zustand store manages three data layers:
```typescript
interface VeritasAnalysis {
  velox: RawAnalysisMap    // Layer 1: Noise & Fallacies
  ratio: FactJSON          // Layer 2: Facts & Claims
  veritas: VerifiedGraphData // Layer 3: Verifications
}
```

Each agent's completion triggers painting of its corresponding layer.

### Message Flow

```
Content Script (Cursor)
    ↓ [ANALYZE_PAGE]
Background Worker
    ↓ [calls Velox]
    ← [VELOX_COMPLETE]
Content Script paints Layer 1
    ↓ [calls Ratio]
    ← [RATIO_COMPLETE]
Content Script stores data
    ↓ [calls Veritas]
    ← [VERITAS_COMPLETE]
Content Script paints Layer 2
```

---

## 🚧 Roadmap

### Phase 1 (Current) - Foundation ✅
- [x] Extension architecture
- [x] All four agents (placeholder)
- [x] DOM manipulation engine
- [x] Visual components

### Phase 2 - Cloud Integration
- [ ] OpenAI/Anthropic/Gemini providers
- [ ] Tavily/Serper search integration
- [ ] Streaming responses
- [ ] Rate limiting & quota management

### Phase 3 - Advanced Features
- [ ] Knowledge graph visualization (D3.js)
- [ ] Historical analysis storage
- [ ] Custom prompt templates
- [ ] Per-site configuration

### Phase 4 - Local Models
- [ ] WebGPU integration
- [ ] On-device inference with Transformers.js
- [ ] Privacy-first mode (no external API calls)

---

## 📝 License

MIT License - Built by HUST Research Team

---

## 🙏 Philosophy

> "In a world drowning in information yet starving for truth, VERITAS stands as a digital lighthouse. Not to tell you what to think, but to show you what to question."

Built with the belief that **critical thinking can be augmented**, not replaced.
