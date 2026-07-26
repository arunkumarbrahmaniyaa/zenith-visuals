import {
  addDays,
  dayKey,
  diffInDays,
  eachDayOfInterval,
  startOfDay,
  startOfWeek,
} from "@zenith-visuals/utils";

export interface CalendarDatum {
  /** Date of the observation (Date or ISO string). */
  date: Date | string;
  /** Numeric magnitude used for color intensity. */
  value: number;
}

export interface CalendarCell {
  date: Date;
  key: string;
  value: number;
  /** Column (week) index. */
  col: number;
  /** Row (weekday) index, 0 = top row. */
  row: number;
  /** True if the day falls outside the requested [start, end] range. */
  outOfRange: boolean;
}

export interface CalendarLayout {
  cells: CalendarCell[];
  weeks: number;
  start: Date;
  end: Date;
  maxValue: number;
  /** Month label anchors: column index -> short month name. */
  monthLabels: { col: number; label: string }[];
}

export interface BuildLayoutOptions {
  data: readonly CalendarDatum[];
  start?: Date;
  end?: Date;
  weekStartsOn?: number;
  /** Number of days shown when start/end are not provided (default 365). */
  rangeDays?: number;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Aggregate daily values and lay them out as a GitHub-style grid of week
 * columns × weekday rows. Pure and deterministic — safe for SSR and testing.
 */
export function buildCalendarLayout(options: BuildLayoutOptions): CalendarLayout {
  const { data, weekStartsOn = 0, rangeDays = 365 } = options;

  const totals = new Map<string, number>();
  for (const datum of data) {
    const d = typeof datum.date === "string" ? new Date(datum.date) : datum.date;
    if (Number.isNaN(d.getTime())) continue;
    const key = dayKey(d);
    totals.set(key, (totals.get(key) ?? 0) + datum.value);
  }

  const end = startOfDay(options.end ?? new Date());
  const rangeStart = options.start ? startOfDay(options.start) : addDays(end, -(rangeDays - 1));
  const gridStart = startOfWeek(rangeStart, weekStartsOn);

  const days = eachDayOfInterval(gridStart, end);
  const cells: CalendarCell[] = [];
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;
  let maxValue = 0;

  for (const date of days) {
    const dayOffset = diffInDays(gridStart, date);
    const col = Math.floor(dayOffset / 7);
    const row = dayOffset % 7;
    const key = dayKey(date);
    const value = totals.get(key) ?? 0;
    if (value > maxValue) maxValue = value;

    const outOfRange = date.getTime() < rangeStart.getTime() || date.getTime() > end.getTime();
    cells.push({ date, key, value, col, row, outOfRange });

    const month = date.getUTCMonth();
    if (row === 0 && month !== lastMonth) {
      monthLabels.push({ col, label: MONTHS[month]! });
      lastMonth = month;
    }
  }

  const weeks = Math.floor(diffInDays(gridStart, end) / 7) + 1;
  return { cells, weeks, start: rangeStart, end, maxValue, monthLabels };
}
