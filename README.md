# Project VERITAS: The Digital Truth Lens

> *Veritas vincit omnia.* (Truth conquers all.)

For Chinese users, please refer to the [README_CN.md](README_CN.md).

**Project VERITAS** is a "Digital Brutalist" browser extension designed to restore trust and clarity to the web. It uses a swarm of specialized AI agents to analyze content in real-time, detecting logical fallacies, extracting factual claims, verifying information against the web, and visualizing the hidden structure of knowledge.

![Veritas Banner](https://github.com/mqingcs/Project-VERITAS-The-Digital-Truth-Lens/blob/Final-version/pics/poster.jpeg)

---

## 🏗️ Philosophy: Digital Brutalism

Veritas rejects the "clean corporate" aesthetic. It embraces **Digital Brutalism**:
*   **Raw Data**: Information without sugar-coating.
*   **High Contrast**: Neon Cyan (#00F0FF) and Gold (#FFD700) against Void Black (#050505).
*   **Function over Form**: Every pixel serves to reveal truth.
*   **The Neon Ritual**: Activation triggers a breathing "Neon Halo" and CRT scanlines, signaling the system is alive.

---

## 🧠 The Agent Swarm

Veritas is not a chatbot. It is a coordinated swarm of four specialized agents:

### 1. 🛡️ VELOX (The Sentry)
*   **Model**: Gemini 2.5 Flash-Lite
*   **Role**: High-speed noise filtering and fallacy detection.
*   **Capabilities**: Identifies *Ad Hominem*, *Strawman*, *Gaslighting*, and emotional manipulation.

### 2. ⚖️ RATIO (The Analyst)
*   **Model**: Gemini 2.5 Flash
*   **Role**: Precision fact extraction.
*   **Capabilities**: Isolates atomic claims, links entities, and preserves original language for accurate search.

### 3. 📊 VERITAS (The Investigator)
*   **Model**: Gemini 2.5 Flash + Google Search Grounding
*   **Role**: Real-time web verification.
*   **Capabilities**: Cross-references claims with trusted sources (Gov/Edu > Media), builds knowledge graphs, and strictly avoids recitation.

### 4. 💬 COMMANDER (The Orchestrator)
*   **Model**: Gemini 2.5 Flash
*   **Role**: The central hub and user interface.
*   **Capabilities**: Executes complex autonomous research chains ("Find X, Verify Y, Report Z"), manages the DOM, and adapts to user intent.

---

## ✨ Key Features

### 👁️ The Truth Scan (`Alt + Shift + V`)
Instantly analyzes the current page.
*   **Blue Outlines**: Logical fallacies.
*   **Cyan Underlines**: Factual claims.
*   **Color-Coded Verification**:
    *   ✅ **Green**: Verified Fact.
    *   ❌ **Red**: Debunked/False.
    *   ⚠️ **Yellow**: Disputed.

### ⚛️ Enhanced Holographic Card
Hover over any highlight to open a draggable, 6-tab dashboard:
*   **Risk Gauge**: Real-time misinformation score (0-100).
*   **Fallacies**: Detailed breakdown of logical errors.
*   **Verification**: Evidence chains and source links.
*   **Commander Chat**: Context-aware Q&A about the specific element.

### 🕸️ 3D Knowledge Graph ("God Mode")
Visualize the hidden connections between claims, entities, and sources in a fully interactive, force-directed 3D space.
*   **Focus Mode**: Isolate specific nodes.
*   **Smart Search**: Instantly find entities in the web.
*   **Physics Engine**: Nodes attract/repel based on semantic relationship.

---

## 🚀 Quick Start

### Prerequisites
*   **Node.js**: v18+
*   **pnpm**: Recommended.
*   **Google Gemini API Key**: Required.

### Installation

1.  **Clone & Install**:
    ```bash
    git clone https://github.com/mqingcs/Project-VERITAS-The-Digital-Truth-Lens/tree/Final-version
    cd Project-VERITAS-The-Digital-Truth-Lens
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run build
    ```

3.  **Load in Chrome**:
    *   Go to `chrome://extensions` -> Enable "Developer Mode".
    *   Click "Load Unpacked" -> Select `build/chrome-mv3-prod`.

---

## ⚡ Advanced Usage

### Autonomous Research Chains
Give Commander complex, multi-step instructions via `Alt + Shift + C`:
> *"Find all claims about 'nuclear energy' on this page, verify them against official IAEA reports, and summarize the misconceptions."*

### Agent Retasking
Correct the swarm if it makes a mistake:
> *"You missed the claim in the second paragraph. Look again."* -> Commander will re-plan and re-execute.

### The "Kill Switch"
Hit **STOP** in the Commander Panel to immediately terminate any autonomous loop.

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

## 📚 Documentation

For a deep dive into the architecture, prompt engineering, and internal mechanics, read the **[Project Guide](docs/project_guide.md)** (or the [Chinese Version](docs/Project-Guide-Chinese.md)).

---

## 📜 License: GPLv3

> **"Truth dies in black boxes."**

To judge the world, the judge must be visible. Veritas is a tool for clarity, not control. We believe that the logic used to dissect reality must itself be open to dissection.

We chose the **GPLv3** because an algorithm that determines truth cannot hide in the shadows. Under this license, any derivative work that claims to seek the truth must be equally willing to show its work.

## ☀️ No secrets. No closed doors.

> "In a world drowning in information yet starving for truth, VERITAS stands as a digital lighthouse. Not to tell you what to think, but to show you what to question."

Built with the belief that **critical thinking can be augmented**, not replaced.
