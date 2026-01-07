<script lang="ts">
	import { goto } from '$app/navigation';
	import { serializeGraph } from '$lib/shareable/shareable';
	import type { FlowNode, FlowEdge } from '$lib/graph/graph-types';

	// Import demo fixtures
	import collisionGraph from '$lib/blueprint/__tests__/fixtures/collision-graph.json';
	import positiveShowcase from '$lib/blueprint/__tests__/fixtures/positive-showcase.json';
	import riskFixPositive from '$lib/blueprint/__tests__/fixtures/risk-fix-positive.json';
	import largeComplexStack from '$lib/blueprint/__tests__/fixtures/large-complex-stack.json';

	interface Demo {
		name: string;
		description: string;
		fixture: { nodes: FlowNode[]; edges: FlowEdge[] };
		tags: string[];
	}

	const demos: Demo[] = [
		{
			name: 'ORM Collision',
			description: 'See how conflicting ORMs (Drizzle vs Prisma) are detected and resolved',
			fixture: collisionGraph as { nodes: FlowNode[]; edges: FlowEdge[] },
			tags: ['collision', 'basic']
		},
		{
			name: 'Clean Stack',
			description: 'Edge-native stack with greenlights (SvelteKit + Drizzle + Turso)',
			fixture: positiveShowcase as { nodes: FlowNode[]; edges: FlowEdge[] },
			tags: ['positive', 'greenlight']
		},
		{
			name: 'All Finding Types',
			description: 'Demonstrates risks, fixes, and positives (Next.js + Prisma + Postgres)',
			fixture: riskFixPositive as { nodes: FlowNode[]; edges: FlowEdge[] },
			tags: ['risk', 'fix', 'positive']
		},
		{
			name: 'Complex Architecture',
			description: 'Production-grade multi-layer stack (5 nodes, 6 connections)',
			fixture: largeComplexStack as { nodes: FlowNode[]; edges: FlowEdge[] },
			tags: ['complex', 'production']
		}
	];

	function loadDemo(demo: Demo) {
		const result = serializeGraph(demo.fixture.nodes, demo.fixture.edges);

		if (result.success) {
			goto(`/demo?data=${result.encoded}`);
		} else {
			console.error('Failed to serialize demo:', result.error);
		}
	}
</script>

<section class="demo-gallery">
	<h2 class="text-2xl font-bold mb-2">Demo Gallery</h2>
	<p class="text-gray-600 mb-4">
		Try these curated examples to see BentoStack analysis in action
	</p>

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		{#each demos as demo}
			<button
				onclick={() => loadDemo(demo)}
				class="demo-card p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all text-left bg-white"
			>
				<h3 class="font-semibold text-lg mb-2">{demo.name}</h3>
				<p class="text-sm text-gray-600 mb-3">{demo.description}</p>
				<div class="flex flex-wrap gap-1">
					{#each demo.tags as tag}
						<span class="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-700">{tag}</span>
					{/each}
				</div>
			</button>
		{/each}
	</div>
</section>

<style>
	.demo-gallery {
		margin: 2rem 0;
	}

	.demo-card {
		cursor: pointer;
	}

	.demo-card:hover h3 {
		color: #3b82f6;
	}
</style>
