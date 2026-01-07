import type { VibeEngine } from './vibe-engine.svelte';
import type { FlowNode, FlowEdge, VibeNode, VibeEdge } from '$lib/graph/graph-types';

export type VibeSnapshot = {
	nodes: FlowNode[];
	edges: FlowEdge[];
	nodeVibes: Record<string, VibeNode>;
	edgeVibes: Record<string, VibeEdge>;
	globalVibe: number;
};

/**
 * Extracts a plain JSON-friendly snapshot from the vibe engine.
 * No proxies, no functions, just data.
 */
export function getSnapshot(engine: VibeEngine): VibeSnapshot {
	return {
		nodes: structuredClone(engine.nodes),
		edges: structuredClone(engine.edges),
		nodeVibes: structuredClone(engine.nodeVibes),
		edgeVibes: structuredClone(engine.edgeVibes),
		globalVibe: engine.globalVibe
	};
}
