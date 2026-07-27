import type { HNode } from "./hierarchy";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

function worstRatio(areas: readonly number[], sum: number, short: number): number {
  if (sum <= 0 || short <= 0) return Infinity;
  const thickness = sum / short;
  let worst = 0;
  for (const a of areas) {
    const side = a / thickness;
    const ratio = Math.max(side / thickness, thickness / side);
    if (ratio > worst) worst = ratio;
  }
  return worst;
}

/**
 * Squarified treemap (Bruls, Huizing & van Wijk) layout of `areas` into the
 * rectangle. Returns a box per input area, index-aligned with `areas`.
 */
export function squarify(areas: readonly number[], x: number, y: number, w: number, h: number): Box[] {
  const out: Box[] = areas.map(() => ({ x: 0, y: 0, w: 0, h: 0 }));
  const order = areas.map((_, i) => i).sort((i, j) => areas[j]! - areas[i]!);
  const n = order.length;
  let cx = x;
  let cy = y;
  let cw = w;
  let ch = h;
  let i = 0;

  while (i < n) {
    const short = Math.min(cw, ch);
    const rowAreas: number[] = [];
    let rowSum = 0;
    let best = Infinity;
    let j = i;
    for (; j < n; j++) {
      const a = areas[order[j]!]!;
      const candidate = worstRatio([...rowAreas, a], rowSum + a, short);
      if (rowAreas.length > 0 && candidate > best) break;
      rowAreas.push(a);
      rowSum += a;
      best = candidate;
    }
    if (rowSum <= 0) {
      i = j > i ? j : i + 1;
      continue;
    }
    const thickness = rowSum / short;
    if (cw >= ch) {
      // vertical column of width `thickness`, items stacked top→bottom
      let yy = cy;
      for (let k = i; k < j; k++) {
        const idx = order[k]!;
        const a = areas[idx]!;
        const itemH = a / thickness;
        out[idx] = { x: cx, y: yy, w: thickness, h: itemH };
        yy += itemH;
      }
      cx += thickness;
      cw -= thickness;
    } else {
      // horizontal row of height `thickness`, items stacked left→right
      let xx = cx;
      for (let k = i; k < j; k++) {
        const idx = order[k]!;
        const a = areas[idx]!;
        const itemW = a / thickness;
        out[idx] = { x: xx, y: cy, w: itemW, h: thickness };
        xx += itemW;
      }
      cy += thickness;
      ch -= thickness;
    }
    i = j;
  }

  return out;
}

/**
 * Assign `x0,y0,x1,y1` (pixel space) to every node of the tree using a
 * squarified treemap. `padding` insets each parent before laying out children.
 */
export function treemapLayout(root: HNode, width: number, height: number, padding = 1): void {
  root.x0 = 0;
  root.y0 = 0;
  root.x1 = width;
  root.y1 = height;

  const layout = (node: HNode) => {
    const kids = node.children;
    if (!kids || kids.length === 0) return;
    const x0 = (node.x0 ?? 0) + padding;
    const y0 = (node.y0 ?? 0) + padding;
    const x1 = Math.max(x0, (node.x1 ?? 0) - padding);
    const y1 = Math.max(y0, (node.y1 ?? 0) - padding);
    const w = x1 - x0;
    const h = y1 - y0;
    const total = node.value || 1;
    const scale = (w * h) / total;
    const boxes = squarify(
      kids.map((c) => Math.max(0, c.value * scale)),
      x0,
      y0,
      w,
      h,
    );
    kids.forEach((c, i) => {
      const b = boxes[i]!;
      c.x0 = b.x;
      c.y0 = b.y;
      c.x1 = b.x + b.w;
      c.y1 = b.y + b.h;
      layout(c);
    });
  };
  layout(root);
}
