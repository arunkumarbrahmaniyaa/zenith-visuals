/**
 * Pure, deterministic layout helpers for radial / part-to-whole charts.
 * Framework-agnostic and SSR-safe — no DOM, no React.
 */

/** A labelled value used by the waffle and rose charts. */
export interface WaffleDatum {
  label: string;
  value: number;
  color?: string;
}

/** One cell of a waffle grid, mapped back to the datum that fills it. */
export interface WaffleCell {
  /** Row index from the top (0-based). */
  row: number;
  /** Column index from the left (0-based). */
  col: number;
  /** Flat fill index (0-based). */
  index: number;
  /** Index into the input data, or -1 for an empty (unfilled) cell. */
  datumIndex: number;
}

export interface WaffleLayout {
  cells: WaffleCell[];
  rows: number;
  cols: number;
  /** Cells allocated per datum, aligned to the input order. */
  counts: number[];
  total: number;
}

/**
 * Allocate a `rows × cols` grid of cells across the data proportionally, using
 * the largest-remainder method so the counts always sum to `rows × cols`
 * (when the data total is positive). Cells are filled in row-major order.
 */
export function computeWaffle(
  data: readonly WaffleDatum[],
  rows = 10,
  cols = 10,
): WaffleLayout {
  const cellCount = Math.max(0, Math.floor(rows)) * Math.max(0, Math.floor(cols));
  const total = data.reduce((acc, d) => acc + Math.max(0, d.value), 0);
  const counts = new Array<number>(data.length).fill(0);

  if (total > 0 && cellCount > 0) {
    const exact = data.map((d) => (Math.max(0, d.value) / total) * cellCount);
    const floors = exact.map((v) => Math.floor(v));
    let used = floors.reduce((a, b) => a + b, 0);
    // Distribute the leftover cells to the largest fractional remainders.
    const remainders = exact
      .map((v, i) => ({ i, r: v - Math.floor(v) }))
      .sort((a, b) => b.r - a.r);
    let k = 0;
    while (used < cellCount && k < remainders.length) {
      floors[remainders[k]!.i]! += 1;
      used += 1;
      k += 1;
    }
    for (let i = 0; i < counts.length; i++) counts[i] = floors[i]!;
  }

  const cells: WaffleCell[] = [];
  let datumIndex = 0;
  let remaining = counts[0] ?? 0;
  for (let index = 0; index < cellCount; index++) {
    while (remaining <= 0 && datumIndex < counts.length - 1) {
      datumIndex += 1;
      remaining = counts[datumIndex] ?? 0;
    }
    const filled = remaining > 0;
    cells.push({
      row: Math.floor(index / cols),
      col: index % cols,
      index,
      datumIndex: filled ? datumIndex : -1,
    });
    if (filled) remaining -= 1;
  }

  return { cells, rows, cols, counts, total };
}

/** A node in a multi-level (nested) pie / sunburst-lite hierarchy. */
export interface NestedSlice {
  label: string;
  /** Leaf value. Ignored when `children` are present (parent = sum of children). */
  value?: number;
  color?: string;
  children?: readonly NestedSlice[];
}

/** A resolved arc in the nested pie layout, with angular span and ring depth. */
export interface NestedArc {
  label: string;
  color?: string;
  /** Ring index: 0 = innermost. */
  depth: number;
  value: number;
  /** Start angle in radians (0 = up, clockwise). */
  start: number;
  /** End angle in radians. */
  end: number;
}

export interface NestedLayout {
  arcs: NestedArc[];
  /** Number of rings (deepest depth + 1). */
  maxDepth: number;
}

function nestedValue(node: NestedSlice): number {
  if (node.children && node.children.length > 0) {
    return node.children.reduce((acc, c) => acc + nestedValue(c), 0);
  }
  return Math.max(0, node.value ?? 0);
}

/**
 * Lay out a hierarchy of slices into concentric rings. Each parent's angular
 * span is subdivided among its children, so rings stay aligned. Returns a flat
 * list of arcs plus the ring count.
 */
export function computeNestedPie(
  data: readonly NestedSlice[],
  sweep: number = Math.PI * 2,
  startAngle = 0,
): NestedLayout {
  const arcs: NestedArc[] = [];
  let maxDepth = 0;

  const layout = (
    nodes: readonly NestedSlice[],
    from: number,
    to: number,
    depth: number,
  ): void => {
    const total = nodes.reduce((acc, n) => acc + nestedValue(n), 0);
    if (total <= 0) return;
    const span = to - from;
    let cursor = from;
    for (const node of nodes) {
      const value = nestedValue(node);
      const slice = (value / total) * span;
      const a0 = cursor;
      const a1 = cursor + slice;
      cursor = a1;
      if (depth > maxDepth) maxDepth = depth;
      arcs.push({ label: node.label, color: node.color, depth, value, start: a0, end: a1 });
      if (node.children && node.children.length > 0) {
        layout(node.children, a0, a1, depth + 1);
      }
    }
  };

  layout(data, startAngle, startAngle + sweep, 0);
  return { arcs, maxDepth: arcs.length === 0 ? 0 : maxDepth + 1 };
}
