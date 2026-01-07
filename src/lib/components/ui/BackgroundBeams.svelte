<script lang="ts">
  let { intensity = 0.55 } = $props<{ intensity?: number }>();
</script>

<div class="pointer-events-none absolute inset-0">
  <div
    class="absolute inset-0 opacity-70"
    style={`opacity:${intensity}; background:
      radial-gradient(900px 500px at 20% 10%, rgba(56,189,248,0.20), transparent 60%),
      radial-gradient(900px 500px at 80% 30%, rgba(168,85,247,0.18), transparent 60%),
      radial-gradient(900px 600px at 50% 90%, rgba(34,197,94,0.12), transparent 60%)
    `}
  ></div>
  <div class="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black"></div>
</div>
