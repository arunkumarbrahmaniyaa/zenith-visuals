# @zenith-visuals/finance

Financial & time-series charts for **Zenith Visuals** — candlesticks, OHLC bars,
Kagi, Renko and horizon charts. Built on the same pure layout engine, theming,
tooltip and accessibility primitives as the rest of the SDK, and reusing
`@zenith-visuals/charts` for the cartesian axes and scales.

Includes: **CandlestickChart, OHLCChart, KagiChart, RenkoChart, HorizonChart**
— plus dependency-free transform helpers (`computeKagi`, `computeRenko`,
`priceExtent`).

## Install

```bash
pnpm add @zenith-visuals/finance @zenith-visuals/charts @zenith-visuals/core react react-dom
```

## Data shape

Every chart takes an ordered array of `OHLCDatum` (oldest → newest):

```ts
const data = [
  { label: "2024-01-02", open: 132.1, high: 135.4, low: 131.0, close: 134.8 },
  { label: "2024-01-03", open: 134.8, high: 136.2, low: 133.1, close: 133.4 },
  // …
];
```

## Usage

### Candlestick & OHLC

```tsx
import { CandlestickChart, OHLCChart } from "@zenith-visuals/finance";

<CandlestickChart data={data} />
<OHLCChart data={data} />
```

### Kagi

```tsx
import { KagiChart } from "@zenith-visuals/finance";

// reversal ≤ 1 is a fraction of mean price (4%); > 1 is an absolute amount.
<KagiChart data={data} reversal={0.04} />
```

### Renko

```tsx
import { RenkoChart } from "@zenith-visuals/finance";

// boxSize ≤ 1 is a fraction of mean price (2%); > 1 is an absolute amount.
<RenkoChart data={data} boxSize={0.02} />
```

### Horizon

```tsx
import { HorizonChart } from "@zenith-visuals/finance";

<HorizonChart data={data} bands={3} height={140} />
```

## Transform helpers

The math powering the charts is exported for reuse:

```ts
import { computeKagi, computeRenko } from "@zenith-visuals/finance";

const bricks = computeRenko(closes, 2);      // fixed-size price bricks
const kagi = computeKagi(closes, 1.5);       // reversal-based line vertices
```

## Accessibility

Every chart renders an SVG with `role="img"` and an `aria-label` (customizable
via `labels.ariaLabel`), per-element `<title>` tooltips, and honors
`prefers-reduced-motion`.

## License

MIT
