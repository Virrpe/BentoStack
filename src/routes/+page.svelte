<script lang="ts">
  import { onMount } from 'svelte';
  import { SvelteFlow, Background, Controls, MiniMap, useSvelteFlow } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';

  import type { FlowEdge, FlowNode } from '$lib/graph/graph-types';
  import { vibeEngine } from '$lib/vibe/vibe-engine.svelte.ts';
  import StackNode from '$lib/components/flow/StackNode.svelte';
  import StackEdge from '$lib/components/flow/StackEdge.svelte';
  import BackgroundBeams from '$lib/components/ui/BackgroundBeams.svelte';
  import VibeBadge from '$lib/components/vibe/VibeBadge.svelte';
  import InspectorPanel from '$lib/components/inspector/InspectorPanel.svelte';
  import BentoMascotCard from '$lib/components/ui/BentoMascotCard.svelte';
  import { saveGraph, loadGraph, clearGraph, exportGraph, importGraph } from '$lib/utils/storage';

  const { fitView } = useSvelteFlow();

  const nodeTypes = {
    stack: StackNode
  };

  const edgeTypes = {
    stack: StackEdge
  };

  // Selection state
  let selection = $state<{ type: 'node'; id: string } | { type: 'edge'; id: string } | null>(null);

  // Seed graph
  const seedNodes: FlowNode[] = [
    { id: 'frontend', type: 'stack', position: { x: 40, y: 120 }, data: { label: 'Frontend', toolId: 'sveltekit', category: 'Frontend' } },
    { id: 'auth', type: 'stack', position: { x: 360, y: 40 }, data: { label: 'Auth', toolId: 'lucia', category: 'Auth' } },
    { id: 'db', type: 'stack', position: { x: 360, y: 220 }, data: { label: 'Database', toolId: 'turso', category: 'Database' } },
    { id: 'orm', type: 'stack', position: { x: 680, y: 140 }, data: { label: 'ORM', toolId: 'drizzle', category: 'ORM' } }
  ];

  const seedEdges: FlowEdge[] = [
    { id: 'e1', source: 'frontend', target: 'auth', type: 'stack' },
    { id: 'e2', source: 'auth', target: 'db', type: 'stack' },
    { id: 'e3', source: 'frontend', target: 'orm', type: 'stack' },
    { id: 'e4', source: 'orm', target: 'db', type: 'stack' }
  ];

  // Boot sequence: load saved graph or seed
  onMount(() => {
    const saved = loadGraph();

    if (saved) {
      console.log('Loaded saved graph from localStorage');
      vibeEngine.init(saved.nodes, saved.edges);
    } else {
      console.log('No saved graph, loading seed');
      vibeEngine.init(seedNodes, seedEdges);
    }

    // Initial camera fit with constraints (breathing room, never over-zoom)
    setTimeout(() => {
      fitView({ padding: 0.55, maxZoom: 0.85, minZoom: 0.35, duration: 200 });
    }, 50);
  });

  // Auto-save effect (debounced to 500ms)
  let saveTimeoutId: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    // Track changes to nodes/edges
    vibeEngine.nodes;
    vibeEngine.edges;

    // Clear previous timeout
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
    }

    // Schedule save
    saveTimeoutId = setTimeout(() => {
      saveGraph(vibeEngine.nodes, vibeEngine.edges);
      console.debug('Graph auto-saved to localStorage');
    }, 500);
  });

  // Event handlers
  function handleNodeClick(evt: CustomEvent<{ node: FlowNode }>) {
    selection = { type: 'node', id: evt.detail.node.id };
  }

  function handleEdgeClick(evt: CustomEvent<{ edge: FlowEdge }>) {
    selection = { type: 'edge', id: evt.detail.edge.id };
  }

  function handlePaneClick() {
    selection = null;
  }

  function onConnect(evt: CustomEvent<{ source: string; target: string }>) {
    const { source, target } = evt.detail;
    const edge: FlowEdge = { id: crypto.randomUUID(), source, target, type: 'stack' };
    vibeEngine.connectEdge(edge);
  }

  // Camera fit handler
  function handleFit() {
    fitView({ padding: 0.55, maxZoom: 0.85, minZoom: 0.35, duration: 300 });
  }

  // Reset/Export/Import handlers
  function handleResetToSeed() {
    if (!confirm('Reset graph? This will clear your current work.')) return;
    clearGraph();
    vibeEngine.init(seedNodes, seedEdges);
    selection = null;
  }

  function handleExport() {
    exportGraph(vibeEngine.nodes, vibeEngine.edges);
  }

  let fileInput: HTMLInputElement;
  async function handleImport() {
    fileInput.click();
  }

  async function handleFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const data = await importGraph(file);
    if (!data) {
      alert('Failed to import file');
      return;
    }

    if (!confirm('Import this graph? Current work will be replaced.')) return;
    vibeEngine.init(data.nodes, data.edges);
    selection = null;
  }
</script>

<div class="relative h-[100vh] w-full overflow-hidden">
  <BackgroundBeams />

  <div class="header-panel">
    <BentoMascotCard src="/brand/bentocut.png" alt="BentoStack" />
    <div class="text-sm font-semibold tracking-tight">BentoStack</div>
    <VibeBadge score={vibeEngine.globalVibe} />
    <div class="text-xs opacity-70">Event: {vibeEngine.lastEvent.type}</div>
    <a class="text-xs underline opacity-70 hover:opacity-100" href="/registry">Registry</a>
    <button class="text-xs underline opacity-70 hover:opacity-100" onclick={handleFit}>Fit</button>
    <button class="text-xs underline opacity-70 hover:opacity-100" onclick={handleResetToSeed}>Reset</button>
    <button class="text-xs underline opacity-70 hover:opacity-100" onclick={handleExport}>Export</button>
    <button class="text-xs underline opacity-70 hover:opacity-100" onclick={handleImport}>Import</button>
  </div>

  <div class="absolute inset-0">
    <SvelteFlow
      nodes={vibeEngine.nodes}
      edges={vibeEngine.edges}
      {nodeTypes}
      {edgeTypes}
      defaultEdgeOptions={{ type: 'stack' }}
      on:connect={onConnect}
      on:nodeclick={handleNodeClick}
      on:edgeclick={handleEdgeClick}
      on:paneclick={handlePaneClick}
    >
      <Background />
      <MiniMap />
      <Controls />
    </SvelteFlow>
  </div>

  <InspectorPanel {selection} onClose={() => selection = null} />

  <input bind:this={fileInput} type="file" accept="application/json" style="display: none" onchange={handleFileSelected} />
</div>

<style>
  .header-panel {
    position: absolute;
    left: 16px;
    top: 16px;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 12px 16px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(8px);
    min-height: 120px;
  }
</style>
