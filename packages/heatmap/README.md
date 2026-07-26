# @zenith-visuals/heatmap

Calendar and matrix heatmap components for Zenith Visuals.

Part of [**Zenith Visuals**](https://github.com/zenith-visuals/zenith-visuals) — the ultimate React visualization SDK. TypeScript-first, tree-shakeable, SSR-safe and accessible.

## Install

```bash
npm install @zenith-visuals/heatmap
```

> Requires `react` (>=18) as a peer dependency where applicable.

## Usage

```tsx
import { ThemeProvider } from "@zenith-visuals/core";
import { CalendarHeatmap } from "@zenith-visuals/heatmap";

const data = [
  { date: "2026-01-01", value: 3 },
  { date: "2026-01-02", value: 8 },
];

<ThemeProvider mode="system">
  <CalendarHeatmap
    data={data}
    rangeDays={365}
    weekStartsOn={1}
    showLegend
    onCellClick={(cell) => console.log(cell.date, cell.value)}
  />
</ThemeProvider>;
```

Key props: `data`, `startDate`/`endDate`/`rangeDays`, `weekStartsOn`, `cellSize`,
`colors`, `showLegend`, `showMonthLabels`, `renderTooltip`, `onCellClick`. Fully
keyboard navigable (arrow keys, Home/End, Enter/Space).

> Wrap component trees in `<ThemeProvider>` from `@zenith-visuals/core` to enable
> theming and dark mode.

## Documentation

See the [main README](https://github.com/zenith-visuals/zenith-visuals#readme) for the full API, theming and more examples.

## License

MIT
