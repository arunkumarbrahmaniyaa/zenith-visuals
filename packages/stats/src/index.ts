// Charts
export { BoxPlot, type BoxPlotProps } from "./BoxPlot";
export { ViolinPlot, type ViolinPlotProps } from "./ViolinPlot";
export { Histogram, type HistogramProps } from "./Histogram";
export { DensityPlot, type DensityPlotProps } from "./DensityPlot";
export { Hexbin, type HexbinProps, type HexBin } from "./Hexbin";
export { ErrorBarChart, type ErrorBarChartProps } from "./ErrorBarChart";
export { RegressionChart, type RegressionChartProps } from "./RegressionChart";
export { StripPlot, type StripPlotProps } from "./StripPlot";
export { BeeswarmChart, type BeeswarmChartProps } from "./BeeswarmChart";
export { QQPlot, type QQPlotProps } from "./QQPlot";
export { RidgelineChart, type RidgelineChartProps } from "./RidgelineChart";
export { DensityHeatmap, type DensityHeatmapProps } from "./DensityHeatmap";
export { ContourPlot, type ContourPlotProps } from "./ContourPlot";
export { MarginalHistogram, type MarginalHistogramProps } from "./MarginalHistogram";

// Data types
export type {
  DistributionGroup,
  DistributionChartProps,
  DensitySeries,
  ErrorDatum,
  Point2D,
} from "./types";

// Statistics helpers
export {
  mean,
  stdDev,
  quantileSorted,
  boxStats,
  histogramBins,
  silvermanBandwidth,
  kde,
  linspace,
  linearRegression,
  normalQuantile,
  qqPoints,
  beeswarmLayout,
  type BoxStats,
  type HistogramBin,
  type Regression,
  type QQPoint,
  type BeeswarmDot,
} from "./lib/stats";

// 2D density helpers
export {
  bin2d,
  kdeGrid2d,
  marchingSquares,
  type Bin2D,
  type Grid2D,
  type DensityField,
  type IsoSegment,
} from "./lib/density2d";
