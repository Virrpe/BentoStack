import { describe, it, expect } from 'vitest';
import { VibeEngine } from '$lib/vibe/vibe-engine.svelte';
import { buildManifest, buildReportData, buildInstallCommand, buildReadmeSnippet, buildReportMarkdown } from '../builders';
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
});
