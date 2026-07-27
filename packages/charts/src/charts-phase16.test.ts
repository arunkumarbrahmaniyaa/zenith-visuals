import { describe, expect, it } from "vitest";
import { buildMatrix, computePolarArea } from "./lib/matrix";

describe("buildMatrix", () => {
  it("builds a dense grid in first-seen order with null gaps", () => {
    const m = buildMatrix([
      { row: "A", col: "x", value: 1 },
      { row: "B", col: "y", value: 4 },
      { row: "A", col: "y", value: 2 },
    ]);
    expect(m.rows).toEqual(["A", "B"]);
    expect(m.cols).toEqual(["x", "y"]);
    expect(m.cells).toHaveLength(4);
    // B/x is missing → null
    const bx = m.cells.find((c) => c.row === "B" && c.col === "x");
    expect(bx?.value).toBeNull();
    expect(m.min).toBe(1);
    expect(m.max).toBe(4);
  });

  it("respects explicit row/col ordering", () => {
    const m = buildMatrix([{ row: "A", col: "x", value: 1 }], { rows: ["Z", "A"], cols: ["x"] });
    expect(m.rows).toEqual(["Z", "A"]);
    expect(m.cells).toHaveLength(2);
  });

  it("defaults extent for empty data and pads a flat extent", () => {
    expect(buildMatrix([])).toMatchObject({ min: 0, max: 1 });
    const flat = buildMatrix([
      { row: "A", col: "x", value: 5 },
      { row: "B", col: "x", value: 5 },
    ]);
    expect(flat.min).toBe(5);
    expect(flat.max).toBe(6);
  });
});

describe("computePolarArea", () => {
  it("stacks series radially per category and tracks the max total", () => {
    const layout = computePolarArea(
      ["Q1", "Q2"],
      [
        { name: "Web", data: [3, 5] },
        { name: "App", data: [2, 1] },
      ],
    );
    expect(layout.slices).toHaveLength(2);
    const q1 = layout.slices[0]!;
    expect(q1.total).toBe(5);
    expect(q1.segments[0]).toMatchObject({ series: "Web", from: 0, to: 3 });
    expect(q1.segments[1]).toMatchObject({ series: "App", from: 3, to: 5 });
    expect(layout.max).toBe(6); // Q2: 5 + 1
  });

  it("clamps negatives to zero and tolerates missing values", () => {
    const layout = computePolarArea(["A"], [{ name: "S", data: [-4] }, { name: "T", data: [] }]);
    const slice = layout.slices[0]!;
    expect(slice.total).toBe(0);
    expect(slice.segments[0]!.value).toBe(0);
    expect(slice.segments[1]!.value).toBe(0);
  });
});
