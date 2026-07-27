import { packLanes, timeExtentMs, toMs } from "../lib/time";

/**
 * An event within a swimlane. Provide `end` for a spanning event, or omit it
 * (or set it equal to `start`) for a point milestone.
 */
export interface SwimlaneEvent {
  id: string;
  /** Owning lane key. */
  lane: string;
  label?: string;
  start: Date | string | number;
  end?: Date | string | number;
  color?: string;
}

/** A positioned event within a swimlane. */
export interface SwimlaneItem {
  id: string;
  lane: string;
  label: string;
  startMs: number;
  endMs: number;
  /** Sub-lane index within the lane band (overlapping events stack). */
  row: number;
  milestone: boolean;
  color?: string;
}

/** A laid-out swimlane band with its packed events. */
export interface SwimlaneBand {
  lane: string;
  /** Index of the lane in first-seen order (used for palette color). */
  index: number;
  rowCount: number;
  /** Top y offset of the band (px). */
  y: number;
  /** Total band height (px). */
  height: number;
  items: SwimlaneItem[];
}

export interface SwimlaneOptions {
  /** Height of a single stacked event row (px). Default 26. */
  eventHeight?: number;
  /** Vertical gap between stacked rows within a lane (px). Default 4. */
  rowGap?: number;
  /** Vertical padding inside each lane band (px). Default 6. */
  bandPadding?: number;
  /** Vertical gap between lane bands (px). Default 6. */
  laneGap?: number;
}

export interface SwimlaneModel {
  bands: SwimlaneBand[];
  lanes: string[];
  min: number;
  max: number;
  /** Total stacked height of all bands (px). */
  contentHeight: number;
}

/**
 * Lay out events into horizontal swimlane bands (one per lane key). Point
 * events (no `end`) become milestones; overlapping events within a lane are
 * stacked into sub-rows via interval packing.
 */
export function computeSwimlane(
  data: readonly SwimlaneEvent[],
  options: SwimlaneOptions = {},
): SwimlaneModel {
  const {
    eventHeight = 26,
    rowGap = 4,
    bandPadding = 6,
    laneGap = 6,
  } = options;

  const normalized = data.map((event) => {
    const startMs = toMs(event.start);
    const endMs = event.end == null ? startMs : toMs(event.end);
    return {
      ...event,
      label: event.label ?? "",
      startMs,
      endMs,
      milestone: endMs <= startMs,
    };
  });

  const [min, max] = timeExtentMs(
    normalized.flatMap((e) => [e.startMs, e.endMs]),
  );

  // Preserve first-seen lane order.
  const lanes: string[] = [];
  const byLane = new Map<string, typeof normalized>();
  for (const event of normalized) {
    let bucket = byLane.get(event.lane);
    if (!bucket) {
      bucket = [];
      byLane.set(event.lane, bucket);
      lanes.push(event.lane);
    }
    bucket.push(event);
  }

  const bands: SwimlaneBand[] = [];
  let y = 0;
  lanes.forEach((lane, index) => {
    const bucket = byLane.get(lane)!;
    // Milestones are treated as tiny intervals so they pack sensibly.
    const { placements, laneCount } = packLanes(bucket);
    const items: SwimlaneItem[] = placements.map(({ item, lane: row }) => ({
      id: item.id,
      lane: item.lane,
      label: item.label,
      startMs: item.startMs,
      endMs: item.endMs,
      row,
      milestone: item.milestone,
      color: item.color,
    }));
    const inner = laneCount * eventHeight + (laneCount - 1) * rowGap;
    const height = inner + bandPadding * 2;
    bands.push({ lane, index, rowCount: laneCount, y, height, items });
    y += height + laneGap;
  });

  const contentHeight = Math.max(0, y - laneGap);
  return { bands, lanes, min, max, contentHeight };
}
