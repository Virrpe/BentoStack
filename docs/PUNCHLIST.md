# Bentostack Punchlist

**Date:** 2026-01-07  
**Scope:** Read-only structural scan; not tax advice  

---

## Critical (P0 - Immediate)

| # | Severity | Impact | File(s) | Suggested Approach |
|---|----------|--------|---------|-------------------|
| C1 | Critical | Runtime safety | [`src/lib/evidence/load.ts`](src/lib/evidence/load.ts) | Add Zod schema validation for EvidencePack JSON files at load time |
| C2 | Critical | Data integrity | [`src/lib/evidence/packs/*.json`](src/lib/evidence/packs/) | Add CI pipeline that validates all EvidencePack JSON files against schema |

**C1 Details:** JSON files are currently loaded directly via `import.meta.glob` without validation. A malformed EvidencePack could crash the report builder or produce incorrect results.

**Suggested schema validation:**
```typescript
// Add to src/lib/evidence/load.ts
import { z } from 'zod';

const EvidenceItemSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  excerpt: z.string().max(250),
  sourceType: z.enum(['official_docs', 'vendor_docs', 'github_maintainer', 'release_notes', 'user_report', 'community']),
  accessedAt: z.string().datetime()
});

const EvidencePackSchema = z.object({
  ruleId: z.string(),
  kind: z.enum(['risk', 'fix', 'positive']),
  claim: z.string(),
  scope: z.string(),
  severity: z.enum(['high', 'medium', 'low', 'info']),
  confidence: z.enum(['high', 'medium', 'low']),
  tags: z.array(z.string()).optional(),
  evidence: z.array(EvidenceItemSchema),
  counterEvidence: z.array(EvidenceItemSchema),
  fixRuleIds: z.array(z.string()).optional(),
  needsVerification: z.boolean().optional()
});

function validateEvidencePack(pack: unknown, filePath: string): EvidencePack {
  const result = EvidencePackSchema.safeParse(pack);
  if (!result.success) {
    throw new Error(`Invalid EvidencePack at ${filePath}: ${result.error.message}`);
  }
  return result.data;
}
```

---

## High (P1 - This Sprint)

| # | Severity | Impact | File(s) | Suggested Approach |
|---|----------|--------|---------|-------------------|
| H1 | High | Determinism | [`src/lib/blueprint/builders.ts:79`](src/lib/blueprint/builders.ts:79), [`src/lib/blueprint/builders.ts:169`](src/lib/blueprint/builders.ts:169) | Accept optional `timestamp` parameter, default to `FIXED_TIMESTAMP` from tests |
| H2 | High | Regression safety | [`src/lib/blueprint/__tests__/builders.test.ts`](src/lib/blueprint/__tests__/builders.test.ts) | Add integration test for full report flow: canvas -> report -> export |
| H3 | High | Type safety | [`src/lib/evidence/load.ts`](src/lib/evidence/load.ts) | Add runtime validation for sourceType field in evidence items |

**H1 Details:** Currently `new Date().toISOString()` is used for `generatedAt` timestamp, making reports non-deterministic across runs. Tests already use `FIXED_TIMESTAMP = '2024-01-01T00:00:00.000Z'`.

**Suggested fix for builders.ts:79:**
```typescript
// Current
generatedAt: new Date().toISOString(),

// Proposed
generatedAt: timestamp ?? FIXED_TIMESTAMP,
```

**H2 Details:** 723 unit tests exist but no end-to-end test verifies the complete flow from graph -> report -> export.

**Suggested integration test structure:**
```typescript
it('generates deterministic report from seed-graph', async () => {
  const graph = loadFixture('seed-graph.json');
  const manifest = buildManifest(graph);
  const reportData = buildReportData(manifest, FIXED_TIMESTAMP);
  const markdown = buildReportMarkdown(reportData, FIXED_TIMESTAMP);
  
  expect(reportData).toMatchGolden('seed-graph.report.json');
  expect(markdown).toMatchGolden('seed-graph.report.md');
});
```

---

## Medium (P2 - Next Cycle)

| # | Severity | Impact | File(s) | Suggested Approach |
|---|----------|--------|---------|-------------------|
| M1 | Medium | Determinism | [`src/lib/evidence/load.ts:56-61`](src/lib/evidence/load.ts:56-61), [`src/lib/blueprint/builders.ts:38-43`](src/lib/blueprint/builders.ts:38-43) | Add explicit `'en'` locale to all `localeCompare()` calls |
| M2 | Medium | Maintainability | [`src/lib/blueprint/builders.ts:25`](src/lib/blueprint/builders.ts:25), [`src/lib/blueprint/builders.ts:121`](src/lib/blueprint/builders.ts:121), [`src/lib/import/packagejson.ts:98`](src/lib/import/packagejson.ts:98) | Extract category order to shared constants file |
| M3 | Medium | User trust | [`src/routes/report/+page.svelte`](src/routes/report/+page.svelte) | Add visual indicator when confidence is downgraded from community sources |
| M4 | Medium | Input validation | [`src/lib/import/packagejson.ts`](src/lib/import/packagejson.ts) | Add validation for invalid package.json structure |
| M5 | Medium | Error handling | [`src/routes/+page.svelte`](src/routes/+page.svelte) | Add error boundary and visible error states for malformed graphs |

**M1 Details:** `localeCompare()` without locale parameter uses system locale, which could vary across environments.

**Suggested fix for load.ts:56:**
```typescript
// Current
evidence.sort((a, b) => canonicalUrl(a.url).localeCompare(canonicalUrl(b.url)));

// Proposed  
evidence.sort((a, b) => canonicalUrl(a.url).localeCompare(canonicalUrl(b.url), 'en'));
```

**M2 Details:** Category order is hardcoded in 3 locations. Extract to `src/lib/constants/category-order.ts`:

```typescript
// src/lib/constants/category-order.ts
export const CATEGORY_ORDER = [
  'framework',
  'meta-framework', 
  'runtime',
  'database',
  'orm',
  'auth',
  'storage',
  'ui',
  'tooling',
  'deployment'
] as const;

export type Category = typeof CATEGORY_ORDER[number];
```

---

## Low (P3 - Backlog)

| # | Severity | Impact | File(s) | Suggested Approach |
|---|----------|--------|---------|-------------------|
| L1 | Low | UX | [`src/routes/report/+page.svelte`](src/routes/report/+page.svelte) | Add empty state component when no findings exist |
| L2 | Low | Accessibility | [`src/routes/+page.svelte`](src/routes/+page.svelte) | Add keyboard navigation for canvas (pan, zoom, select) |
| L3 | Low | UX | [`src/routes/report/+page.svelte`](src/routes/report/+page.svelte) | Add search/filter UI for findings by severity or text |
| L4 | Low | UX | [`src/routes/+page.svelte`](src/routes/+page.svelte) | Add tooltip or inline help explaining confidence scores |
| L5 | Low | Performance | [`src/lib/evidence/load.ts`](src/lib/evidence/load.ts) | Consider lazy loading evidence packs if count exceeds 50 |
| L6 | Low | Maintainability | [`src/lib/blueprint/builders.ts:35`](src/lib/blueprint/builders.ts:35) | Use const assertions for finding type literals |
| L7 | Low | UX | [`src/routes/report/+page.svelte:159`](src/routes/report/+page.svelte:159) | Consider relative timestamps for UI ("2 hours ago") |
| L8 | Low | Testing | [`src/lib/blueprint/__tests__/builders.test.ts`](src/lib/blueprint/__tests__/builders.test.ts) | Add test for `localeCompare` locale sensitivity |
| L9 | Low | Testing | [`src/lib/blueprint/__tests__/builders.test.ts`](src/lib/blueprint/__tests__/builders.test.ts) | Add test for empty evidence array handling |
| L10 | Low | Testing | [`src/lib/blueprint/__tests__/builders.test.ts`](src/lib/blueprint/__tests__/builders.test.ts) | Add test for malformed URL canonicalization |

**L6 Details:** String literals for finding types should use const assertions for type safety:

```typescript
// Current
type FindingType = 'collision' | 'risk' | 'fix' | 'positive' | 'low-score';

// Proposed
const FINDING_TYPES = ['collision', 'risk', 'fix', 'positive', 'low-score'] as const;
type FindingType = typeof FINDING_TYPES[number];
```

---

## Effort Estimation Guide

| Size | Description |
|------|-------------|
| **S** (Small) | Changes in 1-2 files, <50 lines, minimal testing |
| **M** (Medium) | Changes in 2-4 files, 50-200 lines, some testing |
| **L** (Large) | Changes in 5+ files, 200+ lines, comprehensive testing |

---

**Punchlist completed.**
