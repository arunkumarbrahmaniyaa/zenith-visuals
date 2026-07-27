import { computeChordLayout, type ChordLayout } from "../chord/layout";

export interface WheelNodeInput {
  id: string;
  label?: string;
  color?: string;
}

export interface WheelLinkInput {
  source: string;
  target: string;
  /** Flow magnitude. Default 1. */
  value?: number;
}

export interface WheelMatrix {
  /** Ordered node ids matching the matrix rows / columns. */
  ids: string[];
  /** Display labels, index-aligned with `ids`. */
  labels: string[];
  /** Explicit colors per node (may contain undefined). */
  colors: (string | undefined)[];
  /** `matrix[i][j]` = flow from node i to node j. */
  matrix: number[][];
}

/**
 * Build a square flow matrix from directed node → node dependencies. Nodes keep
 * their input order; when omitted they are derived from the links in first-seen
 * order. Pure and deterministic — feeds `computeChordLayout`.
 */
export function buildWheelMatrix(
  nodes: readonly WheelNodeInput[] | undefined,
  links: readonly WheelLinkInput[],
): WheelMatrix {
  const ids: string[] = [];
  const seen = new Set<string>();
  const labelOf = new Map<string, string>();
  const colorOf = new Map<string, string | undefined>();

  const register = (id: string, label?: string, color?: string) => {
    if (!seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
    if (label != null) labelOf.set(id, label);
    if (color != null) colorOf.set(id, color);
  };

  if (nodes && nodes.length) {
    for (const node of nodes) register(node.id, node.label, node.color);
  } else {
    for (const l of links) {
      register(l.source);
      register(l.target);
    }
  }

  const index = new Map(ids.map((id, i) => [id, i]));
  const n = ids.length;
  const matrix: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (const l of links) {
    const i = index.get(l.source);
    const j = index.get(l.target);
    if (i == null || j == null) continue;
    const row = matrix[i]!;
    row[j] = (row[j] ?? 0) + Math.max(0, l.value ?? 1);
  }

  return {
    ids,
    labels: ids.map((id) => labelOf.get(id) ?? id),
    colors: ids.map((id) => colorOf.get(id)),
    matrix,
  };
}

/** Convenience: build the matrix and its chord layout in one call. */
export function computeDependencyWheel(
  nodes: readonly WheelNodeInput[] | undefined,
  links: readonly WheelLinkInput[],
  padAngle = 0.03,
): { data: WheelMatrix; layout: ChordLayout } {
  const data = buildWheelMatrix(nodes, links);
  return { data, layout: computeChordLayout(data.matrix, padAngle) };
}
