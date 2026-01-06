import type { FlowNode, FlowEdge } from '$lib/graph/graph-types';

const STORAGE_KEY = 'bentostack:graph';
const STORAGE_VERSION = 1;

export interface PersistedGraph {
  version: number;
  nodes: FlowNode[];
  edges: FlowEdge[];
  savedAt: string;
}

/**
 * Save graph to localStorage
 */
export function saveGraph(nodes: FlowNode[], edges: FlowEdge[]): void {
  try {
    const data: PersistedGraph = {
      version: STORAGE_VERSION,
      nodes,
      edges,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save graph:', error);
  }
}

/**
 * Load graph from localStorage
 * Returns null if no saved graph or if corrupt
 */
export function loadGraph(): PersistedGraph | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw) as PersistedGraph;
    if (!data.version || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
      console.warn('Invalid graph structure');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to load graph:', error);
    return null;
  }
}

/**
 * Clear saved graph from localStorage
 */
export function clearGraph(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export graph as JSON file download
 */
export function exportGraph(nodes: FlowNode[], edges: FlowEdge[]): void {
  const data: PersistedGraph = {
    version: STORAGE_VERSION,
    nodes,
    edges,
    savedAt: new Date().toISOString()
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `bentostack-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

/**
 * Import graph from JSON file
 */
export async function importGraph(file: File): Promise<PersistedGraph | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as PersistedGraph;
        if (!data.version || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
          resolve(null);
          return;
        }
        resolve(data);
      } catch {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsText(file);
  });
}
