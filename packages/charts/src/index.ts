// Charts
export { LineChart, type LineChartProps } from "./LineChart";
export { AreaChart, type AreaChartProps } from "./AreaChart";
export { BarChart, type BarChartProps } from "./BarChart";
export { ScatterChart, type ScatterChartProps } from "./ScatterChart";
export { PieChart, type PieChartProps } from "./PieChart";
export { RadarChart, type RadarChartProps } from "./RadarChart";
export { RadialBarChart, type RadialBarChartProps } from "./RadialBarChart";
export { GaugeChart, type GaugeChartProps } from "./GaugeChart";
export { FunnelChart, type FunnelChartProps } from "./FunnelChart";
export { Sparkline, type SparklineProps } from "./Sparkline";

// Extended cartesian & trend charts
export { WaterfallChart, type WaterfallChartProps } from "./WaterfallChart";
export { ParetoChart, type ParetoChartProps } from "./ParetoChart";
export { ComboChart, type ComboChartProps } from "./ComboChart";
export { RangeBarChart, type RangeBarChartProps } from "./RangeBarChart";
export { StreamGraph, type StreamGraphProps } from "./StreamGraph";

// Part-to-whole & radial charts
export { HalfDonutChart, type HalfDonutChartProps } from "./HalfDonutChart";
export { NestedPieChart, type NestedPieChartProps } from "./NestedPieChart";
export { RoseChart, type RoseChartProps } from "./RoseChart";
export { RadialLineChart, type RadialLineChartProps } from "./RadialLineChart";
export { SolidGaugeChart, type SolidGaugeChartProps } from "./SolidGaugeChart";
export { ProgressRing, type ProgressRingProps } from "./ProgressRing";
export { WaffleChart, type WaffleChartProps } from "./WaffleChart";

// Additional cartesian charts
export { StepLineChart, type StepLineChartProps } from "./StepLineChart";
export { PercentColumnChart, type PercentColumnChartProps } from "./PercentColumnChart";

// Comparison & matrix charts
export { PolarAreaChart, type PolarAreaChartProps } from "./PolarAreaChart";
export { HeatmapMatrix, type HeatmapMatrixProps } from "./HeatmapMatrix";

// Shared data types
export type {
  ChartSeries,
  CategoryDatum,
  RangeDatum,
  ScatterPoint,
  ScatterSeries,
  CartesianChartProps,
} from "./types";

// Layout primitives (for building custom charts)
export {
  computeCartesianLayout,
  type CartesianLayout,
  type CartesianLayoutOptions,
  type Rect,
} from "./lib/cartesian";
export { niceTicks, defaultFormat, type NiceScale } from "./lib/ticks";
export { linePath, smoothPath, areaPath, arcPath, polar, stepPath, type XY, type StepMode } from "./lib/paths";
export { seriesColor, seriesExtent, stackedExtent } from "./lib/series";

// Transform helpers (framework-agnostic, pure)
export {
  computeWaterfall,
  computePareto,
  computeStreamBands,
  type WaterfallDatum,
  type WaterfallBar,
  type WaterfallDirection,
  type WaterfallLayout,
  type ParetoBar,
  type ParetoLayout,
  type StreamBand,
  type StreamLayout,
  type StreamOffset,
} from "./lib/transforms";

// Radial / part-to-whole layout helpers (framework-agnostic, pure)
export {
  computeWaffle,
  computeNestedPie,
  type WaffleDatum,
  type WaffleCell,
  type WaffleLayout,
  type NestedSlice,
  type NestedArc,
  type NestedLayout,
} from "./lib/radial";

// Matrix & polar-area layout helpers (framework-agnostic, pure)
export {
  buildMatrix,
  computePolarArea,
  type MatrixDatum,
  type MatrixCell,
  type MatrixLayout,
  type PolarSegment,
  type PolarSlice,
  type PolarAreaLayout,
} from "./lib/matrix";

// Reusable components
export { CartesianAxes, type CartesianAxesProps } from "./components/CartesianAxes";
export { Legend, type LegendProps, type LegendItem } from "./components/Legend";
