# @zenith-visuals/themes

Prebuilt themes and a createTheme builder for Zenith Visuals.

Part of [**Zenith Visuals**](https://github.com/zenith-visuals/zenith-visuals) — the ultimate React visualization SDK. TypeScript-first, tree-shakeable, SSR-safe and accessible.

## Install

```bash
npm install @zenith-visuals/themes
```

> Requires `react` (>=18) as a peer dependency where applicable.

## Usage

```tsx
import { ThemeProvider } from "@zenith-visuals/core";
import { createTheme, oceanTheme } from "@zenith-visuals/themes";

// Use a built-in theme…
<ThemeProvider theme={oceanTheme}>{/* … */}</ThemeProvider>;

// …or build your own brand theme by extending a base.
const brand = createTheme({
  name: "brand",
  colors: { primary: "#ff5a1f" },
  palette: ["#ff5a1f", "#1f6fff", "#12b886"],
});

<ThemeProvider theme={brand}>{/* … */}</ThemeProvider>;
```

Built-in themes: `oceanTheme`, `sunsetTheme`, `midnightTheme` (plus `lightTheme`
and `darkTheme` re-exported from `@zenith-visuals/core`).

## Documentation

See the [main README](https://github.com/zenith-visuals/zenith-visuals#readme) for the full API, theming and more examples.

## License

MIT
