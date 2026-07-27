# @zenith-visuals/utils

Framework-agnostic utilities for Zenith Visuals: scales, color, math, date and array helpers.

Part of [**Zenith Visuals**](https://github.com/arunkumarbrahmaniyaa/zenith-visuals) — the ultimate React visualization SDK. TypeScript-first, tree-shakeable, SSR-safe and accessible.

## Install

```bash
npm install @zenith-visuals/utils
```

> Requires `react` (>=18) as a peer dependency where applicable.

## Usage

```ts
import {
  linearScale,
  sequentialScale,
  formatCompact,
  eachDayOfInterval,
} from "@zenith-visuals/utils";

// Map a data domain onto a pixel range.
const x = linearScale([0, 100], [0, 640]);
x(50); // → 320

// Interpolate a color ramp.
const shade = sequentialScale(["#eef2ff", "#6366f1", "#312e81"]);
shade(0.5); // → interpolated hex

formatCompact(12500); // → "12.5K"
eachDayOfInterval(new Date("2026-01-01"), new Date("2026-01-07")); // Date[]
```

Also includes `extent`, `sum`, `groupBy`, `uniqueBy`, `clamp`, `lerp`, `round`,
`bandScale`, `interpolateColor`, `readableTextColor`, `formatDate` and more —
all dependency-free and tree-shakeable.

## Documentation

See the [main README](https://github.com/arunkumarbrahmaniyaa/zenith-visuals#readme) for the full API, theming and more examples.

## License

MIT
