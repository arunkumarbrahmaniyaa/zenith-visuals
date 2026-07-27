import type { AlluvialFlow } from "../alluvial/layout";

export type ParallelSetsRecord = Record<string, string | number>;

export interface ParallelSetsOptions {
  /** Ordered categorical dimension keys to read from each record. */
  dimensions: readonly string[];
  /** Optional numeric key used as the weight of each record. Default: count of 1. */
  valueKey?: string;
}

/**
 * Aggregate tabular records into unique multi-dimension flows for a parallel
 * sets diagram. Records that share the same category on every dimension are
 * summed into a single flow. Flows are sorted by their category path so ribbons
 * of the same first-dimension category stay grouped. Pure and deterministic.
 */
export function buildParallelSetFlows(
  data: readonly ParallelSetsRecord[],
  options: ParallelSetsOptions,
): AlluvialFlow[] {
  const { dimensions, valueKey } = options;
  if (dimensions.length === 0) return [];

  const byPath = new Map<string, { path: string[]; value: number }>();
  for (const row of data) {
    const path = dimensions.map((dim) => String(row[dim] ?? "—"));
    const raw = valueKey != null ? Number(row[valueKey]) : 1;
    const value = Number.isFinite(raw) ? raw : 0;
    if (value <= 0) continue;
    const key = path.join("\u0000");
    const existing = byPath.get(key);
    if (existing) existing.value += value;
    else byPath.set(key, { path, value });
  }

  return [...byPath.values()]
    .sort((a, b) => {
      for (let i = 0; i < a.path.length; i++) {
        const cmp = a.path[i]!.localeCompare(b.path[i]!);
        if (cmp !== 0) return cmp;
      }
      return 0;
    })
    .map((f) => ({ path: f.path, value: f.value }));
}

/** Distinct categories of the first dimension, in first-seen order. */
export function firstDimensionCategories(flows: readonly AlluvialFlow[]): string[] {
  const seen: string[] = [];
  const set = new Set<string>();
  for (const f of flows) {
    const cat = f.path[0];
    if (cat !== undefined && !set.has(cat)) {
      set.add(cat);
      seen.push(cat);
    }
  }
  return seen;
}
