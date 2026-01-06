# BentoStack

A vibe-based stack orchestrator: build your app stack as a graph, watch *ripple scoring* propagate across connected tools.

## Quickstart

```bash
pnpm install
pnpm dev
```

## MVP scope

- SvelteKit 2 + Svelte 5 (Runes-only)
- Svelte Flow canvas
- Registry-driven compatibility (best_with / friction_with)
- Ripple re-audit of the connected component on every change
- Simple Aceternity-ish background polish

## Notes

- This MVP is intentionally **local-only**: no LLM, no scraping, no sandbox workers yet.
- Registry is editable at `src/lib/registry/registry.json`.
