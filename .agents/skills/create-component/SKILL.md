---
name: create-component
description: Step-by-step runbook for authoring a production-ready design system component adhering to 3-tier tokens, 6-state matrix, and WAI-ARIA.
---

# How to Create a Flosurf Design System Component

Follow this authoritative 6-step lifecycle whenever authoring a new component (e.g. Input, Checkbox, Dialog, Dropdown, Button):

## Step 1: Upstream Contract & Anatomy
- Define the component's anatomy and slots:
  - Container (Root element)
  - Sub-elements (Prefix, Suffix, Label, Helper text, Validation message, Spinner)
- If coming from Figma: inspect the `uSpec` contract (`_base.json` or `component.md`).
- If reverse-engineering an existing app: use `@rea` MCP to inspect DOM/bundle structure.

## Step 2: Define Tier 3 Component Tokens
Create `tokens/component/{componentName}.json`:
1. Use the strict DTCG format (`$value`, `$type`, `$description`).
2. Map **every visual property** to Tier 2 Semantic tokens (`{color.bg.action.*}`, `{layout.padding.*}`, `{radius.*}`, `{font.*}`).
3. If interactive, define the full 6-state matrix for each variant:
   - `default`
   - `hover`
   - `focus-visible` (must include focus-ring color, width, and offset)
   - `active`
   - `disabled`
   - `loading`
4. Run `npm run build` to compile the new tokens into `dist/css`, `dist/tailwind`, `dist/ios`, `dist/android`.

## Step 3: Author TypeScript Props Interface
Create `src/components/{ComponentName}.tsx`:
- Extend native HTML attributes (`React.ComponentPropsWithoutRef<'button'>`, `'input'`, etc.).
- Use explicit, polymorphic props:
  - `variant?: 'primary' | 'secondary' | 'danger'`
  - `size?: 'sm' | 'md' | 'lg'`
  - `isDisabled?: boolean`
  - `isLoading?: boolean`
- **Never use conflicting booleans** (e.g., `<Button primary danger />`).

## Step 4: Implement with Zero Hardcoded Values
- **Zero raw hex colors** (`#4F46E5`), **zero raw RGB** (`rgba(...)`), **zero raw pixel values** (`16px`).
- Every visual property must reference a compiled CSS variable:
  ```tsx
  style={{
    backgroundColor: `var(--${comp}-${variant}-bg-default)`,
    padding: `var(--${comp}-padding-x-${size})`,
    borderRadius: `var(--${comp}-radius)`,
    minHeight: `var(--${comp}-min-height-${size})`,
  }}
  ```

## Step 5: Implement Keyboard & WAI-ARIA Contract
- Appropriate ARIA role (`role="button"`, `role="combobox"`, etc.).
- ARIA state reflection:
  - `aria-busy={isLoading}`
  - `aria-disabled={isDisabled || isLoading}`
  - `aria-invalid={isInvalid}`
- Focus management:
  - Visible focus ring on `:focus-visible`.
  - Proper keydown listeners (`Enter`, `Space`, `Escape`, `ArrowUp`/`ArrowDown`).

## Step 6: Verify Against All 4 CI Gates
Run the pre-handoff verification suite before submitting:
```bash
npm run audit:hardcoded src/{ComponentName}.tsx # Gate 1: Zero hardcoded hex/px
npm run audit:contrast                          # Gate 2: Multi-mode WCAG contrast
npm run audit:states                            # Gate 3: State matrix contract
npm run audit:stress                            # Gate 4: 300% zoom & South African multi-language stress
```
