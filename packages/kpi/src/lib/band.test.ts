import { describe, expect, it } from "vitest";
import { bandPosition } from "./kpi";

describe("bandPosition", () => {
  it("maps a value to a clamped 0..1 fraction of the range", () => {
    expect(bandPosition(75, 0, 100)).toBeCloseTo(0.75);
    expect(bandPosition(0, 0, 100)).toBe(0);
    expect(bandPosition(100, 0, 100)).toBe(1);
  });

  it("clamps values outside the range to the ends", () => {
    expect(bandPosition(-20, 0, 100)).toBe(0);
    expect(bandPosition(180, 0, 100)).toBe(1);
  });

  it("returns 0 for a degenerate range", () => {
    expect(bandPosition(5, 10, 10)).toBe(0);
    expect(bandPosition(5, 20, 10)).toBe(0);
  });

  it("handles non-zero minimums", () => {
    expect(bandPosition(60, 40, 80)).toBeCloseTo(0.5);
  });
});
