/** Arithmetic mean of a list of numbers (0 for empty). */
export function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

/** Sample standard deviation (n − 1 denominator). */
export function stdDev(values: readonly number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const m = mean(values);
  let acc = 0;
  for (const v of values) acc += (v - m) ** 2;
  return Math.sqrt(acc / (n - 1));
}

/**
 * Quantile of an already-ascending-sorted array using linear interpolation
 * between closest ranks (the "type 7" definition used by NumPy/Excel).
 */
export function quantileSorted(sorted: readonly number[], q: number): number {
  const n = sorted.length;
  if (n === 0) return NaN;
  if (n === 1) return sorted[0]!;
  const pos = (n - 1) * Math.min(1, Math.max(0, q));
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  const frac = pos - lo;
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * frac;
}

export interface BoxStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  /** Lower whisker end (smallest value ≥ q1 − 1.5·IQR). */
  whiskerLow: number;
  /** Upper whisker end (largest value ≤ q3 + 1.5·IQR). */
  whiskerHigh: number;
  /** Values outside the whiskers. */
  outliers: number[];
  mean: number;
}

/** Compute Tukey box-plot statistics (quartiles, whiskers, outliers). */
export function boxStats(values: readonly number[]): BoxStats {
  const sorted = [...values].filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) {
    return { min: 0, q1: 0, median: 0, q3: 0, max: 0, whiskerLow: 0, whiskerHigh: 0, outliers: [], mean: 0 };
  }
  const q1 = quantileSorted(sorted, 0.25);
  const median = quantileSorted(sorted, 0.5);
  const q3 = quantileSorted(sorted, 0.75);
  const iqr = q3 - q1;
  const lowFence = q1 - 1.5 * iqr;
  const highFence = q3 + 1.5 * iqr;
  let whiskerLow = sorted[sorted.length - 1]!;
  let whiskerHigh = sorted[0]!;
  const outliers: number[] = [];
  for (const v of sorted) {
    if (v < lowFence || v > highFence) {
      outliers.push(v);
    } else {
      if (v < whiskerLow) whiskerLow = v;
      if (v > whiskerHigh) whiskerHigh = v;
    }
  }
  return {
    min: sorted[0]!,
    q1,
    median,
    q3,
    max: sorted[sorted.length - 1]!,
    whiskerLow,
    whiskerHigh,
    outliers,
    mean: mean(sorted),
  };
}

export interface HistogramBin {
  x0: number;
  x1: number;
  count: number;
}

/** Bin values into `binCount` equal-width buckets over their range. */
export function histogramBins(values: readonly number[], binCount = 12): HistogramBin[] {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0 || binCount < 1) return [];
  let min = Infinity;
  let max = -Infinity;
  for (const v of finite) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === max) max = min + 1;
  const width = (max - min) / binCount;
  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => ({
    x0: min + i * width,
    x1: min + (i + 1) * width,
    count: 0,
  }));
  for (const v of finite) {
    let idx = Math.floor((v - min) / width);
    if (idx >= binCount) idx = binCount - 1;
    if (idx < 0) idx = 0;
    bins[idx]!.count += 1;
  }
  return bins;
}

/** Silverman's rule-of-thumb bandwidth for a Gaussian kernel. */
export function silvermanBandwidth(values: readonly number[]): number {
  const n = values.length;
  if (n < 2) return 1;
  const sd = stdDev(values);
  const sorted = [...values].sort((a, b) => a - b);
  const iqr = quantileSorted(sorted, 0.75) - quantileSorted(sorted, 0.25);
  const sigma = iqr > 0 ? Math.min(sd, iqr / 1.349) : sd || 1;
  return 1.06 * sigma * n ** (-1 / 5);
}

const INV_SQRT_2PI = 1 / Math.sqrt(2 * Math.PI);

function gaussian(u: number): number {
  return INV_SQRT_2PI * Math.exp(-0.5 * u * u);
}

/**
 * Gaussian kernel density estimate. Returns the estimated density at each
 * `evalPoints` position. Bandwidth defaults to Silverman's rule.
 */
export function kde(
  values: readonly number[],
  evalPoints: readonly number[],
  bandwidth?: number,
): number[] {
  const finite = values.filter(Number.isFinite);
  const n = finite.length;
  if (n === 0) return evalPoints.map(() => 0);
  const h = bandwidth && bandwidth > 0 ? bandwidth : silvermanBandwidth(finite);
  return evalPoints.map((x) => {
    let acc = 0;
    for (const v of finite) acc += gaussian((x - v) / h);
    return acc / (n * h);
  });
}

/** Evenly spaced sample points across [min, max]. */
export function linspace(min: number, max: number, count: number): number[] {
  if (count < 2) return [min];
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => min + i * step);
}

export interface Regression {
  slope: number;
  intercept: number;
  /** Coefficient of determination R². */
  r2: number;
  /** Predict y for a given x. */
  predict: (x: number) => number;
}

/**
 * Ordinary-least-squares linear regression `y = slope·x + intercept` with the
 * coefficient of determination (R²). Returns a zero-slope fit for degenerate
 * input.
 */
export function linearRegression(points: readonly { x: number; y: number }[]): Regression {
  const pts = points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  const n = pts.length;
  const zero: Regression = { slope: 0, intercept: 0, r2: 0, predict: () => 0 };
  if (n === 0) return zero;
  let sx = 0;
  let sy = 0;
  for (const p of pts) {
    sx += p.x;
    sy += p.y;
  }
  const mx = sx / n;
  const my = sy / n;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const p of pts) {
    const dx = p.x - mx;
    const dy = p.y - my;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  if (sxx === 0) return { slope: 0, intercept: my, r2: 0, predict: () => my };
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const r2 = syy === 0 ? 1 : (sxy * sxy) / (sxx * syy);
  return { slope, intercept, r2, predict: (x: number) => slope * x + intercept };
}

/**
 * Inverse standard-normal CDF (quantile / probit) via Acklam's rational
 * approximation. Accurate to ~1e-9 across (0, 1).
 */
export function normalQuantile(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-7.78489400243029e-3, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [7.78469570904146e-3, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const plow = 0.02425;
  const phigh = 1 - plow;
  if (p < plow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  }
  if (p > phigh) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q /
    (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1);
}

/** A theoretical/sample quantile pair for a Q-Q plot. */
export interface QQPoint {
  /** Theoretical standard-normal quantile. */
  theoretical: number;
  /** Observed sample quantile. */
  sample: number;
}

/**
 * Quantile-quantile points comparing a sample against a standard normal, using
 * the (i − 0.5)/n plotting position. Sorted ascending by theoretical quantile.
 */
export function qqPoints(values: readonly number[]): QQPoint[] {
  const sorted = [...values].filter(Number.isFinite).sort((a, b) => a - b);
  const n = sorted.length;
  return sorted.map((sample, i) => ({ theoretical: normalQuantile((i + 0.5) / n), sample }));
}

/** A beeswarm dot: original value plus its computed cross-axis offset. */
export interface BeeswarmDot {
  value: number;
  /** Signed offset from the group center axis, in px. */
  offset: number;
}

/**
 * Compute non-overlapping cross-axis offsets for a 1D swarm. Values are placed
 * along a single axis (via `positionOf`, in px), and each new dot is nudged
 * sideways just enough to avoid overlapping earlier dots within `2·radius`.
 */
export function beeswarmLayout(
  values: readonly number[],
  positionOf: (value: number) => number,
  radius: number,
): BeeswarmDot[] {
  const indexed = values
    .map((value) => ({ value, pos: positionOf(value) }))
    .filter((d) => Number.isFinite(d.pos))
    .sort((a, b) => a.pos - b.pos);
  const placed: { pos: number; offset: number }[] = [];
  const minDist = radius * 2;
  const dots: BeeswarmDot[] = [];
  for (const d of indexed) {
    // Candidate offsets spiral outward: 0, +step, −step, +2·step, …
    let offset = 0;
    for (let k = 0; k < 2000; k++) {
      const candidate = k === 0 ? 0 : (k % 2 === 1 ? 1 : -1) * Math.ceil(k / 2) * radius;
      const collides = placed.some((p) => {
        const dp = d.pos - p.pos;
        const doff = candidate - p.offset;
        return dp * dp + doff * doff < minDist * minDist - 1e-6;
      });
      if (!collides) {
        offset = candidate;
        break;
      }
    }
    placed.push({ pos: d.pos, offset });
    dots.push({ value: d.value, offset });
  }
  return dots;
}
