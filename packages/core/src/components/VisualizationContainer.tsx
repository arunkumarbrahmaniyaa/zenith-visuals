import {
  forwardRef,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { ZenithTheme } from "../theme/types";
import type { BaseVisualizationProps } from "../types";
import { useResolvedTheme, StateOverlay } from "./StateOverlay";
import { useResizeObserver } from "../hooks/useResizeObserver";

export interface VisualizationContainerProps
  extends Omit<BaseVisualizationProps, "renderEmpty" | "renderLoading" | "renderError"> {
  /** True when there is no data to render. */
  isEmpty?: boolean;
  /**
   * Render function receiving the resolved theme and measured dimensions.
   * Called only when the component is in the "ready" state.
   */
  children: (ctx: { theme: ZenithTheme; width: number; height: number }) => ReactNode;
  /** Default height applied when neither `height` nor a container height exist. */
  defaultHeight?: number;
  renderEmpty?: () => ReactNode;
  renderLoading?: () => ReactNode;
  renderError?: (error: Error) => ReactNode;
}

/**
 * The shared shell for every visualization. It handles:
 * - responsive sizing via ResizeObserver (SSR-safe),
 * - resolved theming (ambient + per-instance override),
 * - loading / error / empty states with accessible live regions,
 * - a labelled ARIA region and RTL direction.
 *
 * Components pass a render function that receives the resolved theme and the
 * measured (or explicit) dimensions.
 */
export const VisualizationContainer = forwardRef<HTMLDivElement, VisualizationContainerProps>(
  function VisualizationContainer(props, forwardedRef) {
    const {
      width,
      height,
      theme: themeOverride,
      loading = false,
      error,
      isEmpty = false,
      dir = "ltr",
      labels,
      className,
      style,
      defaultHeight = 240,
      children,
      renderEmpty,
      renderLoading,
      renderError,
    } = props;

    const theme = useResolvedTheme(themeOverride);
    const { ref: measureRef, dimensions } = useResizeObserver<HTMLDivElement>();

    const resolvedWidth = width ?? dimensions.width;
    const resolvedHeight = height ?? (dimensions.height || defaultHeight);

    const rootStyle: CSSProperties = useMemo(
      () => ({
        position: "relative",
        width: width ?? "100%",
        height: height ?? undefined,
        background: theme.colors.background,
        color: theme.colors.text,
        fontFamily: theme.typography.fontFamily,
        borderRadius: theme.radii.lg,
        boxSizing: "border-box",
        direction: dir,
        ...style,
      }),
      [width, height, theme, dir, style],
    );

    const normalizedError = error
      ? error instanceof Error
        ? error
        : new Error(String(error))
      : null;

    let content: ReactNode;
    if (loading) {
      content =
        renderLoading?.() ??
        <StateOverlay theme={theme} variant="loading" message={labels?.loading ?? "Loading…"} />;
    } else if (normalizedError) {
      content =
        renderError?.(normalizedError) ??
        <StateOverlay theme={theme} variant="error" message={labels?.error ?? normalizedError.message} />;
    } else if (isEmpty) {
      content =
        renderEmpty?.() ??
        <StateOverlay theme={theme} variant="empty" message={labels?.empty ?? "No data to display"} />;
    } else {
      content = children({ theme, width: resolvedWidth, height: resolvedHeight });
    }

    const setRefs = (node: HTMLDivElement | null) => {
      measureRef(node);
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    };

    return (
      <div
        ref={setRefs}
        className={className}
        style={rootStyle}
        role="figure"
        aria-label={labels?.ariaLabel}
        aria-busy={loading || undefined}
      >
        {content}
      </div>
    );
  },
);
