// Components
export { StatCard, type StatCardProps } from "./StatCard";
export { BulletChart, type BulletChartProps } from "./BulletChart";
export { SlopeChart, type SlopeChartProps } from "./SlopeChart";
export { DumbbellChart, type DumbbellChartProps } from "./DumbbellChart";
export { LollipopChart, type LollipopChartProps } from "./LollipopChart";
export { GradientBand, type GradientBandProps, type BandZone } from "./GradientBand";
export { TrendDeltaCard, type TrendDeltaCardProps } from "./TrendDeltaCard";

// Shared data types
export type { KpiChartProps, PairedDatum, ValueDatum } from "./types";

// Pure helpers (framework-agnostic)
export {
  computeDelta,
  valueExtent,
  bandPosition,
  type Delta,
  type Direction,
} from "./lib/kpi";
