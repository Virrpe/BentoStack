# Bentostack Quick Wins

**Date:** 2026-01-07  
**Scope:** Read-only structural scan; not tax advice  

---

## Quick Wins (Low-Effort, High-Impact)

| # | Effort | Impact | File | Change |
|---|--------|--------|------|--------|
| Q1 | S | High | [`src/lib/evidence/load.ts`](src/lib/evidence/load.ts:56) | Add `'en'` locale to `localeCompare()` for deterministic sorting |
| Q2 | S | High | [`src/lib/blueprint/builders.ts`](src/lib/blueprint/builders.ts:38) | Add `'en'` locale to `localeCompare()` for category sorting |
| Q3 | S | Medium | [`src/routes/+page.svelte`](src/routes/+page.svelte:1) | Add scope banner: "Read-only structural scan; not tax advice" |
| Q4 | S | Medium | [`src/routes/report/+page.svelte`](src/routes/report/+page.svelte:1) | Add scope banner to report page |
| Q5 | S | Medium | [`src/routes/report/+page.svelte`](src/routes/report/+page.svelte:159) | Use relative timestamps ("2 hours ago") for findings |
| Q6 | M | High | [`src/lib/blueprint/__tests__/builders.test.ts`](src/lib/blueprint/__tests__/builders.test.ts) | Add integration test for full report flow |
| Q7 | M | Medium | [`src/lib/evidence/load.ts`](src/lib/evidence/load.ts) | Add Zod schema validation for EvidencePack at load time |
| Q8 | S | Low | [`src/routes/report/+page.svelte`](src/routes/report/+page.svelte) | Add empty state component when no findings exist |
| Q9 | S | Low | [`src/lib/blueprint/builders.ts`](src/lib/blueprint/builders.ts:35) | Use const assertions for finding type literals |
| Q10 | S | Low | [`src/routes/+page.svelte`](src/routes/+page.svelte) | Add tooltip explaining confidence scores |

---

## Q1-Q2: Add Explicit Locale to localeCompare()

```typescript
// Before (non-deterministic)
evidence.sort((a, b) => canonicalUrl(a.url).localeCompare(canonicalUrl(b.url)));

// After (deterministic)
evidence.sort((a, b) => canonicalUrl(a.url).localeCompare(canonicalUrl(b.url), 'en'));
```

**Files to modify:**
- `src/lib/evidence/load.ts` (lines 56-61)
- `src/lib/blueprint/builders.ts` (lines 38-43)

---

## Q3-Q4: Add Scope Banner

```svelte
<!-- Add to src/routes/+page.svelte and src/routes/report/+page.svelte -->
<div class="scope-banner">
  <p>Read-only structural scan; not tax advice.</p>
</div>

<style>
.scope-banner {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: #92400e;
}
</style>
```

---

## Q5: Relative Timestamps

```typescript
// Before
accessedAt: '2024-01-15T10:30:00.000Z'

// After (format in UI)
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return 'Just now';
}
```

---

## Q6: Integration Test for Full Report Flow

```typescript
// Add to src/lib/blueprint/__tests__/builders.test.ts
it('generates deterministic report from seed-graph', async () => {
  const FIXED_TIMESTAMP = '2024-01-01T00:00:00.000Z';
  const graph = loadFixture('seed-graph.json');
  
  const manifest = buildManifest(graph);
  const reportData = buildReportData(manifest, FIXED_TIMESTAMP);
  const markdown = buildReportMarkdown(reportData, FIXED_TIMESTAMP);
  
  // Verify determinism with golden fixtures
  expect(reportData).toMatchGolden('seed-graph.report.json');
  expect(markdown).toMatchGolden('seed-graph.report.md');
});
```

---

## Q7: Zod Schema Validation

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

// Wrap loadEvidencePacks to validate on load
export function loadEvidencePacks(): EvidencePack[] {
  const modules = import.meta.glob('./packs/*.json', { eager: true });
  return Object.entries(modules).map(([path, mod]) => {
    const pack = (mod as { default: unknown }).default;
    const result = EvidencePackSchema.safeParse(pack);
    if (!result.success) {
      console.error(`Invalid EvidencePack at ${path}:`, result.error.message);
      return null;
    }
    return result.data;
  }).filter(Boolean) as EvidencePack[];
}
```

---

## Q8: Empty State Component

```svelte
<!-- Add to src/routes/report/+page.svelte -->
{#if findings.length === 0}
  <div class="empty-state">
    <h3>No findings detected</h3>
    <p>Your stack appears to be well-structured with no detected issues.</p>
  </div>
{/if}

<style>
.empty-state {
  text-align: center;
  padding: 3rem;
  background: #f0fdf4;
  border: 1px solid #22c55e;
  border-radius: 8px;
}
</style>
```

---

## Q9: Const Assertions for Finding Types

```typescript
// Before
type FindingType = 'collision' | 'risk' | 'fix' | 'positive' | 'low-score';

// After
const FINDING_TYPES = ['collision', 'risk', 'fix', 'positive', 'low-score'] as const;
type FindingType = typeof FINDING_TYPES[number];

// Usage
const isValidFindingType = (t: string): t is FindingType => 
  FINDING_TYPES.includes(t as FindingType);
```

---

## Q10: Confidence Score Tooltip

```svelte
<!-- Add to src/routes/+page.svelte -->
<span class="confidence-badge" title="Confidence scores indicate how well-verified the finding is based on evidence quality">
  {confidence}
</span>

<style>
.confidence-badge {
  cursor: help;
  border-bottom: 1px dotted currentColor;
}
</style>
```

---

## Implementation Order

1. **Week 1:** Q1, Q2, Q3, Q4 (determinism + scope banners)
2. **Week 2:** Q5, Q8, Q10 (UX improvements)
3. **Week 3:** Q6 (integration test)
4. **Week 4:** Q7, Q9 (validation + type safety)

---

**Quick wins completed.**
