import type { HNode } from "./hierarchy";

/**
 * Partition layout. Assigns each node a normalized `x0..x1` span (proportional
 * to value within its parent) and `y0..y1` band by depth. Both are in [0, 1].
 * Consumed by Sunburst (angular) and Icicle (rectangular).
 */
export function partitionLayout(root: HNode): void {
  const dy = 1 / (root.height + 1);

  const recurse = (node: HNode, depth: number) => {
    node.y0 = depth * dy;
    node.y1 = node.y0 + dy;
    if (node.children && node.children.length > 0) {
      const span = (node.x1 ?? 1) - (node.x0 ?? 0);
      const total = node.value || 1;
      let x = node.x0 ?? 0;
      for (const c of node.children) {
        const w = (c.value / total) * span;
        c.x0 = x;
        c.x1 = x + w;
        x += w;
        recurse(c, depth + 1);
      }
    }
  };

  root.x0 = 0;
  root.x1 = 1;
  recurse(root, 0);
}
