import { timeExtentMs, toMs } from "../lib/time";

/** A single event occurrence within an event-drops row. */
export interface DropEvent {
  time: Date | string | number;
  /** Optional magnitude used to scale the drop radius/opacity. */
  magnitude?: number;
  label?: string;
}

/** A row of events keyed by category. */
export interface EventDropsRow {
  label: string;
  events: readonly DropEvent[];
  color?: string;
}

/** A positioned drop within a laid-out row. */
export interface DropPoint {
  timeMs: number;
  magnitude: number;
  label?: string;
}

/** A laid-out event-drops row. */
export interface EventDropsLane {
  label: string;
  index: number;
  /** Vertical center of the row (px). */
  y: number;
  color?: string;
  drops: DropPoint[];
  /** Number of events in the row. */
  count: number;
}

export interface EventDropsOptions {
  /** Height allotted to each row (px). Default 34. */
  rowHeight?: number;
}

export interface EventDropsModel {
  lanes: EventDropsLane[];
  min: number;
  max: number;
  /** Largest magnitude across all drops (>= 1). */
  maxMagnitude: number;
  /** Total stacked height of all rows (px). */
  contentHeight: number;
}

/**
 * Lay out categorical event streams into horizontal rows, one drop per event
 * positioned along a shared time axis. Rows preserve input order; magnitudes
 * are normalized against the global maximum for radius/opacity scaling.
 */
export function computeEventDrops(
  data: readonly EventDropsRow[],
  options: EventDropsOptions = {},
): EventDropsModel {
  const { rowHeight = 34 } = options;

  const allTimes: number[] = [];
  let maxMagnitude = 1;

  const lanes: EventDropsLane[] = data.map((row, index) => {
    const drops: DropPoint[] = row.events.map((event) => {
      const timeMs = toMs(event.time);
      const magnitude = event.magnitude ?? 1;
      allTimes.push(timeMs);
      if (magnitude > maxMagnitude) maxMagnitude = magnitude;
      return { timeMs, magnitude, label: event.label };
    });
    drops.sort((a, b) => a.timeMs - b.timeMs);
    return {
      label: row.label,
      index,
      y: index * rowHeight + rowHeight / 2,
      color: row.color,
      drops,
      count: drops.length,
    };
  });

  const [min, max] = timeExtentMs(allTimes);
  const contentHeight = data.length * rowHeight;
  return { lanes, min, max, maxMagnitude, contentHeight };
}
