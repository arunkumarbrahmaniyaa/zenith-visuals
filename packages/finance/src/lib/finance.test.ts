import { describe, expect, it } from "vitest";
import { priceExtent, computeKagi, computeRenko } from "./finance";
import type { OHLCDatum } from "../types";

const bars: OHLCDatum[] = [
  { label: "1", open: 10, high: 12, low: 9, close: 11 },
  { label: "2", open: 11, high: 15, low: 10, close: 14 },
  { label: "3", open: 14, high: 14, low: 8, close: 9 },
];

describe("priceExtent", () => {
  it("returns the min low and max high", () => {
    expect(priceExtent(bars)).toEqual([8, 15]);
  });
  it("falls back to [0,1] for empty input", () => {
    expect(priceExtent([])).toEqual([0, 1]);
  });
});

describe("computeRenko", () => {
  it("emits bricks only when price moves a full box", () => {
    const bricks = computeRenko([10, 10.5, 11, 12, 11, 9], 1);
    expect(bricks.length).toBeGreaterThan(0);
    // First up move from 10 -> ~12 spans two up bricks.
    expect(bricks[0]!.dir).toBe(1);
    expect(bricks[0]!.high - bricks[0]!.low).toBeCloseTo(1);
    // Columns increase monotonically.
    for (let i = 1; i < bricks.length; i++) {
      expect(bricks[i]!.x).toBe(bricks[i - 1]!.x + 1);
    }
  });
  it("returns nothing for a flat series", () => {
    expect(computeRenko([5, 5, 5, 5], 1)).toHaveLength(0);
  });
});

describe("computeKagi", () => {
  it("only reverses after the reversal threshold", () => {
    const verts = computeKagi([10, 10.2, 10.1, 13, 12.9, 8], 2);
    expect(verts.length).toBeGreaterThanOrEqual(2);
    // Column index never decreases.
    for (let i = 1; i < verts.length; i++) {
      expect(verts[i]!.x).toBeGreaterThanOrEqual(verts[i - 1]!.x);
    }
  });
  it("returns empty for degenerate input", () => {
    expect(computeKagi([], 1)).toHaveLength(0);
    expect(computeKagi([1, 2, 3], 0)).toHaveLength(0);
  });
});
