import { describe, expect, it } from "vitest";
import { bin2d, kdeGrid2d, marchingSquares } from "./density2d";

describe("bin2d", () => {
  it("counts points into the correct cells", () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ];
    const g = bin2d(pts, 2, 2);
    expect(g.binsX).toBe(2);
    expect(g.binsY).toBe(2);
    expect(g.maxCount).toBe(2);
    // Two points at the min corner (cell 0,0), one at the max corner (clamped to 1,1).
    expect(g.counts[0]).toBe(2);
    expect(g.counts[g.counts.length - 1]).toBe(1);
    const total = g.counts.reduce((a, b) => a + b, 0);
    expect(total).toBe(3);
  });

  it("returns a safe default domain for empty input", () => {
    const g = bin2d([], 4, 4);
    expect(g.maxCount).toBe(0);
    expect(g.cells).toHaveLength(0);
    expect(g.xMax).toBeGreaterThan(g.xMin);
  });
});

describe("kdeGrid2d", () => {
  it("peaks near a tight cluster", () => {
    const pts = Array.from({ length: 20 }, () => ({ x: 0, y: 0 }));
    const f = kdeGrid2d(pts, 21);
    expect(f.max).toBeGreaterThan(0);
    // The densest cell should be the centre of the grid.
    let bestIdx = 0;
    for (let k = 1; k < f.grid.length; k++) if (f.grid[k]! > f.grid[bestIdx]!) bestIdx = k;
    const mid = Math.floor(f.size / 2);
    expect(bestIdx).toBe(mid * f.size + mid);
  });

  it("handles empty input without throwing", () => {
    const f = kdeGrid2d([], 8);
    expect(f.max).toBe(0);
    expect(f.grid.every((v) => v === 0)).toBe(true);
  });
});

describe("marchingSquares", () => {
  it("emits a segment across a single crossing cell", () => {
    // 2x2 grid: bottom-left corner above threshold only.
    const grid = [
      0, 0,
      1, 0,
    ];
    const segs = marchingSquares(grid, 2, 2, 0.5);
    expect(segs).toHaveLength(1);
    const s = segs[0]!;
    // Case 1 connects the left and bottom edges of the cell.
    expect(s.x1).toBeCloseTo(0);
    expect(s.y1).toBeCloseTo(0.5);
    expect(s.x2).toBeCloseTo(0.5);
    expect(s.y2).toBeCloseTo(1);
  });

  it("produces no segments when all corners are below threshold", () => {
    const grid = [0, 0, 0, 0];
    expect(marchingSquares(grid, 2, 2, 0.5)).toHaveLength(0);
  });
});
