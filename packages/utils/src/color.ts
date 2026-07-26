import { clamp } from "./number";

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Parse a #rgb or #rrggbb hex string into an RGB object.
 */
export function hexToRgb(hex: string): RGB {
  let normalized = hex.replace("#", "").trim();
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const int = parseInt(normalized, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

/**
 * Convert an RGB object back into a hex string.
 */
export function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Interpolate between two hex colors by factor `t` (0..1) in sRGB space.
 */
export function interpolateColor(from: string, to: string, t: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const clamped = clamp(t, 0, 1);
  return rgbToHex({
    r: a.r + (b.r - a.r) * clamped,
    g: a.g + (b.g - a.g) * clamped,
    b: a.b + (b.b - a.b) * clamped,
  });
}

/**
 * Build a sequential color interpolator across a list of stop colors.
 * Passing t in [0, 1] returns the blended color at that position.
 */
export function sequentialScale(colors: readonly string[]): (t: number) => string {
  if (colors.length === 0) return () => "#000000";
  if (colors.length === 1) return () => colors[0]!;
  const segments = colors.length - 1;
  return (t: number) => {
    const clamped = clamp(t, 0, 1);
    const scaled = clamped * segments;
    const index = Math.min(segments - 1, Math.floor(scaled));
    return interpolateColor(colors[index]!, colors[index + 1]!, scaled - index);
  };
}

/**
 * Relative luminance (WCAG) of a hex color, 0 (black) .. 1 (white).
 */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * Pick a readable foreground (black/white) for a given background color.
 */
export function readableTextColor(background: string, dark = "#111827", light = "#ffffff"): string {
  return luminance(background) > 0.45 ? dark : light;
}
