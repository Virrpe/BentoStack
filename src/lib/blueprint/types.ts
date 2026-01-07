import type { LibraryCategory } from '$lib/registry/schema';

export type ManifestTool = {
	id: string;
	name: string;
	category: LibraryCategory;
	npm: string;
};

export type ManifestNode = {
	id: string;
	category: string;
	toolId: string;
};

export type ManifestEdge = {
	id: string;
	source: string;
	target: string;
	status?: 'NATIVE' | 'COLLISION' | 'NEUTRAL';
	weight?: number;
};

export type Manifest = {
	version: 1;
	generatedAt: string; // ISO 8601
	tools: ManifestTool[];
	nodes: ManifestNode[];
	edges: ManifestEdge[];
	globalVibe: number;
};

export type ReportFinding = {
	type: 'collision' | 'low-score';
	severity: 'high' | 'medium' | 'low';
	what: string;
	why: string;
	evidence: string;
	suggestedFix: string;
};

export type ReportSwap = {
	edgeId: string;
	sourceTool: string;
	targetTool: string;
	alternatives: Array<{
		toolId: string;
		toolName: string;
		reason: string;
		affectsNodeId: string;
	}>;
};

export type ReportData = {
	timestamp: string;
	globalVibe: number;
	tier: 'GIGA' | 'SOLID' | 'SUS' | 'REKT';
	findings: ReportFinding[];
	swaps: ReportSwap[];
	manifest: Manifest;
};
