# @zenith-visuals/hierarchy

Hierarchical & part-to-whole charts for **Zenith Visuals** — treemaps, sunbursts,
icicle plots, tidy node-link trees and circle packing. Built on the same pure
layout engine, theming, tooltip and accessibility primitives as the rest of the
SDK, with a dependency-free port of the d3-hierarchy layouts.

Includes: **Treemap, Sunburst, Icicle, Tree, CirclePack, RadialTree, Dendrogram, Cluster, MindMap** — plus a framework-agnostic
layout engine (`hierarchy`, `treemapLayout`, `partitionLayout`, `treeLayout`, `clusterLayout`,
`packLayout`, `squarify`).

## Install

```bash
pnpm add @zenith-visuals/hierarchy @zenith-visuals/charts @zenith-visuals/core react react-dom
```

## Data shape

Every chart takes a single nested `HierarchyDatum`. Leaves carry a `value`;
parents sum their children automatically.

```ts
const data = {
  name: "root",
  children: [
    { name: "Engineering", children: [
      { name: "Web", value: 8 },
      { name: "Mobile", value: 5 },
    ]},
    { name: "Design", value: 4 },
  ],
};
```

## Usage

### Treemap

```tsx
import { Treemap } from "@zenith-visuals/hierarchy";

<Treemap data={data} padding={2} showLabels />
```

### Sunburst

```tsx
import { Sunburst } from "@zenith-visuals/hierarchy";

<Sunburst data={data} innerRadius={0.4} />
```

### Icicle

```tsx
import { Icicle } from "@zenith-visuals/hierarchy";

<Icicle data={data} orientation="vertical" />
```

### Tidy tree

```tsx
import { Tree } from "@zenith-visuals/hierarchy";

<Tree data={data} orientation="vertical" nodeRadius={5} />
```

### Circle packing

```tsx
import { CirclePack } from "@zenith-visuals/hierarchy";

<CirclePack data={data} padding={3} />
```

### Radial tree, dendrogram, cluster, mind map

```tsx
import {
  RadialTree,
  Dendrogram,
  Cluster,
  MindMap,
} from "@zenith-visuals/hierarchy";

<RadialTree data={data} />

<Dendrogram data={data} orientation="horizontal" />

<Cluster data={data} orientation="vertical" />

<MindMap data={data} />
```

`RadialTree` maps the tidy tree onto concentric rings, `Dendrogram` and
`Cluster` share the leaf-aligned `clusterLayout` (elbow vs curved links), and
`MindMap` uses branch-colored links with pill labels.

## Layout engine

The math powering the charts is exported for reuse in your own renderers:

```ts
import { hierarchy, treemapLayout, packLayout } from "@zenith-visuals/hierarchy";

const root = hierarchy(data);   // computes value / depth / height
treemapLayout(root, 640, 400);  // assigns x0/y0/x1/y1
packLayout(root, 400, 3);       // assigns x/y/r
```

## Accessibility

Every chart renders an SVG with `role="img"` and an `aria-label` (customizable
via `labels.ariaLabel`), per-element `<title>` tooltips, and honors
`prefers-reduced-motion`.

## License

MIT
