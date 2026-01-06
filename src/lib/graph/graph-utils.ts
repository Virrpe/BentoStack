import type { FlowEdge, NodeId } from './graph-types';

export function buildAdjacency(edges: FlowEdge[]) {
  const adj = new Map<NodeId, Set<NodeId>>();
  for (const e of edges) {
    if (!adj.has(e.source)) adj.set(e.source, new Set());
    if (!adj.has(e.target)) adj.set(e.target, new Set());
    adj.get(e.source)!.add(e.target);
    adj.get(e.target)!.add(e.source);
  }
  return adj;
}

export function connectedComponent(adjacency: Map<NodeId, Set<NodeId>>, seeds: NodeId[]) {
  const seen = new Set<NodeId>();
  const q: NodeId[] = [];

  for (const s of seeds) {
    if (!seen.has(s)) {
      seen.add(s);
      q.push(s);
    }
  }

  while (q.length) {
    const cur = q.shift()!;
    const nbs = adjacency.get(cur);
    if (!nbs) continue;
    for (const nb of nbs) {
      if (!seen.has(nb)) {
        seen.add(nb);
        q.push(nb);
      }
    }
  }

  return seen;
}
