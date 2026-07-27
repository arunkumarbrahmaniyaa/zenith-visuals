import { describe, expect, it } from "vitest";
import {
  boundsOf,
  computeFit,
  densityGrid,
  hexbin,
  polygonCentroid,
  scaleRingAround,
  tileGridExtent,
} from "./lib/geo";
import { projectEquirectangular } from "./projection";

describe("boundsOf", () => {
  it("returns a default box when empty", () => {
    expect(boundsOf([])).toEqual({ minLat: -1, maxLat: 1, minLon: -1, maxLon: 1 });
  });

  it("computes lon/lat extent", () => {
    const b = boundsOf([
      { lat: 10, lon: -5 },
      { lat: -3, lon: 20 },
      { lat: 4, lon: 0 },
    ]);
    expect(b).toEqual({ minLat: -3, maxLat: 10, minLon: -5, maxLon: 20 });
  });
});

describe("computeFit", () => {
  it("maps the bounding corners inside the padded viewport", () => {
    const coords = [
      { lat: 10, lon: -10 },
      { lat: -10, lon: 10 },
    ];
    const fit = computeFit(coords, projectEquirectangular, 200, 200, 12);
    for (const c of coords) {
      const p = fit.toXY(c);
      expect(p.x).toBeGreaterThanOrEqual(11);
      expect(p.x).toBeLessThanOrEqual(189);
      expect(p.y).toBeGreaterThanOrEqual(11);
      expect(p.y).toBeLessThanOrEqual(189);
    }
  });
});

describe("hexbin", () => {
  it("aggregates nearby points into a shared bin", () => {
    const cells = hexbin(
      [
        { x: 100, y: 100 },
        { x: 101, y: 101 },
        { x: 300, y: 300, value: 5 },
      ],
      20,
    );
    // Two clusters → two bins.
    expect(cells).toHaveLength(2);
    const total = cells.reduce((s, c) => s + c.count, 0);
    expect(total).toBe(3);
    const big = cells.find((c) => c.value >= 5);
    expect(big).toBeDefined();
  });
});

describe("densityGrid", () => {
  it("peaks near the sampled point", () => {
    const grid = densityGrid([{ x: 50, y: 50 }], 100, 100, 10, 15);
    expect(grid.cols).toBe(10);
    expect(grid.rows).toBe(10);
    expect(grid.max).toBeGreaterThan(0);
    // The cell containing (50,50) should hold the maximum.
    const idx = Math.floor(50 / 10) * grid.cols + Math.floor(50 / 10);
    expect(grid.values[idx]).toBeCloseTo(grid.max, 5);
  });
});

describe("polygonCentroid + scaleRingAround", () => {
  const square = [
    { lat: 0, lon: 0 },
    { lat: 0, lon: 10 },
    { lat: 10, lon: 10 },
    { lat: 10, lon: 0 },
  ];

  it("finds the centroid of a square", () => {
    const c = polygonCentroid(square);
    expect(c.lon).toBeCloseTo(5, 6);
    expect(c.lat).toBeCloseTo(5, 6);
  });

  it("scales a ring about a center", () => {
    const center = { lat: 5, lon: 5 };
    const scaled = scaleRingAround(square, 0.5, center);
    expect(scaled[0]).toEqual({ lat: 2.5, lon: 2.5 });
    expect(scaled[2]).toEqual({ lat: 7.5, lon: 7.5 });
  });
});

describe("tileGridExtent", () => {
  it("computes rows/cols and min offsets", () => {
    const ext = tileGridExtent([
      { row: 2, col: 1 },
      { row: 4, col: 3 },
      { row: 3, col: 0 },
    ]);
    expect(ext).toEqual({ minRow: 2, minCol: 0, rows: 3, cols: 4 });
  });
});
