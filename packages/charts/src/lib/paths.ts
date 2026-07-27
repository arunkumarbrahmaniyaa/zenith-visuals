export interface XY {
  x: number;
  y: number;
}

/** Build an SVG polyline path (`M … L …`) through the given points. */
export function linePath(points: readonly XY[]): string {
  if (points.length === 0) return "";
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");
}

/**
 * Build a smooth SVG path through the points using a monotone-ish Catmull-Rom
 * to Bézier conversion. Deterministic and dependency-free.
 */
export function smoothPath(points: readonly XY[], tension = 0.5): string {
  const n = points.length;
  if (n < 3) return linePath(points);
  const first = points[0]!;
  let d = `M${first.x.toFixed(2)},${first.y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[Math.min(n - 1, i + 2)]!;
    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension * 2;
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension * 2;
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension * 2;
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension * 2;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

/** Close a line path down to a baseline to form an area fill. */
export function areaPath(points: readonly XY[], baselineY: number, smooth = false): string {
  if (points.length === 0) return "";
  const top = smooth ? smoothPath(points) : linePath(points);
  const last = points[points.length - 1]!;
  const first = points[0]!;
  return `${top} L${last.x.toFixed(2)},${baselineY.toFixed(2)} L${first.x.toFixed(2)},${baselineY.toFixed(2)} Z`;
}

/** Direction of the riser for a step line: before, after, or centered on each point. */
export type StepMode = "before" | "after" | "center";

/**
 * Build a stepped (staircase) SVG path through the points. `after` (default)
 * holds each value until the next x; `before` jumps to the next value first;
 * `center` risers halfway between points.
 */
export function stepPath(points: readonly XY[], mode: StepMode = "after"): string {
  const n = points.length;
  if (n === 0) return "";
  const first = points[0]!;
  let d = `M${first.x.toFixed(2)},${first.y.toFixed(2)}`;
  for (let i = 1; i < n; i++) {
    const p0 = points[i - 1]!;
    const p1 = points[i]!;
    if (mode === "before") {
      d += ` L${p0.x.toFixed(2)},${p1.y.toFixed(2)} L${p1.x.toFixed(2)},${p1.y.toFixed(2)}`;
    } else if (mode === "center") {
      const mx = (p0.x + p1.x) / 2;
      d += ` L${mx.toFixed(2)},${p0.y.toFixed(2)} L${mx.toFixed(2)},${p1.y.toFixed(2)} L${p1.x.toFixed(2)},${p1.y.toFixed(2)}`;
    } else {
      d += ` L${p1.x.toFixed(2)},${p0.y.toFixed(2)} L${p1.x.toFixed(2)},${p1.y.toFixed(2)}`;
    }
  }
  return d;
}

/** Cartesian point on a circle for a given angle (radians, 0 = up, clockwise). */
export function polar(cx: number, cy: number, radius: number, angle: number): XY {
  return { x: cx + radius * Math.sin(angle), y: cy - radius * Math.cos(angle) };
}

/** SVG arc path for a ring/pie slice between two angles (radians, 0 = up). */
export function arcPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  const o0 = polar(cx, cy, outerRadius, startAngle);
  const o1 = polar(cx, cy, outerRadius, endAngle);
  if (innerRadius <= 0) {
    return `M${cx},${cy} L${o0.x.toFixed(2)},${o0.y.toFixed(2)} A${outerRadius},${outerRadius} 0 ${large} 1 ${o1.x.toFixed(2)},${o1.y.toFixed(2)} Z`;
  }
  const i0 = polar(cx, cy, innerRadius, endAngle);
  const i1 = polar(cx, cy, innerRadius, startAngle);
  return [
    `M${o0.x.toFixed(2)},${o0.y.toFixed(2)}`,
    `A${outerRadius},${outerRadius} 0 ${large} 1 ${o1.x.toFixed(2)},${o1.y.toFixed(2)}`,
    `L${i0.x.toFixed(2)},${i0.y.toFixed(2)}`,
    `A${innerRadius},${innerRadius} 0 ${large} 0 ${i1.x.toFixed(2)},${i1.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}
