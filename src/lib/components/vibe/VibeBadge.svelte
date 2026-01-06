<script lang="ts">
  let { score } = $props<{ score: number }>();

  const tier = $derived.by(() => {
    if (score >= 80) return { label: 'GIGA', hint: 'native synergy' };
    if (score >= 60) return { label: 'SOLID', hint: 'works fine' };
    if (score >= 40) return { label: 'SUS', hint: 'some friction' };
    return { label: 'REKT', hint: 'you will suffer' };
  });
</script>

<div class="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-2 py-1">
  <div class="text-xs font-semibold tabular-nums">{score}</div>
  <div class="text-[10px] font-semibold uppercase tracking-wider opacity-80">{tier.label}</div>
  <div class="text-[10px] opacity-60">{tier.hint}</div>
</div>
