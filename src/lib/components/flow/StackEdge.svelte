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
</script>

<g class="stack-edge" data-status={statusClass}>
  <path id={id} class="stack-edge__path" d={edgePath} markerEnd={markerEnd} />
  {#if edgeVibe?.status === 'NATIVE' || edgeVibe?.status === 'COLLISION'}
    <path class="stack-edge__glow" d={edgePath} />
  {/if}
</g>

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

  /* Respect reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .stack-edge__path,
    .stack-edge__glow {
      animation: none !important;
    }
  }
</style>
