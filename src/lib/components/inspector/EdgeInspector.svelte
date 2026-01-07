<script lang="ts">
  import { vibeEngine } from '$lib/vibe/vibe-engine.svelte';
  import type { FlowEdge } from '$lib/graph/graph-types';

  let { edge } = $props<{ edge: FlowEdge }>();

  const edgeVibe = $derived(vibeEngine.edgeVibes[edge.id]);
  const sourceNode = $derived(vibeEngine.nodes.find(n => n.id === edge.source));
  const targetNode = $derived(vibeEngine.nodes.find(n => n.id === edge.target));

  // Suggestion generation (symmetric + collision-resolving)
  const suggestions = $derived.by(() => {
    if (edgeVibe?.status !== 'COLLISION') return [];
    if (!sourceNode || !targetNode) return [];

    const sourceTool = sourceNode.data.toolId;
    const targetTool = targetNode.data.toolId;
    if (!sourceTool || !targetTool) return [];

    const suggestions: Array<{
      id: string;
      action: string;
      toolId: string;
      toolName: string;
      reason: string;
      targetNodeId: string;
    }> = [];

    // Find alternatives for SOURCE node (same category, best_with target)
    for (const lib of vibeEngine.registry) {
      if (lib.category === sourceNode.data.category &&
          lib.id !== sourceTool &&
          lib.best_with?.includes(targetTool)) {
        // Verify this actually resolves collision (symmetric check)
        const targetLib = vibeEngine.byId.get(targetTool);
        const wouldResolve = !lib.friction_with?.includes(targetTool) &&
                             !targetLib?.friction_with?.includes(lib.id);

        if (wouldResolve) {
          suggestions.push({
            id: `${edge.id}-source-${lib.id}`,
            action: `Change ${sourceNode.data.label} to:`,
            toolId: lib.id,
            toolName: lib.name,
            reason: `Native ${targetNode.data.label} support`,
            targetNodeId: sourceNode.id
          });
        }
      }
    }

    // Find alternatives for TARGET node (same category, best_with source)
    for (const lib of vibeEngine.registry) {
      if (lib.category === targetNode.data.category &&
          lib.id !== targetTool &&
          lib.best_with?.includes(sourceTool)) {
        // Verify this actually resolves collision (symmetric check)
        const sourceLib = vibeEngine.byId.get(sourceTool);
        const wouldResolve = !lib.friction_with?.includes(sourceTool) &&
                             !sourceLib?.friction_with?.includes(lib.id);

        if (wouldResolve) {
          suggestions.push({
            id: `${edge.id}-target-${lib.id}`,
            action: `Change ${targetNode.data.label} to:`,
            toolId: lib.id,
            toolName: lib.name,
            reason: `Native ${sourceNode.data.label} support`,
            targetNodeId: targetNode.id
          });
        }
      }
    }

    return suggestions.slice(0, 3); // Max 3 total
  });

  function handleApplySuggestion(suggestion: typeof suggestions[0]) {
    vibeEngine.updateTool(suggestion.targetNodeId, suggestion.toolId);
  }

  function handleDelete() {
    if (confirm('Delete this connection?')) {
      vibeEngine.removeEdge(edge.id);
    }
  }
</script>

<div class="edge-inspector">
  <section class="inspector-section">
    <h3 class="inspector-section__title">Connection</h3>
    <div class="edge-path">
      <div class="edge-path__node">{sourceNode?.data.label ?? 'Unknown'}</div>
      <div class="edge-path__arrow">→</div>
      <div class="edge-path__node">{targetNode?.data.label ?? 'Unknown'}</div>
    </div>
  </section>

  <section class="inspector-section">
    <h3 class="inspector-section__title">Status</h3>
    <div class="edge-status" data-status={edgeVibe?.status}>
      <span class="edge-status__badge">{edgeVibe?.status ?? 'UNKNOWN'}</span>
      <p class="edge-status__reason">{edgeVibe?.reason ?? 'No assessment available'}</p>
    </div>
  </section>

  {#if suggestions.length > 0}
    <section class="inspector-section">
      <h3 class="inspector-section__title">Suggestions</h3>
      <div class="suggestions">
        {#each suggestions as suggestion (suggestion.id)}
          <div class="suggestion-card">
            <div class="suggestion-card__action">{suggestion.action}</div>
            <div class="suggestion-card__tool">{suggestion.toolName}</div>
            <div class="suggestion-card__reason">{suggestion.reason}</div>
            <button
              class="suggestion-card__apply"
              onclick={() => handleApplySuggestion(suggestion)}
            >
              Apply
            </button>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <section class="inspector-section">
    <button class="inspector-button inspector-button--danger" onclick={handleDelete}>
      Delete Connection
    </button>
  </section>
</div>

<style>
  .edge-inspector {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .inspector-section__title {
    font-size: var(--text-xs);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wider);
    color: var(--text-muted);
    margin: 0 0 var(--space-2) 0;
  }

  .edge-path {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3);
    background: var(--bg-elevated);
    border-radius: var(--radius-md);
  }

  .edge-path__node {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-primary);
  }

  .edge-path__arrow {
    color: var(--text-muted);
  }

  .edge-status {
    padding: var(--space-3);
    background: var(--bg-elevated);
    border-radius: var(--radius-md);
    border-left: 3px solid var(--border-default);
  }

  .edge-status[data-status="NATIVE"] {
    border-left-color: var(--color-native-500);
    background: rgba(34, 197, 94, 0.05);
  }

  .edge-status[data-status="COLLISION"] {
    border-left-color: var(--color-collision-500);
    background: rgba(239, 68, 68, 0.05);
  }

  .edge-status__badge {
    display: inline-block;
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-xs);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wider);
    border-radius: var(--radius-sm);
    background: var(--bg-card);
  }

  .edge-status[data-status="NATIVE"] .edge-status__badge {
    color: var(--color-native-400);
  }

  .edge-status[data-status="COLLISION"] .edge-status__badge {
    color: var(--color-collision-400);
  }

  .edge-status__reason {
    margin: var(--space-2) 0 0 0;
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  .suggestions {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .suggestion-card {
    padding: var(--space-3);
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
  }

  .suggestion-card__action {
    font-size: var(--text-xs);
    color: var(--text-muted);
    margin-bottom: var(--space-1);
  }

  .suggestion-card__tool {
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-1);
  }

  .suggestion-card__reason {
    font-size: var(--text-xs);
    color: var(--text-secondary);
    margin-bottom: var(--space-3);
  }

  .suggestion-card__apply {
    width: 100%;
    padding: var(--space-2);
    background: var(--color-accent-500);
    color: white;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    transition: background var(--duration-fast) var(--ease-out);
  }

  .suggestion-card__apply:hover {
    background: var(--color-accent-400);
  }

  .inspector-button {
    width: 100%;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    transition: background var(--duration-fast) var(--ease-out);
  }

  .inspector-button--danger {
    background: var(--color-collision-500);
    color: white;
  }

  .inspector-button--danger:hover {
    background: var(--color-collision-400);
  }
</style>
