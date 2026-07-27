import { describe, expect, it } from "vitest";
import { hierarchy, descendants, leaves } from "./hierarchy";
import { treemapLayout } from "./treemap";
import { packLayout } from "./pack";
import { partitionLayout } from "./partition";
import { treeLayout, clusterLayout } from "./tree";
import type { HierarchyDatum } from "./hierarchy";

const data: HierarchyDatum = {
  name: "root",
  children: [
    { name: "A", children: [{ name: "a1", value: 3 }, { name: "a2", value: 5 }] },
    { name: "B", value: 2 },
  ],
};

describe("hierarchy", () => {
  it("sums leaf values bottom-up", () => {
    const root = hierarchy(data);
    expect(root.value).toBe(10);
    expect(root.children![0]!.value).toBe(8);
    expect(root.children![1]!.value).toBe(2);
  });

  it("computes depth and height", () => {
    const root = hierarchy(data);
    expect(root.depth).toBe(0);
    expect(root.height).toBe(2);
    expect(root.children![0]!.depth).toBe(1);
    expect(root.children![0]!.height).toBe(1);
  });

  it("descendants includes all nodes; leaves only leaves", () => {
    const root = hierarchy(data);
    expect(descendants(root)).toHaveLength(5);
    expect(leaves(root).map((n) => n.data.name).sort()).toEqual(["B", "a1", "a2"]);
  });
});

describe("treemapLayout", () => {
  it("fits all leaves inside the bounds", () => {
    const root = hierarchy(data);
    treemapLayout(root, 200, 100, 0);
    for (const n of leaves(root)) {
      expect(n.x0!).toBeGreaterThanOrEqual(-1e-6);
      expect(n.y0!).toBeGreaterThanOrEqual(-1e-6);
      expect(n.x1!).toBeLessThanOrEqual(200 + 1e-6);
      expect(n.y1!).toBeLessThanOrEqual(100 + 1e-6);
    }
  });
});

describe("partitionLayout", () => {
  it("normalizes x within [0,1] and orders by depth", () => {
    const root = hierarchy(data);
    partitionLayout(root);
    expect(root.x0).toBeCloseTo(0);
    expect(root.x1).toBeCloseTo(1);
    expect(root.y0).toBeCloseTo(0);
    for (const n of descendants(root)) {
      expect(n.x0!).toBeGreaterThanOrEqual(-1e-6);
      expect(n.x1!).toBeLessThanOrEqual(1 + 1e-6);
    }
  });
});

describe("packLayout", () => {
  it("keeps every circle inside the square", () => {
    const root = hierarchy(data);
    packLayout(root, 300, 2);
    for (const n of descendants(root)) {
      expect(n.r!).toBeGreaterThan(0);
      expect((n.x! - n.r!)).toBeGreaterThanOrEqual(-1);
      expect((n.y! - n.r!)).toBeGreaterThanOrEqual(-1);
      expect((n.x! + n.r!)).toBeLessThanOrEqual(301);
      expect((n.y! + n.r!)).toBeLessThanOrEqual(301);
    }
  });
});

describe("treeLayout", () => {
  it("places the root at y=0 and centers parents over children", () => {
    const root = hierarchy(data);
    treeLayout(root);
    expect(root.y).toBeCloseTo(0);
    const a = root.children![0]!;
    expect(a.x).toBeCloseTo(((a.children![0]!.x ?? 0) + (a.children![1]!.x ?? 0)) / 2);
    // Deepest leaves sit at y=1; a shallower leaf keeps its own depth.
    expect(a.children![0]!.y).toBeCloseTo(1);
    expect(root.children![1]!.y).toBeCloseTo(0.5);
  });
});

describe("clusterLayout", () => {
  it("aligns every leaf at y=1 regardless of depth", () => {
    const root = hierarchy(data);
    clusterLayout(root);
    for (const n of leaves(root)) expect(n.y).toBeCloseTo(1);
    // Internal nodes stay above the leaf line.
    expect(root.y).toBeCloseTo(0);
    expect(root.children![0]!.y).toBeLessThan(1);
  });
});
