# @zenith-visuals/gantt

Modern project planning Gantt chart for Zenith Visuals.

Part of [**Zenith Visuals**](https://github.com/arunkumarbrahmaniyaa/zenith-visuals) — the ultimate React visualization SDK. TypeScript-first, tree-shakeable, SSR-safe and accessible.

## Install

```bash
npm install @zenith-visuals/gantt
```

> Requires `react` (>=18) as a peer dependency where applicable.

## Usage

```tsx
import { Gantt, type GanttTask } from "@zenith-visuals/gantt";

const tasks: GanttTask[] = [
  { id: "1", name: "Design", start: "2026-01-01", end: "2026-01-10", group: "Phase 1", progress: 1 },
  { id: "2", name: "Build", start: "2026-01-08", end: "2026-01-24", group: "Phase 1", progress: 0.4 },
  { id: "3", name: "Launch", start: "2026-01-25", end: "2026-01-25", milestone: true },
];

<Gantt data={tasks} onTaskClick={(task) => console.log(task.name)} />;
```

Tasks with the same `group` share a swimlane. Set `milestone: true` for a
zero-width diamond, and `progress` (0..1) to render a completion overlay.

> Wrap component trees in `<ThemeProvider>` from `@zenith-visuals/core` to enable
> theming and dark mode.

## Documentation

See the [main README](https://github.com/arunkumarbrahmaniyaa/zenith-visuals#readme) for the full API, theming and more examples.

## License

MIT
