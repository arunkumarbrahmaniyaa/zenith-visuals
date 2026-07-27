import { describe, expect, it } from "vitest";
import { computeDelta, valueExtent } from "./kpi";

describe("computeDelta", () => {
  it("computes an upward change with percentage", () => {
    const d = computeDelta(120, 100);
    expect(d.delta).toBe(20);
    expect(d.pct).toBeCloseTo(0.2);
    expect(d.direction).toBe("up");
  });

  it("computes a downward change", () => {
    const d = computeDelta(80, 100);
    expect(d.delta).toBe(-20);
    expect(d.pct).toBeCloseTo(-0.2);
    expect(d.direction).toBe("down");
  });

  it("reports flat when unchanged", () => {
    expect(computeDelta(50, 50).direction).toBe("flat");
  });

  it("returns null pct when previous is missing or zero", () => {
    expect(computeDelta(50).pct).toBeNull();
    expect(computeDelta(50).direction).toBe("flat");
    expect(computeDelta(50, 0).pct).toBeNull();
  });
});

describe("valueExtent", () => {
  it("spans every accessor", () => {
    const data = [
      { start: 10, end: 40 },
      { start: 5, end: 25 },
    ];
    expect(valueExtent(data, (d) => d.start, (d) => d.end)).toEqual([5, 40]);
  });

  it("pads a degenerate (single-value) domain", () => {
    const [min, max] = valueExtent([{ v: 7 }], (d) => d.v);
    expect(min).toBeLessThan(7);
    expect(max).toBeGreaterThan(7);
  });

  it("returns a default domain for empty input", () => {
    expect(valueExtent<{ v: number }>([], (d) => d.v)).toEqual([0, 1]);
  });
});
