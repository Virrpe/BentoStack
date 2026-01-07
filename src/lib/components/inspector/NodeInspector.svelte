<script lang="ts">
  import { vibeEngine } from '$lib/vibe/vibe-engine.svelte';
  import VibeBadge from '$lib/components/vibe/VibeBadge.svelte';
  import type { FlowNode } from '$lib/graph/graph-types';

  let { node } = $props<{ node: FlowNode }>();

  const vibe = $derived(vibeEngine.nodeVibes[node.id]);
  const libs = $derived.by(() =>
    vibeEngine.registry.filter((l) => l.category === node.data.category)
  );

  const connections = $derived.by(() => {
    const incoming = vibeEngine.edges.filter(e => e.target === node.id);
    const outgoing = vibeEngine.edges.filter(e => e.source === node.id);
    return { incoming, outgoing };
  });

  function handleToolChange(e: Event) {
    const toolId = (e.currentTarget as HTMLSelectElement).value;
    vibeEngine.updateTool(node.id, toolId);
  }

  function handleDelete() {
    if (confirm(`Delete "${node.data.label}" node?`)) {
      // For now, just log - full implementation will come when we wire to +page.svelte
      console.log('Delete node:', node.id);
    }
  }
</script>

<div class="node-inspector">
  <section class="inspector-section">
    <h3 class="inspector-section__title">Category</h3>
    <p class="inspector-section__value">{node.data.category}</p>
  </section>

  <section class="inspector-section">
    <h3 class="inspector-section__title">Tool</h3>
    <select
      class="inspector-select"
      value={node.data.toolId ?? ''}
      onchange={handleToolChange}
    >
      <option value="" disabled>Select tool…</option>
      {#each libs as lib (lib.id)}
        <option value={lib.id}>{lib.name}</option>
      {/each}
    </select>
  </section>

  <section class="inspector-section">
    <h3 class="inspector-section__title">Vibe Score</h3>
    <VibeBadge score={vibe?.score ?? 0} />
    {#if vibe?.notes && vibe.notes.length > 0}
      <ul class="inspector-notes">
        {#each vibe.notes as note}
          <li>{note}</li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="inspector-section">
    <h3 class="inspector-section__title">Connections</h3>
    <div class="inspector-connections">
      {#if connections.incoming.length > 0}
        <div class="inspector-connections__group">
          <span class="inspector-connections__label">Incoming ({connections.incoming.length})</span>
          {#each connections.incoming as edge (edge.id)}
            {@const edgeVibe = vibeEngine.edgeVibes[edge.id]}
            {@const sourceNode = vibeEngine.nodes.find(n => n.id === edge.source)}
            <div class="connection-item" data-status={edgeVibe?.status}>
              {sourceNode?.data.label ?? 'Unknown'}
            </div>
          {/each}
        </div>
      {/if}

      {#if connections.outgoing.length > 0}
        <div class="inspector-connections__group">
          <span class="inspector-connections__label">Outgoing ({connections.outgoing.length})</span>
          {#each connections.outgoing as edge (edge.id)}
            {@const edgeVibe = vibeEngine.edgeVibes[edge.id]}
            {@const targetNode = vibeEngine.nodes.find(n => n.id === edge.target)}
            <div class="connection-item" data-status={edgeVibe?.status}>
              {targetNode?.data.label ?? 'Unknown'}
            </div>
          {/each}
        </div>
      {/if}

      {#if connections.incoming.length === 0 && connections.outgoing.length === 0}
        <p class="text-muted">No connections</p>
      {/if}
    </div>
  </section>

  <section class="inspector-section">
    <button class="inspector-button inspector-button--danger" onclick={handleDelete}>
      Delete Node
    </button>
  </section>
</div>

<style>
  .node-inspector {
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

  .inspector-section__value {
    font-size: var(--text-base);
    color: var(--text-primary);
    margin: 0;
  }

  .inspector-select {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-size: var(--text-sm);
    outline: none;
    transition: border-color var(--duration-fast) var(--ease-out);
  }

  .inspector-select:hover {
    border-color: var(--border-hover);
  }

  .inspector-select:focus-visible {
    box-shadow: var(--ring-focus);
    border-color: var(--border-accent);
  }

  .inspector-notes {
    margin: var(--space-3) 0 0 0;
    padding-left: var(--space-4);
    font-size: var(--text-xs);
    color: var(--text-secondary);
    list-style: disc;
  }

  .inspector-connections {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .inspector-connections__label {
    display: block;
    font-size: var(--text-xs);
    color: var(--text-muted);
    margin-bottom: var(--space-2);
  }

  .connection-item {
    padding: var(--space-2) var(--space-3);
    background: var(--bg-elevated);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    border-left: 3px solid var(--border-default);
  }

  .connection-item[data-status="NATIVE"] {
    border-left-color: var(--color-native-500);
  }

  .connection-item[data-status="COLLISION"] {
    border-left-color: var(--color-collision-500);
  }

  .inspector-button {
    width: 100%;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    transition: background var(--duration-fast) var(--ease-out),
                box-shadow var(--duration-fast) var(--ease-out);
  }

  .inspector-button--danger {
    background: var(--color-collision-500);
    color: white;
  }

  .inspector-button--danger:hover {
    background: var(--color-collision-400);
    box-shadow: var(--glow-collision);
  }

  .text-muted {
    color: var(--text-muted);
    font-size: var(--text-sm);
  }
</style>
