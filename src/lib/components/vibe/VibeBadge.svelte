<script lang="ts">
  let { score } = $props<{ score: number }>();

  const tier = $derived.by(() => {
    if (score >= 80) return { label: 'GIGA', hint: 'native synergy' };
    if (score >= 60) return { label: 'SOLID', hint: 'works fine' };
    if (score >= 40) return { label: 'SUS', hint: 'some friction' };
    return { label: 'REKT', hint: 'you will suffer' };
  });

  // Trigger animation on score change
  let tickTrigger = $state(false);
  $effect(() => {
    score; // track score
    tickTrigger = true;
    setTimeout(() => tickTrigger = false, 160);
  });
</script>

<div class="vibe-badge" class:tick={tickTrigger}>
  <div class="text-xs font-semibold tabular-nums">{score}</div>
  <div class="text-[10px] font-semibold uppercase tracking-wider opacity-80">{tier.label}</div>
  <div class="text-[10px] opacity-60">{tier.hint}</div>
</div>

<style>
  .vibe-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.3);
    padding: 4px 8px;
    transition: transform 120ms var(--ease-out);
  }

  .vibe-badge.tick {
    animation: badge-tick 160ms var(--ease-out);
  }

  @keyframes badge-tick {
    0% { transform: scale(1); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .vibe-badge.tick {
      animation: none;
    }
  }
</style>
