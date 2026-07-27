import type { OHLCDatum } from "../types";

/** Min/max price across all OHLC bars (uses low/high). */
export function priceExtent(data: readonly OHLCDatum[]): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const d of data) {
    if (d.low < min) min = d.low;
    if (d.high > max) max = d.high;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  return [min, max];
}

/** A single vertex of a Kagi line. `x` is the column index (not time). */
export interface KagiVertex {
  x: number;
  y: number;
  /** Whether the segment ending at this vertex is a thick "yang" line. */
  thick: boolean;
}

/**
 * Build a Kagi line from a close-price series. The line only changes direction
 * (adding a new column) once price reverses by at least `reversal` (absolute
 * price units). Thickness flips to thick when price rises above the prior
 * shoulder and thin when it falls below the prior waist. Pure & deterministic.
 */
export function computeKagi(closes: readonly number[], reversal: number): KagiVertex[] {
  if (closes.length === 0 || reversal <= 0) return [];
  const first = closes[0]!;
  const verts: { x: number; y: number }[] = [{ x: 0, y: first }];
  let dir = 0;
  let tip = first;
  let x = 0;

  for (let i = 1; i < closes.length; i++) {
    const p = closes[i]!;
    if (dir === 0) {
      if (p >= tip + reversal) {
        dir = 1;
        x++;
        verts.push({ x, y: p });
        tip = p;
      } else if (p <= tip - reversal) {
        dir = -1;
        x++;
        verts.push({ x, y: p });
        tip = p;
      }
    } else if (dir === 1) {
      if (p > tip) {
        tip = p;
        verts[verts.length - 1]!.y = p;
      } else if (p <= tip - reversal) {
        dir = -1;
        x++;
        verts.push({ x, y: p });
        tip = p;
      }
    } else {
      if (p < tip) {
        tip = p;
        verts[verts.length - 1]!.y = p;
      } else if (p >= tip + reversal) {
        dir = 1;
        x++;
        verts.push({ x, y: p });
        tip = p;
      }
    }
  }

  // Determine yang/yin thickness per segment via shoulders (peaks) & waists (troughs).
  const out: KagiVertex[] = [{ x: verts[0]!.x, y: verts[0]!.y, thick: false }];
  let shoulder = verts[0]!.y;
  let waist = verts[0]!.y;
  let thick = false;
  for (let i = 1; i < verts.length; i++) {
    const prev = verts[i - 1]!;
    const cur = verts[i]!;
    const up = cur.y > prev.y;
    if (up && cur.y > shoulder) thick = true;
    if (!up && cur.y < waist) thick = false;
    // The previous vertex was a turning point: record shoulder/waist.
    if (up) waist = Math.min(waist, prev.y);
    else shoulder = Math.max(shoulder, prev.y);
    if (up) shoulder = Math.max(shoulder, cur.y);
    else waist = Math.min(waist, cur.y);
    out.push({ x: cur.x, y: cur.y, thick });
  }
  return out;
}

/** A single Renko brick. `x` is the column index (not time). */
export interface RenkoBrick {
  x: number;
  low: number;
  high: number;
  /** +1 for an up (bullish) brick, -1 for a down (bearish) brick. */
  dir: 1 | -1;
}

/**
 * Build Renko bricks from a close-price series. A new brick is added only once
 * price moves a full `box` in either direction; time is ignored. Pure.
 */
export function computeRenko(closes: readonly number[], box: number): RenkoBrick[] {
  const bricks: RenkoBrick[] = [];
  if (closes.length === 0 || box <= 0) return bricks;
  let base = closes[0]!;
  let x = 0;
  for (let i = 1; i < closes.length; i++) {
    const p = closes[i]!;
    while (p - base >= box) {
      bricks.push({ x, low: base, high: base + box, dir: 1 });
      base += box;
      x++;
    }
    while (base - p >= box) {
      bricks.push({ x, low: base - box, high: base, dir: -1 });
      base -= box;
      x++;
    }
  }
  return bricks;
}
