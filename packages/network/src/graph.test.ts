import { describe, expect, it } from "vitest";
import { adjacencyMatrix, bundle, catmullRomPath, normalizeGraph, orderByGroup, type XY } from "./graph";

const links = [
  { source: "a", target: "b" },
  { source: "b", target: "c", value: 2 },
  { source: "a", target: "c" },
];

describe("normalizeGraph", () => {
  it("derives nodes from links in first-seen order", () => {
    const g = normalizeGraph(undefined, links);
    expect(g.nodes.map((n) => n.id)).toEqual(["a", "b", "c"]);
    expect(g.nodes.map((n) => n.index)).toEqual([0, 1, 2]);
  });

  it("computes degree and defaults value to degree", () => {
    const g = normalizeGraph(undefined, links);
    const a = g.nodes.find((n) => n.id === "a")!;
    expect(a.degree).toBe(2);
    expect(a.value).toBe(2);
  });

  it("respects explicit node order, labels and values", () => {
    const g = normalizeGraph(
      [
        { id: "c", label: "Cee", group: 1 },
        { id: "a", value: 9 },
        { id: "b" },
      ],
      links,
    );
    expect(g.nodes.map((n) => n.id)).toEqual(["c", "a", "b"]);
    expect(g.nodes.find((n) => n.id === "c")!.label).toBe("Cee");
    expect(g.nodes.find((n) => n.id === "a")!.value).toBe(9);
  });

  it("drops links that reference unknown nodes", () => {
    const g = normalizeGraph([{ id: "a" }, { id: "b" }], [
      { source: "a", target: "b" },
      { source: "a", target: "zzz" },
    ]);
    expect(g.links).toHaveLength(1);
  });
});

describe("orderByGroup", () => {
  it("sorts by group then original index", () => {
    const g = normalizeGraph(
      [
        { id: "a", group: 1 },
        { id: "b", group: 0 },
        { id: "c", group: 1 },
        { id: "d", group: 0 },
      ],
      [],
    );
    expect(orderByGroup(g.nodes).map((n) => n.id)).toEqual(["b", "d", "a", "c"]);
  });
});

describe("adjacencyMatrix", () => {
  it("builds a symmetric matrix of summed link values", () => {
    const g = normalizeGraph([{ id: "a" }, { id: "b" }, { id: "c" }], links);
    const { matrix, max } = adjacencyMatrix(g);
    expect(matrix[0]![1]).toBe(1); // a-b
    expect(matrix[1]![0]).toBe(1); // symmetric
    expect(matrix[1]![2]).toBe(2); // b-c
    expect(matrix[0]![0]).toBe(0); // no self loop
    expect(max).toBe(2);
  });
});

describe("bundle", () => {
  it("returns endpoints unchanged and pulls the middle toward the straight line", () => {
    const pts: XY[] = [
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: 0, y: 0 },
    ];
    const out = bundle(pts, 0);
    // beta 0 => fully straight: middle point becomes the segment midpoint (0,0).
    expect(out[0]).toEqual({ x: 0, y: 0 });
    expect(out[2]).toEqual({ x: 0, y: 0 });
    expect(out[1]!.y).toBeCloseTo(0);
  });

  it("keeps points unchanged when beta = 1", () => {
    const pts: XY[] = [
      { x: 0, y: 0 },
      { x: 5, y: 9 },
      { x: 10, y: 0 },
    ];
    expect(bundle(pts, 1)).toEqual(pts);
  });
});

describe("catmullRomPath", () => {
  it("starts with a move command and emits cubic segments", () => {
    const d = catmullRomPath([
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 0 },
    ]);
    expect(d.startsWith("M0,0")).toBe(true);
    expect(d).toContain("C");
  });

  it("handles degenerate inputs", () => {
    expect(catmullRomPath([])).toBe("");
    expect(catmullRomPath([{ x: 3, y: 4 }])).toBe("M3,4");
  });
});
