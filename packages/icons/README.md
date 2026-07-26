# @zenith-visuals/icons

Lightweight, tree-shakeable SVG icon components for Zenith Visuals.

Part of [**Zenith Visuals**](https://github.com/zenith-visuals/zenith-visuals) — the ultimate React visualization SDK. TypeScript-first, tree-shakeable, SSR-safe and accessible.

## Install

```bash
npm install @zenith-visuals/icons
```

> Requires `react` (>=18) as a peer dependency where applicable.

## Usage

```tsx
import { Search, ChevronRight, createIcon } from "@zenith-visuals/icons";

// Icons inherit color via `currentColor` and accept a `size` prop.
<Search size={20} color="#6366f1" />;
<ChevronRight />;

// Create your own icon from raw SVG inner markup:
const Star = createIcon(
  "Star",
  '<path d="M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z" />',
);
<Star size={24} />;
```

Includes ~20 ready-made icons (chevrons, `Plus`, `Minus`, `Close`, `Check`,
`Search`, `ZoomIn`/`ZoomOut`, `Download`, `Calendar`, `User`, `GitBranch`,
`Bolt`, `AlertTriangle`, and more) — each tree-shakeable and `forwardRef`-ready.

## Documentation

See the [main README](https://github.com/zenith-visuals/zenith-visuals#readme) for the full API, theming and more examples.

## License

MIT
