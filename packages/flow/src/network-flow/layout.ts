import type { SankeyLinkInput } from "../sankey/layout";

export interface FlowBalance {
  id: string;
  /** Total incoming flow. */
  inflow: number;
  /** Total outgoing flow. */
  outflow: number;
  /** Throughput = max(inflow, outflow). */
  through: number;
  /** inflow − outflow (positive = sink, negative = source). */
  net: number;
  /** No incoming links. */
  isSource: boolean;
  /** No outgoing links. */
  isSink: boolean;
}

/**
 * Compute per-node flow balance for a directed weighted graph: inflow, outflow,
 * throughput and net. Nodes are returned in first-seen order. Pure and
 * deterministic (SSR-safe, testable).
 */
export function flowBalance(links: readonly SankeyLinkInput[]): FlowBalance[] {
  const order: string[] = [];
  const seen = new Set<string>();
  const inflow = new Map<string, number>();
  const outflow = new Map<string, number>();

  const touch = (id: string) => {
    if (!seen.has(id)) {
      seen.add(id);
      order.push(id);
    }
  };

  for (const l of links) {
    const v = Math.max(0, l.value);
    touch(l.source);
    touch(l.target);
    outflow.set(l.source, (outflow.get(l.source) ?? 0) + v);
    inflow.set(l.target, (inflow.get(l.target) ?? 0) + v);
  }

  return order.map((id) => {
    const inf = inflow.get(id) ?? 0;
    const outf = outflow.get(id) ?? 0;
    return {
      id,
      inflow: inf,
      outflow: outf,
      through: Math.max(inf, outf),
      net: inf - outf,
      isSource: inf === 0,
      isSink: outf === 0,
    };
  });
}
