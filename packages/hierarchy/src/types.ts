import type { BaseVisualizationProps } from "@zenith-visuals/core";
import type { HierarchyDatum, HNode } from "./lib/hierarchy";

/** Shared props for hierarchy charts. */
export interface HierarchyChartProps extends BaseVisualizationProps {
  /** Nested hierarchical data. Leaves should carry a `value`. */
  data: HierarchyDatum;
  /** Format a node's value for tooltips/labels. */
  formatValue?: (value: number) => string;
}

export type { HierarchyDatum, HNode };
