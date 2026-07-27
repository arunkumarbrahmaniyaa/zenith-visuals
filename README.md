<div align="center">

# Zenith Visuals

**The ultimate React visualization SDK.**

TypeScript-first · Tree-shakeable · SSR-safe · Accessible · Beautiful by default

</div>

---

Zenith Visuals is an open-source, monorepo-based React visualization SDK. It is
**not** another charting library — it focuses on the advanced visualization
components product teams repeatedly rebuild from scratch: contribution
heatmaps, activity timelines, flow/Sankey diagrams, graphs, org charts, Gantt
charts, schedulers, AI agent graphs and more.

Every component is designed around the same principles: **zero configuration,
beautiful defaults, a minimal declarative API, accessibility, dark mode, and
framework-agnostic styling with no global CSS.**

```tsx
import { ThemeProvider } from "@zenith-visuals/core";
import { CalendarHeatmap } from "@zenith-visuals/heatmap";
import { ActivityTimeline } from "@zenith-visuals/timeline";
import { Sankey } from "@zenith-visuals/flow";

<ThemeProvider mode="system">
  <CalendarHeatmap data={contributions} />
  <ActivityTimeline data={activities} />
  <Sankey data={{ links: flow }} />
</ThemeProvider>;
```

## Repository status

This repository ships a **production-grade monorepo** of 18 published,
tree-shakeable packages under the `@zenith-visuals/*` scope — five shared
foundation packages (`core`, `utils`, `hooks`, `themes`, `icons`) plus 13
visualization component families delivering **100+ chart types**.

### Published packages

| Package | Status | Contents |
| --- | --- | --- |
| `@zenith-visuals/core` | ✅ | Theme system, `ThemeProvider`/`useTheme`, SSR-safe hooks, `VisualizationContainer`, `Tooltip`, loading/empty/error states |
| `@zenith-visuals/utils` | ✅ | Scales, color interpolation, number/date/array helpers (dependency-free) |
| `@zenith-visuals/hooks` | ✅ | `useResizeObserver`, `useZoomPan`, `useTooltip`, `useDebouncedValue`, `useControllableState`, media-query hooks |
| `@zenith-visuals/themes` | ✅ | `createTheme` builder + built-in `light`, `dark`, `ocean`, `sunset`, `midnight` themes |
| `@zenith-visuals/icons` | ✅ | Lightweight `createIcon` factory + ~20 tree-shakeable SVG icons (`currentColor`, forwardRef) |
| `@zenith-visuals/charts` | ✅ | `LineChart`, `AreaChart`, `BarChart`, `ScatterChart`, `PieChart`, `RadarChart`, `RadialBarChart`, `GaugeChart`, `FunnelChart`, `Sparkline`, `WaterfallChart`, `ParetoChart`, `ComboChart`, `RangeBarChart`, `StreamGraph`, `HalfDonutChart`, `NestedPieChart`, `RoseChart`, `RadialLineChart`, `SolidGaugeChart`, `ProgressRing`, `WaffleChart`, `StepLineChart`, `PercentColumnChart`, `PolarAreaChart`, `HeatmapMatrix` (grouped/stacked, smoothing, bubbles, donut, thresholds, ThemeRiver, Nightingale, waffle, step, 100% stacked, stacked coxcomb, matrix heatmap) |
| `@zenith-visuals/stats` | ✅ | `BoxPlot`, `ViolinPlot`, `Histogram`, `DensityPlot` (KDE), `Hexbin`, `ErrorBarChart`, `RegressionChart`, `StripPlot`, `BeeswarmChart`, `QQPlot`, `RidgelineChart`, `DensityHeatmap`, `ContourPlot`, `MarginalHistogram` + stats helpers (`boxStats`, `kde`, `histogramBins`, `linearRegression`, `qqPoints`, `beeswarmLayout`, `bin2d`, `kdeGrid2d`, `marchingSquares`) |
| `@zenith-visuals/hierarchy` | ✅ | `Treemap`, `Sunburst`, `Icicle`, `Tree`, `CirclePack`, `RadialTree`, `Dendrogram`, `Cluster`, `MindMap` + layout engine (`hierarchy`, `treemapLayout`, `partitionLayout`, `treeLayout`, `clusterLayout`, `packLayout`) |
| `@zenith-visuals/finance` | ✅ | `CandlestickChart`, `OHLCChart`, `KagiChart`, `RenkoChart`, `HorizonChart` + transforms (`computeKagi`, `computeRenko`) |
| `@zenith-visuals/kpi` | ✅ | `StatCard`, `BulletChart`, `SlopeChart`, `DumbbellChart`, `LollipopChart`, `GradientBand`, `TrendDeltaCard` + helpers (`computeDelta`, `valueExtent`, `bandPosition`) |
| `@zenith-visuals/heatmap` | ✅ | `CalendarHeatmap` (GitHub-style, keyboard navigable, accessible SVG) |
| `@zenith-visuals/timeline` | ✅ | `ActivityTimeline` (avatars, status, nested events, day grouping, infinite scroll), `ResourceTimeline`, `Swimlane`, `EventDrops` |
| `@zenith-visuals/flow` | ✅ | `Sankey`, `Alluvial`, `ParallelCoordinates`, `Chord`, `ParallelSets`, `Pyramid`, `DependencyWheel`, `NetworkFlow`, `Journey` (pure layout engines, gradient links, hover highlighting, tooltips) |
| `@zenith-visuals/network` | ✅ | `NetworkGraph` (deterministic force layout), `ArcDiagram`, `AdjacencyMatrix`, `EdgeBundling` (hierarchical) with neighbor highlighting + tooltips |
| `@zenith-visuals/orgchart` | ✅ | `OrgChart` (tidy top-down tree, collapsible subtrees, HTML cards + SVG connectors) |
| `@zenith-visuals/gantt` | ✅ | `Gantt` (time scale, swimlanes, milestones, progress overlays, gridlines) |
| `@zenith-visuals/ai` | ✅ | `AgentGraph` (layered DAG, status colors, token/latency badges, streaming edges) |
| `@zenith-visuals/maps` | ✅ | `GeoScatter`, `Choropleth`, `ConnectionMap`, `BubbleMap`, `GeoHeatmap`, `Cartogram`, `HexbinMap`, `TileGridMap` (equirectangular/Mercator projections, graticule, auto-fit polygons, curved arcs, hex binning, Gaussian density, value→size/color) |

### Catalog complete — 100+ charts shipped

Every component on the original roadmap is now shipped and documented: matrix
heatmap, journey flow, dependency graph/wheel, mind map, resource timeline,
swimlanes, choropleth and other geo maps, statistical distributions, hierarchy
layouts, financial charts and KPI cards — all across cartesian, statistical,
hierarchy, flow, time, geo and KPI categories.

Each component reuses `@zenith-visuals/core` primitives (theming, container,
tooltip, states) and `@zenith-visuals/utils` (scales, color, layout math), so
they share one consistent, tree-shakeable, accessible API.

See [ROADMAP.md](ROADMAP.md) for the full delivered catalog (all 8 categories
complete).

## Architecture

```
packages/
  utils/     → pure TS: scales, color, math, dates, arrays (no deps)
  core/      → theming, context, SSR hooks, shared primitives & types
  themes/    → prebuilt themes + createTheme()
  hooks/     → reusable React hooks (zoom/pan, resize, tooltip, ...)
  icons/     → createIcon() factory + SVG icon set
  charts/    → 26 cartesian/radial/part-to-whole charts
  stats/     → 14 statistical & distribution charts
  hierarchy/ → 9 tree/treemap/pack layouts
  finance/   → 5 candlestick/OHLC/Kagi/Renko/Horizon charts
  kpi/       → 7 KPI cards & comparison charts
  heatmap/   → CalendarHeatmap (GitHub-style)
  timeline/  → ActivityTimeline + schedule charts
  flow/      → Sankey, Alluvial, Chord, Journey & more
  network/   → NetworkGraph, ArcDiagram, AdjacencyMatrix, EdgeBundling
  orgchart/  → OrgChart (tidy tree)
  gantt/     → Gantt (timeline / schedule)
  ai/        → AgentGraph (AI agent DAG)
  maps/      → 8 geographic projection charts
```

**Dependency flow:** `utils → core → { themes, hooks } → components`. Every
component package externalizes `react`, `react-dom` and the internal packages,
so nothing is bundled twice and everything is tree-shakeable.

### Design decisions

- **No global CSS.** All styling is inline and theme-driven, so there are zero
  conflicts with Tailwind, MUI, Chakra, Mantine, Ant Design, shadcn/ui, Radix,
  Bootstrap or plain CSS.
- **SSR-first.** `useIsomorphicLayoutEffect`, deferred media queries and a
  ResizeObserver that starts at `0×0` make components safe for Next.js, Remix,
  Gatsby, Vite, Electron and Tauri.
- **Accessibility built in.** Semantic roles (`grid`/`gridcell`, `feed`,
  `figure`), ARIA live regions for state changes, keyboard navigation and
  focus rings driven by the theme.
- **Beautiful by default.** Sensible defaults, an opinionated palette and a
  dark theme that follows `prefers-color-scheme`, plus `prefers-reduced-motion`
  support.
- **Pure, testable layout engines.** Calendar and Sankey layouts are pure
  functions — deterministic, SSR-safe, Web-Worker-ready and unit-tested.

## Getting started

Requires Node 18+ and pnpm.

```bash
pnpm install     # install workspace deps
pnpm build       # build every package (dependency order)
pnpm test        # run the Vitest suite
pnpm typecheck   # type-check all packages
pnpm dev         # watch-build all packages
```

## Demo

A live gallery of every component (with a light/dark/ocean/sunset/midnight theme
switcher) lives in [examples/demo](examples/demo). Run it with:

```bash
pnpm demo        # builds the packages, then starts the Vite dev server
```

Then open http://localhost:5173. The demo consumes the workspace packages
directly, so rebuilding a package (`pnpm build`) refreshes the gallery.

## Component reference

Below are three representative components. **Every package has its own README
with copy-paste `tsx` examples for all of its components** — see
[packages/charts](packages/charts/README.md),
[packages/stats](packages/stats/README.md),
[packages/hierarchy](packages/hierarchy/README.md),
[packages/finance](packages/finance/README.md),
[packages/kpi](packages/kpi/README.md),
[packages/flow](packages/flow/README.md),
[packages/network](packages/network/README.md),
[packages/timeline](packages/timeline/README.md),
[packages/maps](packages/maps/README.md),
[packages/heatmap](packages/heatmap/README.md),
[packages/orgchart](packages/orgchart/README.md),
[packages/gantt](packages/gantt/README.md) and
[packages/ai](packages/ai/README.md). The
[demo gallery](examples/demo/src/App.tsx) renders all 100+ components with live
data and a theme switcher.

### `<CalendarHeatmap />` — `@zenith-visuals/heatmap`

GitHub-style contribution calendar.

```tsx
<CalendarHeatmap
  data={[{ date: "2026-01-01", value: 3 }]}
  rangeDays={365}
  weekStartsOn={1}
  onCellClick={(cell) => console.log(cell.date, cell.value)}
/>
```

Key props: `data`, `startDate`, `endDate`, `rangeDays`, `weekStartsOn`,
`cellSize`, `colors`, `showLegend`, `showMonthLabels`, `onCellClick`,
`renderTooltip`. Fully keyboard navigable (arrow keys, Home/End, Enter/Space).

### `<ActivityTimeline />` — `@zenith-visuals/timeline`

Modern activity feed with avatars, status nodes and nesting.

```tsx
<ActivityTimeline
  data={activities}
  groupByDay
  hasMore={hasMore}
  onLoadMore={fetchNextPage}
  onItemClick={(item) => open(item.id)}
/>
```

Supports `status` (`success`/`warning`/`danger`/`info`), `actor` avatars/initials,
nested `children`, custom `icon`, day grouping, infinite scroll via
`IntersectionObserver`, and `renderItem` for full customization.

### `<Sankey />` — `@zenith-visuals/flow`

Animated Sankey diagram with a real layout engine.

```tsx
<Sankey
  data={{
    links: [
      { source: "Landing", target: "Signup", value: 1000 },
      { source: "Signup", target: "Purchase", value: 420 },
    ],
  }}
  linkGradient
  onNodeClick={(node) => select(node.id)}
/>
```

Layered longest-path node placement, value-proportional widths, gradient links,
crossing-reduction relaxation, hover highlighting and tooltips. The layout
(`computeSankeyLayout`) is exported for headless/server use.

## Theming

```tsx
import { ThemeProvider } from "@zenith-visuals/core";
import { createTheme, midnightTheme } from "@zenith-visuals/themes";

const brand = createTheme({
  name: "brand",
  colors: { primary: "#ff5a1f" },
  palette: ["#ff5a1f", "#1f6fff", "#12b886"],
});

<ThemeProvider theme={brand}>{/* ... */}</ThemeProvider>;
// or: <ThemeProvider mode="dark" /> · <ThemeProvider mode="system" />
```

Per-instance overrides are supported on every component via the `theme` prop.

## Publishing to npm

All packages publish under the public `@zenith-visuals/*` scope. Versioning is
managed with [Changesets](https://github.com/changesets/changesets).

**Prerequisites**

- You own (or are a member of) the `@zenith-visuals` npm organization.
- You are authenticated locally: `npm login` (or set `NPM_TOKEN` in CI).

**Local publish (first release / manual)**

```bash
pnpm build                # build all 18 packages
pnpm -r publish --dry-run --no-git-checks   # verify tarball contents
pnpm publish:packages     # build + publish every package (public access)
```

**Changesets workflow (ongoing releases)**

```bash
pnpm changeset            # describe changes + choose semver bumps
pnpm version-packages     # apply version bumps + changelogs
pnpm release              # build + changeset publish (only changed packages)
```

`workspace:*` internal dependencies are automatically rewritten to real
version numbers at publish time. A GitHub Actions workflow
(`.github/workflows/release.yml`) automates the Changesets flow when an
`NPM_TOKEN` secret is configured.

## License

MIT