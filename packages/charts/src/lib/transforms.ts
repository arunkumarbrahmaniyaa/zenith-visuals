/**
 * Pure, deterministic transforms for the extended cartesian charts
 * (waterfall, Pareto, stream / ThemeRiver). SSR-safe and unit-tested.
 */

import type { ChartSeries } from "../types";

// ---------------------------------------------------------------------------
// Waterfall
// ---------------------------------------------------------------------------

/** Input row for a waterfall chart. */
export interface WaterfallDatum {
  label: string;
  /** Signed delta for a step, or the value of a total/subtotal bar. */
  value: number;
  /** When true this bar is drawn from the zero baseline as a running total. */
  isTotal?: boolean;
}

export type WaterfallDirection = "up" | "down" | "total";

/** A positioned waterfall bar spanning `start`→`end` in value space. */
export interface WaterfallBar {
  label: string;
  start: number;
  end: number;
  value: number;
  direction: WaterfallDirection;
  isTotal: boolean;
}

export interface WaterfallLayout {
  bars: WaterfallBar[];
  min: number;
  max: number;
}

/**
 * Compute running-total waterfall bars. Non-total rows step from the current
 * cumulative value by `value`; total rows are drawn from 0 to the current
 * cumulative value.
 */
export function computeWaterfall(data: readonly WaterfallDatum[]): WaterfallLayout {
  let cum = 0;
  let min = 0;
  let max = 0;
  const bars: WaterfallBar[] = data.map((d) => {
    let bar: WaterfallBar;
    if (d.isTotal) {
      bar = { label: d.label, start: 0, end: cum, value: cum, direction: "total", isTotal: true };
    } else {
      const start = cum;
      const end = cum + d.value;
      cum = end;
      bar = {
        label: d.label,
        start,
        end,
        value: d.value,
        direction: d.value >= 0 ? "up" : "down",
        isTotal: false,
      };
    }
    min = Math.min(min, bar.start, bar.end);
    max = Math.max(max, bar.start, bar.end);
    return bar;
  });
  return { bars, min, max };
}

// ---------------------------------------------------------------------------
// Pareto
// ---------------------------------------------------------------------------

/** A Pareto bar with its running cumulative share. */
export interface ParetoBar {
  label: string;
  value: number;
  color?: string;
  cumulative: number;
  /** Cumulative fraction in [0, 1]. */
  cumulativePct: number;
}

export interface ParetoLayout {
  bars: ParetoBar[];
  total: number;
}

/**
 * Sort items by value descending and compute the cumulative percentage line.
 * The final `cumulativePct` is 1 (100%) when the total is non-zero.
 */
export function computePareto(
  items: readonly { label: string; value: number; color?: string }[],
): ParetoLayout {
  const sorted = items.slice().sort((a, b) => b.value - a.value);
  const total = sorted.reduce((acc, it) => acc + it.value, 0);
  let cum = 0;
  const bars: ParetoBar[] = sorted.map((it) => {
    cum += it.value;
    return {
      label: it.label,
      value: it.value,
      color: it.color,
      cumulative: cum,
      cumulativePct: total === 0 ? 0 : cum / total,
    };
  });
  return { bars, total };
}

// ---------------------------------------------------------------------------
// Stream / ThemeRiver
// ---------------------------------------------------------------------------

/** A stacked band `[lo, hi]` in value space for one series at one category. */
export interface StreamBand {
  lo: number;
  hi: number;
}

export interface StreamLayout {
  /** `bands[seriesIndex][categoryIndex]`. */
  bands: StreamBand[][];
  min: number;
  max: number;
}

export type StreamOffset = "silhouette" | "zero";

/**
 * Stack series into bands. With the default `"silhouette"` offset each
 * category is centered around zero (ThemeRiver / streamgraph); `"zero"`
 * produces a conventional stacked area from the baseline. Negative values are
 * treated as zero.
 */
export function computeStreamBands(
  series: readonly ChartSeries[],
  categoryCount: number,
  offset: StreamOffset = "silhouette",
): StreamLayout {
  const bands: StreamBand[][] = series.map(() => []);
  let min = 0;
  let max = 0;

  for (let ci = 0; ci < categoryCount; ci++) {
    let total = 0;
    for (const s of series) total += Math.max(0, s.data[ci] ?? 0);
    let baseline = offset === "silhouette" ? -total / 2 : 0;
    for (let si = 0; si < series.length; si++) {
      const v = Math.max(0, series[si]!.data[ci] ?? 0);
      const lo = baseline;
      const hi = baseline + v;
      bands[si]!.push({ lo, hi });
      baseline = hi;
      if (lo < min) min = lo;
      if (hi > max) max = hi;
    }
  }

  return { bands, min, max };
}
