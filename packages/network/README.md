# @zenith-visuals/network

Network, dependency and force graph components for Zenith Visuals.

Part of [**Zenith Visuals**](https://github.com/zenith-visuals/zenith-visuals) — the ultimate React visualization SDK. TypeScript-first, tree-shakeable, SSR-safe and accessible.

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

> Wrap component trees in `<ThemeProvider>` from `@zenith-visuals/core` to enable
> theming and dark mode.

## Documentation

See the [main README](https://github.com/zenith-visuals/zenith-visuals#readme) for the full API, theming and more examples.

## License

MIT
