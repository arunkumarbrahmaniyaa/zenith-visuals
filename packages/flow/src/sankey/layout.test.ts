import { describe, expect, it } from "vitest";
import { computeSankeyLayout } from "./layout";

const palette = ["#111", "#222", "#333", "#444"];

describe("computeSankeyLayout", () => {
  it("assigns increasing depth along the flow", () => {
    const { nodes } = computeSankeyLayout({
      links: [
        { source: "A", target: "B", value: 5 },
        { source: "B", target: "C", value: 5 },
      ],
      width: 300,
      height: 200,
      palette,
    });
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    expect(byId.A!.depth).toBe(0);
    expect(byId.B!.depth).toBe(1);
    expect(byId.C!.depth).toBe(2);
    expect(byId.A!.x0).toBeLessThan(byId.C!.x0);
  });

  it("scales node value from max of in/out flow", () => {
    const { nodes } = computeSankeyLayout({
      links: [
        { source: "A", target: "C", value: 3 },
        { source: "B", target: "C", value: 7 },
      ],
      width: 300,
      height: 200,
      palette,
    });
    const c = nodes.find((n) => n.id === "C");
    expect(c?.value).toBe(10);
  });

  it("produces a bezier path for every link", () => {
    const { links } = computeSankeyLayout({
      links: [{ source: "A", target: "B", value: 1 }],
      width: 200,
      height: 100,
      palette,
    });
    expect(links).toHaveLength(1);
    expect(links[0]!.path.startsWith("M")).toBe(true);
    expect(links[0]!.width).toBeGreaterThan(0);
  });

  it("ignores non-positive link values", () => {
    const { links } = computeSankeyLayout({
      links: [
        { source: "A", target: "B", value: 0 },
        { source: "A", target: "B", value: -4 },
      ],
      width: 200,
      height: 100,
      palette,
    });
    expect(links).toHaveLength(0);
  });
});
