# @zenith-visuals/orgchart

Enterprise org chart component for Zenith Visuals.

Part of [**Zenith Visuals**](https://github.com/zenith-visuals/zenith-visuals) — the ultimate React visualization SDK. TypeScript-first, tree-shakeable, SSR-safe and accessible.

## Install

```bash
npm install @zenith-visuals/orgchart
```

> Requires `react` (>=18) as a peer dependency where applicable.

## Usage

```tsx
import { OrgChart, type OrgNode } from "@zenith-visuals/orgchart";

const tree: OrgNode = {
  id: "1",
  name: "Jordan Lee",
  title: "CEO",
  children: [
    { id: "2", name: "Sam Rivera", title: "CTO" },
    { id: "3", name: "Nia Chen", title: "VP Design" },
  ],
};

<OrgChart
  data={tree}
  collapsible
  onNodeClick={(node) => console.log(node.name)}
/>;
```

Click a node to collapse/expand its subtree. Pass `renderCard` to fully customize
node rendering, or use the default card (avatar/initials + name + title).

> Wrap component trees in `<ThemeProvider>` from `@zenith-visuals/core` to enable
> theming and dark mode.

## Documentation

See the [main README](https://github.com/zenith-visuals/zenith-visuals#readme) for the full API, theming and more examples.

## License

MIT
