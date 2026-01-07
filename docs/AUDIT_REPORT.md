# Bentostack Codebase Audit Report

**Date:** 2026-01-07  
**Scope:** Read-only structural scan; not tax advice  
**Audit Type:** Comprehensive codebase analysis

## 1. What The App Does

### User Journey + Primary Value Proposition

Bentostack is a SvelteKit-based tool that:
1. **Visualizes tech stacks** as interactive node-edge graphs using @xyflow/svelte
2. **Generates deterministic, evidence-backed reports** analyzing stack compatibility
3. **Produces EvidencePacks** with risk/fix/positive findings backed by source citations
4. **Exports byte-identical reports** (JSON + Markdown) for reproducibility

**Primary Value Proposition:** Provides confidence-calibrated stack analysis where every claim is traceable to evidence, with automatic confidence downgrades for ungrounded assertions.

### Key User Flows
- **Canvas Flow:** Import package.json -> visualize stack -> inspect nodes/edges -> generate report
- **Report Flow:** View risks/fixes/greenlights -> expand proof blocks -> export deterministic artifacts

## 2. Architecture Map

### Tech Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Framework | SvelteKit | ^2.0.0 |
| UI Library | Svelte | ^5.0.0 |
| Build Tool | Vite | ^6.0.0 |
| Testing | Vitest | ^2.0.0 |
| Flow Visualization | @xyflow/svelte | ^1.0.0 |
| Styling | Tailwind CSS | ^4.0.0 |
| Language | TypeScript | ^5.0.0 |

### Major Modules

| Module | Location | Purpose |
|--------|----------|---------|
| Evidence System | `src/lib/evidence/` | Types, loading, canonicalization, quality gates |
| Blueprint Builders | `src/lib/blueprint/builders.ts` | Report pipeline: manifest -> data -> markdown |
| Vibe Engine | `src/lib/vibe/vibe-engine.svelte.ts` | Stack scoring and compatibility analysis |
| Registry | `src/lib/registry/` | Tool catalog with compatibility metadata |
| Import | `src/lib/import/packagejson.ts` | package.json parsing and graph inference |

### Data Flow Diagram

```
package.json
    |
[Import Parser] -> FlowGraph (nodes + edges)
    |
[Vibe Engine] -> VibeSnapshot (scores + relationships)
    |
[Blueprint Builder] -> EvidencePack matching -> ReportData
    |
[Export] -> REPORT.json + REPORT.md
```

### Entry Points
- **Root:** `src/routes/+page.svelte` - Canvas visualization
- **Report:** `src/routes/report/+page.svelte` - Evidence-backed reports
- **Registry:** `src/routes/registry/+page.svelte` - Tool registry browser

## 3. Determinism Assessment

### What Is Deterministic

| Component | Location | Mechanism |
|-----------|----------|-----------|
| Evidence loading | `src/lib/evidence/load.ts:101` | `import.meta.glob` with eager loading |
| URL canonicalization | `src/lib/evidence/canonicalize.ts` | Pure function, no side effects |
| Evidence sorting | `src/lib/evidence/load.ts:56-61` | `localeCompare` on canonical URLs |
| Tool ordering | `src/lib/blueprint/builders.ts:38-43` | Category order + localeCompare |
| Node ordering | `src/lib/blueprint/builders.ts:52-57` | Category order + id |
| Edge ordering | `src/lib/blueprint/builders.ts:71-75` | Source -> target -> id |
| Findings order | `src/lib/blueprint/builders.ts:338-343` | Type order + ruleId |
| Sources footer | `src/lib/blueprint/builders.ts:551` | `Array.from(Set).sort()` |
| Test fixtures | `src/lib/blueprint/__tests__/builders.test.ts:37` | `FIXED_TIMESTAMP` constant |

### What Might Not Be Deterministic

| Source | Location | Impact | Severity |
|--------|----------|--------|----------|
| `crypto.randomUUID()` | `src/lib/import/packagejson.ts:125` | Edge IDs in inferred graphs | Low (only affects import feature) |
| `new Date().toISOString()` | `src/lib/utils/storage.ts:22` | `savedAt` timestamp in localStorage | Low (client-side only) |
| `new Date().toISOString()` | `src/lib/utils/storage.ts:67` | Export filename timestamp | Low (client-side only) |
| `new Date().toISOString()` | `src/lib/blueprint/builders.ts:79` | `generatedAt` in manifest | Medium (affects report output) |
| `new Date().toISOString()` | `src/lib/blueprint/builders.ts:169` | Report timestamp | Medium (affects report output) |
| `toLocaleString()` | `src/routes/report/+page.svelte:159` | UI display of timestamp | Low (cosmetic only) |
| `localeCompare` (implicit locale) | Multiple sorting functions | Sorting could vary by system locale | Low |

### Hardening Recommendations

1. **Timestamp parameterization:** The report builder accepts optional `timestamp` parameter. Tests use `FIXED_TIMESTAMP = '2024-01-01T00:00:00.000Z'`. Consider making this the default or adding a "freeze mode" flag.

2. **Explicit locale for sorting:** Replace `localeCompare()` with `localeCompare('en')` to ensure consistent ordering across locales.

3. **UUID isolation:** The `crypto.randomUUID()` in import parser only affects client-side graph inference, not report output. Acceptable for now.

## 4. Correctness Assessment

### Evidence Quality Gates

**Location:** `src/lib/evidence/load.ts:67-93`

| Condition | Action |
|-----------|--------|
| No primary evidence | `confidence: 'low'`, `needsVerification: true` |
| Only community sources + high confidence | `confidence: 'medium'` |
| Excerpt > 25 words | `note: 'INVALID: Excerpt exceeds 25 words'` |
| Invalid sourceType | `note: 'INVALID_SOURCE_TYPE: ...'` |

### Risk of False Positives/Negatives

**False Positive Mitigations:**
- Confidence downgrades for community-only sources
- `needsVerification` flag for ungrounded claims
- Scope field defines applicability boundaries

**False Negative Risks:**
- No automated validation that claim/scope are specific enough
- Manual review required for scope adequacy
- Evidence packs are committed JSON - no runtime validation

### Rule Matching Logic

**Location:** `src/lib/blueprint/builders.ts:200-350`

Matching algorithm:
1. Extract tool identifiers from graph nodes
2. Query evidence packs by ruleId patterns
3. Apply quality gates (confidence downgrade rules)
4. Sort findings by type order: collision -> risk -> fix -> positive -> low-score

**Correctness Concerns:**
- Rule matching appears string-based, not semantic
- No fuzzy matching for tool variants/aliases
- Evidence packs are static - no version checking

## 5. Security Assessment

### XSS & Injection Risks

| Location | Risk | Assessment |
|----------|------|------------|
| `src/routes/report/+page.svelte:233` | `href={item.url}` | Uses attribute binding, not innerHTML |
| `src/routes/report/+page.svelte:255` | `href={item.url}` | Uses attribute binding |
| `src/routes/report/+page.svelte:333` | `href={item.url}` | Uses attribute binding |
| `src/routes/report/+page.svelte:355` | `href={item.url}` | Uses attribute binding |
| `src/routes/report/+page.svelte:425` | `href={item.url}` | Uses attribute binding |
| `src/routes/report/+page.svelte:495` | `href={item.url}` | Uses attribute binding |

**Finding:** All URL rendering uses Svelte attribute binding (`href={item.url}`), which properly escapes HTML entities. No innerHTML usage for untrusted content.

### Markdown Rendering

**Location:** `src/lib/blueprint/builders.ts:438-559`

**Risk:** Markdown output includes `<details>` HTML tags (line 395). If rendered in a context that interprets HTML, there could be XSS risk.

**Mitigation:** Markdown is downloaded as a file (`REPORT.md`), not rendered as HTML in the app. Users who render this markdown externally should use a sanitizing parser.

### import.meta.glob Usage

**Location:** `src/lib/evidence/load.ts:101`

```typescript
const packFiles = import.meta.glob<EvidencePack>('./packs/*.json', { eager: true, import: 'default' });
```

**Assessment:**
- Uses `eager: true` - all packs loaded at build time
- JSON files are committed sources, not user-provided
- No runtime file system access
- Type-safe with `<EvidencePack>` generic

### Blueprint Content Surfacing

**Location:** `src/routes/report/+page.svelte:138`

**Assessment:** Install commands are built from registry data (`npm_install` field), not user input. No direct user content rendering in blueprints.

### Security Verdict

**LOW RISK** - No XSS vulnerabilities detected. All untrusted content is properly escaped via Svelte's attribute binding. Markdown output is file-based, not HTML-rendered.

## 6. Performance Assessment

### Bundle Impact

| Component | Loading Strategy | Impact |
|-----------|------------------|--------|
| Evidence packs | `import.meta.glob` eager | ~12 JSON files bundled (~50KB) |
| Registry | Static JSON import | Single file (~100KB) |
| Svelte Flow | Dynamic import | Lazy-loaded |

### Rendering Costs

**State Management:** `src/lib/vibe/vibe-engine.svelte.ts:34-35`

Uses `$state.raw` to avoid deep proxy overhead during drag operations (per Svelte Flow performance guidance).

**Derived Computations:** `src/lib/vibe/vibe-engine.svelte.ts:44-50`

Efficient memoization; only recalculates when dependencies change.

### Performance Concerns

1. **Eager evidence loading:** 12 JSON files bundled at build time. If packs grow to 100+ files, consider lazy loading.

2. **Registry size:** `registry.json` is ~100KB. Consider lazy loading for registry page.

3. **No virtualization:** Report page renders all findings inline. For large stacks with many findings, consider virtual scrolling.

## 7. Maintainability Assessment

### Type Coverage

| Module | Type Safety | Notes |
|--------|-------------|-------|
| Evidence types | Full | `src/lib/evidence/types.ts` complete |
| Registry schema | Full | `src/lib/registry/schema.ts` complete |
| Blueprint types | Full | `src/lib/blueprint/types.ts` complete |
| Graph types | Full | `src/lib/graph/graph-types.ts` complete |
| Vibe engine | Full | `src/lib/vibe/vibe-engine.svelte.ts` typed |

### Module Boundaries

**Strong Boundaries:**
- Evidence system isolated in `src/lib/evidence/`
- Registry isolated in `src/lib/registry/`
- Blueprint builders isolated in `src/lib/blueprint/`
- Vibe engine isolated in `src/lib/vibe/`

**Weak Boundaries:**
- `src/lib/vibe/vibe-engine.svelte.ts` imports from `registry.json` directly
- `src/routes/report/+page.svelte` couples UI with business logic

### Coupling Issues

| Issue | Location | Recommendation |
|-------|----------|----------------|
| Hard-coded category order | `src/lib/blueprint/builders.ts:25` | Extract to constants |
| Hard-coded category order | `src/lib/blueprint/builders.ts:121` | Extract to constants |
| Hard-coded category order | `src/lib/import/packagejson.ts:98` | Extract to constants |
| String literal finding types | `src/lib/blueprint/builders.ts:35` | Use const assertions |

### Test Coverage

**Test Suite:** `src/lib/blueprint/__tests__/builders.test.ts:1-723`

**Coverage:**
- Determinism tests (byte-identical exports)
- Evidence system tests (URL canonicalization, loading, quality gates)
- Schema validation tests (kind, sourceType, severity, fix references)
- Finding order tests (type order, ruleId sorting)

**Coverage Gaps:**
- No schema validation for EvidencePack JSON files (loaded directly without Zod validation)
- No test for `localeCompare` locale sensitivity
- No test for edge case: empty evidence array
- No test for malformed URLs
- No integration test for full report flow

## 8. Product Gaps

### What Would Make This Feel Like a Real Product

1. **Onboarding:** No walkthrough for first-time users. Canvas starts empty with no guidance.

2. **Error Handling:** No visible error states for invalid package.json or malformed graphs.

3. **Loading States:** No skeleton screens or progress indicators for report generation.

4. **Export Options:** Only JSON and Markdown. Consider PDF, HTML, or shareable links.

5. **Search/Filter:** No way to search findings or filter by severity/confidence in UI.

6. **History/Versioning:** No way to compare reports across different stack versions.

7. **Shareability:** No way to share a stack configuration or report via URL.

8. **Tooltips/Help:** No inline help or tooltips explaining confidence scores or evidence types.

9. **Keyboard Navigation:** No keyboard shortcuts for common actions.

10. **Accessibility:** No ARIA labels or keyboard navigation for canvas elements.

## 9. Red Flags

### Critical (Immediate Action Required)

| # | Issue | Location | Evidence |
|---|-------|----------|----------|
| C1 | **No EvidencePack schema validation** | `src/lib/evidence/load.ts:101` | JSON files loaded directly without Zod/type validation. Malformed EvidencePack could crash runtime. |

### High (Should Address Soon)

| # | Issue | Location | Evidence |
|---|-------|----------|----------|
| H1 | **Timestamps in deterministic output** | `src/lib/blueprint/builders.ts:79`, `src/lib/blueprint/builders.ts:169` | `new Date().toISOString()` used for `generatedAt` and report timestamp. Reports are not byte-identical across runs. |
| H2 | **No integration tests** | `src/lib/blueprint/__tests__/builders.test.ts` | 723 unit tests but no end-to-end test for full report flow. Regression risk. |

### Medium (Plan For Next Cycle)

| # | Issue | Location | Evidence |
|---|-------|----------|----------|
| M1 | **Implicit locale in sorting** | `src/lib/evidence/load.ts:56-61`, `src/lib/blueprint/builders.ts:38-43` | `localeCompare()` without locale parameter. Sorting could vary by system locale. |
| M2 | **Hard-coded category orders** | `src/lib/blueprint/builders.ts:25`, `src/lib/blueprint/builders.ts:121`, `src/lib/import/packagejson.ts:98` | Category order defined as string arrays in multiple locations. Maintenance burden. |
| M3 | **Community sources trigger only medium downgrade** | `src/lib/evidence/load.ts:84-90` | Community sources downgrade from high to medium, but no visual distinction in UI. Users may miss confidence reduction. |

### Low (Nice To Have)

| # | Issue | Location | Evidence |
|---|-------|----------|----------|
| L1 | **No empty state handling** | `src/routes/report/+page.svelte` | No visible state when graph has no findings. Empty report shows nothing. |
| L2 | **No keyboard navigation** | `src/routes/+page.svelte` | Canvas requires mouse interaction. Power users need keyboard shortcuts. |
| L3 | **No search/filter UI** | `src/routes/report/+page.svelte` | Finding list is flat. No way to filter by severity or search text. |

---

**Audit completed.**