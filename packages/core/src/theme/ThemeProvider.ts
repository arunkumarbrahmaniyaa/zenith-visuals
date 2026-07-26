import {
  createContext,
  createElement,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { ZenithTheme, ThemeOverride } from "./types";
import { lightTheme, darkTheme, mergeTheme } from "./defaultThemes";
import { usePrefersDark, usePrefersReducedMotion } from "../hooks/useMediaQuery";

const ThemeContext = createContext<ZenithTheme | null>(null);

export interface ThemeProviderProps {
  /**
   * The active theme. Provide a full theme, one of the built-ins, or omit and
   * use `mode` to auto-select light/dark.
   */
  theme?: ZenithTheme;
  /**
   * Color mode selection when `theme` is not supplied.
   * - "light" | "dark": force a built-in theme.
   * - "system" (default): follow prefers-color-scheme.
   */
  mode?: "light" | "dark" | "system";
  /** Deep-partial overrides applied on top of the resolved theme. */
  overrides?: ThemeOverride;
  children: ReactNode;
}

/**
 * Provides a ZenithTheme to all descendant visualizations. Honors the user's
 * OS color-scheme and reduced-motion preferences by default. SSR-safe.
 */
export function ThemeProvider({
  theme,
  mode = "system",
  overrides,
  children,
}: ThemeProviderProps) {
  const prefersDark = usePrefersDark();
  const prefersReducedMotion = usePrefersReducedMotion();

  const resolved = useMemo(() => {
    let base: ZenithTheme;
    if (theme) {
      base = theme;
    } else if (mode === "dark") {
      base = darkTheme;
    } else if (mode === "light") {
      base = lightTheme;
    } else {
      base = prefersDark ? darkTheme : lightTheme;
    }
    const merged = mergeTheme(base, overrides);
    if (prefersReducedMotion && !merged.motion.reducedMotion) {
      return { ...merged, motion: { ...merged.motion, reducedMotion: true } };
    }
    return merged;
  }, [theme, mode, overrides, prefersDark, prefersReducedMotion]);

  return createElement(ThemeContext.Provider, { value: resolved }, children);
}

/**
 * Read the active ZenithTheme. Falls back to the default light theme when used
 * outside a ThemeProvider, so components always render beautifully by default.
 */
export function useTheme(): ZenithTheme {
  return useContext(ThemeContext) ?? lightTheme;
}
