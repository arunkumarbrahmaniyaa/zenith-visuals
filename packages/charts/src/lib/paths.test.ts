import { describe, expect, it } from "vitest";
import { stepPath } from "./paths";

const pts = [
  { x: 0, y: 10 },
  { x: 10, y: 5 },
  { x: 20, y: 8 },
];

describe("stepPath", () => {
  it("holds each value until the next x with mode 'after'", () => {
    expect(stepPath(pts, "after")).toBe("M0.00,10.00 L10.00,10.00 L10.00,5.00 L20.00,5.00 L20.00,8.00");
  });

  it("jumps to the next value first with mode 'before'", () => {
    expect(stepPath(pts, "before")).toBe("M0.00,10.00 L0.00,5.00 L10.00,5.00 L10.00,8.00 L20.00,8.00");
  });

  it("risers halfway between points with mode 'center'", () => {
    expect(stepPath(pts, "center")).toBe(
      "M0.00,10.00 L5.00,10.00 L5.00,5.00 L10.00,5.00 L15.00,5.00 L15.00,8.00 L20.00,8.00",
    );
  });

  it("returns an empty string for no points", () => {
    expect(stepPath([])).toBe("");
  });
});
