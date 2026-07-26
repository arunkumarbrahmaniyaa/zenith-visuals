import { lightTheme, darkTheme, mergeTheme, type ZenithTheme, type ThemeOverride } from "@zenith-visuals/core";

/**
 * Create a custom theme by extending a base theme (defaults to the light
 * theme) with deep-partial overrides. The result is a complete ZenithTheme.
 *
 * @example
 * const brand = createTheme({
 *   name: "brand",
 *   colors: { primary: "#ff5a1f" },
 *   palette: ["#ff5a1f", "#1f6fff", "#12b886"],
 * });
 */
export function createTheme(
  override: ThemeOverride,
  base: ZenithTheme = lightTheme,
): ZenithTheme {
  return mergeTheme(base, override);
}

/** Cool teal/indigo theme suited to analytics dashboards. */
export const oceanTheme: ZenithTheme = createTheme(
  {
    name: "zenith-ocean",
    colors: { primary: "#0891b2", secondary: "#6366f1", focusRing: "#0891b2" },
    palette: ["#0891b2", "#6366f1", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6"],
    sequential: ["#ecfeff", "#a5f3fc", "#22d3ee", "#0891b2", "#155e75"],
  },
  lightTheme,
);

/** Warm sunset theme for marketing and consumer surfaces. */
export const sunsetTheme: ZenithTheme = createTheme(
  {
    name: "zenith-sunset",
    colors: { primary: "#f97316", secondary: "#e11d48", focusRing: "#f97316" },
    palette: ["#f97316", "#e11d48", "#f59e0b", "#8b5cf6", "#0ea5e9", "#10b981"],
    sequential: ["#fff7ed", "#fed7aa", "#fb923c", "#ea580c", "#9a3412"],
  },
  lightTheme,
);

/** High-contrast dark theme tuned for AI/observability tooling. */
export const midnightTheme: ZenithTheme = createTheme(
  {
    name: "zenith-midnight",
    colors: {
      background: "#0b0f19",
      surface: "#111827",
      muted: "#111827",
      primary: "#22d3ee",
      secondary: "#a78bfa",
      focusRing: "#22d3ee",
    },
    palette: ["#22d3ee", "#a78bfa", "#34d399", "#fbbf24", "#f87171", "#60a5fa"],
    sequential: ["#111827", "#0e7490", "#0891b2", "#22d3ee", "#67e8f9"],
  },
  darkTheme,
);

export { lightTheme, darkTheme, mergeTheme } from "@zenith-visuals/core";
export type { ZenithTheme, ThemeOverride } from "@zenith-visuals/core";

/** Registry of all built-in themes keyed by name. */
export const themes = {
  [lightTheme.name]: lightTheme,
  [darkTheme.name]: darkTheme,
  [oceanTheme.name]: oceanTheme,
  [sunsetTheme.name]: sunsetTheme,
  [midnightTheme.name]: midnightTheme,
} as const;
