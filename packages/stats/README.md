# @zenith-visuals/stats

Statistical & distribution charts for **Zenith Visuals** — box plots, violins,
histograms, KDE density curves, hexbin density maps and error bars. Built on the
same pure layout engine, theming, tooltip and accessibility primitives as the
rest of the SDK, and reusing `@zenith-visuals/charts` for axes and scales.

Includes: **BoxPlot, ViolinPlot, Histogram, DensityPlot, Hexbin, ErrorBarChart, RegressionChart, StripPlot, BeeswarmChart, QQPlot, RidgelineChart, DensityHeatmap, ContourPlot, MarginalHistogram**
— plus dependency-free stats helpers (`boxStats`, `histogramBins`, `kde`,
`quantileSorted`, `mean`, `stdDev`, `silvermanBandwidth`).

## Install

```bash
pnpm add @zenith-visuals/stats @zenith-visuals/charts @zenith-visuals/core react react-dom
```

## Usage

### Box plot & violin plot

```tsx
import { BoxPlot, ViolinPlot } from "@zenith-visuals/stats";

const groups = [
  { label: "Control", values: [12, 15, 14, 18, 22, 25, 30, 11, 40] },
  { label: "Variant", values: [20, 22, 19, 25, 28, 31, 35, 24, 60] },
];

<BoxPlot groups={groups} showMean showOutliers />
<ViolinPlot groups={groups} showBox />
```

### Histogram

```tsx
import { Histogram } from "@zenith-visuals/stats";

<Histogram values={[/* … raw samples … */]} bins={16} />
```

### KDE density plot

```tsx
import { DensityPlot } from "@zenith-visuals/stats";

<DensityPlot
  series={[
    { name: "Group A", values: [/* … */] },
    { name: "Group B", values: [/* … */] },
  ]}
/>
```

### Hexbin density

```tsx
import { Hexbin } from "@zenith-visuals/stats";

<Hexbin points={[{ x: 1.2, y: 3.4 }, { x: 1.3, y: 3.5 } /* … */]} radius={12} />
```

### Error bars

```tsx
import { ErrorBarChart } from "@zenith-visuals/stats";

<ErrorBarChart
  connect
  data={[
    { label: "Jan", value: 20, error: 3 },
    { label: "Feb", value: 24, low: 20, high: 30 },
  ]}
/>
```

### Regression, strip, beeswarm, Q-Q, ridgeline

```tsx
import {
  RegressionChart,
  StripPlot,
  BeeswarmChart,
  QQPlot,
  RidgelineChart,
} from "@zenith-visuals/stats";

<RegressionChart points={[{ x: 1, y: 2 }, { x: 2, y: 4.1 } /* … */]} />

<StripPlot groups={groups} jitter={0.6} />

<BeeswarmChart groups={groups} />

<QQPlot values={samples} />

<RidgelineChart groups={groups} overlap={1.6} />
```

`RegressionChart` draws an OLS fit line with an R² badge, `QQPlot` compares a
sample against a normal distribution, and `RidgelineChart` stacks overlapping
KDE curves for many groups.

### 2D density: heatmap, contour, marginal histogram

```tsx
import {
  DensityHeatmap,
  ContourPlot,
  MarginalHistogram,
} from "@zenith-visuals/stats";

<DensityHeatmap points={cloud} binsX={22} binsY={22} />

<ContourPlot points={cloud} levels={7} showPoints />

<MarginalHistogram points={cloud} bins={20} />
```

`DensityHeatmap` bins the scatter into a colored grid, `ContourPlot` traces
kernel-density isolines with marching squares, and `MarginalHistogram` flanks a
scatter with per-axis histograms.

## Statistics helpers

The math powering the charts is exported for reuse:

```tsx
import { boxStats, kde, histogramBins, quantileSorted } from "@zenith-visuals/stats";

const { median, q1, q3, outliers } = boxStats(samples);
```

Also exported: `linearRegression` (OLS with `predict`/R²), `normalQuantile`
(inverse normal CDF), `qqPoints` and `beeswarmLayout`. For 2D density: `bin2d`,
`kdeGrid2d` and `marchingSquares`.

## Accessibility

Every chart renders an SVG with `role="img"` and an `aria-label` (customizable
via `labels.ariaLabel`), per-element `<title>` tooltips, and honors
`prefers-reduced-motion`.

## License

MIT
