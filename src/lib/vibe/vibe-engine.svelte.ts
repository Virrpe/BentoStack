import type { Library } from '$lib/registry/schema';
import registryData from '$lib/registry/registry.json';
import type { FlowEdge, FlowNode, NodeId, ToolId, VibeEdge, VibeNode } from '$lib/graph/graph-types';
import { buildAdjacency, connectedComponent } from '$lib/graph/graph-utils';
import { DEFAULT_VIBE_RULES, type VibeRules } from './vibe-rules';

type EngineEvent =
  | { type: 'INIT' }
  | { type: 'NODE_TOOL_CHANGED'; nodeId: NodeId; toolId: ToolId }
  | { type: 'EDGE_CONNECTED'; edgeId: string; source: NodeId; target: NodeId }
  | { type: 'EDGE_REMOVED'; edgeId: string }
  | { type: 'NODE_ADDED'; nodeId: NodeId }
  | { type: 'NODE_REMOVED'; nodeId: NodeId };

function clamp01_100(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function toMap(libs: Library[]) {
  const m = new Map<string, Library>();
  for (const lib of libs) m.set(lib.id, lib);
  return m;
}

export class VibeEngine {
  // canon
  readonly registry = (registryData as { libraries: Library[] }).libraries;
  readonly byId = toMap(this.registry);

  // physics constants
  rules = $state<VibeRules>({ ...DEFAULT_VIBE_RULES });

  // graph (raw: avoid deep proxy overhead per Svelte Flow performance guidance)
  nodes = $state.raw<FlowNode[]>([]);
  edges = $state.raw<FlowEdge[]>([]);

  // audit outputs
  nodeVibes = $state<Record<NodeId, VibeNode>>({});
  edgeVibes = $state<Record<string, VibeEdge>>({});

  // debug
  lastEvent = $state<EngineEvent>({ type: 'INIT' });

  globalVibe = $derived.by(() => {
    const ids = Object.keys(this.nodeVibes);
    if (ids.length === 0) return 100;
    let sum = 0;
    for (const id of ids) sum += this.nodeVibes[id]!.score;
    return clamp01_100(sum / ids.length);
  });

  init(seedNodes: FlowNode[], seedEdges: FlowEdge[]) {
    this.nodes = seedNodes;
    this.edges = seedEdges;
    this.lastEvent = { type: 'INIT' };
    this.auditAll();
  }

  updateTool(nodeId: NodeId, toolId: ToolId) {
    this.nodes = this.nodes.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, toolId } } : n
    );
    this.lastEvent = { type: 'NODE_TOOL_CHANGED', nodeId, toolId };
    this.auditRipple([nodeId]);
  }

  connectEdge(edge: FlowEdge) {
    this.edges = [...this.edges, { ...edge, type: 'stack' }];
    this.lastEvent = { type: 'EDGE_CONNECTED', edgeId: edge.id, source: edge.source, target: edge.target };
    this.auditRipple([edge.source, edge.target]);
  }

  removeEdge(edgeId: string) {
    const removed = this.edges.find((e) => e.id === edgeId);
    this.edges = this.edges.filter((e) => e.id !== edgeId);
    this.lastEvent = { type: 'EDGE_REMOVED', edgeId };
    if (removed) this.auditRipple([removed.source, removed.target]);
    else this.auditAll();
  }

  // -------------------------
  // AUDIT CORE
  // -------------------------

  private auditAll() {
    const all = this.nodes.map((n) => n.id);
    this.auditRipple(all);
  }

  private auditRipple(seedIds: NodeId[]) {
    const adjacency = buildAdjacency(this.edges);
    const component = connectedComponent(adjacency, seedIds);

    // edges inside the component
    const nextEdgeVibes: Record<string, VibeEdge> = { ...this.edgeVibes };
    for (const e of this.edges) {
      if (!component.has(e.source) && !component.has(e.target)) continue;
      nextEdgeVibes[e.id] = this.scoreEdge(e.source, e.target);
    }
    this.edgeVibes = nextEdgeVibes;

    // nodes in the component
    const nextNodeVibes: Record<NodeId, VibeNode> = { ...this.nodeVibes };
    for (const id of component) {
      nextNodeVibes[id] = this.scoreNode(id, adjacency);
    }
    this.nodeVibes = nextNodeVibes;
  }

  private scoreEdge(a: NodeId, b: NodeId): VibeEdge {
    const A = this.nodes.find((n) => n.id === a);
    const B = this.nodes.find((n) => n.id === b);
    const aTool = A?.data?.toolId as ToolId | undefined;
    const bTool = B?.data?.toolId as ToolId | undefined;

    const aLib = aTool ? this.byId.get(aTool) : undefined;
    const bLib = bTool ? this.byId.get(bTool) : undefined;

    if (!aLib || !bLib) return { status: 'NEUTRAL', reason: 'Missing tool selection.' };

    const collision =
      aLib.friction_with?.includes(bLib.id) || bLib.friction_with?.includes(aLib.id);

    if (collision) return { status: 'COLLISION', reason: `${aLib.name} friction with ${bLib.name}` };

    const native =
      aLib.best_with?.includes(bLib.id) || bLib.best_with?.includes(aLib.id);

    if (native) return { status: 'NATIVE', reason: `${aLib.name} vibes with ${bLib.name}` };

    return { status: 'NEUTRAL', reason: 'No explicit relationship.' };
  }

  private scoreNode(nodeId: NodeId, adjacency: Map<NodeId, Set<NodeId>>): VibeNode {
    const node = this.nodes.find((n) => n.id === nodeId);
    const toolId = node?.data?.toolId as ToolId | undefined;
    const lib = toolId ? this.byId.get(toolId) : undefined;

    if (!node || !lib) {
      return { score: 0, status: 'BROKEN', notes: ['Select a tool to compute vibe.'] };
    }

    const neighbors = adjacency.get(nodeId) ?? new Set<NodeId>();
    let score = lib.vibe_score ?? 50;

    let unknown = 0;
    const notes: string[] = [];

    for (const nb of neighbors) {
      const nbNode = this.nodes.find((n) => n.id === nb);
      const nbTool = nbNode?.data?.toolId as ToolId | undefined;
      const nbLib = nbTool ? this.byId.get(nbTool) : undefined;

      if (!nbLib) {
        unknown++;
        continue;
      }

      if (lib.friction_with?.includes(nbLib.id)) {
        score -= this.rules.frictionPenalty;
        notes.push(`Friction: ${lib.name} ↔ ${nbLib.name}`);
        continue;
      }

      if (lib.best_with?.includes(nbLib.id)) {
        score += this.rules.bestBonus;
        continue;
      }

      unknown++;
    }

    score -= unknown * this.rules.unknownPenalty;

    const clipped = clamp01_100(score);

    const status =
      clipped >= 80 ? 'GIGA' :
      clipped >= 60 ? 'SOLID' :
      clipped >= 40 ? 'SUS' : 'REKT';

    return { score: clipped, status, notes };
  }
}

export const vibeEngine = new VibeEngine();
