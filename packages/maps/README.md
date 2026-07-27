# @zenith-visuals/maps

Lightweight, dependency-free geo-visualization components for Zenith Visuals —
**GeoScatter, Choropleth, ConnectionMap, BubbleMap, GeoHeatmap, Cartogram,
HexbinMap and TileGridMap**. No tile server or GeoJSON loader required.

Part of [**Zenith Visuals**](https://github.com/arunkumarbrahmaniyaa/zenith-visuals) — the ultimate React visualization SDK. TypeScript-first, tree-shakeable, SSR-safe and accessible.

## Install

```bash
npm install @zenith-visuals/maps
```

> Requires `react` (>=18) as a peer dependency where applicable.

## Usage

### GeoScatter

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

### Choropleth

```tsx
import { Choropleth } from "@zenith-visuals/maps";

<Choropleth
  regions={[
    { id: "a", label: "Region A", value: 42, rings: [[{ lat, lon }, /* … */]] },
  ]}
/>;
```

Fills your own lon/lat polygon rings by value using the theme's sequential ramp,
with an auto-fit transform and a color legend.

### ConnectionMap

```tsx
import { ConnectionMap } from "@zenith-visuals/maps";

<ConnectionMap
  points={cities.map((c, i) => ({ ...c, id: String(i) }))}
  connections={[{ source: "0", target: "1", value: 8 }]}
/>;
```

Draws curved arcs between geographic points; arc width encodes `value`.

### More maps

- **`BubbleMap`** — proportional-symbol map; circles anchored to coordinates and
  sized by value with perceptual area (√) scaling, fitted to the data bounds.
- **`GeoHeatmap`** — Gaussian kernel-density raster over projected points
  (`densityGrid` helper), colored by the sequential ramp.
- **`Cartogram`** — non-contiguous cartogram; each region polygon is scaled about
  its centroid so its area ∝ value (`polygonCentroid` / `scaleRingAround`).
- **`HexbinMap`** — aggregates projected points into a hexagonal lattice
  (`hexbin` / `hexagonPath`), colored by count or summed value.
- **`TileGridMap`** — grid cartogram; every region is an equal-size square placed
  on a fixed row/column lattice (`tileGridExtent`), colored by value.

```tsx
import { BubbleMap, GeoHeatmap, Cartogram, HexbinMap, TileGridMap } from "@zenith-visuals/maps";

<BubbleMap data={[{ lat: 35.68, lon: 139.69, value: 37_400_000, label: "Tokyo" }]} />;
<HexbinMap data={cities} radius={18} />;
<TileGridMap data={[{ id: "CA", row: 2, col: 0, value: 39 }]} />;
```

Shared pure helpers (`computeFit`, `hexbin`, `hexagonPath`, `densityGrid`,
`polygonCentroid`, `scaleRingAround`, `tileGridExtent`, `boundsOf`) are exported.

> Wrap component trees in `<ThemeProvider>` from `@zenith-visuals/core` to enable
> theming and dark mode.

## Documentation

See the [main README](https://github.com/arunkumarbrahmaniyaa/zenith-visuals#readme) for the full API, theming and more examples.

## License

MIT
