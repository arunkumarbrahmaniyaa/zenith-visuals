import { clamp } from "./number";

/**
 * A linear scale maps a numeric input domain to an output range.
 */
export interface LinearScale {
  (value: number): number;
  invert(value: number): number;
  domain: [number, number];
  range: [number, number];
}

/**
 * Create a linear scale. Values outside the domain are clamped when
 * `clampOutput` is enabled (default: false).
 */
export function linearScale(
  domain: [number, number],
  range: [number, number],
  clampOutput = false,
): LinearScale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const domainSpan = d1 - d0 || 1;
  const rangeSpan = r1 - r0;

  const scale = ((value: number) => {
    const t = (value - d0) / domainSpan;
    const output = r0 + t * rangeSpan;
    return clampOutput ? clamp(output, Math.min(r0, r1), Math.max(r0, r1)) : output;
  }) as LinearScale;

  scale.invert = (value: number) => d0 + ((value - r0) / (rangeSpan || 1)) * domainSpan;
  scale.domain = domain;
  scale.range = range;
  return scale;
}

/**
 * A band scale maps a discrete set of keys to evenly spaced positions,
 * mirroring d3's scaleBand with padding support.
 */
export interface BandScale<K> {
  (key: K): number;
  bandwidth: number;
  step: number;
  domain: readonly K[];
  range: [number, number];
}

export function bandScale<K>(
  domain: readonly K[],
  range: [number, number],
  padding = 0,
): BandScale<K> {
  const [r0, r1] = range;
  const n = domain.length || 1;
  const totalSpan = r1 - r0;
  const step = totalSpan / (n - padding * (n > 1 ? 1 : 0) || 1);
  const bandwidth = step * (1 - padding);
  const positions = new Map<K, number>();
  domain.forEach((key, i) => positions.set(key, r0 + i * step + (step - bandwidth) / 2));

  const scale = ((key: K) => positions.get(key) ?? r0) as BandScale<K>;
  scale.bandwidth = bandwidth;
  scale.step = step;
  scale.domain = domain;
  scale.range = range;
  return scale;
}

/**
 * Quantize a continuous domain into `n` discrete buckets, returning the
 * bucket index (0..n-1) for a given value. Useful for color thresholding.
 */
export function quantizeIndex(
  value: number,
  domain: [number, number],
  buckets: number,
): number {
  const [d0, d1] = domain;
  if (d1 <= d0) return 0;
  const t = clamp((value - d0) / (d1 - d0), 0, 1);
  return Math.min(buckets - 1, Math.floor(t * buckets));
}
