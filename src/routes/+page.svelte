<script lang="ts">
  import { onMount } from 'svelte';
  import { SvelteFlow, Background, Controls, MiniMap } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';

  import type { FlowEdge, FlowNode } from '$lib/graph/graph-types';
  import { vibeEngine } from '$lib/vibe/vibe-engine.svelte';
  import StackNode from '$lib/components/flow/StackNode.svelte';
  import StackEdge from '$lib/components/flow/StackEdge.svelte';
  import BackgroundBeams from '$lib/components/ui/BackgroundBeams.svelte';
  import VibeBadge from '$lib/components/vibe/VibeBadge.svelte';
  import InspectorPanel from '$lib/components/inspector/InspectorPanel.svelte';
  import BentoMascotCard from '$lib/components/ui/BentoMascotCard.svelte';
  import EventLED from '$lib/components/ui/EventLED.svelte';
  import AmbientDrift from '$lib/components/ui/AmbientDrift.svelte';
  import { saveGraph, loadGraph, clearGraph, exportGraph, importGraph } from '$lib/utils/storage';
  import { loadPrefs, savePrefs } from '$lib/ui/prefs';
  import { initSound, unlockAudio, playClick, playConfirm, playWarn } from '$lib/ui/sound';

  // Flow instance (set via on:init to avoid SSR issues)
  let flowInstance: any = null;

  // Preferences
  let snapToGrid = $state(false);
  let soundEnabled = $state(false);
  const snapGrid: [number, number] = [24, 24];

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

  // Arrange nodes into deterministic bento layout
  function arrangeNodes() {
    const categoryOrder = ['Frontend', 'Backend', 'Auth', 'ORM', 'Database'];

    const sorted = [...vibeEngine.nodes].sort((a, b) => {
      const catA = a.data?.category ?? '';
      const catB = b.data?.category ?? '';
      const orderA = categoryOrder.indexOf(catA);
      const orderB = categoryOrder.indexOf(catB);

      if (orderA !== -1 && orderB !== -1) return orderA - orderB;
      if (orderA !== -1) return -1;
      if (orderB !== -1) return 1;

      return a.id.localeCompare(b.id);
    });

    const X_STEP = 320;
    const Y_STEP = 200;
    const START_X = 40;
    const START_Y = 80;

    const updated = sorted.map((node, i) => {
      const col = Math.floor(i / 2);
      const row = i % 2;
      return {
        ...node,
        position: {
          x: START_X + col * X_STEP,
          y: START_Y + row * Y_STEP
        }
      };
    });

    vibeEngine.nodes = updated;
  }

  // Check if nodes need arrangement (missing/bad positions)
  function needsArrangement(nodes: FlowNode[]): boolean {
    if (nodes.length === 0) return false;
    // Check if any node has missing or near-zero position
    return nodes.some(n => !n.position || (n.position.x < 10 && n.position.y < 10));
  }

  // Boot sequence: load saved graph or seed
  onMount(() => {
    // Load preferences
    const prefs = loadPrefs();
    snapToGrid = prefs.snapToGrid;
    soundEnabled = prefs.soundEnabled;

    const saved = loadGraph();
    let isFirstLoad = false;

    if (saved) {
      console.log('Loaded saved graph from localStorage');
      vibeEngine.init(saved.nodes, saved.edges);
    } else {
      console.log('No saved graph, loading seed');
      vibeEngine.init(seedNodes, seedEdges);
      isFirstLoad = true;
    }

    // Arrange if first load or positions are bad
    if (isFirstLoad || needsArrangement(vibeEngine.nodes)) {
      console.log('Arranging nodes for clean composition');
      arrangeNodes();
    }
  });

  // Handle SvelteFlow initialization with proper paint timing
  function handleFlowInit(evt: CustomEvent) {
    flowInstance = evt.detail;

    // Double rAF to ensure nodes are painted before fitting
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Fit with safe area for toolbar (left side has ~420px of UI)
        flowInstance?.fitView({
          padding: 0.2,
          maxZoom: 0.85,
          minZoom: 0.35,
          duration: 300
        });
      });
    });
  }

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
    if (soundEnabled) playClick();
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
    flowInstance?.fitView({ padding: 0.2, maxZoom: 0.85, minZoom: 0.35, duration: 300 });
  }

  // Snap toggle handler
  function handleToggleSnap() {
    snapToGrid = !snapToGrid;
    const prefs = loadPrefs();
    savePrefs({ ...prefs, snapToGrid });
  }

  // Sound toggle handler
  async function handleToggleSound() {
    soundEnabled = !soundEnabled;
    const prefs = loadPrefs();
    savePrefs({ ...prefs, soundEnabled });

    // Initialize audio context on first enable (requires user gesture)
    if (soundEnabled) {
      initSound();
      await unlockAudio();
      playConfirm(); // Test sound
    }
  }

  // Arrange handler (user-triggered)
  function handleArrange() {
    arrangeNodes();
    // Re-fit after arrangement
    requestAnimationFrame(() => {
      flowInstance?.fitView({
        padding: 0.2,
        maxZoom: 0.85,
        minZoom: 0.35,
        duration: 300
      });
    });
  }

  // Reset/Export/Import handlers
  function handleResetToSeed() {
    if (!confirm('Reset graph? This will clear your current work.')) return;
    clearGraph();
    vibeEngine.init(seedNodes, seedEdges);
    selection = null;
    if (soundEnabled) playWarn();
  }

  function handleExport() {
    exportGraph(vibeEngine.nodes, vibeEngine.edges);
    if (soundEnabled) playConfirm();
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
      if (soundEnabled) playWarn();
      return;
    }

    if (!confirm('Import this graph? Current work will be replaced.')) return;
    vibeEngine.init(data.nodes, data.edges);
    selection = null;
    if (soundEnabled) playConfirm();
  }
</script>

<div class="relative h-[100vh] w-full overflow-hidden">
  <AmbientDrift />
  <BackgroundBeams />

  <div class="header-panel">
    <BentoMascotCard src="/brand/bentocut.png" alt="BentoStack" />
    <div class="text-sm font-semibold tracking-tight">BentoStack</div>
    <VibeBadge score={vibeEngine.globalVibe} />
    <div class="flex items-center gap-2 text-xs opacity-70">
      <EventLED type={vibeEngine.lastEvent.type} />
      <span>Event: {vibeEngine.lastEvent.type}</span>
    </div>
    <a class="text-xs underline opacity-70 hover:opacity-100" href="/registry">Registry</a>
    <button
      class="text-xs underline opacity-70 hover:opacity-100"
      class:active={snapToGrid}
      onclick={handleToggleSnap}
    >
      Snap {snapToGrid ? '✓' : ''}
    </button>
    <button
      class="text-xs underline opacity-70 hover:opacity-100"
      class:active={soundEnabled}
      onclick={handleToggleSound}
    >
      Sound {soundEnabled ? '✓' : ''}
    </button>
    <button class="text-xs underline opacity-70 hover:opacity-100" onclick={handleArrange}>Arrange</button>
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
      {snapToGrid}
      {snapGrid}
      on:init={handleFlowInit}
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

  .header-panel button.active {
    opacity: 1;
    font-weight: 600;
  }
</style>
