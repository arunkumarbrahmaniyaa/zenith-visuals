# @zenith-visuals/timeline

Activity timeline components for Zenith Visuals.

Part of [**Zenith Visuals**](https://github.com/arunkumarbrahmaniyaa/zenith-visuals) — the ultimate React visualization SDK. TypeScript-first, tree-shakeable, SSR-safe and accessible.

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

## Schedule components

This package also ships SVG time-schedule charts built on a shared pure time
library (`niceTimeTicks` axis ticks + `packLanes` interval packing):

- **`ResourceTimeline`** — one row per resource, with allocations laid out along
  a time axis and overlapping tasks stacked into sub-lanes (`computeResourceTimeline`).
- **`Swimlane`** — events grouped into horizontal lane bands; spanning events
  render as pills, point events as milestone diamonds (`computeSwimlane`).
- **`EventDrops`** — categorical event streams as rows of dots along a time
  axis, with drop size scaled by optional magnitude (`computeEventDrops`).

```tsx
import { ResourceTimeline, Swimlane, EventDrops } from "@zenith-visuals/timeline";

<ResourceTimeline data={[{ id: "1", resource: "Alice", start: "2026-01-01", end: "2026-01-05" }]} />;
<Swimlane data={[{ id: "1", lane: "Build", start: "2026-01-01", end: "2026-01-04" }]} />;
<EventDrops data={[{ label: "Deploys", events: [{ time: "2026-01-01" }] }]} />;
```

> Wrap component trees in `<ThemeProvider>` from `@zenith-visuals/core` to enable
> theming and dark mode.

## Documentation

See the [main README](https://github.com/arunkumarbrahmaniyaa/zenith-visuals#readme) for the full API, theming and more examples.

## License

MIT
