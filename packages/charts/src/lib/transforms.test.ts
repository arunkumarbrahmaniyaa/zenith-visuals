import { describe, expect, it } from "vitest";
import {
  computePareto,
  computeStreamBands,
  computeWaterfall,
} from "./transforms";

describe("computeWaterfall", () => {
  it("accumulates step deltas", () => {
    const { bars } = computeWaterfall([
      { label: "Start", value: 100 },
      { label: "Gain", value: 40 },
      { label: "Loss", value: -30 },
    ]);
    expect(bars[0]).toMatchObject({ start: 0, end: 100, direction: "up" });
    expect(bars[1]).toMatchObject({ start: 100, end: 140, direction: "up" });
    expect(bars[2]).toMatchObject({ start: 140, end: 110, direction: "down" });
  });

  it("draws total bars from zero to the running total", () => {
    const { bars, max } = computeWaterfall([
      { label: "A", value: 60 },
      { label: "B", value: 20 },
      { label: "Total", value: 0, isTotal: true },
    ]);
    expect(bars[2]).toMatchObject({ start: 0, end: 80, direction: "total", isTotal: true });
    expect(max).toBe(80);
  });

  it("tracks negative excursions in min", () => {
    const { min } = computeWaterfall([
      { label: "A", value: 10 },
      { label: "B", value: -40 },
    ]);
    expect(min).toBe(-30);
  });
});

describe("computePareto", () => {
  it("sorts descending and computes cumulative share", () => {
    const { bars } = computePareto([
      { label: "A", value: 10 },
      { label: "B", value: 50 },
      { label: "C", value: 40 },
    ]);
    expect(bars.map((b) => b.label)).toEqual(["B", "C", "A"]);
    expect(bars[2]!.cumulativePct).toBeCloseTo(1);
    expect(bars[0]!.cumulativePct).toBeCloseTo(0.5);
  });

  it("handles an all-zero total without dividing by zero", () => {
    const { bars } = computePareto([{ label: "A", value: 0 }]);
    expect(bars[0]!.cumulativePct).toBe(0);
  });
});

describe("computeStreamBands", () => {
  const series = [
    { name: "x", data: [2, 4] },
    { name: "y", data: [2, 0] },
  ];

  it("centers each category around zero for the silhouette offset", () => {
    const { bands, min, max } = computeStreamBands(series, 2, "silhouette");
    // Category 0 total = 4, centered → lo starts at -2.
    expect(bands[0]![0]).toEqual({ lo: -2, hi: 0 });
    expect(bands[1]![0]).toEqual({ lo: 0, hi: 2 });
    expect(min).toBeCloseTo(-2);
    expect(max).toBeCloseTo(2);
  });

  it("stacks from the baseline for the zero offset", () => {
    const { bands, min } = computeStreamBands(series, 2, "zero");
    expect(bands[0]![0]).toEqual({ lo: 0, hi: 2 });
    expect(bands[1]![0]).toEqual({ lo: 2, hi: 4 });
    expect(min).toBe(0);
  });
});
