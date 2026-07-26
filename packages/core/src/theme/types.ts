/**
 * The Zenith theme contract. Every component reads exclusively from this
 * object, which makes the library themeable, dark-mode aware, and free of
 * global styles. Themes are plain serializable objects.
 */
export interface ZenithTheme {
  /** Unique theme name, e.g. "zenith-light". */
  name: string;
  /** Color scheme hint used for prefers-color-scheme and contrast decisions. */
  colorScheme: "light" | "dark";
  colors: ZenithColors;
  /** Ordered categorical palette for series/segments. */
  palette: string[];
  /** Sequential ramp used by heatmaps and density visuals (low -> high). */
  sequential: string[];
  typography: ZenithTypography;
  radii: ZenithRadii;
  spacing: (multiplier: number) => number;
  shadows: ZenithShadows;
  motion: ZenithMotion;
}

export interface ZenithColors {
  /** Component background surface. */
  background: string;
  /** Elevated surface (cards, tooltips, popovers). */
  surface: string;
  /** Subtle surface used for tracks, empty cells, skeletons. */
  muted: string;
  /** Primary accent color. */
  primary: string;
  /** Secondary accent color. */
  secondary: string;
  /** Primary text color. */
  text: string;
  /** Secondary / muted text color. */
  textMuted: string;
  /** Hairline borders and gridlines. */
  border: string;
  /** Focus ring color (accessibility). */
  focusRing: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

export interface ZenithTypography {
  fontFamily: string;
  monoFamily: string;
  fontSize: number;
  fontSizeSm: number;
  fontSizeLg: number;
  fontWeight: number;
  fontWeightBold: number;
}

export interface ZenithRadii {
  sm: number;
  md: number;
  lg: number;
  full: number;
}

export interface ZenithShadows {
  sm: string;
  md: string;
  lg: string;
}

export interface ZenithMotion {
  /** Base animation duration in ms. */
  duration: number;
  /** CSS easing curve. */
  easing: string;
  /** When true, components must disable non-essential animation. */
  reducedMotion: boolean;
}

/**
 * A deep-partial override applied on top of a base theme via `mergeTheme`.
 * Object sections are shallow-partial; arrays and the spacing function are
 * replaced wholesale when provided.
 */
export interface ThemeOverride {
  name?: string;
  colorScheme?: "light" | "dark";
  colors?: Partial<ZenithColors>;
  palette?: string[];
  sequential?: string[];
  typography?: Partial<ZenithTypography>;
  radii?: Partial<ZenithRadii>;
  spacing?: (multiplier: number) => number;
  shadows?: Partial<ZenithShadows>;
  motion?: Partial<ZenithMotion>;
}
