import type { Library } from '$lib/registry/schema';
import type { ToolId, NodeId } from '$lib/graph/graph-types';

export type Suggestion = {
	toolId: ToolId;
	toolName: string;
	reason: string;
	affectsNodeId: NodeId;
	category: string;
};

type SuggestionContext = {
	sourceNodeId: NodeId;
	sourceToolId: ToolId;
	sourceCategory: string;
	targetNodeId: NodeId;
	targetToolId: ToolId;
	targetCategory: string;
	registry: Library[];
	byId: Map<string, Library>;
};

/**
 * Generate collision-resolving suggestions for an edge.
 * Deterministic and rule-based (no LLM).
 * Returns up to 3 suggestions per side (max 6 total).
 */
export function generateCollisionSuggestions(ctx: SuggestionContext): Suggestion[] {
	const suggestions: Suggestion[] = [];

	// Find alternatives for SOURCE node (same category, best_with target)
	for (const lib of ctx.registry) {
		if (
			lib.category === ctx.sourceCategory &&
			lib.id !== ctx.sourceToolId &&
			lib.best_with?.includes(ctx.targetToolId)
		) {
			// Verify this actually resolves collision (symmetric check)
			const targetLib = ctx.byId.get(ctx.targetToolId);
			const wouldResolve =
				!lib.friction_with?.includes(ctx.targetToolId) &&
				!targetLib?.friction_with?.includes(lib.id);

			if (wouldResolve) {
				suggestions.push({
					toolId: lib.id,
					toolName: lib.name,
					reason: `Native support for ${targetLib?.name ?? 'target'}`,
					affectsNodeId: ctx.sourceNodeId,
					category: lib.category
				});
			}
		}
	}

	// Find alternatives for TARGET node (same category, best_with source)
	for (const lib of ctx.registry) {
		if (
			lib.category === ctx.targetCategory &&
			lib.id !== ctx.targetToolId &&
			lib.best_with?.includes(ctx.sourceToolId)
		) {
			// Verify this actually resolves collision (symmetric check)
			const sourceLib = ctx.byId.get(ctx.sourceToolId);
			const wouldResolve =
				!lib.friction_with?.includes(ctx.sourceToolId) &&
				!sourceLib?.friction_with?.includes(lib.id);

			if (wouldResolve) {
				suggestions.push({
					toolId: lib.id,
					toolName: lib.name,
					reason: `Native support for ${sourceLib?.name ?? 'source'}`,
					affectsNodeId: ctx.targetNodeId,
					category: lib.category
				});
			}
		}
	}

	// Sort: native matches first (those in best_with of the other tool), then by vibe_score desc
	const sortedSuggestions = suggestions.sort((a, b) => {
		const aLib = ctx.byId.get(a.toolId);
		const bLib = ctx.byId.get(b.toolId);

		// Prefer "native" matches (best_with relationships)
		const aIsNative =
			(a.affectsNodeId === ctx.sourceNodeId && aLib?.best_with?.includes(ctx.targetToolId)) ||
			(a.affectsNodeId === ctx.targetNodeId && aLib?.best_with?.includes(ctx.sourceToolId));
		const bIsNative =
			(b.affectsNodeId === ctx.sourceNodeId && bLib?.best_with?.includes(ctx.targetToolId)) ||
			(b.affectsNodeId === ctx.targetNodeId && bLib?.best_with?.includes(ctx.sourceToolId));

		if (aIsNative && !bIsNative) return -1;
		if (!aIsNative && bIsNative) return 1;

		// Then by vibe_score desc
		const aScore = aLib?.vibe_score ?? 50;
		const bScore = bLib?.vibe_score ?? 50;
		if (aScore !== bScore) return bScore - aScore;

		// Finally by name
		return a.toolName.localeCompare(b.toolName);
	});

	// Limit to 3 per side (max 6 total, but practically we'll limit to 3 for UI)
	return sortedSuggestions.slice(0, 6);
}
