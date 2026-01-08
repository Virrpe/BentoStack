# BentoStack

A vibe-based stack orchestrator: build your app stack as a graph, watch *ripple scoring* propagate across connected tools.

## Quickstart

```bash
pnpm install
pnpm dev
```

## Features

### Core Canvas

- **Interactive Stack Builder**: Visual graph-based stack composition with Svelte Flow
- **Ripple Scoring**: Real-time compatibility analysis across connected tools
- **Evidence-Backed Analysis**: Risks, fixes, and greenlights backed by curated sources
- **Registry-Driven**: Compatibility rules defined in `src/lib/registry/registry.json`

### Shareable Demos

- **Demo Gallery**: 4 curated stack examples on the homepage
  - ORM Collision (Drizzle vs Prisma)
  - Clean Stack (SvelteKit + Drizzle + Turso with greenlights)
  - All Finding Types (demonstrates risks, fixes, and positives)
  - Complex Architecture (production-grade multi-layer stack)
- **Share Links**: Generate shareable URLs for any stack analysis
  - Full graph payload compressed in URL (LZ-string compression)
  - Size limits: max 100 nodes, 300 edges, 5000 chars encoded
  - **Privacy note**: URLs contain the complete stack data
- **Demo Route**: `/demo?data=<encoded>` for viewing shared analyses

### Build Metadata

- **`/__meta` Endpoint**: JSON metadata for deployment transparency
  - Git SHA, version, build timestamp, environment
  - Useful for debugging and support
- **`/__meta` Page**: Human-readable metadata view with copy buttons

## Routes

- `/` - Canvas: Build and analyze your stack visually
- `/report` - Detailed analysis report with evidence-backed findings
- `/demo?data=<encoded>` - View shared stack analysis
- `/registry` - Browse the compatibility registry
- `/__meta` - Build and deployment metadata

## How Share Links Work

Share links use URL-safe compression to encode the complete graph:

1. Graph (nodes + edges) is canonically sorted for determinism
2. Serialized to JSON and compressed with LZ-string
3. Embedded in URL as query parameter: `/demo?data=<compressed>`
4. Recipient loads demo route, which deserializes and renders the report

**Example workflow:**

1. Build a stack on the canvas
2. Go to `/report` and click "Copy Share Link"
3. Share the URL with teammates or community
4. They open the link to see your exact stack analysis

## Testing

```bash
pnpm test        # Run all tests
pnpm build       # Production build
```

## Tech Stack

- SvelteKit 2 + Svelte 5 (Runes-only)
- Svelte Flow (interactive canvas)
- Tailwind CSS 4 (styling)
- Vitest (testing)
- lz-string (URL compression)

## Notes

- This MVP is intentionally **local-only**: no LLM, no scraping, no sandbox workers yet.
- Registry is editable at `src/lib/registry/registry.json`.
- Share links are deterministic: same graph always produces identical URLs.
