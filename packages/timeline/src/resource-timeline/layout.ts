import { packLanes, timeExtentMs, toMs } from "../lib/time";

/** A single scheduled allocation belonging to a resource row. */
export interface ResourceTask {
  id: string;
  /** Owning resource (row) key. */
  resource: string;
  /** Optional bar label. */
  label?: string;
  start: Date | string | number;
  end: Date | string | number;
  color?: string;
}

/** A positioned bar within a resource row. */
export interface ResourceBar {
  id: string;
  resource: string;
  label: string;
  startMs: number;
  endMs: number;
  /** Sub-lane index within the row (overlapping tasks stack). */
  lane: number;
  color?: string;
}

/** A laid-out resource row with its stacked bars. */
export interface ResourceRow {
  resource: string;
  /** Number of stacked sub-lanes required for overlapping tasks. */
  laneCount: number;
  /** Top y offset of the row (px). */
  y: number;
  /** Total row height (px). */
  height: number;
  bars: ResourceBar[];
  /** Total busy time across the row (ms), ignoring overlap double-counting. */
  busyMs: number;
}

export interface ResourceTimelineOptions {
  /** Height of a single stacked bar (px). Default 22. */
  barHeight?: number;
  /** Vertical gap between stacked sub-lanes (px). Default 3. */
  laneGap?: number;
  /** Vertical gap between resource rows (px). Default 8. */
  rowGap?: number;
}

export interface ResourceTimelineModel {
  rows: ResourceRow[];
  resources: string[];
  min: number;
  max: number;
  /** Total stacked height of all rows (px). */
  contentHeight: number;
}

/**
 * Lay out resource allocations into per-resource rows. Overlapping tasks
 * within a resource are stacked into sub-lanes via interval packing, and each
 * row is sized to fit its deepest overlap.
 */
export function computeResourceTimeline(
  data: readonly ResourceTask[],
  options: ResourceTimelineOptions = {},
): ResourceTimelineModel {
  const { barHeight = 22, laneGap = 3, rowGap = 8 } = options;

  const normalized = data.map((task) => ({
    ...task,
    label: task.label ?? "",
    startMs: toMs(task.start),
    endMs: toMs(task.end),
  }));

  const [min, max] = timeExtentMs(
    normalized.flatMap((t) => [t.startMs, t.endMs]),
  );

  // Preserve first-seen resource order.
  const resources: string[] = [];
  const byResource = new Map<string, typeof normalized>();
  for (const task of normalized) {
    let bucket = byResource.get(task.resource);
    if (!bucket) {
      bucket = [];
      byResource.set(task.resource, bucket);
      resources.push(task.resource);
    }
    bucket.push(task);
  }

  const rows: ResourceRow[] = [];
  let y = 0;
  for (const resource of resources) {
    const bucket = byResource.get(resource)!;
    const { placements, laneCount } = packLanes(bucket);
    const bars: ResourceBar[] = placements.map(({ item, lane }) => ({
      id: item.id,
      resource: item.resource,
      label: item.label,
      startMs: item.startMs,
      endMs: item.endMs,
      lane,
      color: item.color,
    }));
    const busyMs = bucket.reduce((sum, t) => sum + (t.endMs - t.startMs), 0);
    const height = laneCount * barHeight + (laneCount - 1) * laneGap;
    rows.push({ resource, laneCount, y, height, bars, busyMs });
    y += height + rowGap;
  }

  const contentHeight = Math.max(0, y - rowGap);
  return { rows, resources, min, max, contentHeight };
}
