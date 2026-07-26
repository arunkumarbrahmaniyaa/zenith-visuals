# @zenith-visuals/flow

Sankey and flow diagram components for Zenith Visuals.

Part of [**Zenith Visuals**](https://github.com/zenith-visuals/zenith-visuals) — the ultimate React visualization SDK. TypeScript-first, tree-shakeable, SSR-safe and accessible.

## Install

```bash
npm install @zenith-visuals/flow
```

> Requires `react` (>=18) as a peer dependency where applicable.

## Usage

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

> Wrap component trees in `<ThemeProvider>` from `@zenith-visuals/core` to enable
> theming and dark mode.

## Documentation

See the [main README](https://github.com/zenith-visuals/zenith-visuals#readme) for the full API, theming and more examples.

## License

MIT
