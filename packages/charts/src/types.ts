import type { BaseVisualizationProps } from "@zenith-visuals/core";

/** A single named series of numeric values aligned to `categories`. */
export interface ChartSeries {
  /** Series name shown in the legend and tooltips. */
  name: string;
  /** Values aligned index-for-index with the chart's `categories`. */
  data: readonly number[];
  /** Optional explicit color; defaults to the theme palette by index. */
  color?: string;
}

/** A labelled value, used by pie/donut/radial/funnel charts. */
export interface CategoryDatum {
  label: string;
  value: number;
  color?: string;
}

/** A floating range for one category, used by the range / floating bar chart. */
export interface RangeDatum {
  label: string;
  /** Lower bound of the bar. */
  low: number;
  /** Upper bound of the bar. */
  high: number;
  color?: string;
}

/** A point in a scatter/bubble chart. */
export interface ScatterPoint {
  x: number;
  y: number;
  /** Optional radius weight (bubble charts). */
  r?: number;
  label?: string;
}

/** A named collection of scatter points. */
export interface ScatterSeries {
  name: string;
  data: readonly ScatterPoint[];
  color?: string;
}

/** Shared props for category/series cartesian charts. */
export interface CartesianChartProps extends BaseVisualizationProps {
  /** X-axis category labels. */
  categories: readonly string[];
  /** One or more numeric series aligned to `categories`. */
  series: readonly ChartSeries[];
  /** Show the legend. Default true when there is more than one series. */
  showLegend?: boolean;
  /** Show horizontal gridlines. Default true. */
  showGrid?: boolean;
  /** Approximate number of y-axis ticks. Default 5. */
  yTickCount?: number;
  /** Format a y value for axis labels and tooltips. */
  formatValue?: (value: number) => string;
}
