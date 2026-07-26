import { describe, expect, it } from "vitest";
import { buildCalendarLayout } from "./layout";

describe("buildCalendarLayout", () => {
  it("aggregates values on the same day", () => {
    const end = new Date("2026-01-31T00:00:00Z");
    const layout = buildCalendarLayout({
      data: [
        { date: "2026-01-15", value: 2 },
        { date: "2026-01-15", value: 3 },
      ],
      start: new Date("2026-01-01T00:00:00Z"),
      end,
    });
    const cell = layout.cells.find((c) => c.key === "2026-01-15");
    expect(cell?.value).toBe(5);
    expect(layout.maxValue).toBe(5);
  });

  it("lays out days into 7 rows per week column", () => {
    const layout = buildCalendarLayout({
      data: [],
      start: new Date("2026-01-01T00:00:00Z"),
      end: new Date("2026-03-01T00:00:00Z"),
      weekStartsOn: 0,
    });
    for (const cell of layout.cells) {
      expect(cell.row).toBeGreaterThanOrEqual(0);
      expect(cell.row).toBeLessThan(7);
    }
    expect(layout.weeks).toBeGreaterThan(0);
  });

  it("flags days outside the requested range", () => {
    const layout = buildCalendarLayout({
      data: [],
      start: new Date("2026-01-05T00:00:00Z"),
      end: new Date("2026-01-20T00:00:00Z"),
      weekStartsOn: 0,
    });
    const before = layout.cells.find((c) => c.key === "2026-01-04");
    expect(before?.outOfRange).toBe(true);
  });
});
