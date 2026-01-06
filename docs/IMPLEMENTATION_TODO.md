# BentoStack Implementation Plan

## Overview

A 10-day implementation plan broken into phases. Each task has acceptance criteria. Estimated 4-6 hours/day of focused work.

---

## Phase 1: Foundation (Days 1-2)

### Day 1: Project Setup & Registry

#### Task 1.1: Initialize SvelteKit Project
```bash
npm create svelte@latest bentostack
# Select: Skeleton, TypeScript, ESLint, Prettier
cd bentostack
npm install
```

**Acceptance Criteria:**
- [ ] SvelteKit 2 project runs with `npm run dev`
- [ ] TypeScript configured with strict mode
- [ ] ESLint + Prettier working
- [ ] Git repo initialized with .gitignore

#### Task 1.2: Install Dependencies
```bash
npm install @xyflow/svelte
npm install -D tailwindcss @tailwindcss/vite
```

**Acceptance Criteria:**
- [ ] Svelte Flow v1 installed and importable
- [ ] Tailwind CSS v4 configured with `@import "tailwindcss"` in app.css
- [ ] `@theme` directive working in CSS

#### Task 1.3: Create Design Tokens
- Create `/src/lib/styles/tokens.css`
- Define all color, spacing, typography, shadow tokens from DESIGN_SYSTEM.md
- Import tokens in `app.css`

**Acceptance Criteria:**
- [ ] All tokens from DESIGN_SYSTEM.md defined
- [ ] Tokens usable as `var(--color-surface-900)` etc.
- [ ] Dark theme applied to body by default

#### Task 1.4: Build Registry Data
- Create `/src/lib/data/registry.ts`
- Define TypeScript interfaces
- Add 15-20 initial tools across 5 categories:
  - Frontend: Next.js, Nuxt, SvelteKit, Remix
  - Auth: NextAuth, Lucia, Clerk, Auth.js
  - ORM: Prisma, Drizzle, Kysely
  - Database: PostgreSQL, MySQL, SQLite, MongoDB, Turso
  - Hosting: Vercel, Netlify, Railway, Fly.io

**Acceptance Criteria:**
- [ ] Registry exports `tools` object and `categories` array
- [ ] Each tool has: id, name, category, description, best_with, friction_with
- [ ] At least 3 friction_with relationships defined (for demo)
- [ ] TypeScript types exported

---

### Day 2: Vibe Engine Core

#### Task 2.1: Create Vibe Engine Module
- Create `/src/lib/engine/vibe-engine.svelte.ts`
- Implement state with `$state.raw` for nodes/edges
- Implement `computeEdgeStatus()` pure function
- Implement `$derived` for edgeStatuses, nodeVibes, globalVibe, collisions

**Acceptance Criteria:**
- [ ] `createVibeEngine()` returns reactive state object
- [ ] `computeEdgeStatus(toolA, toolB)` returns correct status
- [ ] Changing node tool triggers derived recalculation
- [ ] Unit tests pass for edge status computation

#### Task 2.2: Engine Actions
- Implement `updateNodeTool(nodeId, toolId)`
- Implement `addNode(category, position)`
- Implement `removeNode(nodeId)`
- Implement `addEdge(source, target)`
- Implement `removeEdge(edgeId)`

**Acceptance Criteria:**
- [ ] Each action properly updates raw state arrays
- [ ] State changes propagate to derived values
- [ ] No direct mutation of nodes/edges arrays

#### Task 2.3: localStorage Persistence
- Create `/src/lib/utils/storage.ts`
- Implement `saveGraph(nodes, edges)`
- Implement `loadGraph(): { nodes, edges } | null`
- Add `$effect` in engine to auto-save on changes (debounced)

**Acceptance Criteria:**
- [ ] Graph persists across page refreshes
- [ ] Corrupt data handled gracefully (loads seed instead)
- [ ] Save debounced to 500ms

---

## Phase 2: Canvas Components (Days 3-4)

### Day 3: StackNode Component

#### Task 3.1: Create StackNode Component
- Create `/src/lib/components/canvas/StackNode.svelte`
- Use Svelte 5 runes: `let { id, data, selected } = $props()`
- Implement category label, tool dropdown, vibe badge
- Add Handle components for connections

**Acceptance Criteria:**
- [ ] Node renders with category and dropdown
- [ ] Selected state shows ring highlight
- [ ] Handles visible at top (target) and bottom (source)
- [ ] No Svelte 4 patterns (no `export let`, no `$:`)

#### Task 3.2: Create ToolDropdown Component
- Create `/src/lib/components/ui/ToolDropdown.svelte`
- Filter tools by category from registry
- Style with design tokens
- Emit `onchange` with selected tool id

**Acceptance Criteria:**
- [ ] Dropdown shows only tools matching node category
- [ ] Keyboard navigable (arrow keys, enter, escape)
- [ ] Styled per DESIGN_SYSTEM.md

#### Task 3.3: Create VibeBadge Component
- Create `/src/lib/components/ui/VibeBadge.svelte`
- Implement size variants (sm, md, lg)
- Color-code based on score range
- Optional progress bar

**Acceptance Criteria:**
- [ ] Score 80-100 shows green
- [ ] Score < 40 shows red
- [ ] Null score shows "—"
- [ ] Progress bar width matches score percentage

---

### Day 4: Canvas & Edges

#### Task 4.1: Create StackEdge Component
- Create `/src/lib/components/canvas/StackEdge.svelte`
- Use `$props()` for EdgeProps
- Style based on status (NATIVE/COLLISION/NEUTRAL)
- Add collision pulse animation

**Acceptance Criteria:**
- [ ] NATIVE edges are green with subtle glow
- [ ] COLLISION edges are red with pulse animation
- [ ] NEUTRAL edges are gray
- [ ] Edge path uses smoothstep

#### Task 4.2: Create Canvas Component
- Create `/src/lib/components/canvas/Canvas.svelte`
- Initialize SvelteFlow with nodes/edges bindings
- Register custom nodeTypes and edgeTypes
- Add Background, Controls, Minimap components

**Acceptance Criteria:**
- [ ] Canvas renders with Svelte Flow
- [ ] Custom nodes display correctly
- [ ] Custom edges display correctly
- [ ] fitView on initial load

#### Task 4.3: Wire Up Engine to Canvas
- Create `/src/routes/+page.svelte`
- Initialize vibe engine with seeded graph
- Bind nodes/edges to SvelteFlow
- Handle onconnect, onnodeschange, onedgeschange

**Acceptance Criteria:**
- [ ] Seeded graph loads on first visit
- [ ] Saved graph loads on return visit
- [ ] Tool changes trigger vibe recalculation
- [ ] Edge creation triggers status computation

---

## Phase 3: Inspector & UI Polish (Days 5-6)

### Day 5: Inspector Panel

#### Task 5.1: Create InspectorPanel Component
- Create `/src/lib/components/inspector/InspectorPanel.svelte`
- Implement slide-in/out animation
- Show empty state when nothing selected

**Acceptance Criteria:**
- [ ] Panel slides in from right when selection exists
- [ ] Panel slides out when selection cleared
- [ ] Empty state shows keyboard shortcuts
- [ ] Width fixed at 320px

#### Task 5.2: Create NodeInspector Component
- Create `/src/lib/components/inspector/NodeInspector.svelte`
- Display category, tool dropdown, vibe score
- Show connection list with statuses
- Add notes textarea
- Add delete button

**Acceptance Criteria:**
- [ ] All node data displayed
- [ ] Tool change in inspector updates graph
- [ ] Notes persist to localStorage
- [ ] Delete button removes node

#### Task 5.3: Create EdgeInspector Component
- Create `/src/lib/components/inspector/EdgeInspector.svelte`
- Display source/target info
- Show status with explanation
- Implement suggestion cards for COLLISION edges
- Add delete button

**Acceptance Criteria:**
- [ ] Status displayed with correct color
- [ ] Friction reason shown when available
- [ ] Suggestions shown for collisions
- [ ] "Apply" button changes node tool

#### Task 5.4: Implement Suggestion Generation
- Add `generateSuggestions(edge)` to vibe engine
- Compute estimated vibe change for each suggestion
- Limit to 2 suggestions per direction

**Acceptance Criteria:**
- [ ] Suggestions pulled from registry.best_with
- [ ] Vibe change estimated correctly
- [ ] Max 4 suggestions total per edge

---

### Day 6: Header & Toolbar

#### Task 6.1: Create Header Component
- Create `/src/lib/components/Header.svelte`
- Logo + name
- Global vibe badge
- Navigation links (Canvas, Registry)
- Collision count badge

**Acceptance Criteria:**
- [ ] Global vibe updates reactively
- [ ] Collision badge appears when collisions > 0
- [ ] Navigation works

#### Task 6.2: Create Toolbar Component
- Create `/src/lib/components/canvas/Toolbar.svelte`
- Add node button
- Fit view button
- Zoom in/out buttons
- Zoom level display

**Acceptance Criteria:**
- [ ] Add node opens category selection
- [ ] Fit view zooms to fit all nodes
- [ ] Zoom buttons work
- [ ] Zoom level updates on pan/zoom

#### Task 6.3: Add Node Flow
- Create category selection modal/dropdown
- Place new node at sensible position
- Auto-select new node

**Acceptance Criteria:**
- [ ] Can add node via toolbar button
- [ ] Can add node via keyboard "N"
- [ ] New node placed near viewport center
- [ ] New node auto-selected, inspector opens

---

## Phase 4: Registry & Polish (Days 7-8)

### Day 7: Registry Page

#### Task 7.1: Create Registry Page
- Create `/src/routes/registry/+page.svelte`
- Display tools grouped by category
- Search input
- Category filter

**Acceptance Criteria:**
- [ ] All registry tools displayed
- [ ] Grouped by category with headers
- [ ] Search filters by name and tags
- [ ] Category dropdown filters

#### Task 7.2: Create RegistryCard Component
- Create `/src/lib/components/registry/RegistryCard.svelte`
- Display tool info, best_with, friction_with, tags
- Hover state per design system

**Acceptance Criteria:**
- [ ] All tool data displayed
- [ ] best_with in green text
- [ ] friction_with in red text
- [ ] Tags as pills

---

### Day 8: Visual Polish

#### Task 8.1: Add BackgroundBeams Component
- Create `/src/lib/components/canvas/BackgroundBeams.svelte`
- Subtle SVG beam animation
- Respect prefers-reduced-motion

**Acceptance Criteria:**
- [ ] Beams visible but very subtle (opacity 0.03-0.08)
- [ ] Animation pauses during drag
- [ ] Reduced motion disables animation

#### Task 8.2: Add Micro-interactions
- Node appear/disappear animations
- Edge color transition animations
- Vibe score count animation
- Toast notifications

**Acceptance Criteria:**
- [ ] Node fade-in on create
- [ ] Edge color transitions smoothly (300ms)
- [ ] Vibe scores animate when changing
- [ ] Toast appears for important actions

#### Task 8.3: Responsive & Accessibility Audit
- Test keyboard navigation
- Check focus indicators
- Test color contrast
- Add aria-labels

**Acceptance Criteria:**
- [ ] All actions achievable via keyboard
- [ ] Focus indicators visible
- [ ] Contrast meets WCAG AA
- [ ] Screen reader tested (VoiceOver/NVDA)

---

## Phase 5: Testing & Launch (Days 9-10)

### Day 9: Testing & Bug Fixes

#### Task 9.1: Unit Tests
- Test vibe engine computations
- Test edge status determination
- Test suggestion generation

**Acceptance Criteria:**
- [ ] All pure functions have tests
- [ ] Edge cases covered (null tools, unknown tools)
- [ ] Tests run in CI

#### Task 9.2: Integration Tests
- Test full flow: load → change tool → see ripple
- Test add/remove node
- Test add/remove edge
- Test localStorage persistence

**Acceptance Criteria:**
- [ ] Happy path works end-to-end
- [ ] Edge cases handled gracefully
- [ ] No console errors

#### Task 9.3: Bug Bash
- Manual testing of all flows
- Fix any visual glitches
- Performance check (no jank on drag)

**Acceptance Criteria:**
- [ ] All UX flows from UX_FLOW.md working
- [ ] No visual bugs
- [ ] Smooth 60fps during interactions

---

### Day 10: Documentation & Deploy

#### Task 10.1: README
- Project description
- Screenshot/GIF
- Quick start instructions
- Contributing guide
- License (MIT)

**Acceptance Criteria:**
- [ ] README is engaging and clear
- [ ] GIF shows "holy shit moment"
- [ ] Installation instructions work

#### Task 10.2: Deploy
- Configure for Vercel/Netlify
- Set up domain (bentostack.dev?)
- Test production build

**Acceptance Criteria:**
- [ ] Deploys successfully
- [ ] Production URL works
- [ ] No build warnings

#### Task 10.3: Launch Prep
- Create Twitter/X thread draft
- Create Hacker News post draft
- Prepare demo video

**Acceptance Criteria:**
- [ ] Social content ready
- [ ] Demo video recorded
- [ ] Product Hunt page prepped (optional)

---

## Not Building (Explicitly Deferred)

| Feature | Reason | When to Revisit |
|---------|--------|-----------------|
| LLM-powered suggestions | API cost, latency, prompt engineering | After initial traction |
| Live npm/docs scraping | Legal complexity, rate limits | Consider partnerships |
| Sandbox install testing | Security, resource overhead | Major feature expansion |
| Zip/boilerplate generator | Scope creep | Community request threshold |
| User accounts | Auth complexity, unnecessary for local-first | If cloud sync requested |
| Multi-graph workspaces | UI complexity | After usage patterns clear |
| Custom tool submission UI | Can use GitHub PRs for MVP | After 50+ registry PRs |
| Mobile-optimized canvas | Canvas interactions need desktop | After desktop validated |
| Light mode | Dark is the devtool standard | If explicitly requested |
| Undo/redo beyond single step | State complexity | After MVP feedback |

---

## Daily Checklist Template

```markdown
## Day X Standup

### Yesterday
- [ ] Completed:
- [ ] Blockers:

### Today
- [ ] Task X.X:
- [ ] Task X.X:

### Notes
-
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Svelte Flow v1 API changes | Pin exact version, check changelog before update |
| Registry data accuracy | Add disclaimer, encourage community PRs |
| Performance with many nodes | Test with 20+ nodes, optimize if needed |
| localStorage limits | Warn if graph too large (unlikely for 12 nodes) |
| Tailwind v4 beta issues | Have fallback to v3 if blockers |
