# @zenith-visuals/timeline

Activity timeline components for Zenith Visuals.

Part of [**Zenith Visuals**](https://github.com/zenith-visuals/zenith-visuals) — the ultimate React visualization SDK. TypeScript-first, tree-shakeable, SSR-safe and accessible.

## Install

```bash
npm install @zenith-visuals/timeline
```

> Requires `react` (>=18) as a peer dependency where applicable.

## Usage

```tsx
import { ActivityTimeline, type ActivityItem } from "@zenith-visuals/timeline";

const items: ActivityItem[] = [
  {
    id: "1",
    title: "Deployed v2.1.0",
    timestamp: "2026-07-26T10:00:00Z",
    status: "success",
    actor: { name: "Aria" },
  },
  {
    id: "2",
    title: "Opened pull request",
    description: "Refactor the layout engine",
    timestamp: "2026-07-26T09:12:00Z",
    status: "info",
  },
];

<ActivityTimeline
  data={items}
  groupByDay
  onItemClick={(item) => console.log(item.id)}
/>;
```

Supports `status` (`success`/`warning`/`danger`/`info`), `actor` avatars/initials,
nested `children`, custom `icon`, day grouping, infinite scroll (`hasMore` +
`onLoadMore`) and `renderItem` for full customization.

> Wrap component trees in `<ThemeProvider>` from `@zenith-visuals/core` to enable
> theming and dark mode.

## Documentation

See the [main README](https://github.com/zenith-visuals/zenith-visuals#readme) for the full API, theming and more examples.

## License

MIT
