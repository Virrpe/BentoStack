<script lang="ts">
  import { getBezierPath, type EdgeProps } from '@xyflow/svelte';
  import { vibeEngine } from '$lib/vibe/vibe-engine.svelte.ts';

  let { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd } = $props<EdgeProps>();

  const edgeVibe = $derived(vibeEngine.edgeVibes[id]);

  // Use $derived.by for path calculation (avoids tuple destructuring issues)
  const edgePath = $derived.by(() => {
    const [path] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition
    });
    return path;
  });

  const statusClass = $derived(edgeVibe?.status.toLowerCase() ?? 'neutral');

  // Draw-on-create animation (TE hardware feedback)
  let isNew = $state(true);

  $effect(() => {
    // Edge is new on mount, animate for 180ms
    const timer = setTimeout(() => isNew = false, 180);
    return () => clearTimeout(timer);
  });

  // Tooltip state
  let showTooltip = $state(false);
  let tooltipX = $state(0);
  let tooltipY = $state(0);

  function handleMouseEnter(e: MouseEvent) {
    showTooltip = true;
    tooltipX = e.clientX;
    tooltipY = e.clientY;
  }

  function handleMouseLeave() {
    showTooltip = false;
  }
</script>

<g class="stack-edge" data-status={statusClass} class:drawing={isNew}>
  <path id={id} class="stack-edge__path" d={edgePath} markerEnd={markerEnd} />
  {#if edgeVibe?.status === 'NATIVE' || edgeVibe?.status === 'COLLISION'}
    <path class="stack-edge__glow" d={edgePath} />
  {/if}
  <!-- Invisible wider path for hover -->
  <path
    class="stack-edge__hover-target"
    d={edgePath}
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
  />
</g>

{#if showTooltip && edgeVibe}
  <foreignObject x={tooltipX} y={tooltipY} width="1" height="1" style="overflow: visible; pointer-events: none;">
    <div class="edge-tooltip" xmlns="http://www.w3.org/1999/xhtml">
      <div class="tooltip-status" data-status={statusClass}>{edgeVibe.status}</div>
      <div class="tooltip-reason">{edgeVibe.reason}</div>
    </div>
  </foreignObject>
{/if}

<style>
  .stack-edge__path {
    fill: none;
    stroke: var(--color-neutral-500);
    stroke-width: 2px;
    transition: stroke var(--duration-slow) var(--ease-out),
                stroke-width var(--duration-slow) var(--ease-out);
  }

  /* NATIVE: green with subtle glow */
  .stack-edge[data-status="native"] .stack-edge__path {
    stroke: var(--color-native-500);
    stroke-width: 3px;
  }

  .stack-edge[data-status="native"] .stack-edge__glow {
    fill: none;
    stroke: var(--color-native-500);
    stroke-width: 6px;
    opacity: 0.3;
    filter: blur(4px);
  }

  /* COLLISION: red with pulse animation */
  .stack-edge[data-status="collision"] .stack-edge__path {
    stroke: var(--color-collision-500);
    stroke-width: 3px;
    animation: pulse-collision 2s ease-in-out infinite;
  }

  .stack-edge[data-status="collision"] .stack-edge__glow {
    fill: none;
    stroke: var(--color-collision-500);
    stroke-width: 8px;
    opacity: 0.4;
    filter: blur(6px);
    animation: pulse-glow 2s ease-in-out infinite;
  }

  /* NEUTRAL: gray, no animation */
  .stack-edge[data-status="neutral"] .stack-edge__path {
    stroke: var(--color-neutral-500);
    stroke-width: 2px;
  }

  /* Animations */
  @keyframes pulse-collision {
    0%, 100% {
      stroke-width: 3px;
      opacity: 1;
    }
    50% {
      stroke-width: 4px;
      opacity: 0.8;
    }
  }

  @keyframes pulse-glow {
    0%, 100% {
      opacity: 0.3;
    }
    50% {
      opacity: 0.6;
    }
  }

  /* Hover target */
  .stack-edge__hover-target {
    fill: none;
    stroke: transparent;
    stroke-width: 20px;
    cursor: pointer;
  }

  /* Draw-on-create animation (TE hardware feedback) */
  .stack-edge.drawing .stack-edge__path {
    stroke-dasharray: 5;
    animation: edge-draw 180ms linear forwards;
  }

  @keyframes edge-draw {
    from {
      stroke-dashoffset: 10;
    }
    to {
      stroke-dashoffset: 0;
    }
  }

  /* Tooltip styles */
  :global(.edge-tooltip) {
    position: absolute;
    transform: translate(-50%, -120%);
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 11px;
    white-space: nowrap;
    pointer-events: none;
    box-shadow: var(--shadow-lg);
    z-index: 1000;
  }

  :global(.tooltip-status) {
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-bottom: 2px;
  }

  :global(.tooltip-status[data-status="native"]) {
    color: var(--color-native-400);
  }

  :global(.tooltip-status[data-status="collision"]) {
    color: var(--color-collision-400);
  }

  :global(.tooltip-status[data-status="neutral"]) {
    color: var(--color-neutral-400);
  }

  :global(.tooltip-reason) {
    font-size: 10px;
    opacity: 0.7;
  }

  /* Respect reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .stack-edge__path,
    .stack-edge__glow {
      animation: none !important;
    }
  }
</style>
