import { describe, expect, it } from "vitest";
import { computeNestedPie, computeWaffle } from "./radial";

describe("computeWaffle", () => {
  it("allocates cells proportionally and fills the whole grid", () => {
    const { counts, cells } = computeWaffle(
      [
        { label: "A", value: 60 },
        { label: "B", value: 40 },
      ],
      10,
      10,
    );
    expect(counts).toEqual([60, 40]);
    expect(cells).toHaveLength(100);
    expect(cells.filter((c) => c.datumIndex === 0)).toHaveLength(60);
    expect(cells.filter((c) => c.datumIndex === 1)).toHaveLength(40);
  });

  it("uses largest remainder so counts always sum to the cell count", () => {
    const { counts } = computeWaffle(
      [
        { label: "A", value: 1 },
        { label: "B", value: 1 },
        { label: "C", value: 1 },
      ],
      10,
      10,
    );
    expect(counts.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("leaves cells empty when the total is zero", () => {
    const { cells } = computeWaffle([{ label: "A", value: 0 }], 5, 5);
    expect(cells.every((c) => c.datumIndex === -1)).toBe(true);
  });

  it("assigns row/col in row-major order", () => {
    const { cells } = computeWaffle([{ label: "A", value: 1 }], 2, 3);
    expect(cells[3]).toMatchObject({ row: 1, col: 0, index: 3 });
  });
});

describe("computeNestedPie", () => {
  it("rolls parent values up from children and aligns child spans", () => {
    const { arcs, maxDepth } = computeNestedPie([
      { label: "A", children: [{ label: "A1", value: 30 }, { label: "A2", value: 10 }] },
      { label: "B", value: 60 },
    ]);
    expect(maxDepth).toBe(2);
    const a = arcs.find((x) => x.label === "A")!;
    expect(a.value).toBe(40);
    const a1 = arcs.find((x) => x.label === "A1")!;
    // A1 must sit within A's angular span.
    expect(a1.start).toBeGreaterThanOrEqual(a.start);
    expect(a1.end).toBeLessThanOrEqual(a.end + 1e-9);
  });

  it("spans the full circle by default", () => {
    const { arcs } = computeNestedPie([{ label: "A", value: 1 }]);
    expect(arcs[0]!.start).toBeCloseTo(0);
    expect(arcs[0]!.end).toBeCloseTo(Math.PI * 2);
  });

  it("returns an empty layout for empty data", () => {
    expect(computeNestedPie([])).toEqual({ arcs: [], maxDepth: 0 });
  });
});
