<script lang="ts">
  import { vibeEngine } from '$lib/vibe/vibe-engine.svelte.ts';
</script>

<div class="mx-auto max-w-4xl p-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold">Registry</h1>
    <a class="text-sm underline opacity-80 hover:opacity-100" href="/">Back to canvas</a>
  </div>

  <p class="mt-2 text-sm opacity-70">
    This is the canon. If the registry is wrong, the universe is wrong.
  </p>

  <div class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
    {#each vibeEngine.registry as lib (lib.id)}
      <div class="rounded-2xl border border-white/10 bg-black/30 p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-sm font-semibold">{lib.name}</div>
            <div class="text-xs opacity-70">{lib.category}</div>
          </div>
          <div class="rounded-xl border border-white/10 bg-black/40 px-2 py-1 text-xs tabular-nums">
            {lib.vibe_score}
          </div>
        </div>

        <div class="mt-3 text-xs opacity-75">
          <div><span class="opacity-60">npm:</span> {lib.npm_install}</div>
          <div class="mt-1"><span class="opacity-60">boilerplate:</span> {lib.boilerplate_path}</div>
        </div>
      </div>
    {/each}
  </div>
</div>
