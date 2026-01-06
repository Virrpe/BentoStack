# BentoStack Design System

## Design Tokens

### Colors

```css
/* Base palette - dark theme only for MVP */
@theme {
  /* Surface scale (backgrounds, cards, borders) */
  --color-surface-950: #09090b;   /* Page background */
  --color-surface-900: #0f0f11;   /* Panel backgrounds */
  --color-surface-850: #141416;   /* Card backgrounds */
  --color-surface-800: #1a1a1d;   /* Elevated surfaces */
  --color-surface-700: #27272a;   /* Borders, dividers */
  --color-surface-600: #3f3f46;   /* Hover borders */
  --color-surface-500: #52525b;   /* Muted elements */
  --color-surface-400: #71717a;   /* Muted text */
  --color-surface-300: #a1a1aa;   /* Secondary text */
  --color-surface-100: #e4e4e7;   /* Primary text */
  --color-surface-50: #fafafa;    /* Bright text */

  /* Accent (brand, interactive) */
  --color-accent-600: #0052cc;    /* Pressed state */
  --color-accent-500: #2563eb;    /* Primary accent */
  --color-accent-400: #3b82f6;    /* Hover accent */
  --color-accent-300: #60a5fa;    /* Light accent */
  --color-accent-200: #93c5fd;    /* Subtle accent */
  --color-accent-100: #bfdbfe;    /* Background accent */
  --color-accent-glow: rgba(37, 99, 235, 0.4);

  /* Native (positive, success, compatible) */
  --color-native-600: #16a34a;
  --color-native-500: #22c55e;    /* Primary native */
  --color-native-400: #4ade80;
  --color-native-300: #86efac;
  --color-native-glow: rgba(34, 197, 94, 0.4);

  /* Collision (negative, error, friction) */
  --color-collision-600: #dc2626;
  --color-collision-500: #ef4444;  /* Primary collision */
  --color-collision-400: #f87171;
  --color-collision-300: #fca5a5;
  --color-collision-glow: rgba(239, 68, 68, 0.5);

  /* Neutral (unknown, default) */
  --color-neutral-500: #71717a;
  --color-neutral-400: #a1a1aa;
}
```

### Semantic Color Mapping

```css
/* Use these in components */
:root {
  /* Backgrounds */
  --bg-page: var(--color-surface-950);
  --bg-panel: var(--color-surface-900);
  --bg-card: var(--color-surface-850);
  --bg-elevated: var(--color-surface-800);
  --bg-hover: var(--color-surface-700);

  /* Text */
  --text-primary: var(--color-surface-100);
  --text-secondary: var(--color-surface-300);
  --text-muted: var(--color-surface-400);
  --text-accent: var(--color-accent-400);
  --text-native: var(--color-native-400);
  --text-collision: var(--color-collision-400);

  /* Borders */
  --border-default: var(--color-surface-700);
  --border-hover: var(--color-surface-600);
  --border-accent: var(--color-accent-500);
  --border-native: var(--color-native-500);
  --border-collision: var(--color-collision-500);

  /* Interactive */
  --button-primary-bg: var(--color-accent-500);
  --button-primary-hover: var(--color-accent-400);
  --button-danger-bg: var(--color-collision-500);
  --button-danger-hover: var(--color-collision-400);
}
```

### Border Radius

```css
@theme {
  --radius-sm: 4px;    /* Tags, small badges */
  --radius-md: 6px;    /* Buttons, inputs */
  --radius-lg: 8px;    /* Cards, tooltips */
  --radius-xl: 12px;   /* Panels, modals, nodes */
  --radius-2xl: 16px;  /* Large containers */
  --radius-full: 9999px; /* Pills, handles */
}
```

### Shadows

```css
@theme {
  /* Elevation shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.3), 0 4px 8px rgba(0, 0, 0, 0.2);
  --shadow-xl: 0 16px 32px rgba(0, 0, 0, 0.35), 0 8px 16px rgba(0, 0, 0, 0.25);

  /* Glow shadows (for edges and badges) */
  --glow-accent: 0 0 12px var(--color-accent-glow);
  --glow-native: 0 0 12px var(--color-native-glow);
  --glow-collision: 0 0 16px var(--color-collision-glow);

  /* Focus ring */
  --ring-focus: 0 0 0 3px var(--color-accent-glow);
}
```

### Blur

```css
@theme {
  --blur-sm: 4px;
  --blur-md: 8px;
  --blur-lg: 16px;
  --blur-xl: 24px;
}
```

### Typography Scale

```css
@theme {
  /* Font sizes */
  --text-xs: 11px;
  --text-sm: 13px;
  --text-base: 14px;
  --text-lg: 16px;
  --text-xl: 18px;
  --text-2xl: 24px;
  --text-3xl: 28px;

  /* Line heights */
  --leading-none: 1;
  --leading-tight: 1.2;
  --leading-snug: 1.35;
  --leading-normal: 1.5;
  --leading-relaxed: 1.6;

  /* Font weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Letter spacing */
  --tracking-tighter: -0.02em;
  --tracking-tight: -0.01em;
  --tracking-normal: 0;
  --tracking-wide: 0.02em;
  --tracking-wider: 0.05em;
  --tracking-widest: 0.08em;
}
```

### Spacing Scale

```css
@theme {
  --space-0: 0;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

### Animation Timing

```css
@theme {
  /* Durations */
  --duration-instant: 50ms;
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 400ms;

  /* Easings */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## Component Inventory

### VibeBadge

**Purpose:** Display a vibe score (0-100) with visual progress indicator and color-coded status.

**Props:**
```typescript
interface VibeBadgeProps {
  score: number | null;        // 0-100, null shows "—"
  size?: 'sm' | 'md' | 'lg';   // default: 'md'
  showProgress?: boolean;       // default: true
  showLabel?: boolean;          // "Excellent", "Good", etc.
}
```

**Variants:**
| Score Range | Color | Label | Glow |
|-------------|-------|-------|------|
| 80-100 | native-400 | "Excellent" | Yes |
| 60-79 | native-300 | "Good" | No |
| 40-59 | neutral-400 | "Fair" | No |
| 20-39 | collision-300 | "Poor" | No |
| 0-19 | collision-400 | "Critical" | Yes |
| null | surface-500 | "—" | No |

**Sizes:**
| Size | Score Font | Progress Width | Progress Height |
|------|------------|----------------|-----------------|
| sm | 13px | 60px | 3px |
| md | 14px | 80px | 4px |
| lg | 24px | 120px | 6px |

---

### VibeAlert

**Purpose:** Display collision warnings and suggestions in the inspector.

**Props:**
```typescript
interface VibeAlertProps {
  type: 'collision' | 'warning' | 'info';
  title: string;
  description?: string;
  suggestions?: Suggestion[];
  onApplySuggestion?: (suggestion: Suggestion) => void;
}

interface Suggestion {
  id: string;
  action: string;        // "Change Auth to:"
  tool: string;          // "Lucia"
  reason: string;        // "Native Drizzle support"
  vibeChange: number;    // +26
}
```

**Styling:**
```css
.vibe-alert {
  background: var(--bg-elevated);
  border: 1px solid var(--border-collision);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.vibe-alert--collision {
  border-color: var(--color-collision-500);
  background: rgba(239, 68, 68, 0.05);
}
```

---

### StackNode

**Purpose:** Custom Svelte Flow node representing a tool category.

**Props (via Svelte Flow injection):**
```typescript
interface StackNodeData {
  category: string;        // "Frontend", "Auth", etc.
  tool: string | null;     // "nextjs", "prisma", etc.
  vibe: number | null;     // computed by engine
  notes?: string;
  hasCollision?: boolean;  // edge-computed
}
```

**Structure:**
```svelte
<div class="stack-node" class:selected class:collision={data.hasCollision}>
  <Handle type="target" position="top" />
  
  <header class="stack-node__header">
    <span class="stack-node__category">{data.category}</span>
    <VibeBadge score={data.vibe} size="sm" showProgress={false} />
  </header>
  
  <div class="stack-node__body">
    <ToolDropdown
      category={data.category}
      value={data.tool}
      onchange={handleToolChange}
    />
  </div>
  
  <Handle type="source" position="bottom" />
</div>
```

**CSS:**
```css
.stack-node {
  width: 200px;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  transition: border-color var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}

.stack-node:hover {
  border-color: var(--border-hover);
  box-shadow: var(--shadow-md);
}

.stack-node.selected {
  border-color: var(--border-accent);
  border-width: 2px;
  box-shadow: var(--ring-focus);
}

.stack-node.collision {
  border-color: var(--border-collision);
  box-shadow: var(--glow-collision);
}

.stack-node__category {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  color: var(--text-muted);
}
```

---

### BackgroundBeams

**Purpose:** Subtle animated background beams inspired by Aceternity UI.

**Props:**
```typescript
interface BackgroundBeamsProps {
  intensity?: 'subtle' | 'medium' | 'strong';  // default: 'subtle'
  color?: string;   // default: accent-500
}
```

**Implementation notes:**
- Use SVG paths with gradient strokes
- Animate opacity and position with CSS
- Keep animation very subtle (opacity 0.03-0.08)
- Performance: use `will-change: opacity` sparingly
- Only render when canvas is idle (pause during drag)

**CSS:**
```css
.background-beams {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.background-beams__beam {
  position: absolute;
  stroke: var(--color-accent-500);
  stroke-width: 1px;
  fill: none;
  opacity: 0.05;
  animation: beam-drift 20s ease-in-out infinite;
}

@keyframes beam-drift {
  0%, 100% { opacity: 0.03; transform: translateY(0); }
  50% { opacity: 0.08; transform: translateY(-20px); }
}
```

---

### InspectorPanel

**Purpose:** Right-side panel showing details of selected node or edge.

**Props:**
```typescript
interface InspectorPanelProps {
  selection: SelectedNode | SelectedEdge | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateNode: (id: string, data: Partial<NodeData>) => void;
  onDeleteNode: (id: string) => void;
  onDeleteEdge: (id: string) => void;
  onApplySuggestion: (suggestion: Suggestion) => void;
}
```

**Structure:**
```svelte
<aside class="inspector" class:open={isOpen}>
  <header class="inspector__header">
    <button onclick={onClose} aria-label="Close inspector">
      <ChevronRightIcon />
    </button>
    <span>Inspector</span>
  </header>
  
  <div class="inspector__content">
    {#if !selection}
      <EmptyState />
    {:else if selection.type === 'node'}
      <NodeInspector {selection} {onUpdateNode} {onDeleteNode} />
    {:else}
      <EdgeInspector {selection} {onDeleteEdge} {onApplySuggestion} />
    {/if}
  </div>
</aside>
```

**CSS:**
```css
.inspector {
  width: 320px;
  height: 100%;
  background: var(--bg-panel);
  border-left: 1px solid var(--border-default);
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform var(--duration-slow) var(--ease-out);
}

.inspector.open {
  transform: translateX(0);
}

.inspector__header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-default);
}

.inspector__content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5);
}
```

---

### Toolbar

**Purpose:** Floating toolbar for canvas actions.

**Props:**
```typescript
interface ToolbarProps {
  onAddNode: () => void;
  onFitView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoomLevel: number;
}
```

**Structure:**
```svelte
<div class="toolbar">
  <button onclick={onAddNode} title="Add node (N)">
    <PlusIcon />
  </button>
  <div class="toolbar__divider" />
  <button onclick={onFitView} title="Fit view (F)">
    <MaximizeIcon />
  </button>
  <button onclick={onZoomOut} title="Zoom out (-)">
    <MinusIcon />
  </button>
  <span class="toolbar__zoom">{Math.round(zoomLevel * 100)}%</span>
  <button onclick={onZoomIn} title="Zoom in (+)">
    <PlusIcon />
  </button>
</div>
```

**CSS:**
```css
.toolbar {
  position: absolute;
  bottom: var(--space-6);
  left: var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2);
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.toolbar button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  transition: background var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out);
}

.toolbar button:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.toolbar__divider {
  width: 1px;
  height: 20px;
  background: var(--border-default);
  margin: 0 var(--space-1);
}

.toolbar__zoom {
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
  min-width: 48px;
  text-align: center;
}
```

---

### RegistryCard

**Purpose:** Display a tool in the registry grid.

**Props:**
```typescript
interface RegistryCardProps {
  tool: RegistryTool;
}

interface RegistryTool {
  id: string;
  name: string;
  category: string;
  description: string;
  icon?: string;
  best_with: string[];
  friction_with: string[];
  tags: string[];
}
```

**CSS:**
```css
.registry-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  transition: border-color var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}

.registry-card:hover {
  border-color: var(--border-hover);
  box-shadow: var(--shadow-md);
}

.registry-card__name {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.registry-card__description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.registry-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.registry-card__tag {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  padding: var(--space-1) var(--space-2);
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
}
```

---

## Interaction Rules

### Hover States

| Element | Default | Hover |
|---------|---------|-------|
| Button (primary) | `bg-accent-500` | `bg-accent-400`, `shadow-md` |
| Button (ghost) | `bg-transparent` | `bg-surface-700` |
| Card | `border-surface-700` | `border-surface-600`, `shadow-md` |
| Node | `border-surface-700` | `border-surface-600`, `shadow-md` |
| Link | `text-accent-400` | `text-accent-300`, underline |
| Dropdown item | `bg-transparent` | `bg-surface-700` |

### Focus States

All interactive elements must have visible focus indicators:

```css
:focus-visible {
  outline: none;
  box-shadow: var(--ring-focus);
}

/* For elements where ring doesn't fit */
.focus-border:focus-visible {
  border-color: var(--border-accent);
}
```

### Animation Timing Guidelines

| Action | Duration | Easing |
|--------|----------|--------|
| Button hover | 100ms | ease-out |
| Dropdown open | 150ms | ease-out |
| Panel slide | 250ms | ease-out |
| Node appear | 200ms | ease-out |
| Edge color change | 300ms | ease-out |
| Vibe score count | 400ms | ease-out |
| Toast appear | 200ms | ease-out |
| Collision pulse | 2000ms | infinite, ease-in-out |

### Accessibility Minimums

1. **Color contrast:**
   - Text on backgrounds: minimum 4.5:1 (WCAG AA)
   - Large text (18px+): minimum 3:1
   - Interactive elements: minimum 3:1 against adjacent colors

2. **Focus indicators:**
   - All interactive elements must have visible focus state
   - Focus ring must have minimum 3:1 contrast

3. **Motion:**
   - Respect `prefers-reduced-motion`
   - Provide static alternatives for animations
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

4. **Keyboard navigation:**
   - All actions achievable via keyboard
   - Logical tab order
   - Visible focus indicators
   - Escape closes modals/dropdowns

5. **Screen readers:**
   - Meaningful `aria-label` on icon-only buttons
   - `role="status"` on toast notifications
   - `aria-live="polite"` on vibe score changes

6. **Touch targets:**
   - Minimum 44×44px for mobile
   - Adequate spacing between targets

---

## File Organization

```
src/lib/
├── components/
│   ├── ui/
│   │   ├── VibeBadge.svelte
│   │   ├── VibeAlert.svelte
│   │   ├── Button.svelte
│   │   ├── Dropdown.svelte
│   │   ├── Tooltip.svelte
│   │   └── Toast.svelte
│   ├── canvas/
│   │   ├── StackNode.svelte
│   │   ├── StackEdge.svelte
│   │   ├── BackgroundBeams.svelte
│   │   ├── Toolbar.svelte
│   │   └── Canvas.svelte
│   ├── inspector/
│   │   ├── InspectorPanel.svelte
│   │   ├── NodeInspector.svelte
│   │   ├── EdgeInspector.svelte
│   │   └── EmptyState.svelte
│   └── registry/
│       ├── RegistryCard.svelte
│       └── RegistryGrid.svelte
├── styles/
│   ├── tokens.css          # Design tokens (@theme)
│   ├── base.css            # Reset, typography
│   ├── components.css      # Component styles (if not colocated)
│   └── utilities.css       # Custom utilities
└── app.css                 # Imports all styles
```
