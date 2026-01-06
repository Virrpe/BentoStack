export type NodeId = string;
export type ToolId = string;

export type FlowNode = {
  id: NodeId;
  type: string;
  position: { x: number; y: number };
  data: {
    toolId?: ToolId;
    label?: string;
    category?: string;
  };
};

export type FlowEdge = {
  id: string;
  source: NodeId;
  target: NodeId;
  type?: string;
  style?: Record<string, any>;
};

export type VibeEdge = {
  status: 'NATIVE' | 'COLLISION' | 'NEUTRAL';
  reason: string;
};

export type VibeNode = {
  score: number; // 0-100
  status: 'GIGA' | 'SOLID' | 'SUS' | 'REKT' | 'BROKEN';
  notes: string[];
};
