export interface PyramidDatum {
  label: string;
  /** Magnitude of the left-hand series (e.g. male). */
  left: number;
  /** Magnitude of the right-hand series (e.g. female). */
  right: number;
}

export interface PyramidRow {
  label: string;
  left: number;
  right: number;
  y: number;
  barHeight: number;
  /** Left bar: grows leftward, ending at the center gutter. */
  leftX: number;
  leftWidth: number;
  /** Right bar: grows rightward from the center gutter. */
  rightX: number;
  rightWidth: number;
}

export interface PyramidLayout {
  rows: PyramidRow[];
  /** Largest single-side value used for the shared scale. */
  max: number;
  /** X of the inner edge of the left bars / left of the gutter. */
  gutterLeft: number;
  /** X of the inner edge of the right bars / right of the gutter. */
  gutterRight: number;
}

export interface PyramidOptions {
  width: number;
  height: number;
  /** Central gap (px) reserved for category labels. Default 72. */
  gutter?: number;
  /** Vertical gap between rows (px). Default 4. */
  gap?: number;
}

/**
 * Compute a population-pyramid layout: two mirrored horizontal bar series that
 * share a value scale and grow outward from a central label gutter. Pure and
 * deterministic (SSR-safe, testable).
 */
export function computePyramid(data: readonly PyramidDatum[], options: PyramidOptions): PyramidLayout {
  const { width, height, gutter = 72, gap = 4 } = options;
  const n = data.length;
  const gutterLeft = Math.max(0, (width - gutter) / 2);
  const gutterRight = gutterLeft + gutter;
  const halfW = gutterLeft;

  const max = data.reduce((m, d) => Math.max(m, d.left, d.right), 0);
  if (n === 0 || max <= 0) return { rows: [], max: 0, gutterLeft, gutterRight };

  const barHeight = Math.max(0, (height - (n - 1) * gap) / n);
  const scale = (v: number) => (v / max) * halfW;

  const rows: PyramidRow[] = data.map((d, i) => {
    const y = i * (barHeight + gap);
    const leftWidth = scale(Math.max(0, d.left));
    const rightWidth = scale(Math.max(0, d.right));
    return {
      label: d.label,
      left: d.left,
      right: d.right,
      y,
      barHeight,
      leftX: gutterLeft - leftWidth,
      leftWidth,
      rightX: gutterRight,
      rightWidth,
    };
  });

  return { rows, max, gutterLeft, gutterRight };
}
