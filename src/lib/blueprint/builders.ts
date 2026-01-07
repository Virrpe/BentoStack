import type { Library } from '$lib/registry/schema';
import type { VibeSnapshot } from '$lib/vibe/snapshot';
import type { Manifest, ManifestTool, ManifestNode, ManifestEdge, ReportData, ReportFinding, ReportSwap } from './types';
import type { EvidenceIndex } from '$lib/evidence/types';
import { generateCollisionSuggestions } from '$lib/vibe/suggest';
import { canonicalizeUrl } from '$lib/evidence/canonicalize';

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
 * Deterministic: collision edges first, then rule-based findings, then lowest-scoring nodes.
 * Pass timestamp for deterministic output (defaults to current time).
 * Pass evidenceIndex to include evidence-backed findings.
 */
export function buildReportData(
	snapshot: VibeSnapshot,
	registry: Library[],
	timestamp?: string,
	evidenceIndex?: EvidenceIndex
): ReportData {
	const byId = new Map(registry.map(lib => [lib.id, lib]));
	const ts = timestamp ?? new Date().toISOString();
	const manifest = buildManifest(snapshot, registry, ts);

	// Determine tier from global vibe
	const tier =
		snapshot.globalVibe >= 80 ? 'GIGA' :
		snapshot.globalVibe >= 60 ? 'SOLID' :
		snapshot.globalVibe >= 40 ? 'SUS' : 'REKT';

	// Build findings deterministically: collision → risk → fix → positive → low-score
	const collisions: ReportFinding[] = [];
	const risks: ReportFinding[] = [];
	const fixes: ReportFinding[] = [];
	const positives: ReportFinding[] = [];
	const lowScores: ReportFinding[] = [];

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

		collisions.push({
			type: 'collision',
			severity: 'high',
			what: `Friction between ${sourceNode.data.label} and ${targetNode.data.label}`,
			why: vibe?.reason ?? 'Incompatible tools',
			evidence: `${sourceTool?.name ?? '?'} ↔ ${targetTool?.name ?? '?'}`,
			suggestedFix: 'Consider swapping one of these tools for a compatible alternative (see Recommended Swaps below)'
		});
	}

	// 2. Risk findings (evidence-backed)
	if (evidenceIndex) {
		// Collect all toolIds in the graph
		const toolIds = new Set(snapshot.nodes.map(n => n.data.toolId).filter(Boolean));
		const firedRiskRuleIds = new Set<string>();

		// Match risks
		for (const [ruleId, pack] of Object.entries(evidenceIndex)) {
			if (pack.kind !== 'risk') continue;

			let matched = false;

			// Match based on ruleId patterns
			if (ruleId === 'prisma-orm-edge-incompatibility' && toolIds.has('nextjs') && toolIds.has('prisma')) {
				matched = true;
			} else if (ruleId === 'authjs-database-adapter-edge-failure' && toolIds.has('authjs') && toolIds.has('nextjs')) {
				matched = true;
			} else if (ruleId === 'drizzle-orm-nodejs-dependencies' && toolIds.has('drizzle') && toolIds.has('nextjs')) {
				matched = true;
			} else if (ruleId === 'native-db-drivers-tcp-failure' && (
				(toolIds.has('nextjs') && (toolIds.has('postgres') || toolIds.has('mysql'))) ||
				(toolIds.has('nextjs') && toolIds.has('prisma'))
			)) {
				matched = true;
			} else if (ruleId === 'edge-runtime-response-timeout' && toolIds.has('nextjs')) {
				matched = true;
			} else if (ruleId === 'next-edge-node-apis' && toolIds.has('nextjs')) {
				matched = true;
			} else if (ruleId === 'vercel-serverless-connection-limits' && (toolIds.has('nextjs') || toolIds.has('vercel'))) {
				matched = true;
			}

			if (matched) {
				firedRiskRuleIds.add(ruleId);
				risks.push({
					type: 'risk',
					severity: pack.severity as 'high' | 'medium' | 'low' | 'info',
					what: pack.claim.substring(0, 80) + (pack.claim.length > 80 ? '...' : ''),
					why: pack.claim,
					evidence: pack.needsVerification
						? 'Ungrounded claim (needs verification)'
						: `${pack.evidence.length} source(s)`,
					suggestedFix: pack.fixRuleIds && pack.fixRuleIds.length > 0
						? `See recommended fixes: ${pack.fixRuleIds.join(', ')}`
						: 'Review evidence and consider alternative approaches',
					ruleId: pack.ruleId,
					evidencePack: pack
				});
			}
		}

		// 3. Fix findings (only if referenced by fired risks)
		for (const [ruleId, pack] of Object.entries(evidenceIndex)) {
			if (pack.kind !== 'fix') continue;

			// Check if any fired risk references this fix
			const isReferenced = Array.from(firedRiskRuleIds).some(riskRuleId => {
				const riskPack = evidenceIndex[riskRuleId];
				return riskPack?.fixRuleIds?.includes(ruleId);
			});

			if (isReferenced) {
				fixes.push({
					type: 'fix',
					severity: 'info',
					what: pack.claim.substring(0, 80) + (pack.claim.length > 80 ? '...' : ''),
					why: pack.claim,
					evidence: `${pack.evidence.length} source(s)`,
					suggestedFix: pack.scope,
					ruleId: pack.ruleId,
					evidencePack: pack
				});
			}
		}

		// 4. Positive findings (greenlights)
		for (const [ruleId, pack] of Object.entries(evidenceIndex)) {
			if (pack.kind !== 'positive') continue;

			let matched = false;

			// Match positives
			if (ruleId === 'turso-libsql-edge-native' && toolIds.has('turso')) {
				matched = true;
			} else if (ruleId === 'neon-serverless-edge-driver' && toolIds.has('neon')) {
				matched = true;
			}

			if (matched) {
				positives.push({
					type: 'positive',
					severity: 'info',
					what: pack.claim.substring(0, 80) + (pack.claim.length > 80 ? '...' : ''),
					why: pack.claim,
					evidence: `${pack.evidence.length} source(s)`,
					suggestedFix: pack.scope,
					ruleId: pack.ruleId,
					evidencePack: pack
				});
			}
		}
	}

	// 5. Lowest-scoring nodes
	const nodeScores = Object.entries(snapshot.nodeVibes)
		.map(([id, vibe]) => ({ id, score: vibe.score, vibe }))
		.filter(n => n.vibe.status === 'REKT' || n.vibe.status === 'SUS')
		.sort((a, b) => a.score - b.score);

	for (const { id, vibe } of nodeScores) {
		const node = snapshot.nodes.find(n => n.id === id);
		if (!node) continue;

		const tool = byId.get(node.data.toolId ?? '');
		const notes = vibe.notes.join('; ');

		lowScores.push({
			type: 'low-score',
			severity: vibe.status === 'REKT' ? 'high' : 'medium',
			what: `Low vibe score for ${node.data.label}`,
			why: notes || 'Multiple friction points detected',
			evidence: `Score: ${vibe.score}/100, Tool: ${tool?.name ?? '?'}`,
			suggestedFix: 'Review connections and consider alternative tools'
		});
	}

	// Sort within each category by ruleId (deterministic)
	risks.sort((a, b) => (a.ruleId || '').localeCompare(b.ruleId || ''));
	fixes.sort((a, b) => (a.ruleId || '').localeCompare(b.ruleId || ''));
	positives.sort((a, b) => (a.ruleId || '').localeCompare(b.ruleId || ''));

	// Combine in deterministic order
	const findings = [...collisions, ...risks, ...fixes, ...positives, ...lowScores];

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
 * Helper function to render evidence details for a finding
 */
function renderEvidenceDetails(pack: EvidencePack, allUrls: Set<string>): string {
	let md = '<details>\n';
	md += '<summary>Evidence Details</summary>\n\n';

	if (pack.needsVerification) {
		md += '_⚠️ This claim requires verification - insufficient primary evidence._\n\n';
	}

	md += `**Confidence:** ${pack.confidence}\n\n`;
	md += `**Scope:** ${pack.scope}\n\n`;

	if (pack.evidence.length > 0) {
		md += '**Supporting Evidence:**\n\n';
		for (const item of pack.evidence) {
			md += `- [${item.sourceType}] ${item.excerpt}\n`;
			md += `  - Source: ${item.url}\n`;
			if (item.note) {
				md += `  - Note: ${item.note}\n`;
			}
			allUrls.add(canonicalizeUrl(item.url));
		}
		md += '\n';
	}

	if (pack.counterEvidence.length > 0) {
		md += '**Counter-Evidence:**\n\n';
		for (const item of pack.counterEvidence) {
			md += `- [${item.sourceType}] ${item.excerpt}\n`;
			md += `  - Source: ${item.url}\n`;
			if (item.note) {
				md += `  - Note: ${item.note}\n`;
			}
			allUrls.add(canonicalizeUrl(item.url));
		}
		md += '\n';
	}

	md += '</details>\n\n';
	return md;
}

/**
 * Build markdown report from structured report data.
 */
export function buildReportMarkdown(report: ReportData): string {
	let md = '# BentoStack Vibe Report\n\n';
	md += `**Generated:** ${report.timestamp}\n\n`;
	md += `**Global Vibe:** ${report.globalVibe}/100 (${report.tier})\n\n`;

	// Collect all URLs for sources footer
	const allUrls = new Set<string>();

	// Separate findings by type
	const collisions = report.findings.filter(f => f.type === 'collision');
	const risks = report.findings.filter(f => f.type === 'risk');
	const fixes = report.findings.filter(f => f.type === 'fix');
	const positives = report.findings.filter(f => f.type === 'positive');
	const lowScores = report.findings.filter(f => f.type === 'low-score');

	// Top Findings (collisions and low-score)
	md += '## Top Findings\n\n';
	const topFindings = [...collisions, ...lowScores];
	if (topFindings.length === 0) {
		md += '_No major issues detected. Your stack is looking good!_\n\n';
	} else {
		for (let i = 0; i < topFindings.length; i++) {
			const f = topFindings[i];
			const severity = f.severity === 'high' ? '🔴' : f.severity === 'medium' ? '🟡' : '🟢';
			md += `### ${i + 1}. ${severity} ${f.what}\n\n`;
			md += `**Why:** ${f.why}\n\n`;
			md += `**Evidence:** ${f.evidence}\n\n`;
			md += `**Suggested Fix:** ${f.suggestedFix}\n\n`;

			if (f.evidencePack) {
				md += renderEvidenceDetails(f.evidencePack, allUrls);
			}
		}
	}

	// Risks section
	if (risks.length > 0) {
		md += '## Risks\n\n';
		for (let i = 0; i < risks.length; i++) {
			const f = risks[i];
			const severity = f.severity === 'high' ? '🔴' : f.severity === 'medium' ? '🟡' : '🟢';
			md += `### ${i + 1}. ${severity} ${f.what}\n\n`;
			md += `**Why:** ${f.why}\n\n`;
			md += `**Evidence:** ${f.evidence}\n\n`;
			md += `**Suggested Fix:** ${f.suggestedFix}\n\n`;

			if (f.evidencePack) {
				md += renderEvidenceDetails(f.evidencePack, allUrls);
			}
		}
	}

	// Fixes section
	if (fixes.length > 0) {
		md += '## Fixes\n\n';
		for (let i = 0; i < fixes.length; i++) {
			const f = fixes[i];
			md += `### ${i + 1}. ${f.what}\n\n`;
			md += `**What:** ${f.why}\n\n`;
			md += `**Evidence:** ${f.evidence}\n\n`;
			md += `**Scope:** ${f.suggestedFix}\n\n`;

			if (f.evidencePack) {
				md += renderEvidenceDetails(f.evidencePack, allUrls);
			}
		}
	}

	// Greenlights section
	if (positives.length > 0) {
		md += '## Greenlights\n\n';
		for (let i = 0; i < positives.length; i++) {
			const f = positives[i];
			md += `### ${i + 1}. ✅ ${f.what}\n\n`;
			md += `**What:** ${f.why}\n\n`;
			md += `**Evidence:** ${f.evidence}\n\n`;
			md += `**Scope:** ${f.suggestedFix}\n\n`;

			if (f.evidencePack) {
				md += renderEvidenceDetails(f.evidencePack, allUrls);
			}
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

	// Sources footer (if any evidence was included)
	if (allUrls.size > 0) {
		md += '## Sources\n\n';
		const sortedUrls = Array.from(allUrls).sort();
		for (const url of sortedUrls) {
			md += `- ${url}\n`;
		}
		md += '\n';
	}

	return md;
}
