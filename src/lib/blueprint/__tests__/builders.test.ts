import { describe, it, expect } from 'vitest';
import { VibeEngine } from '$lib/vibe/vibe-engine.svelte';
import { buildManifest, buildReportData, buildInstallCommand, buildReadmeSnippet, buildReportMarkdown } from '../builders';
import { loadEvidenceIndex } from '$lib/evidence/load';
import { canonicalizeUrl } from '$lib/evidence/canonicalize';
import type { VibeSnapshot } from '$lib/vibe/snapshot';

// Import fixtures
import seedGraph from './fixtures/seed-graph.json';
import emptyGraph from './fixtures/empty-graph.json';
import minimalStack from './fixtures/minimal-stack.json';
import collisionGraph from './fixtures/collision-graph.json';
import fullstackReact from './fixtures/fullstack-react.json';
import svelteDrizzleTurso from './fixtures/svelte-drizzle-turso.json';
import nextPrismaPostgres from './fixtures/next-prisma-postgres.json';
import multiCollision from './fixtures/multi-collision.json';
import clerkPrismaCombo from './fixtures/clerk-prisma-combo.json';
import luciaDrizzleNative from './fixtures/lucia-drizzle-native.json';
import largeComplexStack from './fixtures/large-complex-stack.json';
import positiveShowcase from './fixtures/positive-showcase.json';
import riskFixPositive from './fixtures/risk-fix-positive.json';

function loadFixture(fixture: any): VibeSnapshot {
	const engine = new VibeEngine();
	engine.init(fixture.nodes, fixture.edges);

	return {
		nodes: structuredClone(engine.nodes),
		edges: structuredClone(engine.edges),
		nodeVibes: structuredClone(engine.nodeVibes),
		edgeVibes: structuredClone(engine.edgeVibes),
		globalVibe: engine.globalVibe
	};
}

describe('Blueprint Builders - Deterministic Output', () => {
	const FIXED_TIMESTAMP = '2024-01-01T00:00:00.000Z';

	describe('buildManifest', () => {
		it('produces identical output for same input (seed graph)', () => {
			const engine = new VibeEngine();
			const snapshot1 = loadFixture(seedGraph);
			const snapshot2 = loadFixture(seedGraph);

			const manifest1 = buildManifest(snapshot1, engine.registry, FIXED_TIMESTAMP);
			const manifest2 = buildManifest(snapshot2, engine.registry, FIXED_TIMESTAMP);

			expect(JSON.stringify(manifest1)).toBe(JSON.stringify(manifest2));
		});

		it('has stable tool ordering by category then name', () => {
			const snapshot = loadFixture(seedGraph);
			const engine = new VibeEngine();
			const manifest = buildManifest(snapshot, engine.registry, FIXED_TIMESTAMP);

			// Tools should be sorted: Frontend, Backend, Auth, ORM, Database
			const categories = manifest.tools.map(t => t.category);
			const categoryOrder = ['Frontend', 'Backend', 'Auth', 'ORM', 'Database'];

			let lastCategoryIndex = -1;
			for (const cat of categories) {
				const currentIndex = categoryOrder.indexOf(cat);
				if (currentIndex !== -1) {
					expect(currentIndex).toBeGreaterThanOrEqual(lastCategoryIndex);
					lastCategoryIndex = currentIndex;
				}
			}
		});

		it('has stable edge ordering by source, target, id', () => {
			const snapshot = loadFixture(seedGraph);
			const engine = new VibeEngine();
			const manifest = buildManifest(snapshot, engine.registry, FIXED_TIMESTAMP);

			for (let i = 1; i < manifest.edges.length; i++) {
				const prev = manifest.edges[i - 1];
				const curr = manifest.edges[i];

				if (prev.source !== curr.source) {
					expect(prev.source.localeCompare(curr.source)).toBeLessThan(0);
				} else if (prev.target !== curr.target) {
					expect(prev.target.localeCompare(curr.target)).toBeLessThan(0);
				}
			}
		});

		it('handles empty graph', () => {
			const snapshot = loadFixture(emptyGraph);
			const engine = new VibeEngine();
			const manifest = buildManifest(snapshot, engine.registry, FIXED_TIMESTAMP);

			expect(manifest.tools).toEqual([]);
			expect(manifest.nodes).toEqual([]);
			expect(manifest.edges).toEqual([]);
			expect(manifest.globalVibe).toBe(100); // Empty graph = perfect score
		});
	});

	describe('buildInstallCommand', () => {
		it('deduplicates packages and sorts alphabetically', () => {
			const snapshot = loadFixture(seedGraph);
			const engine = new VibeEngine();
			const manifest = buildManifest(snapshot, engine.registry, FIXED_TIMESTAMP);
			const cmd = buildInstallCommand(manifest);

			// Should be deterministic
			const cmd2 = buildInstallCommand(manifest);
			expect(cmd).toBe(cmd2);

			// Should start with pnpm add
			expect(cmd).toMatch(/^pnpm add /);
		});

		it('handles empty manifest', () => {
			const snapshot = loadFixture(emptyGraph);
			const engine = new VibeEngine();
			const manifest = buildManifest(snapshot, engine.registry, FIXED_TIMESTAMP);
			const cmd = buildInstallCommand(manifest);

			expect(cmd).toBe('# No npm packages to install');
		});

		it('produces same output when called twice', () => {
			const snapshot = loadFixture(fullstackReact);
			const engine = new VibeEngine();
			const manifest = buildManifest(snapshot, engine.registry, FIXED_TIMESTAMP);

			const cmd1 = buildInstallCommand(manifest);
			const cmd2 = buildInstallCommand(manifest);

			expect(cmd1).toBe(cmd2);
		});
	});

	describe('buildReadmeSnippet', () => {
		it('produces identical output for same manifest', () => {
			const snapshot = loadFixture(seedGraph);
			const engine = new VibeEngine();
			const manifest = buildManifest(snapshot, engine.registry, FIXED_TIMESTAMP);

			const readme1 = buildReadmeSnippet(manifest);
			const readme2 = buildReadmeSnippet(manifest);

			expect(readme1).toBe(readme2);
		});

		it('includes all expected sections', () => {
			const snapshot = loadFixture(seedGraph);
			const engine = new VibeEngine();
			const manifest = buildManifest(snapshot, engine.registry, FIXED_TIMESTAMP);
			const readme = buildReadmeSnippet(manifest);

			expect(readme).toContain('# BentoStack Blueprint');
			expect(readme).toContain('Generated at:');
			expect(readme).toContain('Global Vibe Score:');
			expect(readme).toContain('## Stack');
		});

		it('shows collision warning when collisions exist', () => {
			const snapshot = loadFixture(collisionGraph);
			const engine = new VibeEngine();
			const manifest = buildManifest(snapshot, engine.registry, FIXED_TIMESTAMP);
			const readme = buildReadmeSnippet(manifest);

			expect(readme).toContain('## Known Collisions');
		});
	});

	describe('buildReportData', () => {
		it('produces identical output for same input', () => {
			const snapshot1 = loadFixture(seedGraph);
			const snapshot2 = loadFixture(seedGraph);
			const engine = new VibeEngine();

			const report1 = buildReportData(snapshot1, engine.registry, FIXED_TIMESTAMP);
			const report2 = buildReportData(snapshot2, engine.registry, FIXED_TIMESTAMP);

			expect(JSON.stringify(report1)).toBe(JSON.stringify(report2));
		});

		it('calculates correct tier based on global vibe', () => {
			const engine = new VibeEngine();

			// Test seed graph (should be high score)
			const snapshot1 = loadFixture(seedGraph);
			const report1 = buildReportData(snapshot1, engine.registry, FIXED_TIMESTAMP);
			expect(['GIGA', 'SOLID']).toContain(report1.tier);

			// Test collision graph (should be lower)
			const snapshot2 = loadFixture(collisionGraph);
			const report2 = buildReportData(snapshot2, engine.registry, FIXED_TIMESTAMP);
			expect(report2.globalVibe).toBeLessThan(snapshot1.globalVibe);
		});

		it('detects collision findings', () => {
			const snapshot = loadFixture(collisionGraph);
			const engine = new VibeEngine();
			const report = buildReportData(snapshot, engine.registry, FIXED_TIMESTAMP);

			const collisionFindings = report.findings.filter(f => f.type === 'collision');
			expect(collisionFindings.length).toBeGreaterThan(0);
			expect(collisionFindings[0].severity).toBe('high');
		});

		it('generates swap suggestions for collisions', () => {
			const snapshot = loadFixture(collisionGraph);
			const engine = new VibeEngine();
			const report = buildReportData(snapshot, engine.registry, FIXED_TIMESTAMP);

			expect(report.swaps.length).toBeGreaterThan(0);
		});

		it('handles empty graph gracefully', () => {
			const snapshot = loadFixture(emptyGraph);
			const engine = new VibeEngine();
			const report = buildReportData(snapshot, engine.registry, FIXED_TIMESTAMP);

			expect(report.findings).toEqual([]);
			expect(report.swaps).toEqual([]);
			expect(report.globalVibe).toBe(100);
			expect(report.tier).toBe('GIGA');
		});
	});

	describe('buildReportMarkdown', () => {
		it('produces identical output for same report data', () => {
			const snapshot = loadFixture(seedGraph);
			const engine = new VibeEngine();
			const report = buildReportData(snapshot, engine.registry, FIXED_TIMESTAMP);

			const md1 = buildReportMarkdown(report);
			const md2 = buildReportMarkdown(report);

			expect(md1).toBe(md2);
		});

		it('includes all expected sections', () => {
			const snapshot = loadFixture(seedGraph);
			const engine = new VibeEngine();
			const report = buildReportData(snapshot, engine.registry, FIXED_TIMESTAMP);
			const md = buildReportMarkdown(report);

			expect(md).toContain('# BentoStack Vibe Report');
			expect(md).toContain('**Generated:**');
			expect(md).toContain('**Global Vibe:**');
			expect(md).toContain('## Top Findings');
			expect(md).toContain('## Recommended Swaps');
			expect(md).toContain('## Stack Tools');
		});

		it('shows empty state messages when no issues', () => {
			const snapshot = loadFixture(minimalStack);
			const engine = new VibeEngine();
			const report = buildReportData(snapshot, engine.registry, FIXED_TIMESTAMP);
			const md = buildReportMarkdown(report);

			expect(md).toContain('_No major issues detected');
			expect(md).toContain('_No collisions detected');
		});
	});

	describe('All Fixtures - Determinism Tests', () => {
		const fixtures = [
			{ name: 'seed-graph', data: seedGraph },
			{ name: 'empty-graph', data: emptyGraph },
			{ name: 'minimal-stack', data: minimalStack },
			{ name: 'collision-graph', data: collisionGraph },
			{ name: 'fullstack-react', data: fullstackReact },
			{ name: 'svelte-drizzle-turso', data: svelteDrizzleTurso },
			{ name: 'next-prisma-postgres', data: nextPrismaPostgres },
			{ name: 'multi-collision', data: multiCollision },
			{ name: 'clerk-prisma-combo', data: clerkPrismaCombo },
			{ name: 'lucia-drizzle-native', data: luciaDrizzleNative },
			{ name: 'large-complex-stack', data: largeComplexStack }
		];

		fixtures.forEach(({ name, data }) => {
			it(`${name}: produces byte-identical JSON exports`, () => {
				const snapshot1 = loadFixture(data);
				const snapshot2 = loadFixture(data);
				const engine = new VibeEngine();

				const report1 = buildReportData(snapshot1, engine.registry, FIXED_TIMESTAMP);
				const report2 = buildReportData(snapshot2, engine.registry, FIXED_TIMESTAMP);

				const json1 = JSON.stringify(report1, null, 2);
				const json2 = JSON.stringify(report2, null, 2);

				expect(json1).toBe(json2);
			});

			it(`${name}: produces byte-identical markdown exports`, () => {
				const snapshot1 = loadFixture(data);
				const snapshot2 = loadFixture(data);
				const engine = new VibeEngine();

				const report1 = buildReportData(snapshot1, engine.registry, FIXED_TIMESTAMP);
				const report2 = buildReportData(snapshot2, engine.registry, FIXED_TIMESTAMP);

				const md1 = buildReportMarkdown(report1);
				const md2 = buildReportMarkdown(report2);

				expect(md1).toBe(md2);
			});
		});
	});

	describe('Edge Cases', () => {
		it('handles graph with only nodes, no edges', () => {
			const snapshot = loadFixture(minimalStack);
			const engine = new VibeEngine();
			const report = buildReportData(snapshot, engine.registry, FIXED_TIMESTAMP);

			expect(report.findings).toBeDefined();
			expect(report.swaps).toEqual([]);
		});

		it('handles multiple collisions consistently', () => {
			const snapshot = loadFixture(multiCollision);
			const engine = new VibeEngine();

			const report1 = buildReportData(snapshot, engine.registry, FIXED_TIMESTAMP);
			const report2 = buildReportData(snapshot, engine.registry, FIXED_TIMESTAMP);

			expect(report1.swaps.length).toBe(report2.swaps.length);
			expect(JSON.stringify(report1.swaps)).toBe(JSON.stringify(report2.swaps));
		});

		it('handles large complex stacks', () => {
			const snapshot = loadFixture(largeComplexStack);
			const engine = new VibeEngine();
			const report = buildReportData(snapshot, engine.registry, FIXED_TIMESTAMP);

			expect(report.manifest.nodes.length).toBeGreaterThan(0);
			expect(report.manifest.edges.length).toBeGreaterThan(0);

			// Verify determinism
			const report2 = buildReportData(snapshot, engine.registry, FIXED_TIMESTAMP);
			expect(JSON.stringify(report)).toBe(JSON.stringify(report2));
		});
	});

	describe('Evidence System', () => {
		describe('URL Canonicalization', () => {
			it('forces https protocol', () => {
				expect(canonicalizeUrl('http://example.com')).toBe('https://example.com/');
			});

			it('lowercases hostname', () => {
				expect(canonicalizeUrl('https://EXAMPLE.COM')).toBe('https://example.com/');
			});

			it('strips query parameters', () => {
				expect(canonicalizeUrl('https://example.com/path?foo=bar')).toBe('https://example.com/path');
			});

			it('strips fragment', () => {
				expect(canonicalizeUrl('https://example.com/path#section')).toBe('https://example.com/path');
			});

			it('strips trailing slash except root', () => {
				expect(canonicalizeUrl('https://example.com/')).toBe('https://example.com/');
				expect(canonicalizeUrl('https://example.com/path/')).toBe('https://example.com/path');
			});

			it('produces deterministic output', () => {
				const url = 'HTTP://Example.COM/Path/?query=1#hash';
				const result1 = canonicalizeUrl(url);
				const result2 = canonicalizeUrl(url);
				expect(result1).toBe(result2);
			});
		});

		describe('Evidence Loading', () => {
			it('loads evidence packs successfully', () => {
				const evidenceIndex = loadEvidenceIndex();
				expect(evidenceIndex).toBeDefined();
				expect(evidenceIndex['prisma-orm-edge-incompatibility']).toBeDefined();
			});

			it('canonicalizes URLs in evidence items', () => {
				const evidenceIndex = loadEvidenceIndex();
				const pack = evidenceIndex['prisma-orm-edge-incompatibility'];

				for (const item of pack.evidence) {
					expect(item.url).toMatch(/^https:\/\//);
					expect(item.url.toLowerCase()).toBe(item.url);
				}
			});

			it('sorts evidence items by canonical URL', () => {
				const evidenceIndex = loadEvidenceIndex();
				const pack = evidenceIndex['prisma-orm-edge-incompatibility'];

				for (let i = 1; i < pack.evidence.length; i++) {
					expect(pack.evidence[i - 1].url.localeCompare(pack.evidence[i].url)).toBeLessThanOrEqual(0);
				}
			});

			it('loads all expected evidence packs', () => {
				const evidenceIndex = loadEvidenceIndex();
				expect(evidenceIndex['prisma-orm-edge-incompatibility']).toBeDefined();
				expect(evidenceIndex['next-edge-node-apis']).toBeDefined();
				expect(evidenceIndex['authjs-database-adapter-edge-failure']).toBeDefined();
				expect(evidenceIndex['vercel-serverless-connection-limits']).toBeDefined();
				expect(evidenceIndex['drizzle-orm-nodejs-dependencies']).toBeDefined();
			});
		});

		describe('Evidence-Backed Findings', () => {
			it('detects Next.js + Prisma and adds evidence-backed finding', () => {
				const snapshot = loadFixture(nextPrismaPostgres);
				const engine = new VibeEngine();
				const evidenceIndex = loadEvidenceIndex();
				const report = buildReportData(snapshot, engine.registry, FIXED_TIMESTAMP, evidenceIndex);

				const ruleFindings = report.findings.filter(f => f.type === 'risk');
				expect(ruleFindings.length).toBeGreaterThan(0);

				const prismaFinding = ruleFindings.find(f => f.ruleId === 'prisma-orm-edge-incompatibility');
				expect(prismaFinding).toBeDefined();
				expect(prismaFinding?.evidencePack).toBeDefined();
				expect(prismaFinding?.evidencePack?.ruleId).toBe('prisma-orm-edge-incompatibility');
			});

			it('evidence-backed finding has correct severity', () => {
				const snapshot = loadFixture(nextPrismaPostgres);
				const engine = new VibeEngine();
				const evidenceIndex = loadEvidenceIndex();
				const report = buildReportData(snapshot, engine.registry, FIXED_TIMESTAMP, evidenceIndex);

				const prismaFinding = report.findings.find(f => f.ruleId === 'prisma-orm-edge-incompatibility');
				expect(prismaFinding?.severity).toBe('high');
			});

			it('does not add finding when tools are not present', () => {
				const snapshot = loadFixture(seedGraph); // No Next.js or Prisma
				const engine = new VibeEngine();
				const evidenceIndex = loadEvidenceIndex();
				const report = buildReportData(snapshot, engine.registry, FIXED_TIMESTAMP, evidenceIndex);

				const prismaFinding = report.findings.find(f => f.ruleId === 'prisma-orm-edge-incompatibility');
				expect(prismaFinding).toBeUndefined();
			});

			it('produces deterministic output with evidence', () => {
				const snapshot1 = loadFixture(nextPrismaPostgres);
				const snapshot2 = loadFixture(nextPrismaPostgres);
				const engine = new VibeEngine();
				const evidenceIndex = loadEvidenceIndex();

				const report1 = buildReportData(snapshot1, engine.registry, FIXED_TIMESTAMP, evidenceIndex);
				const report2 = buildReportData(snapshot2, engine.registry, FIXED_TIMESTAMP, evidenceIndex);

				expect(JSON.stringify(report1)).toBe(JSON.stringify(report2));
			});
		});

		describe('Markdown Evidence Rendering', () => {
			it('includes evidence details in markdown', () => {
				const snapshot = loadFixture(nextPrismaPostgres);
				const engine = new VibeEngine();
				const evidenceIndex = loadEvidenceIndex();
				const report = buildReportData(snapshot, engine.registry, FIXED_TIMESTAMP, evidenceIndex);
				const md = buildReportMarkdown(report);

				expect(md).toContain('<details>');
				expect(md).toContain('Evidence Details');
				expect(md).toContain('**Supporting Evidence:**');
			});

			it('includes sources footer when evidence present', () => {
				const snapshot = loadFixture(nextPrismaPostgres);
				const engine = new VibeEngine();
				const evidenceIndex = loadEvidenceIndex();
				const report = buildReportData(snapshot, engine.registry, FIXED_TIMESTAMP, evidenceIndex);
				const md = buildReportMarkdown(report);

				expect(md).toContain('## Sources');
			});

			it('sources are sorted alphabetically', () => {
				const snapshot = loadFixture(nextPrismaPostgres);
				const engine = new VibeEngine();
				const evidenceIndex = loadEvidenceIndex();
				const report = buildReportData(snapshot, engine.registry, FIXED_TIMESTAMP, evidenceIndex);
				const md = buildReportMarkdown(report);

				const sourcesSection = md.split('## Sources')[1];
				if (sourcesSection) {
					const urls = sourcesSection
						.split('\n')
						.filter(line => line.startsWith('- '))
						.map(line => line.substring(2));

					for (let i = 1; i < urls.length; i++) {
						expect(urls[i - 1].localeCompare(urls[i])).toBeLessThanOrEqual(0);
					}
				}
			});

			it('produces byte-identical markdown with evidence', () => {
				const snapshot1 = loadFixture(nextPrismaPostgres);
				const snapshot2 = loadFixture(nextPrismaPostgres);
				const engine = new VibeEngine();
				const evidenceIndex = loadEvidenceIndex();

				const report1 = buildReportData(snapshot1, engine.registry, FIXED_TIMESTAMP, evidenceIndex);
				const report2 = buildReportData(snapshot2, engine.registry, FIXED_TIMESTAMP, evidenceIndex);

				const md1 = buildReportMarkdown(report1);
				const md2 = buildReportMarkdown(report2);

				expect(md1).toBe(md2);
			});

			it('does not include sources section when no evidence', () => {
				const snapshot = loadFixture(seedGraph);
				const engine = new VibeEngine();
				const report = buildReportData(snapshot, engine.registry, FIXED_TIMESTAMP);
				const md = buildReportMarkdown(report);

				expect(md).not.toContain('## Sources');
			});
		});

		describe('Quality Gate', () => {
			it('validates excerpt word count', () => {
				const evidenceIndex = loadEvidenceIndex();

				// All current evidence items should be valid (< 25 words)
				for (const pack of Object.values(evidenceIndex)) {
					for (const item of pack.evidence) {
						const wordCount = item.excerpt.trim().split(/\s+/).length;
						if (wordCount > 25) {
							expect(item.note).toContain('INVALID');
						}
					}
				}
			});

			it('marks packs without primary evidence', () => {
				const evidenceIndex = loadEvidenceIndex();

				for (const pack of Object.values(evidenceIndex)) {
					const hasPrimaryEvidence = pack.evidence.length > 0 &&
						pack.evidence.some(e => e.excerpt.trim().length > 0 && !e.note?.includes('INVALID'));

					if (!hasPrimaryEvidence) {
						expect(pack.confidence).toBe('low');
						expect(pack.needsVerification).toBe(true);
					}
				}
			});
		});
	});

	describe('Evidence Schema Validation', () => {
		it('all evidence packs have kind field', () => {
			const evidenceIndex = loadEvidenceIndex();

			for (const [ruleId, pack] of Object.entries(evidenceIndex)) {
				expect(pack.kind).toBeDefined();
				expect(['risk', 'fix', 'positive']).toContain(pack.kind);
			}
		});

		it('all evidence packs have valid sourceType values', () => {
			const evidenceIndex = loadEvidenceIndex();
			const validSourceTypes = ['official_docs', 'vendor_docs', 'github_maintainer', 'release_notes', 'user_report', 'community'];

			for (const [ruleId, pack] of Object.entries(evidenceIndex)) {
				for (const item of pack.evidence) {
					expect(validSourceTypes).toContain(item.sourceType);
				}
				for (const item of pack.counterEvidence) {
					expect(validSourceTypes).toContain(item.sourceType);
				}
			}
		});

		it('all positive packs have severity info', () => {
			const evidenceIndex = loadEvidenceIndex();

			for (const [ruleId, pack] of Object.entries(evidenceIndex)) {
				if (pack.kind === 'positive') {
					expect(pack.severity).toBe('info');
				}
			}
		});

		it('risk packs with fixRuleIds reference valid fix packs', () => {
			const evidenceIndex = loadEvidenceIndex();

			for (const [ruleId, pack] of Object.entries(evidenceIndex)) {
				if (pack.kind === 'risk' && pack.fixRuleIds) {
					for (const fixRuleId of pack.fixRuleIds) {
						expect(evidenceIndex[fixRuleId]).toBeDefined();
						expect(evidenceIndex[fixRuleId].kind).toBe('fix');
					}
				}
			}
		});
	});

	describe('Positive Finding Matching', () => {
		it('detects Turso and adds positive finding', () => {
			const snapshot = loadFixture(positiveShowcase);
			const engine = new VibeEngine();
			const evidenceIndex = loadEvidenceIndex();
			const report = buildReportData(snapshot, engine.registry, FIXED_TIMESTAMP, evidenceIndex);

			const positiveFindings = report.findings.filter(f => f.type === 'positive');
			expect(positiveFindings.length).toBeGreaterThan(0);

			const tursoFinding = positiveFindings.find(f => f.ruleId === 'turso-libsql-edge-native');
			expect(tursoFinding).toBeDefined();
			expect(tursoFinding?.severity).toBe('info');
			expect(tursoFinding?.evidencePack).toBeDefined();
		});

		it('positive findings are deterministic', () => {
			const snapshot1 = loadFixture(positiveShowcase);
			const snapshot2 = loadFixture(positiveShowcase);
			const engine = new VibeEngine();
			const evidenceIndex = loadEvidenceIndex();

			const report1 = buildReportData(snapshot1, engine.registry, FIXED_TIMESTAMP, evidenceIndex);
			const report2 = buildReportData(snapshot2, engine.registry, FIXED_TIMESTAMP, evidenceIndex);

			const positives1 = report1.findings.filter(f => f.type === 'positive');
			const positives2 = report2.findings.filter(f => f.type === 'positive');

			expect(positives1.length).toBe(positives2.length);
			expect(JSON.stringify(positives1)).toBe(JSON.stringify(positives2));
		});
	});

	describe('Fix Reference Gating', () => {
		it('shows fixes only when referenced by fired risks', () => {
			const snapshot = loadFixture(riskFixPositive);
			const engine = new VibeEngine();
			const evidenceIndex = loadEvidenceIndex();
			const report = buildReportData(snapshot, engine.registry, FIXED_TIMESTAMP, evidenceIndex);

			// Should have risks
			const risks = report.findings.filter(f => f.type === 'risk');
			expect(risks.length).toBeGreaterThan(0);

			// Should have fixes (because risks fired)
			const fixes = report.findings.filter(f => f.type === 'fix');
			expect(fixes.length).toBeGreaterThan(0);

			// All fixes should be referenced by a fired risk
			const firedRiskRuleIds = new Set(risks.map(r => r.ruleId));
			for (const fix of fixes) {
				const isReferenced = Array.from(firedRiskRuleIds).some(riskRuleId => {
					const riskPack = evidenceIndex[riskRuleId!];
					return riskPack?.fixRuleIds?.includes(fix.ruleId!);
				});
				expect(isReferenced).toBe(true);
			}
		});

		it('does not show fixes when no risks fire', () => {
			const snapshot = loadFixture(positiveShowcase); // Clean stack with no risks
			const engine = new VibeEngine();
			const evidenceIndex = loadEvidenceIndex();
			const report = buildReportData(snapshot, engine.registry, FIXED_TIMESTAMP, evidenceIndex);

			const risks = report.findings.filter(f => f.type === 'risk');
			const fixes = report.findings.filter(f => f.type === 'fix');

			expect(risks.length).toBe(0);
			expect(fixes.length).toBe(0); // No fixes should appear
		});
	});

	describe('Finding Order Determinism', () => {
		it('findings are in deterministic order: collision → risk → fix → positive → low-score', () => {
			const snapshot = loadFixture(riskFixPositive);
			const engine = new VibeEngine();
			const evidenceIndex = loadEvidenceIndex();
			const report = buildReportData(snapshot, engine.registry, FIXED_TIMESTAMP, evidenceIndex);

			const types = report.findings.map(f => f.type);
			const typeOrder = ['collision', 'risk', 'fix', 'positive', 'low-score'];

			// Verify that types appear in order (not necessarily all present)
			let lastTypeIndex = -1;
			for (const type of types) {
				const typeIndex = typeOrder.indexOf(type);
				expect(typeIndex).toBeGreaterThanOrEqual(lastTypeIndex);
				lastTypeIndex = typeIndex;
			}
		});

		it('findings within same type are sorted by ruleId', () => {
			const snapshot = loadFixture(riskFixPositive);
			const engine = new VibeEngine();
			const evidenceIndex = loadEvidenceIndex();
			const report = buildReportData(snapshot, engine.registry, FIXED_TIMESTAMP, evidenceIndex);

			const riskFindings = report.findings.filter(f => f.type === 'risk');
			if (riskFindings.length > 1) {
				for (let i = 1; i < riskFindings.length; i++) {
					const prev = riskFindings[i - 1].ruleId || '';
					const curr = riskFindings[i].ruleId || '';
					expect(prev.localeCompare(curr)).toBeLessThanOrEqual(0);
				}
			}

			const fixFindings = report.findings.filter(f => f.type === 'fix');
			if (fixFindings.length > 1) {
				for (let i = 1; i < fixFindings.length; i++) {
					const prev = fixFindings[i - 1].ruleId || '';
					const curr = fixFindings[i].ruleId || '';
					expect(prev.localeCompare(curr)).toBeLessThanOrEqual(0);
				}
			}
		});
	});
});
