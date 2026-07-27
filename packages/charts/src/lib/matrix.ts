/**
 * Framework-agnostic layout helpers for matrix & polar-area charts.
 * Pure, deterministic and SSR-safe.
 */

import type { ChartSeries } from "../types";

/** A single {row, column, value} observation for a matrix heatmap. */
export interface MatrixDatum {
  row: string;
  col: string;
  value: number;
}

/** A resolved cell in the laid-out matrix grid. `value` is `null` when missing. */
export interface MatrixCell {
  row: string;
  col: string;
  rowIndex: number;
  colIndex: number;
  value: number | null;
}

/** The full matrix layout: ordered rows/cols, every cell, and the value extent. */
export interface MatrixLayout {
  rows: string[];
  cols: string[];
  cells: MatrixCell[];
  min: number;
  max: number;
}

/**
 * Build a dense row × column grid from sparse `{row, col, value}` data.
 * Missing combinations get `value: null`. Row/column order follows first
 * appearance unless an explicit order is supplied.
 *
 * @example
 * buildMatrix([{ row: "A", col: "x", value: 3 }]) // → rows ["A"], cols ["x"], 1 cell
 */
export function buildMatrix(
  data: readonly MatrixDatum[],
  options: { rows?: readonly string[]; cols?: readonly string[] } = {},
): MatrixLayout {
  const rows = options.rows ? [...options.rows] : uniqueInOrder(data.map((d) => d.row));
  const cols = options.cols ? [...options.cols] : uniqueInOrder(data.map((d) => d.col));

  const lookup = new Map<string, number>();
  let min = Infinity;
  let max = -Infinity;
  for (const d of data) {
    lookup.set(`${d.row}\u0000${d.col}`, d.value);
    if (d.value < min) min = d.value;
    if (d.value > max) max = d.value;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    min = 0;
    max = 1;
  } else if (min === max) {
    max = min + 1;
  }

  const cells: MatrixCell[] = [];
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]!;
    for (let c = 0; c < cols.length; c++) {
      const col = cols[c]!;
      const key = `${row}\u0000${col}`;
      const value = lookup.has(key) ? lookup.get(key)! : null;
      cells.push({ row, col, rowIndex: r, colIndex: c, value });
    }
  }

  return { rows, cols, cells, min, max };
}

/** One stacked segment inside a polar-area slice. */
export interface PolarSegment {
  series: string;
  value: number;
  /** Cumulative value at the inner edge of this segment. */
  from: number;
  /** Cumulative value at the outer edge of this segment. */
  to: number;
  color?: string;
}

/** One angular slice (category) of a stacked polar-area chart. */
export interface PolarSlice {
  category: string;
  index: number;
  segments: PolarSegment[];
  total: number;
}

/** The full stacked polar-area layout. */
export interface PolarAreaLayout {
  slices: PolarSlice[];
  /** Largest stacked total across all categories (radial domain max). */
  max: number;
}

/**
 * Stack one or more series radially per category for a polar-area (coxcomb)
 * chart. Each category becomes an equal-angle slice; series stack from the
 * centre outward. Values are clamped to `>= 0`.
 *
 * @example
 * computePolarArea(["Q1", "Q2"], [{ name: "A", data: [3, 5] }])
 */
export function computePolarArea(
  categories: readonly string[],
  series: readonly ChartSeries[],
): PolarAreaLayout {
  let max = 0;
  const slices: PolarSlice[] = categories.map((category, index) => {
    let cum = 0;
    const segments: PolarSegment[] = series.map((s) => {
      const value = Math.max(0, s.data[index] ?? 0);
      const from = cum;
      cum += value;
      const segment: PolarSegment = { series: s.name, value, from, to: cum };
      if (s.color !== undefined) segment.color = s.color;
      return segment;
    });
    if (cum > max) max = cum;
    return { category, index, segments, total: cum };
  });
  return { slices, max };
}

function uniqueInOrder(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}
