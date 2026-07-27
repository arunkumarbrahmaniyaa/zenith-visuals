# Zenith Visuals — Chart Roadmap (100 graphs)

Goal: make Zenith Visuals the most complete, beautiful, accessible React
visualization SDK — covering everything the leading libraries offer (D3, ECharts,
Highcharts, Chart.js, Recharts, Nivo, visx, Plotly, ApexCharts, AntV G2, amCharts)
under one consistent, themeable, tree-shakeable, SSR-safe API.

Legend: ✅ shipped · 🚧 in progress · ⭐ planned

## Design principles (every chart)

- Pure, deterministic layout engine (SSR-safe, testable, Web-Worker-ready).
- No global CSS; theme-driven inline styling; dark mode + `prefers-reduced-motion`.
- Accessible: ARIA roles, keyboard navigation, live regions, `readableTextColor`.
- Responsive via `VisualizationContainer` + `ResizeObserver`.
- Consistent data model: `categories` + `series`, or `{ label, value }[]`.
- Tree-shakeable per-chart exports; `sideEffects: false`.

---

## 1. Cartesian & trend (1–20) — `@zenith-visuals/charts`

| # | Chart | Status |
| --- | --- | --- |
| 1 | Line | ✅ |
| 2 | Multi-series line | ✅ |
| 3 | Area | ✅ |
| 4 | Stacked area | ✅ |
| 5 | Spline / smooth line | ✅ |
| 6 | Step line | ✅ |
| 7 | Column (vertical bar) | ✅ |
| 8 | Grouped column | ✅ |
| 9 | Stacked column | ✅ |
| 10 | 100% stacked column | ✅ |
| 11 | Bar (horizontal) | ✅ |
| 12 | Grouped / stacked bar | ✅ |
| 13 | Range / floating bar | ✅ |
| 14 | Bullet | ✅ |
| 15 | Waterfall | ✅ |
| 16 | Histogram | ✅ |
| 17 | Pareto | ✅ |
| 18 | Combo (bar + line) | ✅ |
| 19 | Stream / ThemeRiver | ✅ |
| 20 | Sparkline | ✅ |

## 2. Statistical & distribution (21–35) — `@zenith-visuals/charts`, `@zenith-visuals/stats`

| # | Chart | Status |
| --- | --- | --- |
| 21 | Scatter | ✅ |
| 22 | Bubble | ✅ |
| 23 | Box plot | ✅ |
| 24 | Violin | ✅ |
| 25 | Density / KDE | ✅ |
| 26 | Beeswarm | ✅ |
| 27 | Error bar | ✅ |
| 28 | Q-Q plot | ✅ |
| 29 | Ridgeline | ✅ |
| 30 | 2D density heatmap | ✅ |
| 31 | Hexbin | ✅ |
| 32 | Contour | ✅ |
| 33 | Regression / trend fit | ✅ |
| 34 | Marginal histogram | ✅ |
| 35 | Strip plot | ✅ |

## 3. Part-to-whole & radial (36–50) — `@zenith-visuals/charts`, `@zenith-visuals/hierarchy`

| # | Chart | Status |
| --- | --- | --- |
| 36 | Pie | ✅ |
| 37 | Donut | ✅ |
| 38 | Half donut | ✅ |
| 39 | Nested / multi-level pie | ✅ |
| 40 | Rose / Nightingale | ✅ |
| 41 | Radial bar | ✅ |
| 42 | Radial line | ✅ |
| 43 | Gauge | ✅ |
| 44 | Solid gauge | ✅ |
| 45 | Progress ring | ✅ |
| 46 | Sunburst | ✅ |
| 47 | Icicle | ✅ |
| 48 | Treemap | ✅ |
| 49 | Circle packing | ✅ |
| 50 | Waffle | ✅ |

## 4. Hierarchy & network (51–62) — `@zenith-visuals/network`, `@zenith-visuals/hierarchy`

| # | Chart | Status |
| --- | --- | --- |
| 51 | Tree (node-link) | ✅ |
| 52 | Radial tree | ✅ |
| 53 | Dendrogram | ✅ |
| 54 | Cluster | ✅ |
| 55 | Force-directed graph | ✅ (network) |
| 56 | Arc diagram | ✅ |
| 57 | Chord | ✅ |
| 58 | Hierarchical edge bundling | ✅ |
| 59 | Adjacency matrix | ✅ |
| 60 | Network graph | ✅ |
| 61 | Org chart | ✅ |
| 62 | Mind map | ✅ |

## 5. Flow & relationship (63–72) — `@zenith-visuals/flow`

| # | Chart | Status |
| --- | --- | --- |
| 63 | Sankey | ✅ |
| 64 | Alluvial | ✅ |
| 65 | Parallel sets | ✅ |
| 66 | Parallel coordinates | ✅ |
| 67 | Chord flow | ✅ |
| 68 | Funnel | ✅ |
| 69 | Pyramid | ✅ |
| 70 | Dependency wheel | ✅ |
| 71 | Network flow | ✅ |
| 72 | Journey flow | ✅ |

## 6. Time & schedule (73–82) — `@zenith-visuals/timeline`, `@zenith-visuals/gantt`, `@zenith-visuals/finance`

| # | Chart | Status |
| --- | --- | --- |
| 73 | Gantt | ✅ |
| 74 | Activity timeline | ✅ |
| 75 | Calendar heatmap | ✅ |
| 76 | Candlestick / OHLC | ✅ |
| 77 | Kagi | ✅ |
| 78 | Renko | ✅ |
| 79 | Horizon chart | ✅ |
| 80 | Resource timeline | ✅ |
| 81 | Swimlane | ✅ |
| 82 | Event drops | ✅ |

## 7. Geo & spatial (83–90) — `@zenith-visuals/maps`

| # | Chart | Status |
| --- | --- | --- |
| 83 | Geo scatter | ✅ |
| 84 | Choropleth | ✅ |
| 85 | Bubble map | ✅ |
| 86 | Connection / flow map | ✅ |
| 87 | Geo heatmap | ✅ |
| 88 | Cartogram | ✅ |
| 89 | Hexbin map | ✅ |
| 90 | Tile-grid map | ✅ |

## 8. Comparison & KPI (91–100) — `@zenith-visuals/charts`, `@zenith-visuals/kpi`

| # | Chart | Status |
| --- | --- | --- |
| 91 | Radar | ✅ |
| 92 | Polar area | ✅ |
| 93 | Heatmap matrix | ✅ |
| 94 | KPI stat card | ✅ |
| 95 | Bullet KPI | ✅ |
| 96 | Slope chart | ✅ |
| 97 | Dumbbell | ✅ |
| 98 | Lollipop | ✅ |
| 99 | Range / gradient band | ✅ |
| 100 | Trend delta card | ✅ |

---

## Delivery phases

- **Phase 1 (shipped): `@zenith-visuals/charts`** — the essential everyday charts
  every dashboard needs: Line, Area (stacked), Column/Bar (grouped & stacked),
  Scatter, Bubble, Pie, Donut, Radar, Radial bar, Gauge, Funnel, Sparkline.
  Shared cartesian engine (nice ticks, axes, gridlines, legend, tooltips).
- **Phase 2 (shipped): `@zenith-visuals/stats`** — distribution & statistical
  charts: box plot, violin, histogram, KDE density, hexbin density, error bars,
  plus reusable stats helpers (`boxStats`, `kde`, `histogramBins`, quantiles).
- **Phase 3:** hierarchy (`@zenith-visuals/hierarchy`): treemap, sunburst, tree,
  circle packing, icicle. ✅ Shipped — Treemap, Sunburst, Icicle, Tree and
  CirclePack with a dependency-free d3-hierarchy layout port.
- **Phase 4:** finance (`@zenith-visuals/finance`): candlestick, OHLC, horizon.
  ✅ Shipped — CandlestickChart, OHLCChart, KagiChart, RenkoChart and
  HorizonChart with pure Kagi/Renko transforms.
- **Phase 5:** flow & geo expansion (alluvial, parallel coordinates, chord,
  choropleth, connection map). ✅ Shipped — Alluvial, ParallelCoordinates and
  Chord added to `@zenith-visuals/flow`; Choropleth and ConnectionMap added to
  `@zenith-visuals/maps` (all dependency-free, core + utils only).
- **Phase 6:** KPI kit (`@zenith-visuals/kpi`): stat cards, bullet, slope,
  dumbbell, lollipop. ✅ Shipped — StatCard, BulletChart, SlopeChart,
  DumbbellChart and LollipopChart with pure `computeDelta`/`valueExtent` helpers.
- **Phase 7:** cartesian & trend expansion (`@zenith-visuals/charts`). ✅ Shipped
  — WaterfallChart, ParetoChart, ComboChart, RangeBarChart and StreamGraph
  (ThemeRiver) with pure `computeWaterfall`/`computePareto`/`computeStreamBands`
  transforms.
- **Phase 8:** part-to-whole & radial expansion (`@zenith-visuals/charts`). ✅
  Shipped — HalfDonutChart, NestedPieChart, RoseChart (Nightingale),
  RadialLineChart, SolidGaugeChart, ProgressRing and WaffleChart with pure
  `computeWaffle`/`computeNestedPie` layout helpers.
- **Phase 9:** cartesian finish + statistical expansion (`@zenith-visuals/charts`,
  `@zenith-visuals/stats`). ✅ Shipped — StepLineChart, PercentColumnChart,
  RegressionChart, StripPlot, BeeswarmChart, QQPlot and RidgelineChart with pure
  `stepPath`/`linearRegression`/`normalQuantile`/`qqPoints`/`beeswarmLayout`
  helpers.
- **Phase 10:** statistical category complete (`@zenith-visuals/stats`). ✅
  Shipped — DensityHeatmap, ContourPlot and MarginalHistogram with pure
  `bin2d`/`kdeGrid2d`/`marchingSquares` 2D-density helpers. Category 2
  (statistical & distribution, #21–35) is now fully implemented.
- **Phase 11:** hierarchy tree family (`@zenith-visuals/hierarchy`). ✅ Shipped
  — RadialTree, Dendrogram, Cluster and MindMap on a shared `treeLayout` /
  `clusterLayout` engine (leaves aligned for cluster/dendrogram, elbow vs curved
  vs radial vs branch-colored links).
- **Phase 12:** graph relationship views (`@zenith-visuals/network`). ✅ Shipped
  — ArcDiagram (#56), AdjacencyMatrix (#59) and EdgeBundling (#58) on a shared
  pure `normalizeGraph` / `adjacencyMatrix` / `bundle` / `catmullRomPath` helper
  library. Category 4 (hierarchy & network, #51–62) is now fully implemented.
- **Phase 13:** flow & relationship completion (`@zenith-visuals/flow`). ✅
  Shipped — ParallelSets (#65), Pyramid (#69), DependencyWheel (#70),
  NetworkFlow (#71) and Journey (#72), reusing the alluvial/chord/sankey layout
  engines plus pure `computePyramid` / `buildWheelMatrix` / `flowBalance` /
  `computeJourney` helpers. Category 5 (flow & relationship, #63–72) is now
  fully implemented.
- **Phase 14:** time & schedule completion (`@zenith-visuals/timeline`). ✅
  Shipped — ResourceTimeline (#80), Swimlane (#81) and EventDrops (#82) on a
  shared pure time library (`niceTimeTicks` axis ticks + `packLanes` interval
  packing for overlap stacking). Category 6 (time & schedule, #73–82) is now
  fully implemented.
- **Phase 15:** geo & spatial completion (`@zenith-visuals/maps`). ✅ Shipped
  — BubbleMap (#85), GeoHeatmap (#87), Cartogram (#88), HexbinMap (#89) and
  TileGridMap (#90) on a shared pure geo library (`computeFit` projection
  fitting, `hexbin`/`hexagonPath` hex lattice, `densityGrid` Gaussian KDE,
  `polygonCentroid`/`scaleRingAround` cartogram scaling, `tileGridExtent`).
  Category 7 (geo & spatial, #83–90) is now fully implemented.
- **Phase 16:** comparison & KPI completion (`@zenith-visuals/charts`,
  `@zenith-visuals/kpi`). ✅ Shipped — PolarAreaChart (#92) and HeatmapMatrix
  (#93) on pure `computePolarArea` / `buildMatrix` helpers, plus GradientBand
  (#99) and TrendDeltaCard (#100) with a pure `bandPosition` helper. Category 8
  (comparison & KPI, #91–100) is now fully implemented — **all 100 charts are
  shipped.**

Every phase reuses the same theming, container, tooltip, scale and color
primitives, so the API stays consistent as the catalog grows to 100+.
