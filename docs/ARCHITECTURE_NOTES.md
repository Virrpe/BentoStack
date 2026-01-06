# BentoStack Architecture Notes

## State Architecture

### Overview

BentoStack uses a centralized vibe engine module with Svelte 5 runes for reactivity. Graph data (nodes, edges) is stored in `$state.raw` arrays to avoid deep-proxy overhead—Svelte Flow performs frequent updates during drag operations, and deep reactivity would cause unnecessary re-renders.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STATE ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │  nodes          │    │  edges          │    │  registry               │  │
│  │  $state.raw([]) │    │  $state.raw([]) │    │  static import          │  │
│  └────────┬────────┘    └────────┬────────┘    └────────────┬────────────┘  │
│           │                      │                          │               │
│           └──────────────────────┼──────────────────────────┘               │
│                                  │                                          │
│                                  ▼                                          │
│                    ┌─────────────────────────┐                              │
│                    │     VIBE ENGINE         │                              │
│                    │   vibe-engine.svelte.ts │                              │
│                    │                         │                              │
│                    │  • computeEdgeStatus()  │                              │
│                    │  • computeNodeVibe()    │                              │
│                    │  • computeGlobalVibe()  │                              │
│                    │  • findConnectedNodes() │                              │
│                    │  • generateSuggestions()│                              │
│                    └────────────┬────────────┘                              │
│                                 │                                           │
│                                 ▼                                           │
│                    ┌─────────────────────────┐                              │
│                    │   DERIVED STATE         │                              │
│                    │                         │                              │
│                    │  nodeVibes: $derived    │  ← Map<nodeId, number>       │
│                    │  edgeStatuses: $derived │  ← Map<edgeId, EdgeStatus>   │
│                    │  globalVibe: $derived   │  ← number                    │
│                    │  collisions: $derived   │  ← Edge[]                    │
│                    └─────────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core State Module: `vibe-engine.svelte.ts`

```typescript
// src/lib/engine/vibe-engine.svelte.ts

import type { Node, Edge } from '@xyflow/svelte';
import { registry } from '$lib/data/registry';

// Types
export type EdgeStatus = 'NATIVE' | 'COLLISION' | 'NEUTRAL';

export interface StackNodeData {
  category: string;
  tool: string | null;
  notes?: string;
}

export interface ComputedEdge extends Edge {
  data: {
    status: EdgeStatus;
    reason?: string;
  };
}

// Score weights
const SCORE_WEIGHTS = {
  NATIVE: 20,      // bonus for best_with match
  COLLISION: -30,  // penalty for friction_with match
  NEUTRAL: 0,      // no change for unknown
  BASE: 50,        // starting score for any edge
} as const;

// Main engine class
export function createVibeEngine() {
  // Raw state for performance
  let nodes = $state.raw<Node<StackNodeData>[]>([]);
  let edges = $state.raw<Edge[]>([]);

  // Computed edge statuses
  const edgeStatuses = $derived.by(() => {
    const statuses = new Map<string, { status: EdgeStatus; reason?: string }>();
    
    for (const edge of edges) {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (!sourceNode?.data.tool || !targetNode?.data.tool) {
        statuses.set(edge.id, { status: 'NEUTRAL', reason: 'Missing tool selection' });
        continue;
      }
      
      const result = computeEdgeStatus(sourceNode.data.tool, targetNode.data.tool);
      statuses.set(edge.id, result);
    }
    
    return statuses;
  });

  // Computed node vibes
  const nodeVibes = $derived.by(() => {
    const vibes = new Map<string, number>();
    
    for (const node of nodes) {
      if (!node.data.tool) {
        vibes.set(node.id, null);
        continue;
      }
      
      const connectedEdges = edges.filter(
        e => e.source === node.id || e.target === node.id
      );
      
      if (connectedEdges.length === 0) {
        vibes.set(node.id, null); // No connections = no vibe
        continue;
      }
      
      const scores = connectedEdges.map(e => {
        const status = edgeStatuses.get(e.id);
        return SCORE_WEIGHTS.BASE + SCORE_WEIGHTS[status?.status ?? 'NEUTRAL'];
      });
      
      const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      vibes.set(node.id, Math.max(0, Math.min(100, avgScore)));
    }
    
    return vibes;
  });

  // Global vibe (average of all node vibes)
  const globalVibe = $derived.by(() => {
    const scores = [...nodeVibes.values()].filter(v => v !== null) as number[];
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  });

  // List of collision edges
  const collisions = $derived(
    edges.filter(e => edgeStatuses.get(e.id)?.status === 'COLLISION')
  );

  return {
    // State (bind to SvelteFlow)
    get nodes() { return nodes; },
    set nodes(v) { nodes = v; },
    get edges() { return edges; },
    set edges(v) { edges = v; },
    
    // Derived (read-only)
    get edgeStatuses() { return edgeStatuses; },
    get nodeVibes() { return nodeVibes; },
    get globalVibe() { return globalVibe; },
    get collisions() { return collisions; },
    
    // Actions
    updateNodeTool,
    addNode,
    removeNode,
    addEdge,
    removeEdge,
  };
}

// Pure function: compute edge status
function computeEdgeStatus(
  toolA: string,
  toolB: string
): { status: EdgeStatus; reason?: string } {
  const regA = registry.tools[toolA];
  const regB = registry.tools[toolB];
  
  if (!regA || !regB) {
    return { status: 'NEUTRAL', reason: 'Unknown tool(s)' };
  }
  
  // Check for collision (symmetric)
  if (regA.friction_with?.includes(toolB) || regB.friction_with?.includes(toolA)) {
    const reason = regA.friction_with?.includes(toolB)
      ? regA.friction_reasons?.[toolB]
      : regB.friction_reasons?.[toolA];
    return { status: 'COLLISION', reason };
  }
  
  // Check for native (symmetric)
  if (regA.best_with?.includes(toolB) && regB.best_with?.includes(toolA)) {
    return { status: 'NATIVE' };
  }
  
  // One-way best_with = still native (generous interpretation)
  if (regA.best_with?.includes(toolB) || regB.best_with?.includes(toolA)) {
    return { status: 'NATIVE' };
  }
  
  return { status: 'NEUTRAL' };
}
```

---

## Event Model

### Node Tool Change

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ EVENT: User changes tool dropdown in StackNode                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. User selects new tool in dropdown                                       │
│     └─→ ToolDropdown.onchange(newTool)                                      │
│                                                                             │
│  2. StackNode dispatches update                                             │
│     └─→ dispatch('nodeDataChange', { id, data: { tool: newTool } })         │
│                                                                             │
│  3. Canvas handles event, updates state                                     │
│     └─→ engine.updateNodeTool(nodeId, newTool)                              │
│         ┌──────────────────────────────────────────────────────────────┐    │
│         │ function updateNodeTool(nodeId, newTool) {                   │    │
│         │   nodes = nodes.map(n =>                                     │    │
│         │     n.id === nodeId                                          │    │
│         │       ? { ...n, data: { ...n.data, tool: newTool } }         │    │
│         │       : n                                                    │    │
│         │   );                                                         │    │
│         │   // Reassigning triggers $derived recalculations            │    │
│         │ }                                                            │    │
│         └──────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  4. Derived state automatically recalculates:                               │
│     └─→ edgeStatuses (for connected edges only)                             │
│     └─→ nodeVibes (for connected nodes only)                                │
│     └─→ globalVibe                                                          │
│     └─→ collisions                                                          │
│                                                                             │
│  5. UI reactively updates:                                                  │
│     └─→ Edge colors/glows change                                            │
│     └─→ VibeBadges animate to new scores                                    │
│     └─→ Inspector panel updates if node/edge selected                       │
│                                                                             │
│  6. Persist to localStorage                                                 │
│     └─→ $effect(() => saveToStorage(nodes, edges))                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Connect Edge

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ EVENT: User drags handle to create edge                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. User drags from source handle                                           │
│     └─→ SvelteFlow shows connection line                                    │
│                                                                             │
│  2. User drops on target handle                                             │
│     └─→ SvelteFlow fires 'onconnect' event                                  │
│                                                                             │
│  3. Validate connection                                                     │
│     ┌──────────────────────────────────────────────────────────────┐        │
│     │ function isValidConnection(connection) {                     │        │
│     │   // No self-loops                                           │        │
│     │   if (connection.source === connection.target) return false; │        │
│     │                                                              │        │
│     │   // No duplicates                                           │        │
│     │   const exists = edges.some(e =>                             │        │
│     │     (e.source === connection.source &&                       │        │
│     │      e.target === connection.target) ||                      │        │
│     │     (e.source === connection.target &&                       │        │
│     │      e.target === connection.source)                         │        │
│     │   );                                                         │        │
│     │   if (exists) return false;                                  │        │
│     │                                                              │        │
│     │   // Both nodes must have tools selected                     │        │
│     │   const sourceNode = nodes.find(n => n.id === connection.source);    │
│     │   const targetNode = nodes.find(n => n.id === connection.target);    │
│     │   if (!sourceNode?.data.tool || !targetNode?.data.tool) {    │        │
│     │     showToast('Select tools for both nodes first');          │        │
│     │     return false;                                            │        │
│     │   }                                                          │        │
│     │                                                              │        │
│     │   return true;                                               │        │
│     │ }                                                            │        │
│     └──────────────────────────────────────────────────────────────┘        │
│                                                                             │
│  4. If valid, add edge                                                      │
│     └─→ engine.addEdge({ id, source, target, type: 'smoothstep' })          │
│                                                                             │
│  5. Derived state recalculates for new edge + connected nodes               │
│                                                                             │
│  6. Persist to localStorage                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Remove Edge

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ EVENT: User deletes edge (Delete key or Inspector button)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. User triggers delete                                                    │
│     └─→ keyboard: Delete/Backspace with edge selected                       │
│     └─→ or: clicks [Delete Edge] in Inspector                               │
│                                                                             │
│  2. Remove edge from state                                                  │
│     └─→ engine.removeEdge(edgeId)                                           │
│         ┌──────────────────────────────────────────────────────────────┐    │
│         │ function removeEdge(edgeId) {                                │    │
│         │   edges = edges.filter(e => e.id !== edgeId);                │    │
│         │ }                                                            │    │
│         └──────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  3. Derived state recalculates                                              │
│     └─→ edgeStatuses removes entry                                          │
│     └─→ nodeVibes for previously-connected nodes (may become null)          │
│     └─→ globalVibe                                                          │
│     └─→ collisions (may decrease)                                           │
│                                                                             │
│  4. Clear selection if deleted edge was selected                            │
│                                                                             │
│  5. Persist to localStorage                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Contracts

### Registry Schema

```typescript
// src/lib/data/registry.ts

export interface Registry {
  version: string;
  tools: Record<string, RegistryTool>;
  categories: Category[];
}

export interface RegistryTool {
  id: string;              // unique slug: "nextjs", "prisma"
  name: string;            // display name: "Next.js", "Prisma"
  category: string;        // category id: "frontend", "orm"
  description: string;     // short description (1-2 sentences)
  icon?: string;           // optional icon identifier
  url?: string;            // official website
  
  // Compatibility declarations
  best_with: string[];     // tool ids that work great with this
  friction_with: string[]; // tool ids that have integration issues
  
  // Optional: explanations for friction
  friction_reasons?: Record<string, string>;
  
  // Searchable tags
  tags: string[];
}

export interface Category {
  id: string;              // "frontend", "auth", "orm", "database"
  name: string;            // "Frontend Framework"
  description: string;
  color: string;           // for visual grouping
}

// Example entry
const exampleTool: RegistryTool = {
  id: 'nextauth',
  name: 'NextAuth.js',
  category: 'auth',
  description: 'Authentication for Next.js applications',
  url: 'https://next-auth.js.org',
  best_with: ['nextjs', 'prisma', 'postgresql'],
  friction_with: ['drizzle'],
  friction_reasons: {
    drizzle: 'NextAuth adapters require specific patterns that Drizzle does not natively support. Custom adapter implementation needed.'
  },
  tags: ['auth', 'oauth', 'sessions', 'nextjs']
};
```

### Node Data Shape

```typescript
// Used by SvelteFlow and our engine

export interface StackNodeData {
  category: string;        // matches Category.id
  tool: string | null;     // matches RegistryTool.id, null if not selected
  notes?: string;          // user-entered notes
  
  // Computed (injected by engine, not persisted)
  vibe?: number | null;
  hasCollision?: boolean;
}

export interface StackNode extends Node<StackNodeData> {
  type: 'stack';           // maps to StackNode.svelte component
}
```

### Edge Data Shape

```typescript
export interface StackEdgeData {
  // Computed by engine
  status: EdgeStatus;
  reason?: string;
}

export interface StackEdge extends Edge<StackEdgeData> {
  type: 'stack';           // maps to StackEdge.svelte component
}
```

### localStorage Schema

```typescript
// Key: 'bentostack:graph'
interface PersistedGraph {
  version: number;         // schema version for migrations
  nodes: PersistedNode[];
  edges: PersistedEdge[];
  viewport?: Viewport;     // { x, y, zoom }
}

interface PersistedNode {
  id: string;
  position: { x: number; y: number };
  data: {
    category: string;
    tool: string | null;
    notes?: string;
  };
}

interface PersistedEdge {
  id: string;
  source: string;
  target: string;
}
```

---

## No-Ambiguity Decisions

### 1. Symmetric vs Asymmetric Compatibility

**Decision:** Symmetric

**Rationale:**
- If Tool A declares `friction_with: ['B']`, we treat it as mutual friction
- This simplifies the mental model: "these two don't play well together"
- Real-world friction is almost always symmetric (adapter issues, API mismatches)
- Reduces registry maintenance burden (don't need to declare both directions)
- Edge status is computed once, not twice

**Implementation:**
```typescript
function computeEdgeStatus(toolA: string, toolB: string) {
  // Check friction in EITHER direction → COLLISION
  if (regA.friction_with?.includes(toolB) || regB.friction_with?.includes(toolA)) {
    return { status: 'COLLISION' };
  }
  // ...
}
```

### 2. Unknown Compatibility Handling

**Decision:** NEUTRAL with base score of 50

**Rationale:**
- We can't assume tools are compatible just because we don't have data
- We also shouldn't punish users for using niche/new tools
- Score of 50 is the "no opinion" midpoint
- Encourages community to add compatibility data via PRs
- Unknown tools still render, just with no vibe bonuses

**Implementation:**
```typescript
if (!regA || !regB) {
  return { status: 'NEUTRAL', reason: 'Unknown tool(s)' };
}
// ...
const SCORE_WEIGHTS = {
  NEUTRAL: 0,  // No bonus or penalty
  BASE: 50,    // Starting point
};
```

### 3. Multi-Edge / Cycles Behavior

**Decision:** Allowed with no special handling

**Rationale:**
- Real stacks have cycles (Frontend↔Auth↔DB↔ORM↔Frontend)
- Cycles don't break our computation model (no recursion in vibe calc)
- Each edge is evaluated independently
- Node vibe = average of all connected edges (regardless of structure)
- No need to detect or prevent cycles in MVP

**What we prevent:**
- Self-loops (node connecting to itself) → rejected at validation
- Duplicate edges (same source/target pair) → rejected at validation
- Edges without tool selections → allowed but marked NEUTRAL

### 4. Suggestion Generation

**Decision:** Rule-based lookup from registry

**Rationale:**
- No LLM = deterministic, fast, offline-capable
- Suggestions come from `best_with` declarations in registry
- For a collision edge A↔B, we suggest tools that are `best_with` the non-changed tool

**Algorithm:**
```typescript
function generateSuggestions(edge: Edge): Suggestion[] {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);
  const suggestions: Suggestion[] = [];
  
  // Suggest alternatives for source tool
  const sourceAlternatives = Object.values(registry.tools)
    .filter(t => 
      t.category === sourceNode.data.category &&  // Same category
      t.id !== sourceNode.data.tool &&            // Different tool
      t.best_with?.includes(targetNode.data.tool) // Compatible with target
    )
    .slice(0, 2);  // Max 2 suggestions per direction
  
  for (const alt of sourceAlternatives) {
    suggestions.push({
      id: `change-source-${alt.id}`,
      action: `Change ${registry.categories[sourceNode.data.category].name} to:`,
      tool: alt.name,
      toolId: alt.id,
      reason: alt.best_with?.includes(targetNode.data.tool) 
        ? 'Native integration' 
        : 'No known friction',
      nodeId: sourceNode.id,
      vibeChange: estimateVibeChange(sourceNode, alt.id),
    });
  }
  
  // Same for target tool...
  
  return suggestions;
}

function estimateVibeChange(node: Node, newToolId: string): number {
  // Simulate the change and compute delta
  const currentVibe = nodeVibes.get(node.id) ?? 50;
  const simulatedVibe = simulateNodeVibe(node.id, newToolId);
  return simulatedVibe - currentVibe;
}
```

### 5. Edge Weight Priority

**Decision:** All edges equal weight (1.0) for MVP

**Rationale:**
- Simpler mental model
- Avoids "which connection matters more?" debates
- Can extend later with categories like "critical path" vs "nice to have"

**Future extension hook:**
```typescript
// Not implemented in MVP, but structure supports it
interface Edge {
  data: {
    weight?: number;  // 0.0-1.0, default 1.0
  };
}
```

### 6. Ripple Scope

**Decision:** Connected component only (not full graph)

**Rationale:**
- Changing Frontend tool shouldn't recalculate unconnected Testing node
- Performance optimization for larger graphs
- More intuitive: "my change only affects things connected to me"

**Implementation:**
```typescript
function findConnectedComponent(startNodeId: string): Set<string> {
  const visited = new Set<string>();
  const queue = [startNodeId];
  
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    
    // Find all edges touching this node
    const connectedEdges = edges.filter(
      e => e.source === nodeId || e.target === nodeId
    );
    
    // Add connected nodes to queue
    for (const edge of connectedEdges) {
      const otherId = edge.source === nodeId ? edge.target : edge.source;
      if (!visited.has(otherId)) {
        queue.push(otherId);
      }
    }
  }
  
  return visited;
}
```

---

## Performance Considerations

1. **`$state.raw` for graph data:** Avoids deep proxy overhead during drag operations
2. **`$derived.by` for complex computations:** Memoized, only recalculates when dependencies change
3. **No full-graph recalc:** Ripple stays within connected component
4. **Edge status caching:** Computed once per edge, stored in Map
5. **Debounced localStorage saves:** Don't write on every micro-update
6. **Pause animations during drag:** Reduce compositor work

```typescript
// Debounced persistence
let saveTimeout: number;
$effect(() => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    localStorage.setItem('bentostack:graph', JSON.stringify({
      version: 1,
      nodes: nodes.map(serializeNode),
      edges: edges.map(serializeEdge),
    }));
  }, 500);
});
```
