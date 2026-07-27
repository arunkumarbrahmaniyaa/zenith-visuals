# @zenith-visuals/network

Network, dependency and force graph components for Zenith Visuals.

Part of [**Zenith Visuals**](https://github.com/arunkumarbrahmaniyaa/zenith-visuals) — the ultimate React visualization SDK. TypeScript-first, tree-shakeable, SSR-safe and accessible.

## Install

```bash
npm install @zenith-visuals/network
```

> Requires `react` (>=18) as a peer dependency where applicable.

## Usage

```tsx
import { NetworkGraph } from "@zenith-visuals/network";

<NetworkGraph
  data={{
    nodes: [
      { id: "app", label: "App", group: 0 },
      { id: "api", label: "API", group: 1 },
      { id: "db", label: "Database", group: 2 },
    ],
    links: [
      { source: "app", target: "api", value: 2 },
      { source: "api", target: "db" },
    ],
  }}
  onNodeClick={(node) => console.log(node.id)}
/>;
```

Hovering a node highlights its neighbors. The deterministic force layout
`computeForceLayout` is exported for headless/server use.

## Components

- **NetworkGraph** — force-directed node-link diagram.
- **ArcDiagram** — nodes on a horizontal axis with semicircular link arcs.
- **AdjacencyMatrix** — matrix view shaded by connection strength; rows and
  columns are ordered by group so communities form diagonal blocks. Scales to
  dense graphs where node-link diagrams become spaghetti.
- **EdgeBundling** — hierarchical edge bundling; ring-placed nodes with links
  braided through per-group centroids and the hub.

`ArcDiagram`, `AdjacencyMatrix` and `EdgeBundling` all accept the **same**
`data={{ nodes?, links }}` shape as `NetworkGraph`, so you can swap the view
without reshaping your data:

```tsx
import { ArcDiagram, AdjacencyMatrix, EdgeBundling } from "@zenith-visuals/network";

const graph = {
  nodes: [
    { id: "app", label: "App", group: 0 },
    { id: "api", label: "API", group: 1 },
    { id: "db", label: "Database", group: 1 },
    { id: "cache", label: "Cache", group: 2 },
  ],
  links: [
    { source: "app", target: "api", value: 3 },
    { source: "api", target: "db", value: 2 },
    { source: "api", target: "cache", value: 1 },
  ],
};

<ArcDiagram data={graph} />;
<AdjacencyMatrix data={graph} />;
<EdgeBundling data={graph} />;
```

The pure helpers `computeForceLayout`, `normalizeGraph`, `orderByGroup`,
`adjacencyMatrix`, `bundle` and `catmullRomPath` are exported for headless/server
use and testing.

> Wrap component trees in `<ThemeProvider>` from `@zenith-visuals/core` to enable
> theming and dark mode.

## Documentation

See the [main README](https://github.com/arunkumarbrahmaniyaa/zenith-visuals#readme) for the full API, theming and more examples.

## License

MIT
