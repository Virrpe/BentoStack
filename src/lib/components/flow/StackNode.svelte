<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  import { vibeEngine } from '$lib/vibe/vibe-engine.svelte';
  import VibeBadge from '$lib/components/vibe/VibeBadge.svelte';

  // Svelte Flow provides selected prop to custom nodes
  let { id, data, selected = false } = $props<{
    id: string;
    data: { label?: string; toolId?: string; category?: string };
    selected?: boolean;
  }>();

  const libs = $derived.by(() =>
    vibeEngine.registry.filter((l) => !data?.category || l.category === data.category)
  );

  function onToolChange(e: Event) {
    const toolId = (e.currentTarget as HTMLSelectElement).value;
    vibeEngine.updateTool(id, toolId);
  }
</script>

<div class="stack-node" class:selected>
  <div class="flex items-center justify-between gap-2">
    <div class="text-xs font-semibold uppercase tracking-wider opacity-80">{data?.label ?? 'Node'}</div>
    <VibeBadge score={vibeEngine.nodeVibes[id]?.score ?? 0} />
  </div>

  <div class="mt-2">
    <select
      class="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none"
      onchange={onToolChange}
      value={data?.toolId ?? ''}
    >
      <option value="" disabled>Select tool…</option>
      {#each libs as lib (lib.id)}
        <option value={lib.id}>{lib.name}</option>
      {/each}
    </select>
  </div>

  {#if vibeEngine.nodeVibes[id]?.notes?.length}
    <div class="mt-2 space-y-1">
      {#each vibeEngine.nodeVibes[id].notes as note (note)}
        <div class="text-xs opacity-75">• {note}</div>
      {/each}
    </div>
  {/if}

  <Handle type="target" position={Position.Left} class="!h-3 !w-3 !border-0" />
  <Handle type="source" position={Position.Right} class="!h-3 !w-3 !border-0" />
</div>

<style>
  .stack-node {
    min-width: 220px;
    background: var(--bg-card);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xl);
    padding: var(--space-4);
    box-shadow: var(--shadow-lg);
    backdrop-filter: blur(var(--blur-md));
    transition: border-color var(--duration-normal) var(--ease-out),
                box-shadow var(--duration-normal) var(--ease-out),
                transform var(--duration-normal) var(--ease-out);
  }

  .stack-node:hover {
    border-color: var(--border-hover);
    box-shadow: var(--shadow-xl);
    transform: translateY(-1px);
  }

  .stack-node.selected {
    border-color: var(--border-accent);
    box-shadow: var(--ring-selected);
  }
</style>
