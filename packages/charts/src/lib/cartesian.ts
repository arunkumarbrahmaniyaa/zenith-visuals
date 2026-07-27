import { bandScale, linearScale, type BandScale, type LinearScale } from "@zenith-visuals/utils";
import { niceTicks } from "./ticks";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CartesianLayout {
  plot: Rect;
  /** Band scale positioning each category (left edge of its slot). */
  xBand: BandScale<string>;
  /** Linear scale mapping a value to a y pixel (inverted: high value = low y). */
  yScale: LinearScale;
  /** Human-friendly y tick values. */
  yTicks: number[];
  yMin: number;
  yMax: number;
  /** Center x pixel for a category index. */
  categoryCenter: (index: number) => number;
}

export interface CartesianLayoutOptions {
  width: number;
  height: number;
  categories: readonly string[];
  valueMin: number;
  valueMax: number;
  yTickCount?: number;
  includeZero?: boolean;
  padding?: { top: number; right: number; bottom: number; left: number };
  bandPadding?: number;
}

/**
 * Pure cartesian layout engine: computes the plot rectangle, x band scale,
 * y linear scale and nice ticks. SSR-safe and deterministic.
 */
export function computeCartesianLayout(opts: CartesianLayoutOptions): CartesianLayout {
  const {
    width,
    height,
    categories,
    valueMin,
    valueMax,
    yTickCount = 5,
    includeZero = true,
    padding = { top: 12, right: 16, bottom: 28, left: 44 },
    bandPadding = 0.2,
  } = opts;

  const { ticks, niceMin, niceMax } = niceTicks(valueMin, valueMax, yTickCount, includeZero);

  const plot: Rect = {
    x: padding.left,
    y: padding.top,
    w: Math.max(1, width - padding.left - padding.right),
    h: Math.max(1, height - padding.top - padding.bottom),
  };

  const xBand = bandScale<string>(categories, [plot.x, plot.x + plot.w], bandPadding);
  const yScale = linearScale([niceMin, niceMax], [plot.y + plot.h, plot.y]);

  const categoryCenter = (index: number): number => {
    const key = categories[index];
    if (key === undefined) return plot.x;
    return xBand(key) + xBand.bandwidth / 2;
  };

  return { plot, xBand, yScale, yTicks: ticks, yMin: niceMin, yMax: niceMax, categoryCenter };
}
