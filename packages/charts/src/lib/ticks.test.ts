import { describe, expect, it } from "vitest";
import { niceTicks, defaultFormat } from "./ticks";
import { computeCartesianLayout } from "./cartesian";

describe("niceTicks", () => {
  it("produces human-friendly, ascending ticks covering the domain", () => {
    const { ticks, niceMin, niceMax } = niceTicks(0, 97, 5);
    expect(niceMin).toBe(0);
    expect(niceMax).toBeGreaterThanOrEqual(97);
    expect(ticks[0]).toBe(niceMin);
    expect(ticks[ticks.length - 1]).toBe(niceMax);
    for (let i = 1; i < ticks.length; i++) {
      expect(ticks[i]!).toBeGreaterThan(ticks[i - 1]!);
    }
  });

  it("includes zero in the domain by default", () => {
    const { niceMin } = niceTicks(20, 80, 5);
    expect(niceMin).toBe(0);
  });

  it("can exclude zero for non-baseline charts", () => {
    const { niceMin } = niceTicks(20, 80, 5, false);
    expect(niceMin).toBeLessThanOrEqual(20);
    expect(niceMin).toBeGreaterThan(0);
  });
});

describe("defaultFormat", () => {
  it("compacts large numbers", () => {
    expect(defaultFormat(1500)).toBe("1.5K");
    expect(defaultFormat(2_000_000)).toBe("2M");
    expect(defaultFormat(42)).toBe("42");
  });
});

describe("computeCartesianLayout", () => {
  it("keeps category centers inside the plot rectangle", () => {
    const layout = computeCartesianLayout({
      width: 400,
      height: 300,
      categories: ["A", "B", "C"],
      valueMin: 0,
      valueMax: 100,
    });
    for (let i = 0; i < 3; i++) {
      const cx = layout.categoryCenter(i);
      expect(cx).toBeGreaterThanOrEqual(layout.plot.x);
      expect(cx).toBeLessThanOrEqual(layout.plot.x + layout.plot.w);
    }
    expect(layout.yScale(layout.yMax)).toBeCloseTo(layout.plot.y);
    expect(layout.yScale(layout.yMin)).toBeCloseTo(layout.plot.y + layout.plot.h);
  });
});
