import { describe, expect, it } from "vitest";
import {
  niceTimeTicks,
  packLanes,
  timeExtentMs,
  toMs,
} from "./lib/time";
import { computeResourceTimeline } from "./resource-timeline/layout";
import { computeSwimlane } from "./swimlane/layout";
import { computeEventDrops } from "./event-drops/layout";

const DAY = 86_400_000;

describe("time helpers", () => {
  it("toMs coerces dates, strings and numbers", () => {
    const d = new Date("2026-01-01T00:00:00Z");
    expect(toMs(d)).toBe(d.getTime());
    expect(toMs("2026-01-01T00:00:00Z")).toBe(d.getTime());
    expect(toMs(1234)).toBe(1234);
  });

  it("timeExtentMs guarantees a non-degenerate span", () => {
    expect(timeExtentMs([])).toEqual([0, DAY]);
    expect(timeExtentMs([5, 5, 5])).toEqual([5, 5 + DAY]);
    expect(timeExtentMs([10, 3, 7])).toEqual([3, 10]);
  });

  it("niceTimeTicks produces ascending in-range ticks", () => {
    const min = toMs("2026-01-01");
    const max = toMs("2026-01-31");
    const ticks = niceTimeTicks(min, max, 6);
    expect(ticks.length).toBeGreaterThan(0);
    for (const t of ticks) {
      expect(t.value).toBeGreaterThanOrEqual(min);
      expect(t.value).toBeLessThanOrEqual(max);
      expect(typeof t.label).toBe("string");
    }
    for (let i = 1; i < ticks.length; i++) {
      expect(ticks[i]!.value).toBeGreaterThan(ticks[i - 1]!.value);
    }
  });

  it("packLanes stacks overlapping intervals and reuses freed lanes", () => {
    const { placements, laneCount } = packLanes([
      { startMs: 0, endMs: 10 },
      { startMs: 5, endMs: 15 },
      { startMs: 12, endMs: 20 },
    ]);
    // First two overlap → 2 lanes; third reuses lane 0 (freed at t=10).
    expect(laneCount).toBe(2);
    const byStart = placements.sort((a, b) => a.item.startMs - b.item.startMs);
    expect(byStart[0]!.lane).toBe(0);
    expect(byStart[1]!.lane).toBe(1);
    expect(byStart[2]!.lane).toBe(0);
  });
});

describe("computeResourceTimeline", () => {
  it("groups by resource in first-seen order and stacks overlaps", () => {
    const model = computeResourceTimeline([
      { id: "a", resource: "Alice", start: "2026-01-01", end: "2026-01-05" },
      { id: "b", resource: "Bob", start: "2026-01-02", end: "2026-01-04" },
      { id: "c", resource: "Alice", start: "2026-01-03", end: "2026-01-07" },
    ]);
    expect(model.resources).toEqual(["Alice", "Bob"]);
    const alice = model.rows.find((r) => r.resource === "Alice")!;
    expect(alice.laneCount).toBe(2); // a and c overlap
    expect(alice.bars).toHaveLength(2);
    expect(model.contentHeight).toBeGreaterThan(0);
  });
});

describe("computeSwimlane", () => {
  it("classifies point events as milestones and packs lanes", () => {
    const model = computeSwimlane([
      { id: "1", lane: "Build", start: "2026-01-01", end: "2026-01-03" },
      { id: "2", lane: "Build", start: "2026-01-04" },
      { id: "3", lane: "Ship", start: "2026-01-02", end: "2026-01-06" },
    ]);
    expect(model.lanes).toEqual(["Build", "Ship"]);
    const build = model.bands.find((b) => b.lane === "Build")!;
    const milestone = build.items.find((i) => i.id === "2")!;
    expect(milestone.milestone).toBe(true);
    const span = build.items.find((i) => i.id === "1")!;
    expect(span.milestone).toBe(false);
  });
});

describe("computeEventDrops", () => {
  it("sorts drops by time and tracks max magnitude and counts", () => {
    const model = computeEventDrops([
      {
        label: "Deploys",
        events: [
          { time: "2026-01-05", magnitude: 3 },
          { time: "2026-01-01", magnitude: 1 },
        ],
      },
      { label: "Errors", events: [{ time: "2026-01-03" }] },
    ]);
    expect(model.maxMagnitude).toBe(3);
    const deploys = model.lanes[0]!;
    expect(deploys.count).toBe(2);
    expect(deploys.drops[0]!.timeMs).toBeLessThan(deploys.drops[1]!.timeMs);
    expect(model.lanes[1]!.index).toBe(1);
  });
});
