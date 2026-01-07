<script lang="ts">
  import { fade } from 'svelte/transition';
  import { vibeEngine } from '$lib/vibe/vibe-engine.svelte';
  import NodeInspector from './NodeInspector.svelte';
  import EdgeInspector from './EdgeInspector.svelte';

  let { selection, onClose } = $props<{
    selection: { type: 'node'; id: string } | { type: 'edge'; id: string } | null;
    onClose: () => void;
  }>();

  const isOpen = $derived(selection !== null);

  const selectedNode = $derived.by(() => {
    if (selection?.type === 'node') {
      return vibeEngine.nodes.find(n => n.id === selection.id);
    }
    return null;
  });

  const selectedEdge = $derived.by(() => {
    if (selection?.type === 'edge') {
      return vibeEngine.edges.find(e => e.id === selection.id);
    }
    return null;
  });
</script>

<aside class="inspector" class:open={isOpen}>
  <header class="inspector__header">
    <button onclick={onClose} aria-label="Close inspector">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 14l5-4-5-4v8z"/>
      </svg>
    </button>
    <span class="inspector__title">Inspector</span>
  </header>

  <div class="inspector__content">
    {#if !selection}
      <div class="inspector__empty" transition:fade={{ duration: 150 }}>
        <p>Select a node or edge to view details</p>
      </div>
    {:else if selection.type === 'node' && selectedNode}
      <div transition:fade={{ duration: 150 }}>
        <NodeInspector node={selectedNode} />
      </div>
    {:else if selection.type === 'edge' && selectedEdge}
      <div transition:fade={{ duration: 150 }}>
        <EdgeInspector edge={selectedEdge} />
      </div>
    {/if}
  </div>
</aside>

<style>
  .inspector {
    position: fixed;
    right: 0;
    top: 0;
    width: 320px;
    height: 100vh;
    background: var(--bg-panel);
    border-left: 1px solid var(--border-default);
    display: flex;
    flex-direction: column;
    z-index: 50;
    transform: translateX(100%);
    transition: transform var(--duration-slow) var(--ease-out);
  }

  .inspector.open {
    transform: translateX(0);
  }

  .inspector__header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--border-default);
  }

  .inspector__header button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    transition: background var(--duration-fast) var(--ease-out),
                color var(--duration-fast) var(--ease-out);
  }

  .inspector__header button:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .inspector__title {
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
  }

  .inspector__content {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-5);
  }

  .inspector__empty {
    text-align: center;
    padding: var(--space-8) var(--space-4);
    color: var(--text-muted);
  }
</style>
