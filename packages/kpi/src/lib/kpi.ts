/**
 * Framework-agnostic helpers for KPI & comparison charts. Pure and SSR-safe.
 */

export type Direction = "up" | "down" | "flat";

export interface Delta {
  /** Absolute change (current − previous). */
  delta: number;
  /** Fractional change relative to previous (0.1 = +10%). `null` when previous is 0 or missing. */
  pct: number | null;
  /** Direction of the change. */
  direction: Direction;
}

/**
 * Compute the change between a current and previous value.
 *
 * @example
 * computeDelta(120, 100) // { delta: 20, pct: 0.2, direction: "up" }
 */
export function computeDelta(current: number, previous?: number): Delta {
  if (previous === undefined || Number.isNaN(previous)) {
    return { delta: 0, pct: null, direction: "flat" };
  }
  const delta = current - previous;
  const pct = previous === 0 ? null : delta / previous;
  const direction: Direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return { delta, pct, direction };
}

/**
 * Extent (`[min, max]`) over an array using one or more numeric accessors.
 * Considers every accessor so paired data (start/end) fits on a shared axis.
 * Returns `[0, 1]` for empty input.
 */
export function valueExtent<T>(
  items: readonly T[],
  ...accessors: ReadonlyArray<(item: T) => number>
): [number, number] {
  if (items.length === 0 || accessors.length === 0) return [0, 1];
  let min = Infinity;
  let max = -Infinity;
  for (const item of items) {
    for (const accessor of accessors) {
      const v = accessor(item);
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (min === max) {
    // Degenerate: pad so the axis has a visible span.
    const pad = Math.abs(min) || 1;
    return [min - pad, max + pad];
  }
  return [min, max];
}

/**
 * Fractional position (0..1) of `value` within the `[min, max]` range, clamped
 * to the ends. Returns `0` for a degenerate (zero-width) range.
 *
 * @example
 * bandPosition(75, 0, 100) // 0.75
 */
export function bandPosition(value: number, min: number, max: number): number {
  const span = max - min;
  if (span <= 0) return 0;
  const t = (value - min) / span;
  return t < 0 ? 0 : t > 1 ? 1 : t;
}
