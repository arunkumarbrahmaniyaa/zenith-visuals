# @zenith-visuals/kpi

KPI & comparison components for Zenith Visuals — **StatCard, BulletChart,
SlopeChart, DumbbellChart, LollipopChart, GradientBand and TrendDeltaCard**.

Part of [**Zenith Visuals**](https://github.com/arunkumarbrahmaniyaa/zenith-visuals) — the ultimate React visualization SDK. TypeScript-first, tree-shakeable, SSR-safe and accessible.

## Install

```bash
npm install @zenith-visuals/kpi
```

> Requires `react` (>=18) as a peer dependency where applicable.

## Usage

### StatCard

```tsx
import { StatCard } from "@zenith-visuals/kpi";

<StatCard
  label="MRR"
  value={48200}
  previousValue={44100}
  unit="$"
  trend={[41, 42, 44, 43, 46, 48]}
/>;
```

Shows a headline value, a period-over-period delta badge and a mini sparkline.
Set `goodDirection="down"` for metrics where a decrease is positive.

### BulletChart

```tsx
import { BulletChart } from "@zenith-visuals/kpi";

<BulletChart label="Revenue" measure={82} target={90} ranges={[50, 75, 100]} />;
```

### SlopeChart

```tsx
import { SlopeChart } from "@zenith-visuals/kpi";

<SlopeChart
  startLabel="2023"
  endLabel="2024"
  data={[
    { label: "North", start: 40, end: 62 },
    { label: "South", start: 55, end: 48 },
  ]}
/>;
```

### DumbbellChart

```tsx
import { DumbbellChart } from "@zenith-visuals/kpi";

<DumbbellChart
  startLabel="Before"
  endLabel="After"
  data={[{ label: "Team A", start: 30, end: 72 }]}
/>;
```

### LollipopChart

```tsx
import { LollipopChart } from "@zenith-visuals/kpi";

<LollipopChart
  sort="desc"
  data={[
    { label: "Alpha", value: 82 },
    { label: "Beta", value: 61 },
  ]}
/>;
```

### GradientBand

```tsx
import { GradientBand } from "@zenith-visuals/kpi";

<GradientBand label="Health score" value={72} min={0} max={100} target={80} />;
```

Shows where a value sits between a `min` and `max` over a continuous color
gradient (or discrete qualitative `zones`), with an optional dashed target
marker. Positions are computed with the pure `bandPosition` helper.

### TrendDeltaCard

```tsx
import { TrendDeltaCard } from "@zenith-visuals/kpi";

<TrendDeltaCard
  label="Signups"
  value={1280}
  previousValue={1104}
  trend={[980, 1010, 1044, 1104, 1180, 1280]}
  periodLabel="vs last week"
/>;
```

Pairs a headline value with a period-over-period delta (both absolute and
percentage) and a filled area sparkline. Set `goodDirection="down"` for metrics
like churn or cost.

The pure helpers `computeDelta`, `valueExtent` and `bandPosition` are exported
for headless use.

> Wrap component trees in `<ThemeProvider>` from `@zenith-visuals/core` to enable
> theming and dark mode.

## Documentation

See the [main README](https://github.com/arunkumarbrahmaniyaa/zenith-visuals#readme) for the full API, theming and more examples.

## License

MIT
