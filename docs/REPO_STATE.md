# BentoStack Repository State

**Last Updated:** 2026-01-07
**Version:** 0.0.1
**Status:** Active Development

---

## What is BentoStack?

BentoStack is a **vibe-based stack orchestrator** built with SvelteKit 2 and Svelte 5 (Runes). It allows developers to visually compose their application stack as a graph on an interactive canvas, then watch compatibility scores propagate across connected tools using a "ripple scoring" engine.

**Core Value:** Detect friction early by modeling tool compatibility before writing code.

**Key Features:**
- Visual stack composition via Svelte Flow canvas
- Registry-driven compatibility rules (`best_with` / `friction_with`)
- Real-time "vibe" scoring that ripples through the connected component
- Evidence-backed findings (risks, fixes, greenlights) with sourced claims
- Deterministic report generation (markdown + JSON exports)
- Zero external dependencies at runtime (no LLM, no scraping)

---

## Main Flows

### 1. **Canvas → Snapshot → Report**
```
User adds nodes (tools) to canvas
  → Vibe engine calculates compatibility scores
    → Snapshot captures graph + vibes
      → Report builder generates findings
        → Export to markdown/JSON
```

### 2. **Evidence-Backed Findings**
```
Evidence packs (JSON) define risks/fixes/positives
  → Loader validates + sorts evidence deterministically
    → Builder matches evidence to stack snapshot
      → Findings include sources, confidence, severity
        → UI displays with collapsible proof sections
```

### 3. **Deterministic Output**
```
Fixed timestamp injection
  → Sorted findings (collision → risk → fix → positive → low-score)
    → Alphabetical ruleId within categories
      → Canonicalized URLs in evidence
        → Byte-identical exports for same input
```

---

## Key Modules

### Core Canvas & Engine
- **`src/lib/vibe/vibe-engine.svelte.ts`** - Ripple scoring engine (reactive Svelte 5 class)
- **`src/lib/vibe/snapshot.ts`** - Type definitions for graph snapshots
- **`src/lib/registry/registry.json`** - Tool compatibility database

### Blueprint System
- **`src/lib/blueprint/types.ts`** - Report data types (ReportData, ReportFinding, etc.)
- **`src/lib/blueprint/builders.ts`** - Core report builders:
  - `buildReportData()` - Generates findings from snapshot
  - `buildReportMarkdown()` - Markdown export with evidence
  - `buildManifest()` - Stack manifest for package.json-like output
  - `buildInstallCommand()` - Install command generator
  - `buildReadmeSnippet()` - README snippet generator

### Evidence System
- **`src/lib/evidence/types.ts`** - Evidence pack schema (kind, sourceType, confidence, severity)
- **`src/lib/evidence/load.ts`** - Evidence loader with validation gates:
  - SourceType validation (marks invalid, downgrades confidence)
  - Excerpt length enforcement (≤25 words)
  - Community-only evidence downgrade
  - Deterministic sorting by canonicalUrl
- **`src/lib/evidence/canonicalize.ts`** - URL normalization for deduplication
- **`src/lib/evidence/packs/*.json`** - 14 evidence pack files:
  - 5 risks (e.g., `prisma-orm-edge-incompatibility`)
  - 5 fixes (e.g., `prisma-accelerate-http`)
  - 2 positives (e.g., `turso-libsql-edge-native`)

### Routes
- **`src/routes/+page.svelte`** - Main canvas page (Svelte Flow)
- **`src/routes/report/+page.svelte`** - Report viewer with findings (Risks, Fixes, Greenlights)
- **`src/routes/registry/+page.svelte`** - Registry browser

### Tests
- **`src/lib/blueprint/__tests__/builders.test.ts`** - 74 tests:
  - Deterministic output validation
  - Evidence loading & schema validation
  - Fix reference gating
  - Positive finding matching
  - Finding order verification
- **`src/lib/blueprint/__tests__/fixtures/*.json`** - 11 test fixtures

---

## How to Run

### Install
```bash
pnpm install
```

### Development
```bash
pnpm dev
# Open http://localhost:5173
```

### Build
```bash
pnpm build
# Output: .svelte-kit/output/
```

### Test
```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
```

### Type Check
```bash
pnpm check
```

---

## Determinism Rules

**Where enforced:**

1. **Evidence Loader** (`src/lib/evidence/load.ts`):
   - Sorts evidence items by `canonicalUrl ?? url`
   - Uses stable `localeCompare()` (⚠️ TODO: add explicit `'en'` locale per QUICK_WINS Q1)
   - Deterministic validation (invalid sourceType always marked the same way)

2. **Report Builder** (`src/lib/blueprint/builders.ts`):
   - Fixed finding order: `[...collisions, ...risks, ...fixes, ...positives, ...lowScores]`
   - Alphabetical sort within categories: `ruleId.localeCompare(ruleId2)` (⚠️ TODO: add `'en'` locale per QUICK_WINS Q2)
   - Collision suggestions use `Set` → `Array.from().sort()`
   - Timestamp injection via parameter (tests use `FIXED_TIMESTAMP`)

3. **Tests** (`src/lib/blueprint/__tests__/builders.test.ts`):
   - All tests use `FIXED_TIMESTAMP = '2024-01-01T00:00:00.000Z'`
   - Byte-identical output validation via JSON.stringify equality
   - Deterministic ordering tests (type order + ruleId sorting)

**Not yet enforced:**
- Explicit `'en'` locale in `localeCompare()` calls (see QUICK_WINS.md Q1-Q2)
- Zod schema validation (see QUICK_WINS.md Q7)

---

## Evidence Pack Design

### Schema
```typescript
{
  ruleId: string;                              // Unique identifier
  kind: 'risk' | 'fix' | 'positive';           // Finding category
  claim: string;                               // Main assertion
  scope: string;                               // Applicability context
  severity: 'high' | 'medium' | 'low' | 'info'; // Impact level
  confidence: 'high' | 'medium' | 'low';       // Evidence quality
  tags?: string[];                             // Searchable tags
  evidence: EvidenceItem[];                    // Supporting sources
  counterEvidence: EvidenceItem[];             // Contradicting sources
  fixRuleIds?: string[];                       // Referenced fixes (for risks)
  needsVerification?: boolean;                 // Quality gate flag
}
```

### SourceType Enum (Stable)
```typescript
'official_docs'      // Official project docs
'vendor_docs'        // Vendor-specific docs (Vercel, AWS, etc.)
'github_maintainer'  // GitHub issues/discussions from maintainers
'release_notes'      // Official release notes/changelogs
'user_report'        // User-submitted reports/issues
'community'          // Community blog posts, tutorials
```

### Validation Gates
1. **Excerpt length:** Must be ≤25 words, otherwise marked `INVALID`
2. **SourceType validation:** Unknown types marked `INVALID_SOURCE_TYPE: <value>`, confidence downgraded
3. **Community-only evidence:** If all evidence is community-sourced, confidence downgraded to 'low'
4. **No primary evidence:** If no valid evidence items, `needsVerification: true`, confidence: 'low'

### Fix Gating
**Rule:** Fixes only appear in reports if referenced by fired risks via `fixRuleIds[]`.

**Example:**
- Risk `prisma-orm-edge-incompatibility` has `fixRuleIds: ['prisma-accelerate-http', 'use-edge-compatible-db-drivers']`
- If risk fires (Next.js + Prisma detected), both fixes appear
- If risk doesn't fire, fixes are hidden

### Positive Findings
**Purpose:** Boring confirmations, not marketing hype.

**Constraints:**
- Must have `severity: 'info'`
- Claim is displayed verbatim (no editorializing)
- Example: "Turso and libSQL are natively compatible with Edge Runtime via HTTP."

---

## Known Risks & Tech Debt

### High Priority
1. **Locale in localeCompare()** - Need explicit `'en'` locale for true determinism (QUICK_WINS Q1-Q2)
2. **No schema validation at runtime** - Evidence packs loaded without Zod/similar (QUICK_WINS Q7)
3. **Large UI component** - `report/+page.svelte` is 458 lines, consider splitting

### Medium Priority
4. **No integration test** - Missing full report flow test (QUICK_WINS Q6)
5. **No scope banner** - Missing "Read-only scan; not tax advice" disclaimer (QUICK_WINS Q3-Q4)
6. **Absolute timestamps** - Report shows ISO timestamps, not "2 hours ago" (QUICK_WINS Q5)

### Low Priority
7. **No empty state** - Report page has no "no findings" fallback (QUICK_WINS Q8)
8. **No const assertions** - Finding types use string literals, not const arrays (QUICK_WINS Q9)
9. **No tooltip** - Confidence scores lack explanation (QUICK_WINS Q10)

### Tech Debt Backlog
- Evidence pack matching is hardcoded (ruleId checks in builders.ts)
- No dynamic evidence pack discovery (could use glob + filter)
- Markdown export lacks configurable templates
- No CSV/PDF export options yet
- Registry editing is manual JSON (no UI)

---

## Architecture Notes

### Svelte 5 Runes
This project uses **Runes-only** mode:
- `$state()` for reactive state
- `$derived()` for computed values
- `$effect()` for side effects
- No legacy `$:` reactive statements

**Example:**
```typescript
let expandedEvidence = $state<Record<string, boolean>>({});
let risks = $state<ReportFinding[]>([]);

$effect(() => {
  risks = reportData?.findings.filter(f => f.type === 'risk') ?? [];
});
```

### Testing Philosophy
- **Determinism first:** All tests use fixed timestamps
- **Byte-identical validation:** JSON.stringify equality for output comparison
- **Golden fixtures:** Test fixtures represent real-world stack scenarios
- **Schema tests:** Validate all evidence packs conform to expected schema

### No External Runtime Dependencies
**Design constraint:** BentoStack is intentionally local-only.
- No LLM calls (evidence is pre-curated)
- No web scraping (sources are manually verified)
- No sandbox workers (registry is static JSON)

**Future:** May add optional integrations, but core functionality stays offline-capable.

---

## Directory Structure

```
bentostack/
├── src/
│   ├── lib/
│   │   ├── blueprint/           # Report generation
│   │   │   ├── __tests__/       # Tests + fixtures
│   │   │   ├── types.ts
│   │   │   └── builders.ts
│   │   ├── evidence/            # Evidence pack system
│   │   │   ├── packs/           # 14 JSON evidence packs
│   │   │   ├── types.ts
│   │   │   ├── load.ts
│   │   │   └── canonicalize.ts
│   │   ├── registry/            # Tool compatibility database
│   │   │   └── registry.json
│   │   ├── vibe/                # Scoring engine
│   │   │   ├── vibe-engine.svelte.ts
│   │   │   └── snapshot.ts
│   │   ├── components/          # UI components
│   │   └── styles/              # Global styles
│   └── routes/
│       ├── +page.svelte         # Canvas page
│       ├── report/+page.svelte  # Report viewer
│       └── registry/+page.svelte # Registry browser
├── docs/
│   ├── REPO_STATE.md            # This file
│   ├── COMMIT_PLAN.md           # Commit strategy
│   ├── CHANGELOG_UNRELEASED.md  # Unreleased changes
│   ├── AUDIT_REPORT.md          # Analysis doc
│   ├── PUNCHLIST.md             # Planning doc
│   └── QUICK_WINS.md            # Quick improvement list
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── svelte.config.js
├── vite.config.ts
└── README.md
```

---

## Contact & Contribution

**Status:** Personal/experimental project
**License:** Not yet specified
**Maintainer:** @swirky

For contributing:
1. Read this REPO_STATE.md first
2. Check QUICK_WINS.md for low-hanging fruit
3. Follow existing commit patterns (Conventional Commits)
4. Run tests before committing: `pnpm test`

---

**End of REPO_STATE.md**
