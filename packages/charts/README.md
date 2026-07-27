# @zenith-visuals/charts

Essential, beautiful, themeable chart components for **Zenith Visuals** — the
everyday charts every dashboard needs, built on the same pure layout engine,
theming, tooltip and accessibility primitives as the rest of the SDK.

Includes 26 chart types — the everyday cartesian, part-to-whole and radial
charts every dashboard needs: **LineChart, AreaChart, BarChart, ScatterChart,
PieChart, RadarChart, RadialBarChart, GaugeChart, FunnelChart, Sparkline,
WaterfallChart, ParetoChart, ComboChart, RangeBarChart, StreamGraph,
HalfDonutChart, NestedPieChart, RoseChart, RadialLineChart, SolidGaugeChart,
ProgressRing, WaffleChart, StepLineChart, PercentColumnChart, PolarAreaChart,
HeatmapMatrix** — plus reusable layout primitives (`computeCartesianLayout`,
`niceTicks`, `arcPath`, `CartesianAxes`, `Legend`) for building your own charts.

## Install

```bash
pnpm add @zenith-visuals/charts @zenith-visuals/core react react-dom
```

## Usage

### Line & Area

```tsx
import { LineChart, AreaChart } from "@zenith-visuals/charts";

const categories = ["Jan", "Feb", "Mar", "Apr", "May"];

<LineChart
  categories={categories}
  smooth
  series={[
    { name: "Revenue", data: [12, 19, 15, 27, 24] },
    { name: "Cost", data: [8, 11, 9, 14, 13] },
  ]}
/>

<AreaChart
  categories={categories}
  stacked
  series={[
    { name: "Mobile", data: [3, 5, 4, 7, 6] },
    { name: "Desktop", data: [6, 4, 8, 5, 9] },
  ]}
/>
```

### Bar & Column

```tsx
import { BarChart } from "@zenith-visuals/charts";

// Grouped columns (default vertical)
<BarChart
  categories={["Q1", "Q2", "Q3", "Q4"]}
  series={[
    { name: "2023", data: [4, 8, 6, 9] },
    { name: "2024", data: [6, 5, 9, 12] },
  ]}
/>

// Stacked horizontal bars
<BarChart horizontal stacked categories={["A", "B", "C"]} series={[/* … */]} />
```

### Scatter & Bubble

```tsx
import { ScatterChart } from "@zenith-visuals/charts";

<ScatterChart
  series={[
    { name: "Segment A", data: [{ x: 10, y: 20, r: 5 }, { x: 15, y: 12, r: 12 }] },
  ]}
/>
```

### Pie & Donut

```tsx
import { PieChart } from "@zenith-visuals/charts";

<PieChart
  innerRadius={0.6}
  centerLabel="100%"
  data={[
    { label: "Chrome", value: 63 },
    { label: "Safari", value: 20 },
    { label: "Edge", value: 17 },
  ]}
/>
```

### Radar, Radial bar, Gauge, Funnel, Sparkline

```tsx
import {
  RadarChart, RadialBarChart, GaugeChart, FunnelChart, Sparkline,
} from "@zenith-visuals/charts";

<RadarChart
  indicators={["Speed", "Power", "Range", "Agility", "Cost"]}
  series={[{ name: "Model X", data: [4, 5, 3, 4, 2] }]}
/>

<RadialBarChart maxValue={100} data={[
  { label: "CPU", value: 72 }, { label: "RAM", value: 48 }, { label: "Disk", value: 30 },
]} />

<GaugeChart value={72} max={100} unit="% CPU"
  thresholds={[[0, "#22c55e"], [0.6, "#eab308"], [0.85, "#ef4444"]]} />

<FunnelChart data={[
  { label: "Visits", value: 1000 },
  { label: "Signups", value: 420 },
  { label: "Purchases", value: 120 },
]} />

<Sparkline data={[3, 5, 4, 8, 6, 9, 7]} variant="area" smooth />
```

### Waterfall, Pareto, Combo, Range, Stream

```tsx
import {
  WaterfallChart, ParetoChart, ComboChart, RangeBarChart, StreamGraph,
} from "@zenith-visuals/charts";

<WaterfallChart data={[
  { label: "Start", value: 100 },
  { label: "Sales", value: 40 },
  { label: "Refunds", value: -15 },
  { label: "End", value: 0, isTotal: true },
]} />

<ParetoChart data={[
  { label: "Bugs", value: 42 }, { label: "Perf", value: 28 }, { label: "UX", value: 12 },
]} />

<ComboChart
  categories={months}
  series={[{ name: "Revenue", data: rev }]}
  lineSeries={[{ name: "Growth %", data: growth }]}
  secondaryAxis
/>

<RangeBarChart data={[
  { label: "Mon", low: 12, high: 21 }, { label: "Tue", low: 14, high: 24 },
]} />

<StreamGraph categories={weeks} series={topics} />
```

The pure transforms `computeWaterfall`, `computePareto` and `computeStreamBands`
are exported for headless/server use.

### Half donut, Nested pie, Rose, Radial line, Solid gauge, Progress ring, Waffle

```tsx
import {
  HalfDonutChart, NestedPieChart, RoseChart, RadialLineChart,
  SolidGaugeChart, ProgressRing, WaffleChart,
} from "@zenith-visuals/charts";

<HalfDonutChart centerLabel="72%" data={[
  { label: "Used", value: 72 }, { label: "Free", value: 28 },
]} />

<NestedPieChart data={[
  { label: "Web", children: [{ label: "Mobile", value: 30 }, { label: "Desktop", value: 20 }] },
  { label: "API", value: 25 },
]} />

<RoseChart data={[
  { label: "Mon", value: 12 }, { label: "Tue", value: 30 }, { label: "Wed", value: 22 },
]} />

<RadialLineChart
  categories={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]}
  series={[{ name: "2025", data: [3, 5, 4, 8, 6, 9] }]}
  area
/>

<SolidGaugeChart value={72} max={100} unit="% complete" />

<ProgressRing value={68} caption="Storage used" />

<WaffleChart data={[{ label: "Done", value: 68 }, { label: "Left", value: 32 }]} />
```

The pure layout helpers `computeWaffle` and `computeNestedPie` are exported for
headless/server use.

### Step line, 100% stacked column

```tsx
import { StepLineChart, PercentColumnChart } from "@zenith-visuals/charts";

<StepLineChart
  categories={["00:00", "06:00", "12:00", "18:00"]}
  series={[{ name: "Plan A", data: [20, 45, 30, 30] }]}
  mode="after"
  showPoints
/>

<PercentColumnChart
  categories={["Q1", "Q2", "Q3", "Q4"]}
  series={[
    { name: "Desktop", data: [42, 38, 30, 26] },
    { name: "Mobile", data: [28, 34, 41, 48] },
  ]}
/>
```

`StepLineChart` supports `mode="before" | "after" | "center"` via the pure
`stepPath` helper. `PercentColumnChart` normalises each category to 100% and
labels the value axis as percentages.

### Polar area, heatmap matrix

```tsx
import { PolarAreaChart, HeatmapMatrix } from "@zenith-visuals/charts";

<PolarAreaChart
  categories={["Q1", "Q2", "Q3", "Q4"]}
  series={[
    { name: "Web", data: [18, 24, 21, 30] },
    { name: "Mobile", data: [12, 16, 20, 26] },
  ]}
/>

<HeatmapMatrix
  data={[
    { row: "Mon", col: "9am", value: 12 },
    { row: "Mon", col: "12pm", value: 34 },
    { row: "Tue", col: "9am", value: 21 },
  ]}
/>
```

`PolarAreaChart` stacks each series radially per equal-angle category (a stacked
coxcomb) via the pure `computePolarArea` helper. `HeatmapMatrix` renders a dense
row × column grid — colored on the theme's sequential ramp — from sparse
`{ row, col, value }` data via the pure `buildMatrix` helper.

## Theming

All charts accept a `theme` override and respond to a surrounding
`ThemeProvider` from `@zenith-visuals/core`. Colors default to the active
theme's `palette`; pass a per-series `color` to override.

## Accessibility

Every chart renders an SVG with `role="img"` and an `aria-label` (customizable
via `labels.ariaLabel`), per-element `<title>` tooltips, and honors
`prefers-reduced-motion`.

## License

MIT
