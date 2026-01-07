import type { Library } from '$lib/registry/schema';
import type { FlowNode, FlowEdge } from '$lib/graph/graph-types';

export type PackageDependency = {
	name: string;
	version: string;
	isDev: boolean;
};

/**
 * Parse package.json file text and extract dependencies.
 */
export function parsePackageJson(fileText: string): PackageDependency[] {
	try {
		const pkg = JSON.parse(fileText);
		const deps: PackageDependency[] = [];

		// Production dependencies
		if (pkg.dependencies && typeof pkg.dependencies === 'object') {
			for (const [name, version] of Object.entries(pkg.dependencies)) {
				deps.push({ name, version: version as string, isDev: false });
			}
		}

		// Dev dependencies
		if (pkg.devDependencies && typeof pkg.devDependencies === 'object') {
			for (const [name, version] of Object.entries(pkg.devDependencies)) {
				deps.push({ name, version: version as string, isDev: true });
			}
		}

		return deps;
	} catch (err) {
		console.error('Failed to parse package.json:', err);
		return [];
	}
}

/**
 * Map package dependencies to registry tools.
 * Uses exact package name matching and fuzzy token matching.
 */
export function mapDepsToTools(deps: PackageDependency[], registry: Library[]): string[] {
	const toolIds = new Set<string>();

	for (const dep of deps) {
		// Try exact match first (check npm_install string)
		for (const lib of registry) {
			// Extract package name from npm_install (e.g., "npm i @sveltejs/kit" -> "@sveltejs/kit")
			const npmCmd = lib.npm_install;
			if (npmCmd.startsWith('npm i ') || npmCmd.startsWith('npm install ')) {
				const pkgName = npmCmd.replace(/^npm (i|install) /, '').trim();
				if (pkgName === dep.name) {
					toolIds.add(lib.id);
					break;
				}
			}
		}

		// Fuzzy match by tokens (e.g., "drizzle-orm" should match "drizzle")
		if (toolIds.size === 0 || !Array.from(toolIds).some(id => registry.find(l => l.id === id))) {
			for (const lib of registry) {
				const tokens = [lib.id.toLowerCase(), lib.name.toLowerCase()];
				const depLower = dep.name.toLowerCase();

				// Check if dep name contains any token or vice versa
				if (
					tokens.some(token => depLower.includes(token) || token.includes(depLower))
				) {
					toolIds.add(lib.id);
					break;
				}
			}
		}
	}

	return Array.from(toolIds);
}

/**
 * Infer a graph (nodes + edges) from detected tool IDs.
 * Uses deterministic rules to connect related tools.
 */
export function inferGraphFromTools(toolIds: string[], registry: Library[]): { nodes: FlowNode[], edges: FlowEdge[] } {
	const byId = new Map(registry.map(lib => [lib.id, lib]));
	const tools = toolIds.map(id => byId.get(id)).filter((t): t is Library => t !== undefined);

	// Group tools by category
	const byCategory = new Map<string, Library[]>();
	for (const tool of tools) {
		if (!byCategory.has(tool.category)) {
			byCategory.set(tool.category, []);
		}
		byCategory.get(tool.category)!.push(tool);
	}

	// Create nodes (one per category, using first/best tool)
	const categoryOrder = ['Frontend', 'Backend', 'Auth', 'ORM', 'Database'];
	const nodes: FlowNode[] = [];
	const categoryToNodeId = new Map<string, string>();

	for (const cat of categoryOrder) {
		const toolsInCat = byCategory.get(cat);
		if (toolsInCat && toolsInCat.length > 0) {
			// Pick the tool with highest vibe_score
			const bestTool = toolsInCat.sort((a, b) => (b.vibe_score ?? 50) - (a.vibe_score ?? 50))[0];
			const nodeId = cat.toLowerCase();
			categoryToNodeId.set(cat, nodeId);

			nodes.push({
				id: nodeId,
				type: 'stack',
				position: { x: 0, y: 0 }, // Will be arranged later
				data: {
					label: cat,
					toolId: bestTool.id,
					category: cat
				}
			});
		}
	}

	// Create edges using relationship rules
	const edges: FlowEdge[] = [];
	const edgeId = () => crypto.randomUUID();

	const frontend = categoryToNodeId.get('Frontend');
	const backend = categoryToNodeId.get('Backend');
	const auth = categoryToNodeId.get('Auth');
	const orm = categoryToNodeId.get('ORM');
	const db = categoryToNodeId.get('Database');

	// Rule 1: ORM ↔ Database
	if (orm && db) {
		edges.push({ id: edgeId(), source: orm, target: db, type: 'stack' });
	}

	// Rule 2: Auth ↔ Frontend
	if (auth && frontend) {
		edges.push({ id: edgeId(), source: frontend, target: auth, type: 'stack' });
	}

	// Rule 3: Auth ↔ Database (if auth exists)
	if (auth && db) {
		edges.push({ id: edgeId(), source: auth, target: db, type: 'stack' });
	}

	// Rule 4: Frontend ↔ ORM
	if (frontend && orm) {
		edges.push({ id: edgeId(), source: frontend, target: orm, type: 'stack' });
	}

	// Rule 5: Backend ↔ Database (if backend exists)
	if (backend && db) {
		edges.push({ id: edgeId(), source: backend, target: db, type: 'stack' });
	}

	// Rule 6: Backend ↔ ORM (if backend exists)
	if (backend && orm) {
		edges.push({ id: edgeId(), source: backend, target: orm, type: 'stack' });
	}

	return { nodes, edges };
}
