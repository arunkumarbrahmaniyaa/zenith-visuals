import type { ZenithTheme } from "@zenith-visuals/core";
import type { ChartSeries } from "../types";

/** Resolve a series color: explicit color, else theme palette by index. */
export function seriesColor(
  theme: ZenithTheme,
  series: { color?: string },
  index: number,
): string {
  if (series.color) return series.color;
  const palette = theme.palette;
  return palette[index % palette.length] ?? theme.colors.primary;
}

/** Min and max across every value in every series (0 counted for baseline). */
export function seriesExtent(
  series: readonly ChartSeries[],
  includeZero = true,
): [number, number] {
  let min = includeZero ? 0 : Number.POSITIVE_INFINITY;
  let max = includeZero ? 0 : Number.NEGATIVE_INFINITY;
  for (const s of series) {
    for (const v of s.data) {
      if (!Number.isFinite(v)) continue;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (!Number.isFinite(min)) min = 0;
  if (!Number.isFinite(max)) max = 1;
  return [min, max];
}

/** Stacked cumulative min/max across categories. */
export function stackedExtent(series: readonly ChartSeries[], categoryCount: number): [number, number] {
  let max = 0;
  let min = 0;
  for (let i = 0; i < categoryCount; i++) {
    let pos = 0;
    let neg = 0;
    for (const s of series) {
      const v = s.data[i] ?? 0;
      if (v >= 0) pos += v;
      else neg += v;
    }
    if (pos > max) max = pos;
    if (neg < min) min = neg;
  }
  return [min, max];
}
