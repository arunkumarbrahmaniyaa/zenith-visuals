import { descendants, leaves, type HNode } from "./hierarchy";

/**
 * Tidy node-link tree layout. Assigns each node normalized `x` (0..1 across the
 * breadth) and `y` (0..1 by depth). Leaves are spread evenly; parents are
 * centered over their children. Deterministic and SSR-safe.
 */
export function treeLayout(root: HNode): void {
  const allLeaves = leaves(root);
  const leafCount = Math.max(1, allLeaves.length);
  const maxDepth = Math.max(1, root.height);
  let nextLeaf = 0;

  const first = (node: HNode) => {
    node.y = node.depth / maxDepth;
    if (!node.children || node.children.length === 0) {
      node.x = leafCount > 1 ? nextLeaf / (leafCount - 1) : 0.5;
      nextLeaf += 1;
    } else {
      for (const c of node.children) first(c);
      const firstChild = node.children[0]!;
      const lastChild = node.children[node.children.length - 1]!;
      node.x = ((firstChild.x ?? 0) + (lastChild.x ?? 0)) / 2;
    }
  };
  first(root);

  // Guarantee every node has coordinates.
  for (const n of descendants(root)) {
    if (n.x == null) n.x = 0.5;
    if (n.y == null) n.y = n.depth / maxDepth;
  }
}

/**
 * Cluster (dendrogram) layout. Like {@link treeLayout} but every leaf is placed
 * at the same maximum depth (`y = 1`), so the leaves align along one edge and
 * internal nodes sit at the mean breadth of their children. Deterministic and
 * SSR-safe.
 */
export function clusterLayout(root: HNode): void {
  const allLeaves = leaves(root);
  const leafCount = Math.max(1, allLeaves.length);
  const maxDepth = Math.max(1, root.height);
  let nextLeaf = 0;

  const first = (node: HNode) => {
    if (!node.children || node.children.length === 0) {
      node.x = leafCount > 1 ? nextLeaf / (leafCount - 1) : 0.5;
      node.y = 1; // leaves align at the deepest level
      nextLeaf += 1;
    } else {
      for (const c of node.children) first(c);
      const firstChild = node.children[0]!;
      const lastChild = node.children[node.children.length - 1]!;
      node.x = ((firstChild.x ?? 0) + (lastChild.x ?? 0)) / 2;
      node.y = node.depth / maxDepth;
    }
  };
  first(root);

  for (const n of descendants(root)) {
    if (n.x == null) n.x = 0.5;
    if (n.y == null) n.y = n.depth / maxDepth;
  }
}

