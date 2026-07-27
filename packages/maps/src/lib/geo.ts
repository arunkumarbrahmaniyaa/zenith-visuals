import type { GeoCoord, Point } from "../projection";

/** Geographic bounding box in degrees. */
export interface GeoBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

/**
 * Compute the lon/lat bounding box of a set of coordinates. Returns a small
 * default box when the input is empty so downstream fits stay finite.
 */
export function boundsOf(coords: readonly GeoCoord[]): GeoBounds {
  if (coords.length === 0) return { minLat: -1, maxLat: 1, minLon: -1, maxLon: 1 };
  let minLat = 90;
  let maxLat = -90;
  let minLon = 180;
  let maxLon = -180;
  for (const c of coords) {
    if (c.lat < minLat) minLat = c.lat;
    if (c.lat > maxLat) maxLat = c.lat;
    if (c.lon < minLon) minLon = c.lon;
    if (c.lon > maxLon) maxLon = c.lon;
  }
  return { minLat, maxLat, minLon, maxLon };
}

/** A fitted projection transform mapping lon/lat into a padded viewport. */
export interface Fit {
  toXY: (coord: GeoCoord) => Point;
  scale: number;
  bounds: GeoBounds;
}

/**
 * Fit a set of coordinates into a `width`×`height` viewport (with margin) using
 * the supplied projection. Preserves aspect ratio and centers the result.
 */
export function computeFit(
  coords: readonly GeoCoord[],
  project: (c: GeoCoord, w: number, h: number) => Point,
  width: number,
  height: number,
  margin = 12,
): Fit {
  const bounds = boundsOf(coords);
  const p1 = project({ lat: bounds.maxLat, lon: bounds.minLon }, 1, 1);
  const p2 = project({ lat: bounds.minLat, lon: bounds.maxLon }, 1, 1);
  const spanX = Math.max(1e-6, Math.abs(p2.x - p1.x));
  const spanY = Math.max(1e-6, Math.abs(p2.y - p1.y));
  const scale = Math.min(
    (width - margin * 2) / spanX,
    (height - margin * 2) / spanY,
  );
  const offX = margin + (width - margin * 2 - spanX * scale) / 2;
  const offY = margin + (height - margin * 2 - spanY * scale) / 2;
  const minPX = Math.min(p1.x, p2.x);
  const minPY = Math.min(p1.y, p2.y);
  const toXY = (coord: GeoCoord): Point => {
    const p = project(coord, 1, 1);
    return { x: offX + (p.x - minPX) * scale, y: offY + (p.y - minPY) * scale };
  };
  return { toXY, scale, bounds };
}

/** An input point for hex binning, in pixel space. */
export interface HexInput {
  x: number;
  y: number;
  value?: number;
}

/** An aggregated hexagonal bin. */
export interface HexCell {
  /** Column index in the hex lattice. */
  i: number;
  /** Row index in the hex lattice. */
  j: number;
  /** Pixel center. */
  x: number;
  y: number;
  /** Number of points in the bin. */
  count: number;
  /** Sum of point values (falls back to count when values are absent). */
  value: number;
}

/**
 * Aggregate pixel-space points into hexagonal bins of the given radius.
 * Uses the standard pointy-top hex lattice snapping (d3-hexbin algorithm).
 */
export function hexbin(points: readonly HexInput[], radius: number): HexCell[] {
  const r = Math.max(1e-6, radius);
  const dx = r * 2 * Math.sin(Math.PI / 3);
  const dy = r * 1.5;
  const bins = new Map<string, HexCell>();

  for (const point of points) {
    let py = point.y / dy;
    let pj = Math.round(py);
    let px = point.x / dx - (pj & 1 ? 0.5 : 0);
    let pi = Math.round(px);
    const py1 = py - pj;

    if (Math.abs(py1) * 3 > 1) {
      const px1 = px - pi;
      const pi2 = pi + (px < pi ? -1 : 1) / 2;
      const pj2 = pj + (py < pj ? -1 : 1);
      const px2 = px - pi2;
      const py2 = py - pj2;
      if (px1 * px1 + py1 * py1 > px2 * px2 + py2 * py2) {
        pi = pi2 + (pj & 1 ? 1 : -1) / 2;
        pj = pj2;
      }
    }

    const key = `${pi}:${pj}`;
    let cell = bins.get(key);
    if (!cell) {
      cell = {
        i: pi,
        j: pj,
        x: (pi + (pj & 1 ? 0.5 : 0)) * dx,
        y: pj * dy,
        count: 0,
        value: 0,
      };
      bins.set(key, cell);
    }
    cell.count += 1;
    cell.value += point.value ?? 1;
  }

  return [...bins.values()];
}

/**
 * Build an SVG path for a pointy-top hexagon centered at (cx, cy) with the
 * given circumradius.
 */
export function hexagonPath(cx: number, cy: number, radius: number): string {
  const thirdPi = Math.PI / 3;
  let d = "";
  for (let a = 0; a < 6; a++) {
    const angle = a * thirdPi;
    const x = cx + Math.sin(angle) * radius;
    const y = cy - Math.cos(angle) * radius;
    d += `${a === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }
  return d + "Z";
}

/** A weighted point for density estimation, in pixel space. */
export interface DensityInput {
  x: number;
  y: number;
  weight?: number;
}

/** A rasterized density field over a viewport. */
export interface DensityGrid {
  cols: number;
  rows: number;
  cellSize: number;
  /** Row-major density values. */
  values: number[];
  max: number;
}

/**
 * Estimate a Gaussian density field for pixel-space points over a viewport,
 * splatting each point onto a grid of `cellSize` cells with the given
 * `bandwidth` (standard deviation in px).
 */
export function densityGrid(
  points: readonly DensityInput[],
  width: number,
  height: number,
  cellSize = 16,
  bandwidth = cellSize * 1.5,
): DensityGrid {
  const cols = Math.max(1, Math.ceil(width / cellSize));
  const rows = Math.max(1, Math.ceil(height / cellSize));
  const values = new Array<number>(cols * rows).fill(0);
  const twoSig2 = 2 * bandwidth * bandwidth;
  const reach = Math.max(1, Math.ceil((bandwidth * 2) / cellSize));

  for (const point of points) {
    const ci = Math.floor(point.x / cellSize);
    const cj = Math.floor(point.y / cellSize);
    const weight = point.weight ?? 1;
    for (let dj = -reach; dj <= reach; dj++) {
      const j = cj + dj;
      if (j < 0 || j >= rows) continue;
      for (let di = -reach; di <= reach; di++) {
        const i = ci + di;
        if (i < 0 || i >= cols) continue;
        const cx = (i + 0.5) * cellSize;
        const cy = (j + 0.5) * cellSize;
        const d2 = (cx - point.x) ** 2 + (cy - point.y) ** 2;
        const idx = j * cols + i;
        values[idx] = (values[idx] ?? 0) + weight * Math.exp(-d2 / twoSig2);
      }
    }
  }

  let max = 1e-9;
  for (const v of values) if (v > max) max = v;
  return { cols, rows, cellSize, values, max };
}

/**
 * Area-weighted centroid of a planar polygon ring (treating lon/lat as x/y).
 * Falls back to the vertex mean for degenerate (zero-area) rings.
 */
export function polygonCentroid(ring: readonly GeoCoord[]): GeoCoord {
  const n = ring.length;
  if (n === 0) return { lat: 0, lon: 0 };
  let twiceArea = 0;
  let lon = 0;
  let lat = 0;
  for (let i = 0; i < n; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % n]!;
    const cross = a.lon * b.lat - b.lon * a.lat;
    twiceArea += cross;
    lon += (a.lon + b.lon) * cross;
    lat += (a.lat + b.lat) * cross;
  }
  if (Math.abs(twiceArea) < 1e-12) {
    let mLon = 0;
    let mLat = 0;
    for (const c of ring) {
      mLon += c.lon;
      mLat += c.lat;
    }
    return { lat: mLat / n, lon: mLon / n };
  }
  const factor = 1 / (3 * twiceArea);
  return { lat: lat * factor, lon: lon * factor };
}

/** Scale a ring's coordinates around a center by the given factor. */
export function scaleRingAround(
  ring: readonly GeoCoord[],
  factor: number,
  center: GeoCoord,
): GeoCoord[] {
  return ring.map((c) => ({
    lat: center.lat + (c.lat - center.lat) * factor,
    lon: center.lon + (c.lon - center.lon) * factor,
  }));
}

/** A cell placed on a discrete tile grid. */
export interface TileGridCell {
  row: number;
  col: number;
}

/** The extent of a tile grid: number of rows/cols and their min offsets. */
export interface TileGridExtent {
  minRow: number;
  minCol: number;
  rows: number;
  cols: number;
}

/** Compute the bounding extent (rows/cols) of a set of tile-grid cells. */
export function tileGridExtent(cells: readonly TileGridCell[]): TileGridExtent {
  if (cells.length === 0) return { minRow: 0, minCol: 0, rows: 1, cols: 1 };
  let minRow = Infinity;
  let maxRow = -Infinity;
  let minCol = Infinity;
  let maxCol = -Infinity;
  for (const c of cells) {
    if (c.row < minRow) minRow = c.row;
    if (c.row > maxRow) maxRow = c.row;
    if (c.col < minCol) minCol = c.col;
    if (c.col > maxCol) maxCol = c.col;
  }
  return {
    minRow,
    minCol,
    rows: maxRow - minRow + 1,
    cols: maxCol - minCol + 1,
  };
}
