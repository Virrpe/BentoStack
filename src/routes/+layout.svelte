<script lang="ts">
  // Svelte 5 runes layout: no <slot/>
  let { children } = $props();
  import "../app.css";
  import Navbar from '$lib/components/nav/Navbar.svelte';
</script>

<Navbar />
{@render children()}
