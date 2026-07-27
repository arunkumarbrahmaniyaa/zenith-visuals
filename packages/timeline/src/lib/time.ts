import { formatDate } from "@zenith-visuals/utils";

/** A resolved axis tick with its millisecond value and display label. */
export interface TimeTick {
  value: number;
  label: string;
}

const HOUR = 3_600_000;
const DAY = 86_400_000;

/** Candidate "nice" tick spacings, ascending, from 1h up to 1 year. */
const TIME_STEPS = [
  HOUR,
  2 * HOUR,
  3 * HOUR,
  6 * HOUR,
  12 * HOUR,
  DAY,
  2 * DAY,
  7 * DAY,
  14 * DAY,
  30 * DAY,
  90 * DAY,
  180 * DAY,
  365 * DAY,
];

/** Coerce a Date or date-like string/number into epoch milliseconds. */
export function toMs(value: Date | string | number): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  return new Date(value).getTime();
}

/**
 * Compute the [min, max] millisecond extent of a set of times, guaranteeing a
 * non-degenerate span (expands by one day when all values are equal or empty).
 */
export function timeExtentMs(times: readonly number[]): [number, number] {
  if (times.length === 0) return [0, DAY];
  let min = times[0]!;
  let max = times[0]!;
  for (const t of times) {
    if (t < min) min = t;
    if (t > max) max = t;
  }
  if (min === max) max = min + DAY;
  return [min, max];
}

/**
 * Produce evenly spaced, human-friendly time ticks across [min, max].
 * The label granularity adapts to the chosen step (time-of-day for sub-day
 * steps, day/month otherwise).
 */
export function niceTimeTicks(
  min: number,
  max: number,
  target = 6,
  locale = "en-US",
): TimeTick[] {
  const span = Math.max(1, max - min);
  const rough = span / Math.max(1, target);
  let step = TIME_STEPS[TIME_STEPS.length - 1]!;
  for (const candidate of TIME_STEPS) {
    if (candidate >= rough) {
      step = candidate;
      break;
    }
  }
  const options: Intl.DateTimeFormatOptions & { locale?: string } =
    step < DAY
      ? { locale, hour: "numeric", minute: "2-digit" }
      : step < 30 * DAY
        ? { locale, month: "short", day: "numeric" }
        : { locale, month: "short", year: "2-digit" };

  const first = Math.ceil(min / step) * step;
  const ticks: TimeTick[] = [];
  for (let t = first; t <= max; t += step) {
    ticks.push({ value: t, label: formatDate(new Date(t), options) });
  }
  return ticks;
}

/** An item that occupies a time interval, used for lane packing. */
export interface TimeInterval {
  startMs: number;
  endMs: number;
}

/**
 * Greedily pack time intervals into the minimum number of non-overlapping
 * lanes (interval-graph coloring). Items are processed in start order; each is
 * placed in the first lane whose last item has already ended.
 *
 * @returns each input paired with its assigned lane index and the total lane count.
 */
export function packLanes<T extends TimeInterval>(
  items: readonly T[],
): { placements: { item: T; lane: number }[]; laneCount: number } {
  const sorted = [...items].sort(
    (a, b) => a.startMs - b.startMs || a.endMs - b.endMs,
  );
  const laneEnds: number[] = [];
  const placements: { item: T; lane: number }[] = [];

  for (const item of sorted) {
    let lane = -1;
    for (let i = 0; i < laneEnds.length; i++) {
      if (laneEnds[i]! <= item.startMs) {
        lane = i;
        break;
      }
    }
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.endMs);
    } else {
      laneEnds[lane] = item.endMs;
    }
    placements.push({ item, lane });
  }

  return { placements, laneCount: Math.max(1, laneEnds.length) };
}
