# BentoStack Product Specification

## Summary

BentoStack is a node-based stack orchestrator that lets developers visualize and validate their app architecture as a graph. Each node represents a technology category (Frontend, Auth, Database, ORM, etc.), users select tools from a registry, and a "vibe engine" computes compatibility scores based on declarative `best_with` / `friction_with` rules. Changes ripple through connected nodes, surfacing integration friction before it becomes production pain.

---

## Target Users

**Primary:** Solo developers and small teams (1-5 engineers) architecting greenfield projects who want to validate tech choices before committing.

**Secondary:** Technical leads evaluating stack options for team adoption; dev influencers creating "my stack" content.

**Jobs to Be Done:**
1. "Help me see if Next.js + Drizzle + Turso actually play nice together before I'm 3 weeks in."
2. "Show me what I should swap when I pick a tool that clashes with my auth layer."
3. "Give me a shareable artifact of my stack decisions for my README or portfolio."

---

## MVP Features

### In Scope
| Feature | Description |
|---------|-------------|
| **Canvas View** | Svelte Flow canvas with custom nodes; drag/pan/zoom; auto-fit on load |
| **StackNode** | Custom node: category label, tool dropdown, vibe badge (0–100), optional notes field |
| **Edge Rendering** | Edges styled by status: NATIVE (green glow), COLLISION (red pulse), NEUTRAL (gray) |
| **Vibe Engine** | Computes per-node score (average of connected edge weights) and global score (weighted average) |
| **Ripple Effect** | Changing a node's tool re-audits only its connected component, not full graph |
| **Inspector Panel** | Right-side panel showing selected node/edge details, collision explanations, suggested fixes |
| **Registry Page** | Read-only `/registry` listing all tools with categories, tags, and compatibility declarations |
| **Seeded Graph** | First-run loads a preset "Next.js starter" graph so users see vibe scores immediately |
| **Local Persistence** | Graph state saved to `localStorage`; export/import as JSON |

### Out of Scope (Not MVP)
| Feature | Reason |
|---------|--------|
| LLM-powered suggestions | Requires API cost, latency handling, prompt engineering |
| Live scraping of npm/docs | Legal complexity, rate limits, stale data issues |
| Sandbox install testing | Security sandbox, resource overhead |
| Zip/boilerplate generator | Scope creep; ship core value first |
| User accounts / cloud sync | Adds auth complexity; local-first is simpler |
| Multi-graph workspaces | UI complexity; single graph per session is fine |

---

## Definitions

| Term | Definition |
|------|------------|
| **Node** | A graph vertex representing a technology category (e.g., "Frontend Framework"). Contains a selected tool and computed vibe score. |
| **Edge** | A graph connection between two nodes indicating an integration relationship. Has a status (NATIVE/COLLISION/NEUTRAL) and optional weight. |
| **Tool** | A specific technology (e.g., "Next.js", "Prisma"). Lives in the registry with metadata. |
| **Registry** | The canonical list of tools with their `best_with`, `friction_with`, and `category` declarations. Stored as static JSON. |
| **Vibe Score** | A 0–100 integer representing compatibility health. Node vibe = f(connected edges). Global vibe = f(all nodes). |
| **Ripple** | The propagation of vibe recalculation through a connected component when any tool changes. |
| **Connected Component** | A subgraph where all nodes are reachable from each other. Ripple stays within this boundary. |
| **NATIVE** | Edge status when both tools declare `best_with` each other. Score boost: +20. |
| **COLLISION** | Edge status when either tool declares `friction_with` the other. Score penalty: -30. |
| **NEUTRAL** | Edge status when no explicit relationship exists. Score delta: 0. |

---

## "Holy Shit Moment" (< 60 seconds)

1. **0s:** User lands on `/` — sees a pre-seeded graph (Next.js + NextAuth + Prisma + PostgreSQL)
2. **5s:** Notices green glowing edges and a "Global Vibe: 87" badge in the header
3. **15s:** Clicks the "ORM" node, sees Prisma selected with "Vibe: 92"
4. **25s:** Changes ORM dropdown from Prisma → Drizzle
5. **30s:** Edges animate — Auth→ORM edge turns red (COLLISION), vibe drops to 64
6. **40s:** Inspector panel slides open: "NextAuth has friction with Drizzle (adapter compatibility)"
7. **50s:** Sees suggestion: "Consider: Lucia Auth (native Drizzle support)"
8. **60s:** User thinks: "Oh shit, this just saved me a weekend of debugging adapter issues."

---

## Success Metrics (Clout Project)

This is a portfolio/open-source clout project, not a revenue play. Metrics that matter:

| Metric | Target (90 days) | Why It Matters |
|--------|------------------|----------------|
| GitHub Stars | 500+ | Social proof, discoverability |
| Hacker News Front Page | 1 post | Launch momentum |
| Twitter/X Shares | 100+ unique | Virality signal |
| "Built with BentoStack" READMEs | 20+ | Adoption proof |
| Registry PRs from community | 10+ | Ecosystem signal |
| Demo video views | 5,000+ | Reach |
| Forks | 50+ | Engagement depth |

**Non-metrics:** Revenue, DAU, retention (not relevant for MVP clout play).

---

## Assumptions & Defaults

| Assumption | Default | Rationale |
|------------|---------|-----------|
| Compatibility is symmetric | Yes | If A has friction with B, B has friction with A. Simplifies engine; can extend later. |
| Unknown compatibility | NEUTRAL (score: 50) | Conservative; doesn't punish users for niche tools |
| Edge weight | All edges weight 1.0 | Simplifies MVP; can add priority weighting later |
| Max nodes | 12 | Prevents visual clutter; typical stack is 5-8 nodes |
| Registry source | Static JSON in repo | No backend; community PRs to add tools |
