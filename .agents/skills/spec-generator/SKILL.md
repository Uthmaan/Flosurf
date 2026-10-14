---
name: spec-generator
description: Generate a production-ready Design-to-Code Component Contract from visual or DOM inspection.
---

# Figma-to-Code Component Spec Generator

You are a Principal Design System Engineer. When analyzing a target component from visual mocks, Figma specs, or DOM inspection, generate a complete 4-part Architecture Specification:

## 1. Anatomy & Slots
- Diagram the component hierarchy:
  - Root container
  - Sub-elements (Prefix Icon, Label, Suffix Icon, Caret, Spinner)
  - Composable slot regions and polymorphic root elements (`asChild` pattern).

## 2. Token Mapping Table
Map every visual property across all 6 interactive states using Tier 2 Semantic or Tier 3 Component tokens:

| Property | Default | Hover | Focus-Visible | Active | Disabled | Loading |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Background | `--{comp}-{var}-bg-default` | `--{comp}-{var}-bg-hover` | `--{comp}-{var}-bg-focus-visible` | `--{comp}-{var}-bg-active` | `--{comp}-{var}-bg-disabled` | `--{comp}-{var}-bg-loading` |
| Foreground | `--{comp}-{var}-fg-default` | `--{comp}-{var}-fg-hover` | `--{comp}-{var}-fg-focus-visible` | `--{comp}-{var}-fg-active` | `--{comp}-{var}-fg-disabled` | `--{comp}-{var}-fg-loading` |
| Border | `--{comp}-{var}-border-default` | `--{comp}-{var}-border-hover` | `--{comp}-{var}-border-focus-visible` | `--{comp}-{var}-border-active` | `--{comp}-{var}-border-disabled` | `--{comp}-{var}-border-loading` |
| Focus Ring | N/A | N/A | `var(--focus-ring-width) solid var(--color-border-focus)` | N/A | N/A | N/A |
| Padding | `var(--layout-padding-control-*)` | ... | ... | ... | ... | ... |
| Radius | `var(--radius-control)` | ... | ... | ... | ... | ... |

## 3. TypeScript Props Interface
Write a clean, strictly typed interface extending native HTML attributes:
```typescript
export interface ComponentProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}
```

## 4. ARIA & Keyboard Spec
Define the exact WAI-ARIA pattern, required ARIA attributes, and keybindings:
- **ARIA Roles & States**: `role="button"`, `aria-busy={isLoading}`, `aria-disabled={isDisabled}`, `aria-expanded` (if dropdown/disclosure).
- **Keyboard Handling**:
  - `Enter` / `Space`: Activates the control.
  - `Tab`: Navigates to/from control with visible outline in `:focus-visible`.
  - `Escape`: Closes open overlays or dismisses state.
