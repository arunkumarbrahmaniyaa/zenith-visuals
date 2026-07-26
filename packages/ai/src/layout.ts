export type AgentNodeStatus = "idle" | "running" | "success" | "error" | "streaming";

export type AgentNodeType =
  | "agent"
  | "planner"
  | "retriever"
  | "vectorstore"
  | "llm"
  | "tool"
  | "memory"
  | "response";

export interface AgentNodeInput {
  id: string;
  label: string;
  type?: AgentNodeType;
  status?: AgentNodeStatus;
  /** Token usage for this step. */
  tokens?: number;
  /** Latency in ms for this step. */
  latencyMs?: number;
  /** Retry attempts. */
  retries?: number;
}

export interface AgentEdgeInput {
  source: string;
  target: string;
  /** Marks the edge as actively streaming data. */
  active?: boolean;
}

export interface AgentNode extends AgentNodeInput {
  depth: number;
  x: number;
  y: number;
}

export interface AgentGraphLayout {
  nodes: AgentNode[];
  edges: AgentEdgeInput[];
  width: number;
  height: number;
}

export interface AgentLayoutOptions {
  nodes: readonly AgentNodeInput[];
  edges: readonly AgentEdgeInput[];
  nodeWidth: number;
  nodeHeight: number;
  hGap: number;
  vGap: number;
}

/**
 * Layered DAG layout for AI agent execution graphs. Depth is assigned by
 * longest path from sources; nodes stack vertically within each layer.
 * Pure and deterministic (SSR-safe, testable).
 */
export function computeAgentLayout(options: AgentLayoutOptions): AgentGraphLayout {
  const { nodes: nodeInputs, edges, nodeWidth, nodeHeight, hGap, vGap } = options;

  const depth = new Map<string, number>();
  for (const n of nodeInputs) depth.set(n.id, 0);
  const adjacency = new Map<string, string[]>();
  for (const e of edges) {
    if (!adjacency.has(e.source)) adjacency.set(e.source, []);
    adjacency.get(e.source)!.push(e.target);
  }

  // Relax depths (guarded against cycles by node count cap).
  for (let pass = 0; pass < nodeInputs.length; pass++) {
    let changed = false;
    for (const e of edges) {
      const want = (depth.get(e.source) ?? 0) + 1;
      if ((depth.get(e.target) ?? 0) < want) {
        depth.set(e.target, want);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const layers = new Map<number, AgentNodeInput[]>();
  for (const node of nodeInputs) {
    const d = depth.get(node.id) ?? 0;
    if (!layers.has(d)) layers.set(d, []);
    layers.get(d)!.push(node);
  }

  const maxDepth = Math.max(0, ...[...layers.keys()]);
  const maxRows = Math.max(1, ...[...layers.values()].map((l) => l.length));
  const stepX = nodeWidth + hGap;
  const stepY = nodeHeight + vGap;

  const nodes: AgentNode[] = [];
  for (const [d, layerNodes] of layers) {
    const offset = ((maxRows - layerNodes.length) * stepY) / 2;
    layerNodes.forEach((node, i) => {
      nodes.push({
        ...node,
        depth: d,
        x: d * stepX,
        y: offset + i * stepY,
      });
    });
  }

  return {
    nodes,
    edges: [...edges],
    width: (maxDepth + 1) * stepX - hGap,
    height: maxRows * stepY - vGap,
  };
}
