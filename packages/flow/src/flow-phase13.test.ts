import { describe, expect, it } from "vitest";
import { buildParallelSetFlows, firstDimensionCategories } from "./parallel-sets/layout";
import { computePyramid } from "./pyramid/layout";
import { buildWheelMatrix } from "./dependency-wheel/layout";
import { flowBalance } from "./network-flow/layout";
import { computeJourney } from "./journey/layout";

describe("buildParallelSetFlows", () => {
  const rows = [
    { cls: "A", ok: "yes" },
    { cls: "A", ok: "yes" },
    { cls: "A", ok: "no" },
    { cls: "B", ok: "no" },
  ];

  it("aggregates identical paths and counts by default", () => {
    const flows = buildParallelSetFlows(rows, { dimensions: ["cls", "ok"] });
    const ayes = flows.find((f) => f.path[0] === "A" && f.path[1] === "yes");
    expect(ayes?.value).toBe(2);
    expect(flows).toHaveLength(3);
  });

  it("sums a numeric value key when provided", () => {
    const weighted = [
      { cls: "A", ok: "yes", n: 5 },
      { cls: "A", ok: "yes", n: 3 },
    ];
    const flows = buildParallelSetFlows(weighted, { dimensions: ["cls", "ok"], valueKey: "n" });
    expect(flows[0]!.value).toBe(8);
  });

  it("firstDimensionCategories lists first-seen order", () => {
    const flows = buildParallelSetFlows(rows, { dimensions: ["cls", "ok"] });
    expect(firstDimensionCategories(flows)).toEqual(["A", "B"]);
  });
});

describe("computePyramid", () => {
  it("mirrors bars around a central gutter on a shared scale", () => {
    const layout = computePyramid(
      [
        { label: "0–9", left: 100, right: 80 },
        { label: "10–19", left: 50, right: 60 },
      ],
      { width: 400, height: 200, gutter: 80 },
    );
    expect(layout.max).toBe(100);
    const gutterLeft = (400 - 80) / 2; // 160
    expect(layout.gutterLeft).toBe(gutterLeft);
    expect(layout.gutterRight).toBe(gutterLeft + 80);
    // Largest left bar spans the full half width and ends at the gutter.
    const first = layout.rows[0]!;
    expect(first.leftWidth).toBeCloseTo(gutterLeft);
    expect(first.leftX).toBeCloseTo(0);
    expect(first.rightX).toBe(layout.gutterRight);
  });

  it("returns empty rows for no data", () => {
    expect(computePyramid([], { width: 100, height: 100 }).rows).toEqual([]);
  });
});

describe("buildWheelMatrix", () => {
  it("builds a directed matrix in first-seen order", () => {
    const { ids, matrix } = buildWheelMatrix(undefined, [
      { source: "a", target: "b", value: 2 },
      { source: "b", target: "c" },
      { source: "a", target: "c", value: 3 },
    ]);
    expect(ids).toEqual(["a", "b", "c"]);
    expect(matrix[0]![1]).toBe(2); // a→b
    expect(matrix[1]![2]).toBe(1); // b→c
    expect(matrix[0]![2]).toBe(3); // a→c
    expect(matrix[1]![0]).toBe(0); // directed: no b→a
  });
});

describe("flowBalance", () => {
  it("computes inflow, outflow, throughput and source/sink flags", () => {
    const bal = flowBalance([
      { source: "in", target: "svc", value: 8 },
      { source: "svc", target: "out", value: 5 },
      { source: "svc", target: "err", value: 3 },
    ]);
    const svc = bal.find((b) => b.id === "svc")!;
    expect(svc.inflow).toBe(8);
    expect(svc.outflow).toBe(8);
    expect(svc.through).toBe(8);
    expect(svc.net).toBe(0);
    expect(bal.find((b) => b.id === "in")!.isSource).toBe(true);
    expect(bal.find((b) => b.id === "out")!.isSink).toBe(true);
  });
});

describe("computeJourney", () => {
  it("tapers band height with volume and reports drop-off", () => {
    const layout = computeJourney(
      [
        { label: "Visit", value: 1000 },
        { label: "Signup", value: 400 },
        { label: "Purchase", value: 100 },
      ],
      { width: 600, height: 300 },
    );
    expect(layout.max).toBe(1000);
    expect(layout.stages).toHaveLength(3);
    expect(layout.stages[0]!.dropFromPrev).toBeNull();
    expect(layout.stages[1]!.dropFromPrev).toBeCloseTo(0.6);
    // Taller band for the larger stage.
    expect(layout.stages[0]!.height).toBeGreaterThan(layout.stages[2]!.height);
    expect(layout.segments).toHaveLength(2);
  });

  it("adds a sentiment strip only when sentiment is present", () => {
    const withSentiment = computeJourney([{ label: "A", value: 10, sentiment: 0.5 }], {
      width: 200,
      height: 200,
    });
    expect(withSentiment.hasSentiment).toBe(true);
    expect(withSentiment.stages[0]!.sentimentY).not.toBeNull();
  });
});
