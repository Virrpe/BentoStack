import type { Library } from '$lib/registry/schema';
import type { VibeSnapshot } from '$lib/vibe/snapshot';
import type { Manifest, ManifestTool, ManifestNode, ManifestEdge, ReportData, ReportFinding, ReportSwap } from './types';
import { generateCollisionSuggestions } from '$lib/vibe/suggest';

/**
 * Build a deterministic manifest from a vibe snapshot.
 * Stable sorting for tools, nodes, and edges.
 * Pass timestamp for deterministic output (defaults to current time).
 */
export function buildManifest(snapshot: VibeSnapshot, registry: Library[], timestamp?: string): Manifest {
	const byId = new Map(registry.map(lib => [lib.id, lib]));

	// Collect unique tools used in the graph
	const toolIds = new Set<string>();
	for (const node of snapshot.nodes) {
		if (node.data.toolId) {
			toolIds.add(node.data.toolId);
		}
	}

	// Build tools array (sorted by category then name)
	const categoryOrder = ['Frontend', 'Backend', 'Auth', 'ORM', 'Database'];
	const tools: ManifestTool[] = Array.from(toolIds)
		.map(id => {
			const lib = byId.get(id);
			if (!lib) return null;
			return {
				id: lib.id,
				name: lib.name,
				category: lib.category,
				npm: lib.npm_install
			};
		})
		.filter((t): t is ManifestTool => t !== null)
		.sort((a, b) => {
			const orderA = categoryOrder.indexOf(a.category);
			const orderB = categoryOrder.indexOf(b.category);
			if (orderA !== orderB) return orderA - orderB;
			return a.name.localeCompare(b.name);
		});

	// Build nodes array (sorted by category order then id)
	const nodes: ManifestNode[] = snapshot.nodes
		.map(n => ({
			id: n.id,
			category: n.data.category ?? '',
			toolId: n.data.toolId ?? ''
		}))
		.sort((a, b) => {
			const orderA = categoryOrder.indexOf(a.category);
			const orderB = categoryOrder.indexOf(b.category);
			if (orderA !== -1 && orderB !== -1 && orderA !== orderB) return orderA - orderB;
			return a.id.localeCompare(b.id);
		});

	// Build edges array (sorted by source then target then id)
	const edges: ManifestEdge[] = snapshot.edges
		.map(e => {
			const vibe = snapshot.edgeVibes[e.id];
			return {
				id: e.id,
				source: e.source,
				target: e.target,
				status: vibe?.status,
				weight: vibe?.status === 'NATIVE' ? 1 : vibe?.status === 'COLLISION' ? -1 : 0
			};
		})
		.sort((a, b) => {
			if (a.source !== b.source) return a.source.localeCompare(b.source);
			if (a.target !== b.target) return a.target.localeCompare(b.target);
			return a.id.localeCompare(b.id);
		});

	return {
		version: 1,
		generatedAt: timestamp ?? new Date().toISOString(),
		tools,
		nodes,
		edges,
		globalVibe: snapshot.globalVibe
	};
}

/**
 * Build deterministic install command from manifest.
 * Deduplicates npm packages and sorts alphabetically.
 */
export function buildInstallCommand(manifest: Manifest): string {
	const packages = new Set<string>();

	for (const tool of manifest.tools) {
		// Parse npm_install to extract package names
		// Format could be: "npm i package-name" or "docker run postgres" or "n/a"
		const npmCmd = tool.npm;

		if (npmCmd.startsWith('npm i ') || npmCmd.startsWith('npm install ')) {
			const pkg = npmCmd.replace(/^npm (i|install) /, '').trim();
			if (pkg && pkg !== 'n/a') {
				packages.add(pkg);
			}
		}
	}

	const sorted = Array.from(packages).sort();

	if (sorted.length === 0) {
		return '# No npm packages to install';
	}

	return `pnpm add ${sorted.join(' ')}`;
}

/**
 * Build README snippet from manifest.
 * Includes tools list grouped by category and collision summary.
 */
export function buildReadmeSnippet(manifest: Manifest): string {
	const categoryOrder = ['Frontend', 'Backend', 'Auth', 'ORM', 'Database'];

	let md = '# BentoStack Blueprint\n\n';
	md += `Generated at: ${manifest.generatedAt}\n`;
	md += `Global Vibe Score: ${manifest.globalVibe}/100\n\n`;

	// Group tools by category
	const byCategory = new Map<string, ManifestTool[]>();
	for (const tool of manifest.tools) {
		if (!byCategory.has(tool.category)) {
			byCategory.set(tool.category, []);
		}
		byCategory.get(tool.category)!.push(tool);
	}

	md += '## Stack\n\n';
	for (const cat of categoryOrder) {
		const tools = byCategory.get(cat);
		if (tools && tools.length > 0) {
			md += `**${cat}:** `;
			md += tools.map(t => t.name).join(', ');
			md += '\n\n';
		}
	}

	// Collision summary
	const collisions = manifest.edges.filter(e => e.status === 'COLLISION');
	if (collisions.length > 0) {
		md += '## Known Collisions\n\n';
		md += `⚠️ ${collisions.length} collision(s) detected. Review your stack for compatibility issues.\n\n`;
	}

	return md;
}

/**
 * Build structured report data from snapshot.
 * Deterministic: collision edges first, then lowest-scoring nodes.
 * Pass timestamp for deterministic output (defaults to current time).
 */
export function buildReportData(snapshot: VibeSnapshot, registry: Library[], timestamp?: string): ReportData {
	const byId = new Map(registry.map(lib => [lib.id, lib]));
	const ts = timestamp ?? new Date().toISOString();
	const manifest = buildManifest(snapshot, registry, ts);

	// Determine tier from global vibe
	const tier =
		snapshot.globalVibe >= 80 ? 'GIGA' :
		snapshot.globalVibe >= 60 ? 'SOLID' :
		snapshot.globalVibe >= 40 ? 'SUS' : 'REKT';

	// Build findings (max 5)
	const findings: ReportFinding[] = [];

	// 1. Collision edges first
	const collisionEdges = snapshot.edges.filter(e => {
		const vibe = snapshot.edgeVibes[e.id];
		return vibe?.status === 'COLLISION';
	});

	for (const edge of collisionEdges) {
		const sourceNode = snapshot.nodes.find(n => n.id === edge.source);
		const targetNode = snapshot.nodes.find(n => n.id === edge.target);
		const vibe = snapshot.edgeVibes[edge.id];

		if (!sourceNode || !targetNode) continue;

		const sourceTool = byId.get(sourceNode.data.toolId ?? '');
		const targetTool = byId.get(targetNode.data.toolId ?? '');

		findings.push({
			type: 'collision',
			severity: 'high',
			what: `Friction between ${sourceNode.data.label} and ${targetNode.data.label}`,
			why: vibe?.reason ?? 'Incompatible tools',
			evidence: `${sourceTool?.name ?? '?'} ↔ ${targetTool?.name ?? '?'}`,
			suggestedFix: 'Consider swapping one of these tools for a compatible alternative (see Recommended Swaps below)'
		});

		if (findings.length >= 5) break;
	}

	// 2. Lowest-scoring nodes
	if (findings.length < 5) {
		const nodeScores = Object.entries(snapshot.nodeVibes)
			.map(([id, vibe]) => ({ id, score: vibe.score, vibe }))
			.filter(n => n.vibe.status === 'REKT' || n.vibe.status === 'SUS')
			.sort((a, b) => a.score - b.score);

		for (const { id, vibe } of nodeScores) {
			if (findings.length >= 5) break;

			const node = snapshot.nodes.find(n => n.id === id);
			if (!node) continue;

			const tool = byId.get(node.data.toolId ?? '');
			const notes = vibe.notes.join('; ');

			findings.push({
				type: 'low-score',
				severity: vibe.status === 'REKT' ? 'high' : 'medium',
				what: `Low vibe score for ${node.data.label}`,
				why: notes || 'Multiple friction points detected',
				evidence: `Score: ${vibe.score}/100, Tool: ${tool?.name ?? '?'}`,
				suggestedFix: 'Review connections and consider alternative tools'
			});
		}
	}

	// Build swaps (for collision edges)
	const swaps: ReportSwap[] = [];
	for (const edge of collisionEdges) {
		const sourceNode = snapshot.nodes.find(n => n.id === edge.source);
		const targetNode = snapshot.nodes.find(n => n.id === edge.target);

		if (!sourceNode || !targetNode) continue;
		if (!sourceNode.data.toolId || !targetNode.data.toolId) continue;

		const suggestions = generateCollisionSuggestions({
			sourceNodeId: sourceNode.id,
			sourceToolId: sourceNode.data.toolId,
			sourceCategory: sourceNode.data.category ?? '',
			targetNodeId: targetNode.id,
			targetToolId: targetNode.data.toolId,
			targetCategory: targetNode.data.category ?? '',
			registry,
			byId
		});

		const sourceTool = byId.get(sourceNode.data.toolId);
		const targetTool = byId.get(targetNode.data.toolId);

		swaps.push({
			edgeId: edge.id,
			sourceTool: sourceTool?.name ?? sourceNode.data.toolId,
			targetTool: targetTool?.name ?? targetNode.data.toolId,
			alternatives: suggestions.map(s => ({
				toolId: s.toolId,
				toolName: s.toolName,
				reason: s.reason,
				affectsNodeId: s.affectsNodeId
			}))
		});
	}

	return {
		timestamp: ts,
		globalVibe: snapshot.globalVibe,
		tier,
		findings,
		swaps,
		manifest
	};
}

/**
 * Build markdown report from structured report data.
 */
export function buildReportMarkdown(report: ReportData): string {
	let md = '# BentoStack Vibe Report\n\n';
	md += `**Generated:** ${report.timestamp}\n\n`;
	md += `**Global Vibe:** ${report.globalVibe}/100 (${report.tier})\n\n`;

	// Top Findings
	md += '## Top Findings\n\n';
	if (report.findings.length === 0) {
		md += '_No major issues detected. Your stack is looking good!_\n\n';
	} else {
		for (let i = 0; i < report.findings.length; i++) {
			const f = report.findings[i];
			const severity = f.severity === 'high' ? '🔴' : f.severity === 'medium' ? '🟡' : '🟢';
			md += `### ${i + 1}. ${severity} ${f.what}\n\n`;
			md += `**Why:** ${f.why}\n\n`;
			md += `**Evidence:** ${f.evidence}\n\n`;
			md += `**Suggested Fix:** ${f.suggestedFix}\n\n`;
		}
	}

	// Recommended Swaps
	md += '## Recommended Swaps\n\n';
	if (report.swaps.length === 0) {
		md += '_No collisions detected. No swaps needed._\n\n';
	} else {
		for (const swap of report.swaps) {
			md += `### ${swap.sourceTool} ↔ ${swap.targetTool}\n\n`;
			if (swap.alternatives.length === 0) {
				md += '_No compatible alternatives found in registry._\n\n';
			} else {
				md += 'Consider:\n\n';
				for (const alt of swap.alternatives) {
					md += `- **${alt.toolName}**: ${alt.reason}\n`;
				}
				md += '\n';
			}
		}
	}

	// Tools
	md += '## Stack Tools\n\n';
	for (const tool of report.manifest.tools) {
		md += `- **${tool.name}** (${tool.category})\n`;
	}
	md += '\n';

	return md;
}
