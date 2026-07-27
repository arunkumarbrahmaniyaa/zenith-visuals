# @zenith-visuals/flow

Flow & relationship diagrams for Zenith Visuals — **Sankey, Alluvial, Parallel
Coordinates, Chord, Parallel Sets, Pyramid, Dependency Wheel, Network Flow and
Journey**.

Part of [**Zenith Visuals**](https://github.com/arunkumarbrahmaniyaa/zenith-visuals) — the ultimate React visualization SDK. TypeScript-first, tree-shakeable, SSR-safe and accessible.

## Install

```bash
npm install @zenith-visuals/flow
```

> Requires `react` (>=18) as a peer dependency where applicable.

## Usage

### Sankey

```tsx
import { Sankey } from "@zenith-visuals/flow";

<Sankey
  data={{
    links: [
      { source: "Landing", target: "Signup", value: 1000 },
      { source: "Signup", target: "Purchase", value: 420 },
    ],
  }}
  linkGradient
  onNodeClick={(node) => console.log(node.id)}
/>;
```

Nodes are inferred from the links (or pass an explicit `data.nodes` array).
The pure layout engine `computeSankeyLayout` is exported for headless/server use.

### Alluvial

```tsx
import { Alluvial } from "@zenith-visuals/flow";

<Alluvial
  stageLabels={["Source", "Stage", "Outcome"]}
  flows={[
    { path: ["Mobile", "Trial", "Paid"], value: 30 },
    { path: ["Web", "Trial", "Churn"], value: 12 },
  ]}
/>;
```

### Parallel coordinates

```tsx
import { ParallelCoordinates } from "@zenith-visuals/flow";

<ParallelCoordinates
  data={rows}
  dimensions={[{ key: "mpg" }, { key: "hp" }, { key: "weight" }]}
  categories={rows.map((r) => r.origin)}
/>;
```

### Chord

```tsx
import { Chord } from "@zenith-visuals/flow";

<Chord
  matrix={[
    [0, 5, 6],
    [7, 0, 8],
    [9, 4, 0],
  ]}
  groupLabels={["A", "B", "C"]}
/>;
```

Pure layout engines `computeSankeyLayout`, `computeAlluvialLayout` and
`computeChordLayout` are exported for headless/server use.

### Parallel sets

Joint distribution of several categorical dimensions; ribbons are colored by the
first dimension. Takes tabular `data` plus the `dimensions` to cross-tabulate.

```tsx
import { ParallelSets } from "@zenith-visuals/flow";

<ParallelSets
  data={[
    { class: "First", sex: "Female", survived: "Yes", n: 140 },
    { class: "Third", sex: "Male", survived: "No", n: 418 },
    // …
  ]}
  dimensions={["class", "sex", "survived"]}
  dimensionLabels={["Class", "Sex", "Survived"]}
  valueKey="n"
/>;
```

### Population pyramid

Two mirrored horizontal bar series sharing a scale around a central label gutter.

```tsx
import { Pyramid } from "@zenith-visuals/flow";

<Pyramid
  leftLabel="Male"
  rightLabel="Female"
  data={[
    { label: "0–9", left: 82, right: 78 },
    { label: "10–19", left: 90, right: 86 },
    // …
  ]}
/>;
```

### Dependency wheel

A chord diagram driven by directed node → node dependencies.

```tsx
import { DependencyWheel } from "@zenith-visuals/flow";

<DependencyWheel
  data={{
    links: [
      { source: "app", target: "ui", value: 8 },
      { source: "ui", target: "utils", value: 7 },
      { source: "store", target: "api", value: 5 },
    ],
  }}
/>;
```

### Network flow

A directed layered flow graph with arrowheads and per-node throughput labels.

```tsx
import { NetworkFlow } from "@zenith-visuals/flow";

<NetworkFlow
  data={{
    links: [
      { source: "Ingress", target: "Auth", value: 100 },
      { source: "Auth", target: "Router", value: 92 },
      { source: "Router", target: "Orders", value: 40 },
    ],
  }}
/>;
```

### Journey

A customer-journey band that tapers with drop-off, with an optional sentiment
line (`sentiment` in `-1..1`).

```tsx
import { Journey } from "@zenith-visuals/flow";

<Journey
  data={[
    { label: "Awareness", value: 1000, sentiment: 0.3 },
    { label: "Trial", value: 420, sentiment: 0.1 },
    { label: "Purchase", value: 240, sentiment: -0.2 },
    { label: "Advocacy", value: 120, sentiment: 0.8 },
  ]}
/>;
```

Additional pure helpers `buildParallelSetFlows`, `computePyramid`,
`buildWheelMatrix` / `computeDependencyWheel`, `flowBalance` and `computeJourney`
are exported for headless/server use and testing.

> Wrap component trees in `<ThemeProvider>` from `@zenith-visuals/core` to enable
> theming and dark mode.

## Documentation

See the [main README](https://github.com/arunkumarbrahmaniyaa/zenith-visuals#readme) for the full API, theming and more examples.

## License

MIT
