# Flosurf Design System

> Self-hosted, enterprise-grade Design System Architecture, W3C DTCG Token Pipeline, CI/CD Automated Audit Gates, and Antigravity Agent Playbook.

Replaces paid aggregators with full local and CI control over design tokens, multi-platform outputs, automated accessibility gates, and agentic workflows.

---

## Features

- 🎨 **3-Tier W3C DTCG Token Hierarchy**: Primitives (Tier 1) &rarr; Semantic Aliases (Tier 2) &rarr; Component Tokens (Tier 3).
- 🌓 **Dynamic Multi-Mode Theming**: Light, Dark, and High-Contrast modes with CSS `color-scheme` and `prefers-color-scheme` / `prefers-contrast` fallbacks.
- 🚀 **Style Dictionary v4 Compiler**: Automatically builds cross-platform tokens:
  - **Web CSS**: `dist/css/index.css` (with `:root`, `[data-theme="dark"]`, `[data-theme="high-contrast"]`)
  - **Tailwind CSS**: `dist/tailwind/theme.css` (Tailwind v4 `@theme`) & `dist/tailwind/preset.cjs` (Tailwind v3)
  - **iOS Swift & Asset Catalogs**: `dist/ios/FlosurfTokens.swift` + `FlosurfTokens.xcassets` (light/dark/high-contrast appearance sets)
  - **Android Resources**: `dist/android/values/`, `values-night/`, and `high-contrast/values/flosurf_colors.xml`
- 🛡️ **Automated CI/CD Audit Gates**:
  - `Gate 1`: Hardcoded value linter detecting raw hex/px and mapping them to nearest semantic tokens via OKLab Delta-E.
  - `Gate 2`: Multi-mode contrast verification checking 29 critical UI and text pairs against WCAG 2.2 AA and APCA $L_c$.
  - `Gate 3`: State matrix contract ensuring all 6 interactive states exist for interactive components.
- 🔍 **Interactive Topology Visualizer**: Standalone, zero-dependency HTML app at `visualizer/index.html` with real-time token inspector and component sandbox.
- 🤖 **Local Agentic Skills for Antigravity**:
  - `audit-system`: Audits components for hardcoded values and WCAG compliance.
  - `spec-generator`: Generates production component contracts from visual mocks or DOM elements.
- 🕵️ **REA MCP Server Integration**: Reverse-engineer design tokens from native, Electron, or web bundles.

---

## Quick Start

### 1. Pre-built Distribution
Pre-compiled tokens are committed under `dist/` and published by GitHub Actions CI on every commit, so **you do not need to build locally** to consume them:
```html
<!-- Web CSS -->
<link rel="stylesheet" href="./dist/css/index.css" />
```
```js
// Tailwind CSS (v3 preset)
module.exports = {
  presets: [require('./dist/tailwind/preset.cjs')]
}
```

### 2. Running Audits and Build Locally (Optional)
```bash
# Build multi-mode tokens across all platforms
npm run build

# Run CI Audit Gates
npm run audit:hardcoded src   # Gate 1: Zero hardcoded hex/px
npm run audit:contrast        # Gate 2: Multi-mode contrast matrix
npm run audit:states          # Gate 3: Interactive state matrix contract
npm run audit                 # Runs all 3 gates in sequence

# Open the Interactive Visualizer
npm run visualizer            # Opens visualizer/index.html in your browser
```

### 3. Demo the Hardcoded Value Linter
To see how Gate 1 catches raw hex and pixel values and maps them to tokens:
```bash
npm run audit:demo
```

---

## Repository Structure

```
Flosurf/
├── .agents/skills/              # Antigravity IDE Agent Skills
│   ├── audit-system/SKILL.md    # Design system auditor skill
│   └── spec-generator/SKILL.md  # Figma-to-code spec generator skill
├── .github/workflows/           # CI/CD Workflows
│   └── ci.yml                   # Automated token build & audit pipeline
├── audit/                       # CI gate contracts
│   └── contrast-pairs.json      # Contrast test pairing matrix
├── build/                       # Style Dictionary build pipeline
│   └── build-tokens.mjs         # Multi-mode DTCG compiler
├── dist/                        # Compiled tokens (CSS, Tailwind, iOS, Android, JSON)
├── examples/                    # Violation test cases
│   └── violations/BadButton.tsx
├── scripts/                     # Automated audit gate scripts
│   ├── audit-hardcoded.mjs      # Gate 1 linter
│   ├── audit-contrast.mjs       # Gate 2 contrast verifier
│   ├── audit-states.mjs         # Gate 3 state matrix checker
│   └── lib/                     # Color math (WCAG, APCA, OKLab Delta-E)
├── src/                         # Production UI components
│   └── components/
│       ├── Button.tsx           # Compliant Button primitive
│       └── Card.tsx             # Compliant Card primitive
├── tokens/                      # W3C DTCG Token Source Files
│   ├── primitives/              # Tier 1 (Context-agnostic scales)
│   ├── semantic/                # Tier 2 (Mode-aware intent: light, dark, high-contrast)
│   └── component/               # Tier 3 (Scoped component tokens)
├── visualizer/                  # Standalone interactive visualizer
│   └── index.html               # 3-Tier topology, sandbox, and live audit runner
├── AGENTS.md                    # Antigravity project rules
├── ARCHITECTURE.md              # Detailed architecture documentation
└── package.json
```
