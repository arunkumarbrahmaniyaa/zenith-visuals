# @zenith-visuals/maps

Lightweight geo-visualization components for Zenith Visuals.

Part of [**Zenith Visuals**](https://github.com/zenith-visuals/zenith-visuals) — the ultimate React visualization SDK. TypeScript-first, tree-shakeable, SSR-safe and accessible.

## Install

```bash
npm install @zenith-visuals/maps
```

> Requires `react` (>=18) as a peer dependency where applicable.

## Usage

```tsx
import { GeoScatter, type GeoPoint } from "@zenith-visuals/maps";

const cities: GeoPoint[] = [
  { lat: 40.71, lon: -74.0, value: 120, label: "New York" },
  { lat: 51.51, lon: -0.13, value: 90, label: "London" },
  { lat: 35.68, lon: 139.69, value: 150, label: "Tokyo" },
];

<GeoScatter data={cities} projection="mercator" showGraticule />;
```

Marker size and color encode `value`. Choose `projection` (`"mercator"` or
`"equirectangular"`); no GeoJSON required. The projection helpers
`projectMercator`, `projectEquirectangular` and `getProjection` are exported.

> Wrap component trees in `<ThemeProvider>` from `@zenith-visuals/core` to enable
> theming and dark mode.

## Documentation

See the [main README](https://github.com/zenith-visuals/zenith-visuals#readme) for the full API, theming and more examples.

## License

MIT
