import type { BaseVisualizationProps } from "@zenith-visuals/core";

/** Shared props for KPI comparison charts. */
export interface KpiChartProps extends BaseVisualizationProps {
  /** Format a numeric value for axes, labels and tooltips. */
  formatValue?: (value: number) => string;
}

/** A category compared across two measures (used by dumbbell & slope). */
export interface PairedDatum {
  /** Category label. */
  label: string;
  /** The "start" / "before" value. */
  start: number;
  /** The "end" / "after" value. */
  end: number;
}

/** A single category value (used by the lollipop chart). */
export interface ValueDatum {
  /** Category label. */
  label: string;
  /** The measured value. */
  value: number;
  /** Optional explicit color override for this item. */
  color?: string;
}
