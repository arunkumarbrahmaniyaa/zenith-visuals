/** Round a number to a "nice" value (1, 2, 5 × 10ⁿ). */
function niceNum(range: number, round: boolean): number {
  const exponent = Math.floor(Math.log10(range || 1));
  const fraction = range / 10 ** exponent;
  let nice: number;
  if (round) {
    nice = fraction < 1.5 ? 1 : fraction < 3 ? 2 : fraction < 7 ? 5 : 10;
  } else {
    nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  }
  return nice * 10 ** exponent;
}

export interface NiceScale {
  /** Evenly spaced, human-friendly tick values covering [niceMin, niceMax]. */
  ticks: number[];
  niceMin: number;
  niceMax: number;
  step: number;
}

/**
 * Compute human-friendly axis ticks for a numeric domain — the classic
 * "nice numbers" algorithm used by axis renderers. Always includes 0 in the
 * domain when `includeZero` is true (default), which is correct for bar/area.
 */
export function niceTicks(
  min: number,
  max: number,
  count = 5,
  includeZero = true,
): NiceScale {
  let lo = includeZero ? Math.min(0, min) : min;
  let hi = includeZero ? Math.max(0, max) : max;
  if (lo === hi) {
    hi = lo + 1;
  }
  const range = niceNum(hi - lo, false);
  const step = niceNum(range / Math.max(1, count - 1), true);
  const niceMin = Math.floor(lo / step) * step;
  const niceMax = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step / 2; v += step) {
    ticks.push(Number(v.toFixed(10)));
  }
  return { ticks, niceMin, niceMax, step };
}

/** Default numeric formatter: compact for large numbers, trimmed decimals. */
export function defaultFormat(value: number): string {
  if (!Number.isFinite(value)) return "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))}M`;
  if (abs >= 1_000) return `${Number((value / 1_000).toFixed(1))}K`;
  return `${Number(value.toFixed(2))}`;
}
