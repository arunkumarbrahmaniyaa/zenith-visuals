import type { Point2D } from "../types";

export interface Bin2D {
  /** Column index. */
  ix: number;
  /** Row index. */
  iy: number;
  /** Number of points in the cell. */
  count: number;
}

export interface Grid2D {
  binsX: number;
  binsY: number;
  /** Row-major counts, `counts[iy * binsX + ix]`. */
  counts: number[];
  cells: Bin2D[];
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  maxCount: number;
}

/**
 * Aggregate 2D points into a rectangular grid, counting how many fall in each
 * cell. Empty cells are omitted from `cells` (but present in `counts`).
 */
export function bin2d(
  points: readonly Point2D[],
  binsX = 24,
  binsY = 24,
): Grid2D {
  const nx = Math.max(1, Math.floor(binsX));
  const ny = Math.max(1, Math.floor(binsY));
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const p of points) {
    if (p.x < xMin) xMin = p.x;
    if (p.x > xMax) xMax = p.x;
    if (p.y < yMin) yMin = p.y;
    if (p.y > yMax) yMax = p.y;
  }
  if (!Number.isFinite(xMin)) {
    xMin = 0;
    xMax = 1;
    yMin = 0;
    yMax = 1;
  }
  if (xMax === xMin) xMax = xMin + 1;
  if (yMax === yMin) yMax = yMin + 1;

  const counts = new Array<number>(nx * ny).fill(0);
  const spanX = xMax - xMin;
  const spanY = yMax - yMin;
  for (const p of points) {
    let ix = Math.floor(((p.x - xMin) / spanX) * nx);
    let iy = Math.floor(((p.y - yMin) / spanY) * ny);
    if (ix >= nx) ix = nx - 1;
    if (iy >= ny) iy = ny - 1;
    if (ix < 0) ix = 0;
    if (iy < 0) iy = 0;
    counts[iy * nx + ix]! += 1;
  }

  const cells: Bin2D[] = [];
  let maxCount = 0;
  for (let iy = 0; iy < ny; iy++) {
    for (let ix = 0; ix < nx; ix++) {
      const count = counts[iy * nx + ix]!;
      if (count > maxCount) maxCount = count;
      if (count > 0) cells.push({ ix, iy, count });
    }
  }
  return { binsX: nx, binsY: ny, counts, cells, xMin, xMax, yMin, yMax, maxCount };
}

export interface DensityField {
  size: number;
  /** Row-major density values, `grid[j * size + i]`, j increasing = y increasing. */
  grid: number[];
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  max: number;
}

/**
 * Gaussian kernel density estimate sampled on a `size × size` grid. Bandwidth
 * defaults to a Scott/Silverman-style rule per dimension.
 */
export function kdeGrid2d(
  points: readonly Point2D[],
  size = 40,
  bandwidth?: number,
): DensityField {
  const n = points.length;
  const s = Math.max(2, Math.floor(size));
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const p of points) {
    if (p.x < xMin) xMin = p.x;
    if (p.x > xMax) xMax = p.x;
    if (p.y < yMin) yMin = p.y;
    if (p.y > yMax) yMax = p.y;
  }
  if (!Number.isFinite(xMin) || n === 0) {
    return { size: s, grid: new Array<number>(s * s).fill(0), xMin: 0, xMax: 1, yMin: 0, yMax: 1, max: 0 };
  }
  // Pad the domain so density tails are visible.
  const padX = (xMax - xMin || 1) * 0.1;
  const padY = (yMax - yMin || 1) * 0.1;
  xMin -= padX;
  xMax += padX;
  yMin -= padY;
  yMax += padY;

  const stdOf = (get: (p: Point2D) => number) => {
    let m = 0;
    for (const p of points) m += get(p);
    m /= n;
    let acc = 0;
    for (const p of points) acc += (get(p) - m) ** 2;
    return Math.sqrt(acc / Math.max(1, n - 1));
  };
  const factor = Math.pow(n, -1 / 6); // Scott's rule for 2D
  const hx = bandwidth ?? Math.max(1e-6, stdOf((p) => p.x) * factor);
  const hy = bandwidth ?? Math.max(1e-6, stdOf((p) => p.y) * factor);

  const grid = new Array<number>(s * s).fill(0);
  const invNorm = 1 / (2 * Math.PI * hx * hy * n);
  let max = 0;
  for (let j = 0; j < s; j++) {
    const gy = yMin + (j / (s - 1)) * (yMax - yMin);
    for (let i = 0; i < s; i++) {
      const gx = xMin + (i / (s - 1)) * (xMax - xMin);
      let sum = 0;
      for (const p of points) {
        const dx = (gx - p.x) / hx;
        const dy = (gy - p.y) / hy;
        sum += Math.exp(-0.5 * (dx * dx + dy * dy));
      }
      const d = sum * invNorm;
      grid[j * s + i] = d;
      if (d > max) max = d;
    }
  }
  return { size: s, grid, xMin, xMax, yMin, yMax, max };
}

export interface IsoSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Marching-squares isoline extraction. Returns line segments in grid-index
 * space (fractional `i` in `[0, cols-1]`, `j` in `[0, rows-1]`) for the given
 * threshold. Callers map indices back to data/pixel coordinates.
 */
export function marchingSquares(
  grid: readonly number[],
  cols: number,
  rows: number,
  threshold: number,
): IsoSegment[] {
  const at = (i: number, j: number) => grid[j * cols + i]!;
  const segs: IsoSegment[] = [];
  // Interpolate the crossing position along an edge between two corners.
  const lerp = (a: number, b: number) => {
    const d = b - a;
    if (d === 0) return 0.5;
    return (threshold - a) / d;
  };

  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < cols - 1; i++) {
      const tl = at(i, j);
      const tr = at(i + 1, j);
      const br = at(i + 1, j + 1);
      const bl = at(i, j + 1);
      let idx = 0;
      if (tl > threshold) idx |= 8;
      if (tr > threshold) idx |= 4;
      if (br > threshold) idx |= 2;
      if (bl > threshold) idx |= 1;
      if (idx === 0 || idx === 15) continue;

      // Edge crossing points (in grid-index space).
      const top = { x: i + lerp(tl, tr), y: j };
      const right = { x: i + 1, y: j + lerp(tr, br) };
      const bottom = { x: i + lerp(bl, br), y: j + 1 };
      const left = { x: i, y: j + lerp(tl, bl) };
      const push = (a: { x: number; y: number }, b: { x: number; y: number }) =>
        segs.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });

      switch (idx) {
        case 1:
        case 14:
          push(left, bottom);
          break;
        case 2:
        case 13:
          push(bottom, right);
          break;
        case 3:
        case 12:
          push(left, right);
          break;
        case 4:
        case 11:
          push(top, right);
          break;
        case 5:
          push(left, top);
          push(bottom, right);
          break;
        case 6:
        case 9:
          push(top, bottom);
          break;
        case 7:
        case 8:
          push(left, top);
          break;
        case 10:
          push(left, bottom);
          push(top, right);
          break;
        default:
          break;
      }
    }
  }
  return segs;
}
