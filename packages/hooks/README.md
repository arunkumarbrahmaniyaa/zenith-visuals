# @zenith-visuals/hooks

Reusable React hooks for building Zenith visualizations.

Part of [**Zenith Visuals**](https://github.com/zenith-visuals/zenith-visuals) — the ultimate React visualization SDK. TypeScript-first, tree-shakeable, SSR-safe and accessible.

## Install

```bash
npm install @zenith-visuals/hooks
```

> Requires `react` (>=18) as a peer dependency where applicable.

## Usage

```tsx
import {
  useResizeObserver,
  useZoomPan,
  useDebouncedValue,
} from "@zenith-visuals/hooks";

function Panel() {
  const { ref, dimensions } = useResizeObserver<HTMLDivElement>();
  const { transform, handlers, toMatrix } = useZoomPan();
  const width = useDebouncedValue(dimensions.width, 200);

  return (
    <div ref={ref} {...handlers} style={{ width: "100%", height: 400 }}>
      <svg width={width} height={dimensions.height}>
        <g transform={toMatrix()}>{/* zoom/pan content */}</g>
      </svg>
    </div>
  );
}
```

Also exports `useTooltip`, `useControllableState`, `useMediaQuery`,
`usePrefersDark`, `usePrefersReducedMotion` and `useIsomorphicLayoutEffect`.

## Documentation

See the [main README](https://github.com/zenith-visuals/zenith-visuals#readme) for the full API, theming and more examples.

## License

MIT
