import type { ZenithTheme } from "@zenith-visuals/core";
import { descendants, type HNode } from "./hierarchy";

/**
 * Assign a color to every node: explicit `data.color` wins, otherwise each
 * depth-1 subtree inherits a distinct palette color from its top ancestor.
 */
export function assignColors(theme: ZenithTheme, root: HNode): Map<HNode, string> {
  const map = new Map<HNode, string>();
  map.set(root, root.data.color ?? theme.colors.primary);
  const kids = root.children ?? [];
  kids.forEach((child, i) => {
    const base = child.data.color ?? theme.palette[i % theme.palette.length] ?? theme.colors.primary;
    for (const d of descendants(child)) {
      map.set(d, d.data.color ?? base);
    }
  });
  return map;
}
