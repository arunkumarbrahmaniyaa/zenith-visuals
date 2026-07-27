import { describe, expect, it } from "vitest";
import { computeChordLayout } from "./layout";

const matrix = [
  [0, 5, 6],
  [7, 0, 8],
  [9, 4, 0],
];

describe("computeChordLayout", () => {
  it("creates one group per row with arcs summing to the row total", () => {
    const { groups } = computeChordLayout(matrix, 0);
    expect(groups).toHaveLength(3);
    expect(groups[0]!.value).toBe(11);
    expect(groups[1]!.value).toBe(15);
    expect(groups[2]!.value).toBe(13);
  });

  it("spans the full circle when padAngle is 0", () => {
    const { groups } = computeChordLayout(matrix, 0);
    expect(groups[0]!.startAngle).toBeCloseTo(0);
    const last = groups[groups.length - 1]!;
    expect(last.endAngle).toBeCloseTo(Math.PI * 2);
  });

  it("emits one ribbon per unordered pair (incl. none for zero flow)", () => {
    const { chords } = computeChordLayout(matrix, 0);
    // pairs: (0,1),(0,2),(1,2) — diagonal is zero so no self loops.
    expect(chords).toHaveLength(3);
  });

  it("returns empty for an empty or zero matrix", () => {
    expect(computeChordLayout([]).groups).toHaveLength(0);
    expect(computeChordLayout([[0, 0], [0, 0]]).chords).toHaveLength(0);
  });
});
