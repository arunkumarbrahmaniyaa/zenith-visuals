// Theme
export type {
  ZenithTheme,
  ZenithColors,
  ZenithTypography,
  ZenithRadii,
  ZenithShadows,
  ZenithMotion,
  ThemeOverride,
} from "./theme/types";
export { lightTheme, darkTheme, mergeTheme } from "./theme/defaultThemes";
export { ThemeProvider, useTheme, type ThemeProviderProps } from "./theme/ThemeProvider";

// Shared types
export type {
  BaseVisualizationProps,
  VisualizationStatus,
  ZenithLabels,
  NumberAccessor,
  StringAccessor,
  ResolvedThemeContext,
} from "./types";

// Primitives
export {
  VisualizationContainer,
  type VisualizationContainerProps,
} from "./components/VisualizationContainer";
export { StateOverlay, useResolvedTheme, type StateOverlayProps } from "./components/StateOverlay";
export { Tooltip, type TooltipProps } from "./components/Tooltip";

// Hooks
export { useIsomorphicLayoutEffect } from "./hooks/useIsomorphicLayoutEffect";
export { useMediaQuery, usePrefersDark, usePrefersReducedMotion } from "./hooks/useMediaQuery";
export { useResizeObserver, type Dimensions } from "./hooks/useResizeObserver";
export { useControllableState } from "./hooks/useControllableState";
export { useTooltip, type TooltipState } from "./hooks/useTooltip";
