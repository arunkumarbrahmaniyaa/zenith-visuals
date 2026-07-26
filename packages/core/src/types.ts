import type { CSSProperties, ReactNode } from "react";
import type { ThemeOverride, ZenithTheme } from "./theme/types";

/**
 * Standard state descriptors shared by every Zenith visualization.
 */
export type VisualizationStatus = "idle" | "loading" | "error" | "empty" | "ready";

/**
 * Localization strings surfaced in UI states. All optional with sensible
 * English defaults, enabling full i18n.
 */
export interface ZenithLabels {
  loading?: string;
  empty?: string;
  error?: string;
  /** aria-label applied to the root region for screen readers. */
  ariaLabel?: string;
}

/**
 * Props shared by all top-level visualization components. Individual
 * components extend this with their own `data` and feature props.
 */
export interface BaseVisualizationProps {
  /** Explicit width in px. Omit to size responsively to the container. */
  width?: number;
  /** Explicit height in px. Omit to use the component's default aspect. */
  height?: number;
  /** Per-instance theme override merged on top of the ambient theme. */
  theme?: ThemeOverride;
  /** Force a loading state (e.g. while data is fetching). */
  loading?: boolean;
  /** Force an error state; a string is shown as the error message. */
  error?: string | Error | null;
  /** Text direction for RTL support. */
  dir?: "ltr" | "rtl";
  /** Localized UI strings. */
  labels?: ZenithLabels;
  /** Additional class name applied to the root element. */
  className?: string;
  /** Inline styles applied to the root element. */
  style?: CSSProperties;
  /** Optional custom render for the empty state. */
  renderEmpty?: () => ReactNode;
  /** Optional custom render for the loading state. */
  renderLoading?: () => ReactNode;
  /** Optional custom render for the error state. */
  renderError?: (error: Error) => ReactNode;
}

/** A generic accessor that reads a numeric value from a datum. */
export type NumberAccessor<T> = (datum: T) => number;

/** A generic accessor that reads a string value from a datum. */
export type StringAccessor<T> = (datum: T) => string;

/** The resolved theme plus a per-instance override, ready for rendering. */
export interface ResolvedThemeContext {
  theme: ZenithTheme;
}
