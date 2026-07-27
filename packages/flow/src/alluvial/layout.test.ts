import { describe, expect, it } from "vitest";
import { computeAlluvialLayout } from "./layout";

const flows = [
  { path: ["Mobile", "Trial", "Paid"], value: 30 },
  { path: ["Mobile", "Trial", "Churn"], value: 10 },
  { path: ["Web", "Trial", "Paid"], value: 20 },
  { path: ["Web", "Direct", "Paid"], value: 15 },
];

const opts = { flows, width: 600, height: 300, palette: ["#a", "#b", "#c", "#d", "#e"] };

describe("computeAlluvialLayout", () => {
  it("detects the stage count", () => {
    expect(computeAlluvialLayout(opts).stageCount).toBe(3);
  });

  it("aggregates category values per stage", () => {
    const { nodes } = computeAlluvialLayout(opts);
    const mobile = nodes.find((n) => n.stage === 0 && n.category === "Mobile");
    const trial = nodes.find((n) => n.stage === 1 && n.category === "Trial");
    expect(mobile!.value).toBe(40);
    expect(trial!.value).toBe(60);
  });

  it("assigns a stable color per category across stages", () => {
    const { nodes } = computeAlluvialLayout(opts);
    const paidNodes = nodes.filter((n) => n.category === "Paid");
    expect(new Set(paidNodes.map((n) => n.color)).size).toBe(1);
  });

  it("emits ribbons for each adjacent stage transition", () => {
    const { ribbons } = computeAlluvialLayout(opts);
    // 4 flows × 2 transitions = 8 ribbons.
    expect(ribbons).toHaveLength(8);
    for (const r of ribbons) expect(r.width).toBeGreaterThan(0);
  });

  it("returns empty for no flows", () => {
    const empty = computeAlluvialLayout({ ...opts, flows: [] });
    expect(empty.nodes).toHaveLength(0);
    expect(empty.stageCount).toBe(0);
  });
});
