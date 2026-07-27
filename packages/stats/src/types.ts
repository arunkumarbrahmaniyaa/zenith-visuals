import type { BaseVisualizationProps } from "@zenith-visuals/core";

/** A named group of raw numeric samples (box plot, violin plot). */
export interface DistributionGroup {
  label: string;
  values: readonly number[];
  color?: string;
}

/** A named sample set for overlaid density curves. */
export interface DensitySeries {
  name: string;
  values: readonly number[];
  color?: string;
}

/** A point with a symmetric or asymmetric error range. */
export interface ErrorDatum {
  label: string;
  value: number;
  /** Symmetric error magnitude (used when `low`/`high` are absent). */
  error?: number;
  /** Explicit lower bound. */
  low?: number;
  /** Explicit upper bound. */
  high?: number;
  color?: string;
}

/** A 2D point for hexbin density. */
export interface Point2D {
  x: number;
  y: number;
}

/** Shared props for categorical distribution charts. */
export interface DistributionChartProps extends BaseVisualizationProps {
  groups: readonly DistributionGroup[];
  showGrid?: boolean;
  yTickCount?: number;
  formatValue?: (value: number) => string;
}
