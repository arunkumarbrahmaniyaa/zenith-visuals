import { describe, expect, it } from "vitest";
import {
  beeswarmLayout,
  boxStats,
  histogramBins,
  kde,
  linearRegression,
  linspace,
  mean,
  normalQuantile,
  qqPoints,
  quantileSorted,
  stdDev,
} from "./stats";

describe("mean & stdDev", () => {
  it("computes the arithmetic mean", () => {
    expect(mean([2, 4, 6])).toBe(4);
    expect(mean([])).toBe(0);
  });

  it("computes sample standard deviation", () => {
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 2);
    expect(stdDev([5])).toBe(0);
  });
});

describe("quantileSorted", () => {
  it("interpolates between ranks", () => {
    const s = [1, 2, 3, 4];
    expect(quantileSorted(s, 0)).toBe(1);
    expect(quantileSorted(s, 0.5)).toBe(2.5);
    expect(quantileSorted(s, 1)).toBe(4);
  });
});

describe("boxStats", () => {
  it("computes quartiles, whiskers and outliers", () => {
    const s = boxStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 100]);
    expect(s.median).toBeCloseTo(5.5, 5);
    expect(s.q1).toBeLessThan(s.median);
    expect(s.q3).toBeGreaterThan(s.median);
    expect(s.outliers).toContain(100);
    expect(s.whiskerHigh).toBeLessThan(100);
  });

  it("is safe for empty input", () => {
    const s = boxStats([]);
    expect(s.median).toBe(0);
    expect(s.outliers).toHaveLength(0);
  });
});

describe("histogramBins", () => {
  it("partitions values into equal-width bins summing to n", () => {
    const bins = histogramBins([1, 1, 2, 3, 4, 5, 5, 5], 5);
    expect(bins).toHaveLength(5);
    expect(bins.reduce((a, b) => a + b.count, 0)).toBe(8);
    expect(bins[0]!.x0).toBeLessThan(bins[0]!.x1);
  });
});

describe("kde", () => {
  it("returns non-negative densities that peak near the data mode", () => {
    const values = [0, 0, 0, 1, 2, 3, 4];
    const pts = linspace(-2, 6, 40);
    const dens = kde(values, pts);
    expect(dens.every((d) => d >= 0)).toBe(true);
    const maxIdx = dens.indexOf(Math.max(...dens));
    expect(pts[maxIdx]!).toBeLessThan(2);
  });
});

describe("linearRegression", () => {
  it("recovers the slope and intercept of a perfect line", () => {
    const fit = linearRegression([
      { x: 0, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 5 }, { x: 3, y: 7 },
    ]);
    expect(fit.slope).toBeCloseTo(2, 6);
    expect(fit.intercept).toBeCloseTo(1, 6);
    expect(fit.r2).toBeCloseTo(1, 6);
    expect(fit.predict(4)).toBeCloseTo(9, 6);
  });

  it("is safe for empty input", () => {
    expect(linearRegression([]).slope).toBe(0);
  });
});

describe("normalQuantile", () => {
  it("maps the median to 0 and is symmetric", () => {
    expect(normalQuantile(0.5)).toBeCloseTo(0, 6);
    expect(normalQuantile(0.975)).toBeCloseTo(1.959964, 4);
    expect(normalQuantile(0.025)).toBeCloseTo(-1.959964, 4);
  });
});

describe("qqPoints", () => {
  it("returns one sorted pair per sample", () => {
    const pts = qqPoints([3, 1, 2, 5, 4]);
    expect(pts).toHaveLength(5);
    expect(pts.map((p) => p.sample)).toEqual([1, 2, 3, 4, 5]);
    expect(pts[0]!.theoretical).toBeLessThan(pts[4]!.theoretical);
  });
});

describe("beeswarmLayout", () => {
  it("keeps identical values from overlapping", () => {
    const dots = beeswarmLayout([5, 5, 5, 5], () => 100, 4);
    const offsets = dots.map((d) => d.offset);
    expect(new Set(offsets).size).toBe(offsets.length);
    expect(dots[0]!.offset).toBe(0);
  });
});

