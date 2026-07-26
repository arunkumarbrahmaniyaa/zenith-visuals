// Re-export the shared hooks from core for a single import surface.
export {
  useIsomorphicLayoutEffect,
  useMediaQuery,
  usePrefersDark,
  usePrefersReducedMotion,
  useResizeObserver,
  useControllableState,
  useTooltip,
  type Dimensions,
  type TooltipState,
} from "@zenith-visuals/core";

export { useDebouncedValue } from "./useDebouncedValue";
export { useZoomPan, type Transform, type UseZoomPanOptions } from "./useZoomPan";
