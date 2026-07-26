/**
 * Clamp a number between a minimum and maximum bound.
 */
export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * Linearly interpolate between `a` and `b` by factor `t` (0..1).
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Round a number to a fixed number of decimal places.
 */
export function round(value: number, precision = 0): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

const NUMBER_FORMATTERS = new Map<string, Intl.NumberFormat>();

/**
 * Format a number with locale-aware grouping and optional compact notation.
 * Formatters are memoized per locale/options signature.
 */
export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions & { locale?: string } = {},
): string {
  const { locale = "en-US", ...rest } = options;
  const key = locale + JSON.stringify(rest);
  let formatter = NUMBER_FORMATTERS.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, rest);
    NUMBER_FORMATTERS.set(key, formatter);
  }
  return formatter.format(value);
}

/**
 * Compact number formatting: 1200 -> "1.2K", 3_400_000 -> "3.4M".
 */
export function formatCompact(value: number, locale = "en-US"): string {
  return formatNumber(value, {
    locale,
    notation: "compact",
    maximumFractionDigits: 1,
  });
}
