# Flosurf Design System Agent Rules

## Core Rules for All Agent Operations

1. **Strict 3-Tier W3C Token Taxonomy**:
   - **Tier 1 (Primitives)**: Context-agnostic raw scales (`tokens/primitives/`). NEVER reference directly in UI code.
   - **Tier 2 (Semantic)**: Mode-aware aliases (`tokens/semantic/`). Switch across `light`, `dark`, and `high-contrast`. Use for generic layouts and theme-wide styles.
   - **Tier 3 (Component)**: Scoped overrides (`tokens/component/`). Must be used for specific component primitives (Button, Card, Input).

2. **Pre-Handoff 4-Stage Architectural Gate**:
   - **Gate 1 (Zero Hardcoded Hex/Px)**: Every CSS property must resolve to a design token (`var(--...)`). Run `npm run audit:hardcoded` before completing tasks.
   - **Gate 2 (WCAG 2.2 AA Contrast)**: Minimum 4.5:1 for normal text, 3:1 for UI controls and boundaries across all 3 modes. Run `npm run audit:contrast`.
   - **Gate 3 (State Matrix Contract)**: Interactive components must implement all 6 states (`default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`) and required WAI-ARIA attributes (`aria-busy`, `aria-disabled`). Run `npm run audit:states`.
   - **Gate 4 (Layout & Stress Test)**: Layouts must survive 300% text zoom and long-string localization without clipping.

3. **CI First**:
   - We do not rely exclusively on local builds. CI runs `npm run ci` (`npm run build && npm run audit`) to compile tokens and enforce all gates.
