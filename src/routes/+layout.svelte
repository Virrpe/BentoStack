<script lang="ts">
  // Svelte 5 runes layout: no <slot/>
  let { children } = $props();
  import "../app.css";
</script>

{@render children()}
