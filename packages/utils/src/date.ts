const DAY_MS = 86_400_000;

/**
 * Return a new date at UTC midnight for the given date (timezone-stable keys).
 */
export function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Add `days` to a date, returning a new Date.
 */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/**
 * Number of whole days between two dates (b - a).
 */
export function diffInDays(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
}

/**
 * Start of the week containing `date`. `weekStartsOn` is 0 (Sun) .. 6 (Sat).
 */
export function startOfWeek(date: Date, weekStartsOn = 0): Date {
  const start = startOfDay(date);
  const day = start.getUTCDay();
  const diff = (day - weekStartsOn + 7) % 7;
  return addDays(start, -diff);
}

/**
 * All days in the inclusive interval [start, end].
 */
export function eachDayOfInterval(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  let cursor = startOfDay(start);
  const last = startOfDay(end);
  while (cursor.getTime() <= last.getTime()) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

/**
 * Stable YYYY-MM-DD key (UTC) for indexing values by day.
 */
export function dayKey(date: Date): string {
  return startOfDay(date).toISOString().slice(0, 10);
}

const DATE_FORMATTERS = new Map<string, Intl.DateTimeFormat>();

/**
 * Locale/timezone-aware date formatting with memoized formatters.
 */
export function formatDate(
  date: Date,
  options: Intl.DateTimeFormatOptions & { locale?: string } = {},
): string {
  const { locale = "en-US", ...rest } = options;
  const key = locale + JSON.stringify(rest);
  let formatter = DATE_FORMATTERS.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, rest);
    DATE_FORMATTERS.set(key, formatter);
  }
  return formatter.format(date);
}
