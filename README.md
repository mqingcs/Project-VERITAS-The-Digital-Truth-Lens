# Veritas: Autonomous Multi-Agent Truth Engine

> **"Nox est norma, Lux per rationem reconstruitur."**
> *(Darkness is the norm, Light is reconstructed through reason.)*

🇨🇳🇭🇰🇲🇴🇸🇬 **中文**用户请参阅 [README_CN.md](README_CN.md)。

**Veritas** is not just a browser extension; it is a **Cognitive Defense System**.

It is an **Autonomous Multi-Agent Truth Engine** designed to reduce information entropy in real-time. By orchestrating a swarm of specialized AI agents, Veritas overlays a "Truth Lens" on the web, revealing the hidden structure of arguments, exposing logical fallacies, and verifying facts against global ground truths.

It rejects the "clean corporate" aesthetic in favor of **Digital Brutalism**—raw data, high contrast, and function over form.

![Veritas Banner](https://github.com/mqingcs/Veritas-Autonomous-Multi-Agent-Truth-Engine/blob/Final-version/pics/poster.jpeg)

---

## 📚 Documentation

For a deep dive into the architecture, prompt engineering, and internal mechanics, read the **[Project Guide](docs/Project-Guide.md)** (or the [项目指南（中文版）](docs/Project-Guide-Chinese.md)).

---

## 🧠 The Autonomous Agent Swarm

Veritas operates as a **Multi-Agent System (MAS)** where four specialized intelligences collaborate via a high-speed internal protocol.

### 1. 🛡️ VELOX (The Sentry)
*   **Engine**: Gemini 2.5 Flash-Lite (Optimized for <100ms latency)
*   **Role**: **Pattern Recognition & Noise Suppression**.
*   **Tech Stack**: Real-time DOM analysis, heuristic fallacy detection.
*   **Capabilities**:
    *   **Fallacy Detection**: Identifies 12+ rhetorical patterns (e.g., *Ad Hominem*, *Strawman*, *False Dichotomy*).
    *   **Entropy Reduction**: Visually suppresses low-value content (ads, boilerplate) to maximize signal-to-noise ratio.

### 2. ⚖️ RATIO (The Analyst)
*   **Engine**: Gemini 2.5 Flash
*   **Role**: **Atomic Fact Extraction**.
*   **Tech Stack**: NLP-based claim isolation, entity recognition (NER).
*   **Capabilities**:
    *   **Signal Extraction**: Parses unstructured text into atomic, testable claims.
    *   **Cross-Lingual Processing**: Preserves original language semantics (Chinese/English) to ensure accurate downstream verification.

### 3. 🔍 VERITAS (The Investigator)
*   **Engine**: Gemini 2.5 Flash + Google Search Grounding
*   **Role**: **Autonomous Verification**.
*   **Tech Stack**: RAG (Retrieval-Augmented Generation), Multi-hop reasoning.
*   **Capabilities**:
    *   **Anti-Recitation Protocol**: Synthesizes answers to prevent hallucination and copyright infringement.
    *   **Source Credibility Scoring**: Ranks evidence based on domain authority (Gov > Edu > Media > Blog).
    *   **Graph Construction**: Builds semantic relationships (Supports/Contradicts) for the Knowledge Graph.

### 4. 💬 COMMANDER (The Hive Mind)
*   **Engine**: Gemini 2.5 Flash
*   **Role**: **ReAct Orchestrator**.
*   **Tech Stack**: Autonomous Agent Loop (Reasoning + Acting), DOM Manipulation API.
*   **Capabilities**:
    *   **Mission Execution**: Accepts high-level goals (*"Verify all stats in this section"*) and autonomously plans the tool execution chain.
    *   **Context Awareness**: Maintains a sliding window of conversation and page context.

---

## 🛠️ Core Capabilities & Usage

### 1. The Truth Scan (`Alt + V`)
**Trigger**: Press `Alt + V` (Mac: `Option + V`) to initiate the **Neon Ritual**.
*   **Visual Feedback**: A breathing Cyan/Gold halo indicates the swarm is active.
*   **Result**:
    *   **Blue Boxes**: Logical Fallacies (Hover to see definition).
    *   **Cyan Underlines**: Factual Claims.
    *   **Strikethrough**: Debunked Lies.

### 2. Enhanced Holographic Card
**Trigger**: Hover over any highlighted element.
A 6-tab floating dashboard provides deep analysis:
*   **Risk Gauge**: Real-time misinformation probability (0-100).
*   **Fallacies**: Academic breakdown of rhetorical errors.
*   **Claims**: List of extracted atomic facts.
*   **Verification**: Evidence chain with direct source links.
*   **Graph**: Mini-map of the local knowledge network.
*   **Commander**: Context-specific chat.

### 3. Commander Terminal (`Alt + C`)
**Trigger**: Press `Alt + C` (Mac: `Option + C`) to open the side panel.
**Usage**: Talk to the swarm in natural language.
*   **Direct Execution**: *"Highlight all mentions of 'Elon Musk'."*
*   **Deep Research**: *"Find all claims about nuclear energy, verify them, and summarize the misconceptions."*
*   **Correction**: *"You missed the claim in the second paragraph. Look again."*

### 4. Deep Dive (Precision Strike)
**Trigger**: Select text -> Right Click -> **"Veritas: Deep Dive"**.
**Function**: Forces the swarm to focus all computational power on a specific segment.
*   **Use Case**: When the full-page scan misses a subtle detail or you need rigorous verification of a single paragraph.

### 5. 3D Knowledge Graph ("God Mode")
**Trigger**: Click "View Graph" in the Holographic Card.
**Tech**: `Three.js` + `d3-force` physics engine.
*   **Visualization**: Renders the semantic network of Claims (Gold), Entities (Cyan), and Sources (Green).
*   **Interaction**:
    *   **Drag**: Manipulate the graph structure.
    *   **Scroll**: Zoom in/out.
    *   **Click**: Focus on specific nodes and their neighbors.
*   **Analysis**: Spot "Fallacy Clusters" (dense webs of blue nodes) to identify coordinated disinformation campaigns.

---

## 🚀 Quick Start

### Prerequisites
*   **Node.js**: v18+
*   **pnpm** (Recommended) or npm.
*   **Google Gemini API Key**: Required for intelligence.

### Installation

1.  **Clone & Install**:
    ```bash
    git clone https://github.com/mqingcs/Veritas-Autonomous-Multi-Agent-Truth-Engine.git
    cd Veritas-Autonomous-Multi-Agent-Truth-Engine
    npm install
    ```

2.  **Build**:
    ```bash
    npm run build
    ```

3.  **Load in Chrome**:
    *   Go to `chrome://extensions` -> Enable "Developer Mode".
    *   Click "Load Unpacked" -> Select `build/chrome-mv3-prod`.

4.  **Configure**:
    *   Click the extension icon -> Settings ⚙️.
    *   Enter your **Gemini API Key**.

---

## ⚡ Advanced Usage

### Autonomous Research Chains
Commander implements a **ReAct Loop**. You can give it open-ended missions:
> *"Scan this page for contradictions regarding the 2024 budget, cross-reference with the Treasury report, and generate a summary table."*

### Cross-Lingual Forensics
Veritas bridges the language gap.
> *Scenario: Reading a Chinese news report.*
> *Command: "Verify these claims using English sources."*
> *Result: Veritas translates the query, searches English media (BBC/Reuters), and reports back in Chinese with the ground truth.*

### The "Kill Switch"
If the autonomous loop runs too long or goes off-track:
*   **Action**: Click **STOP** in the Commander Panel.
*   **Effect**: Instantly terminates all agent processes and clears the task queue.

---

## 🚧 Roadmap

### Phase 1: Critical Fixes & Urgent Features
- [ ] **Localization**: Ensure Holographic Card language adapts to user settings.
- [ ] **Bug Fix**: Fix `Confidence: NaN%` display when mixing fallacies and verifications.
- [ ] **Highlighting**: Achieve 100% success rate for DOM annotation.
- [ ] **UX**: Fix progress bar stuck at 0 during tasks.
- [ ] **Error Handling**: Add specific prompts for duplicate search errors.

### Phase 2: Architecture & Unification
- [ ] **Unified Commander**: Merge the Holographic Card's chat with the Global Commander for a single context window.
- [ ] **Extension API**: Implement APIs to allow more autonomous agent operations.
- [ ] **Model Upgrade**: Migrate to **Gemini 3.0 Flash** immediately upon release.

### Phase 3: UI/UX Overhaul
- [ ] **Visual Polish**: Implement "Marquee" scrolling effects and refined Sidebar design.
- [ ] **Design Consistency**: Unify all popups, modals, and dialogs to strictly follow the "Digital Brutalism" and Holographic UI language.
- [ ] **Layout**: Move the "Fullscreen" button in the Graph Card to the right for better ergonomics.

### Phase 4: Performance & Economy
- [ ] **Latency**: Drastically reduce search and analysis time.
- [ ] **Billing System**: Real-time cost calculation based on Gemini API pricing.
- [ ] **Budget Mode**: A "Low Power" setting (skips complex "Thinking" loops, uses cheaper models).

### Phase 5: The Core Brain (GraphRAG)
*Moving beyond Vector Similarity to true Graph-based Retrieval Augmented Generation.*

- [ ] **Integration**: Embed logical fallacies and verification results directly into the Knowledge Graph.
- [ ] **Deep Dive**: "Deep Dive" actions should dynamically spawn new nodes in the graph.
- [ ] **Graph Querying**: Allow users to chat *with* the graph (e.g., "Find connections between Entity A and Event B").
- [ ] **The Vision**:
    *   *Traditional RAG*: Tells you "What the article says."
    *   *GraphRAG*: Tells you "Why it matters" by traversing hidden links (e.g., linking a stock drop to a supplier fire 3 months ago).
    *   *Philosophy*: "Only by seeing the connections can we escape the darkness of a single perspective."

---

## 📜 License: GPLv3

> **"Truth dies in black boxes."**

To judge the world, the judge must be visible. Veritas is a tool for clarity, not control. We believe that the logic used to dissect reality must itself be open to dissection.

We chose the **GPLv3** because an algorithm that determines truth cannot hide in the shadows. Under this license, any derivative work that claims to seek the truth must be equally willing to show its work.

## ☀️ No secrets. No closed doors.

> "In a world drowning in information yet starving for truth, VERITAS stands as a digital lighthouse. Not to tell you what to think, but to show you what to question."

Built with the belief that **critical thinking can be augmented**, not replaced.
