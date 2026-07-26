import type { ZenithTheme, ThemeOverride } from "./types";

const SYSTEM_FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"';
const MONO_FONT =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

const baseTypography = {
  fontFamily: SYSTEM_FONT,
  monoFamily: MONO_FONT,
  fontSize: 13,
  fontSizeSm: 11,
  fontSizeLg: 16,
  fontWeight: 400,
  fontWeightBold: 600,
};

const baseRadii = { sm: 3, md: 6, lg: 12, full: 9999 };

const baseMotion = { duration: 220, easing: "cubic-bezier(0.22, 1, 0.36, 1)", reducedMotion: false };

/** The default light theme. */
export const lightTheme: ZenithTheme = {
  name: "zenith-light",
  colorScheme: "light",
  colors: {
    background: "#ffffff",
    surface: "#ffffff",
    muted: "#ebedf0",
    primary: "#4f46e5",
    secondary: "#0ea5e9",
    text: "#111827",
    textMuted: "#6b7280",
    border: "#e5e7eb",
    focusRing: "#4f46e5",
    success: "#16a34a",
    warning: "#d97706",
    danger: "#dc2626",
    info: "#2563eb",
  },
  palette: [
    "#4f46e5",
    "#0ea5e9",
    "#16a34a",
    "#d97706",
    "#dc2626",
    "#9333ea",
    "#0891b2",
    "#ca8a04",
  ],
  sequential: ["#ebedf0", "#c6e48b", "#7bc96f", "#239a3b", "#196127"],
  typography: baseTypography,
  radii: baseRadii,
  spacing: (m: number) => m * 4,
  shadows: {
    sm: "0 1px 2px rgba(16, 24, 40, 0.06)",
    md: "0 4px 12px rgba(16, 24, 40, 0.10)",
    lg: "0 12px 32px rgba(16, 24, 40, 0.16)",
  },
  motion: baseMotion,
};

/** The default dark theme. */
export const darkTheme: ZenithTheme = {
  name: "zenith-dark",
  colorScheme: "dark",
  colors: {
    background: "#0d1117",
    surface: "#161b22",
    muted: "#161b22",
    primary: "#818cf8",
    secondary: "#38bdf8",
    text: "#e6edf3",
    textMuted: "#8b949e",
    border: "#30363d",
    focusRing: "#818cf8",
    success: "#3fb950",
    warning: "#d29922",
    danger: "#f85149",
    info: "#58a6ff",
  },
  palette: [
    "#818cf8",
    "#38bdf8",
    "#3fb950",
    "#d29922",
    "#f85149",
    "#c084fc",
    "#22d3ee",
    "#facc15",
  ],
  sequential: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
  typography: baseTypography,
  radii: baseRadii,
  spacing: (m: number) => m * 4,
  shadows: {
    sm: "0 1px 2px rgba(1, 4, 9, 0.5)",
    md: "0 4px 12px rgba(1, 4, 9, 0.6)",
    lg: "0 12px 32px rgba(1, 4, 9, 0.7)",
  },
  motion: baseMotion,
};

/**
 * Shallow-merge nested theme sections onto a base theme. Only the provided
 * keys are overridden; everything else is inherited.
 */
export function mergeTheme(base: ZenithTheme, override?: ThemeOverride): ZenithTheme {
  if (!override) return base;
  return {
    ...base,
    ...override,
    colors: { ...base.colors, ...override.colors },
    typography: { ...base.typography, ...override.typography },
    radii: { ...base.radii, ...override.radii },
    shadows: { ...base.shadows, ...override.shadows },
    motion: { ...base.motion, ...override.motion },
    palette: override.palette ?? base.palette,
    sequential: override.sequential ?? base.sequential,
    spacing: override.spacing ?? base.spacing,
  };
}
