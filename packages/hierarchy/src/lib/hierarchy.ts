/** Input tree node. Provide `value` on leaves; parents sum their children. */
export interface HierarchyDatum {
  name: string;
  value?: number;
  color?: string;
  children?: HierarchyDatum[];
}

/** A laid-out hierarchy node produced by `hierarchy()`. */
export interface HNode {
  data: HierarchyDatum;
  /** Distance from the root (root = 0). */
  depth: number;
  /** Distance to the deepest descendant leaf (leaf = 0). */
  height: number;
  /** Summed value (own value for leaves, sum of children otherwise). */
  value: number;
  parent: HNode | null;
  children?: HNode[];

  // Rectangular layouts (treemap, partition/icicle) — pixel space.
  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;

  // Radial / node-link layouts (tree, pack).
  x?: number;
  y?: number;
  r?: number;
}

/**
 * Build a hierarchy from nested data, computing `value` (sum of leaf values),
 * `depth` and `height` for every node. Pure and deterministic.
 */
export function hierarchy(data: HierarchyDatum): HNode {
  const root: HNode = { data, depth: 0, height: 0, value: 0, parent: null };

  const build = (node: HNode) => {
    const kids = node.data.children;
    if (kids && kids.length > 0) {
      node.children = kids.map((child) => {
        const c: HNode = { data: child, depth: node.depth + 1, height: 0, value: 0, parent: node };
        build(c);
        return c;
      });
    }
  };
  build(root);

  // value + height bottom-up
  const compute = (node: HNode): { value: number; height: number } => {
    if (!node.children || node.children.length === 0) {
      node.value = Math.max(0, node.data.value ?? 0);
      node.height = 0;
      return { value: node.value, height: 0 };
    }
    let sum = 0;
    let maxChildHeight = 0;
    for (const c of node.children) {
      const r = compute(c);
      sum += r.value;
      if (r.height + 1 > maxChildHeight) maxChildHeight = r.height + 1;
    }
    node.value = node.data.value != null && node.data.value > sum ? node.data.value : sum;
    node.height = maxChildHeight;
    return { value: node.value, height: node.height };
  };
  compute(root);

  return root;
}

/** All nodes in the subtree (including `node`), in pre-order. */
export function descendants(node: HNode): HNode[] {
  const out: HNode[] = [];
  const walk = (n: HNode) => {
    out.push(n);
    if (n.children) for (const c of n.children) walk(c);
  };
  walk(node);
  return out;
}

/** All leaf nodes in the subtree. */
export function leaves(node: HNode): HNode[] {
  return descendants(node).filter((n) => !n.children || n.children.length === 0);
}
