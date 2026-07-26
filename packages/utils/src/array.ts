/**
 * Return the [min, max] extent of a list of values.
 * Returns [0, 0] for empty input.
 */
export function extent<T>(
  items: readonly T[],
  accessor: (item: T) => number = (v) => v as unknown as number,
): [number, number] {
  if (items.length === 0) return [0, 0];
  let min = Infinity;
  let max = -Infinity;
  for (const item of items) {
    const value = accessor(item);
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return [min, max];
}

/**
 * Sum a list of values via an optional accessor.
 */
export function sum<T>(
  items: readonly T[],
  accessor: (item: T) => number = (v) => v as unknown as number,
): number {
  let total = 0;
  for (const item of items) total += accessor(item);
  return total;
}

/**
 * Group a list of items into a Map keyed by the result of `keyFn`.
 */
export function groupBy<T, K>(
  items: readonly T[],
  keyFn: (item: T) => K,
): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}

/**
 * Stable unique-by helper preserving first occurrence.
 */
export function uniqueBy<T, K>(items: readonly T[], keyFn: (item: T) => K): T[] {
  const seen = new Set<K>();
  const result: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}
