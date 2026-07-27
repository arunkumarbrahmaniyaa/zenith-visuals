import type { BaseVisualizationProps } from "@zenith-visuals/core";

/** A single OHLC(V) bar keyed by a label (usually a date). */
export interface OHLCDatum {
  /** Category label — typically a date string like "2024-01-05". */
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
  /** Optional traded volume, used by charts that render a volume pane. */
  volume?: number;
}

/** Shared props for price/time-series financial charts. */
export interface FinanceChartProps extends BaseVisualizationProps {
  /** Ordered series of OHLC bars (oldest → newest). */
  data: readonly OHLCDatum[];
  /** Format a price value for axes/tooltips. */
  formatValue?: (value: number) => string;
  /** Color for rising (close ≥ open) bars. Defaults to theme success. */
  upColor?: string;
  /** Color for falling (close < open) bars. Defaults to theme danger. */
  downColor?: string;
}
