export interface GraphNodeInput {
  id: string;
  label?: string;
  /** Group index used for palette coloring and matrix / bundle ordering. */
  group?: number;
  /** Relative importance (affects node size). Defaults to node degree. */
  value?: number;
}

export interface GraphLinkInput {
  source: string;
  target: string;
  /** Relative strength (affects stroke width + matrix intensity). Default 1. */
  value?: number;
}

export interface GraphNode {
  id: string;
  label: string;
  group: number;
  /** Position of the node in the normalized order. */
  index: number;
  /** Number of incident links. */
  degree: number;
  /** Weight used for sizing (explicit value or degree). */
  value: number;
}

export interface GraphLink {
  source: string;
  target: string;
  value: number;
}

export interface NormalizedGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * Normalize raw node / link inputs into an ordered, deduplicated graph.
 * Nodes keep their input order; when nodes are omitted they are derived from
 * the links in first-seen order. Pure and deterministic (SSR-safe, testable).
 */
export function normalizeGraph(
  nodes: readonly GraphNodeInput[] | undefined,
  links: readonly GraphLinkInput[],
): NormalizedGraph {
  const degree = new Map<string, number>();
  for (const l of links) {
    degree.set(l.source, (degree.get(l.source) ?? 0) + 1);
    degree.set(l.target, (degree.get(l.target) ?? 0) + 1);
  }

  const inputs: GraphNodeInput[] = nodes && nodes.length ? [...nodes] : dedupeNodes(links);

  const graphNodes: GraphNode[] = inputs.map((input, index) => {
    const deg = degree.get(input.id) ?? 0;
    return {
      id: input.id,
      label: input.label ?? input.id,
      group: input.group ?? 0,
      index,
      degree: deg,
      value: input.value ?? deg,
    };
  });

  const known = new Set(graphNodes.map((n) => n.id));
  const graphLinks: GraphLink[] = links
    .filter((l) => known.has(l.source) && known.has(l.target))
    .map((l) => ({ source: l.source, target: l.target, value: l.value ?? 1 }));

  return { nodes: graphNodes, links: graphLinks };
}

/** Order nodes by group (then original index) so clusters sit together. */
export function orderByGroup(nodes: readonly GraphNode[]): GraphNode[] {
  return [...nodes].sort((a, b) => a.group - b.group || a.index - b.index);
}

export interface AdjacencyMatrix {
  /** Ordered nodes matching matrix rows / columns. */
  order: GraphNode[];
  /** Symmetric `n x n` matrix of summed link values. `matrix[i][j]`. */
  matrix: number[][];
  /** Largest single cell value (0 when the graph has no links). */
  max: number;
}

/**
 * Build a symmetric adjacency matrix. Rows / columns follow `orderByGroup` so
 * densely connected communities appear as blocks along the diagonal.
 */
export function adjacencyMatrix(graph: NormalizedGraph): AdjacencyMatrix {
  const order = orderByGroup(graph.nodes);
  const n = order.length;
  const indexOf = new Map(order.map((node, i) => [node.id, i]));
  const matrix: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));

  let max = 0;
  for (const link of graph.links) {
    const i = indexOf.get(link.source);
    const j = indexOf.get(link.target);
    if (i == null || j == null) continue;
    const rowI = matrix[i]!;
    const rowJ = matrix[j]!;
    rowI[j] = (rowI[j] ?? 0) + link.value;
    rowJ[i] = (rowJ[i] ?? 0) + link.value;
    max = Math.max(max, rowI[j]!, rowJ[i]!);
  }

  return { order, matrix, max };
}

export interface XY {
  x: number;
  y: number;
}

/**
 * Straighten a polyline toward the segment joining its endpoints. `beta = 1`
 * keeps the original control points; `beta = 0` collapses onto a straight
 * line. This is the classic Holten edge-bundling relaxation.
 */
export function bundle(points: readonly XY[], beta: number): XY[] {
  const n = points.length;
  if (n < 2) return points.slice();
  const first = points[0]!;
  const last = points[n - 1]!;
  const out: XY[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const sx = first.x + (last.x - first.x) * t;
    const sy = first.y + (last.y - first.y) * t;
    const p = points[i]!;
    out.push({ x: beta * p.x + (1 - beta) * sx, y: beta * p.y + (1 - beta) * sy });
  }
  return out;
}

/** Build a smooth SVG path through the given points using Catmull-Rom splines. */
export function catmullRomPath(points: readonly XY[]): string {
  const n = points.length;
  if (n === 0) return "";
  if (n === 1) return `M${round(points[0]!.x)},${round(points[0]!.y)}`;
  let d = `M${round(points[0]!.x)},${round(points[0]!.y)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2 < n ? i + 2 : n - 1]!;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${round(c1x)},${round(c1y)} ${round(c2x)},${round(c2y)} ${round(p2.x)},${round(p2.y)}`;
  }
  return d;
}

function round(v: number): number {
  return Math.round(v * 100) / 100;
}

function dedupeNodes(links: readonly GraphLinkInput[]): GraphNodeInput[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const l of links) {
    if (!seen.has(l.source)) {
      seen.add(l.source);
      ids.push(l.source);
    }
    if (!seen.has(l.target)) {
      seen.add(l.target);
      ids.push(l.target);
    }
  }
  return ids.map((id) => ({ id }));
}
