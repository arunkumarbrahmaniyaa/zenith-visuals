# @zenith-visuals/core

Core theming, context, primitives and shared types for Zenith Visuals.

Part of [**Zenith Visuals**](https://github.com/arunkumarbrahmaniyaa/zenith-visuals) — the ultimate React visualization SDK. TypeScript-first, tree-shakeable, SSR-safe and accessible.

## Install

```bash
npm install @zenith-visuals/core
```

> Requires `react` (>=18) as a peer dependency where applicable.

## Usage

```tsx
import { ThemeProvider, useTheme } from "@zenith-visuals/core";

// 1. Wrap your app once. mode: "light" | "dark" | "system".
export function App() {
  return (
    <ThemeProvider mode="system">
      <Panel />
    </ThemeProvider>
  );
}

// 2. Read the resolved theme anywhere below the provider.
function Panel() {
  const theme = useTheme();
  return (
    <div style={{ background: theme.colors.surface, color: theme.colors.text }}>
      Hello Zenith
    </div>
  );
}
```

Building your own visualization? `VisualizationContainer` gives you a responsive,
SSR-safe, themed canvas with built-in loading/empty/error states, and `Tooltip`
renders themed, positioned tooltips.

## Documentation

See the [main README](https://github.com/arunkumarbrahmaniyaa/zenith-visuals#readme) for the full API, theming and more examples.

## License

MIT
