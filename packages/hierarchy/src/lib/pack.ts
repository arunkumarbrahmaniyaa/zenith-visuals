import { descendants, type HNode } from "./hierarchy";

interface Circle {
  x: number;
  y: number;
  r: number;
}

// --- Smallest enclosing circle (Matoušek–Sharir–Welzl) --------------------

function enclosesWeak(a: Circle, b: Circle): boolean {
  const dr = a.r - b.r + Math.max(a.r, b.r, 1) * 1e-9;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dr > 0 && dr * dr > dx * dx + dy * dy;
}

function enclosesNot(a: Circle, b: Circle): boolean {
  const dr = a.r - b.r;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dr < 0 || dr * dr < dx * dx + dy * dy;
}

function enclosesWeakAll(a: Circle, B: readonly Circle[]): boolean {
  for (const b of B) if (!enclosesWeak(a, b)) return false;
  return true;
}

function encloseBasis1(a: Circle): Circle {
  return { x: a.x, y: a.y, r: a.r };
}

function encloseBasis2(a: Circle, b: Circle): Circle {
  const x1 = a.x;
  const y1 = a.y;
  const r1 = a.r;
  const x2 = b.x;
  const y2 = b.y;
  const r2 = b.r;
  const x21 = x2 - x1;
  const y21 = y2 - y1;
  const r21 = r2 - r1;
  const l = Math.sqrt(x21 * x21 + y21 * y21);
  return {
    x: (x1 + x2 + (x21 / l) * r21) / 2,
    y: (y1 + y2 + (y21 / l) * r21) / 2,
    r: (l + r1 + r2) / 2,
  };
}

function encloseBasis3(a: Circle, b: Circle, c: Circle): Circle {
  const x1 = a.x;
  const y1 = a.y;
  const r1 = a.r;
  const x2 = b.x;
  const y2 = b.y;
  const r2 = b.r;
  const x3 = c.x;
  const y3 = c.y;
  const r3 = c.r;
  const a2 = x1 - x2;
  const a3 = x1 - x3;
  const b2 = y1 - y2;
  const b3 = y1 - y3;
  const c2 = r2 - r1;
  const c3 = r3 - r1;
  const d1 = x1 * x1 + y1 * y1 - r1 * r1;
  const d2 = d1 - x2 * x2 - y2 * y2 + r2 * r2;
  const d3 = d1 - x3 * x3 - y3 * y3 + r3 * r3;
  const ab = a3 * b2 - a2 * b3;
  const xa = (b2 * d3 - b3 * d2) / (ab * 2) - x1;
  const xb = (b3 * c2 - b2 * c3) / ab;
  const ya = (a3 * d2 - a2 * d3) / (ab * 2) - y1;
  const yb = (a2 * c3 - a3 * c2) / ab;
  const A = xb * xb + yb * yb - 1;
  const B = 2 * (r1 + xa * xb + ya * yb);
  const C = xa * xa + ya * ya - r1 * r1;
  const r = -(Math.abs(A) > 1e-6 ? (B + Math.sqrt(B * B - 4 * A * C)) / (2 * A) : C / B);
  return { x: x1 + xa + xb * r, y: y1 + ya + yb * r, r };
}

function encloseBasis(B: readonly Circle[]): Circle {
  if (B.length === 1) return encloseBasis1(B[0]!);
  if (B.length === 2) return encloseBasis2(B[0]!, B[1]!);
  return encloseBasis3(B[0]!, B[1]!, B[2]!);
}

function extendBasis(B: Circle[], p: Circle): Circle[] {
  if (enclosesWeakAll(p, B)) return [p];
  for (let i = 0; i < B.length; ++i) {
    if (enclosesNot(p, B[i]!) && enclosesWeakAll(encloseBasis2(B[i]!, p), B)) {
      return [B[i]!, p];
    }
  }
  for (let i = 0; i < B.length - 1; ++i) {
    for (let j = i + 1; j < B.length; ++j) {
      if (
        enclosesNot(encloseBasis2(B[i]!, B[j]!), p) &&
        enclosesNot(encloseBasis2(B[i]!, p), B[j]!) &&
        enclosesNot(encloseBasis2(B[j]!, p), B[i]!) &&
        enclosesWeakAll(encloseBasis3(B[i]!, B[j]!, p), B)
      ) {
        return [B[i]!, B[j]!, p];
      }
    }
  }
  throw new Error("circle packing: unable to extend basis");
}

function enclose(circles: readonly Circle[]): Circle {
  let i = 0;
  const n = circles.length;
  let B: Circle[] = [];
  let e: Circle | null = null;
  while (i < n) {
    const p = circles[i]!;
    if (e && enclosesWeak(e, p)) {
      ++i;
    } else {
      B = extendBasis(B, p);
      e = encloseBasis(B);
      i = 0;
    }
  }
  return e ?? { x: 0, y: 0, r: 0 };
}

// --- Sibling packing (front-chain, Wang et al.) ---------------------------

function place(b: Circle, a: Circle, c: Circle): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d2 = dx * dx + dy * dy;
  if (d2) {
    let a2 = a.r + c.r;
    a2 *= a2;
    let b2 = b.r + c.r;
    b2 *= b2;
    if (a2 > b2) {
      const x = (d2 + b2 - a2) / (2 * d2);
      const y = Math.sqrt(Math.max(0, b2 / d2 - x * x));
      c.x = b.x - x * dx - y * dy;
      c.y = b.y - x * dy + y * dx;
    } else {
      const x = (d2 + a2 - b2) / (2 * d2);
      const y = Math.sqrt(Math.max(0, a2 / d2 - x * x));
      c.x = a.x + x * dx - y * dy;
      c.y = a.y + x * dy + y * dx;
    }
  } else {
    c.x = a.x + c.r;
    c.y = a.y;
  }
}

function intersects(a: Circle, b: Circle): boolean {
  const dr = a.r + b.r - 1e-6;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dr > 0 && dr * dr > dx * dx + dy * dy;
}

interface FNode {
  _: Circle;
  next: FNode;
  previous: FNode;
}

function score(node: FNode): number {
  const a = node._;
  const b = node.next._;
  const ab = a.r + b.r;
  const dx = (a.x * b.r + b.x * a.r) / ab;
  const dy = (a.y * b.r + b.y * a.r) / ab;
  return dx * dx + dy * dy;
}

/** Pack the given circles so they touch without overlap; returns enclosing r. */
function packSiblings(circles: Circle[]): number {
  const n = circles.length;
  if (n === 0) return 0;

  let a = circles[0]!;
  a.x = 0;
  a.y = 0;
  if (n === 1) return a.r;

  let b = circles[1]!;
  a.x = -b.r;
  b.x = a.r;
  b.y = 0;
  if (n === 2) return a.r + b.r;

  let c = circles[2]!;
  place(b, a, c);

  let na: FNode = { _: a, next: null!, previous: null! };
  let nb: FNode = { _: b, next: null!, previous: null! };
  let nc: FNode = { _: c, next: null!, previous: null! };
  na.next = nc.previous = nb;
  nb.next = na.previous = nc;
  nc.next = nb.previous = na;

  pack: for (let i = 3; i < n; ++i) {
    c = circles[i]!;
    place(na._, nb._, c);
    nc = { _: c, next: null!, previous: null! };

    let j = nb.next;
    let k = na.previous;
    let sj = nb._.r;
    let sk = na._.r;
    do {
      if (sj <= sk) {
        if (intersects(j._, c)) {
          nb = j;
          na.next = nb;
          nb.previous = na;
          --i;
          continue pack;
        }
        sj += j._.r;
        j = j.next;
      } else {
        if (intersects(k._, c)) {
          na = k;
          na.next = nb;
          nb.previous = na;
          --i;
          continue pack;
        }
        sk += k._.r;
        k = k.previous;
      }
    } while (j !== k.next);

    nc.previous = na;
    nc.next = nb;
    na.next = nb.previous = nb = nc;

    let aa = score(na);
    let cursor = nc;
    while ((cursor = cursor.next) !== nb) {
      const ca = score(cursor);
      if (ca < aa) {
        na = cursor;
        aa = ca;
      }
    }
    nb = na.next;
  }

  const all: Circle[] = [nb._];
  let cursor = nb;
  while ((cursor = cursor.next) !== nb) all.push(cursor._);
  const e = enclose(all);
  for (let i = 0; i < n; ++i) {
    const circ = circles[i]!;
    circ.x -= e.x;
    circ.y -= e.y;
  }
  return e.r;
}

/**
 * Circle-packing layout. Assigns `x`, `y` (center) and `r` (radius) in pixel
 * space to every node, fitting the root into a `size × size` square. Leaf area
 * is proportional to value. Pure and deterministic.
 */
export function packLayout(root: HNode, size: number, padding = 3): void {
  const rel = new Map<HNode, { x: number; y: number }>();

  const packNode = (node: HNode) => {
    const kids = node.children;
    if (kids && kids.length > 0) {
      for (const c of kids) packNode(c);
      const circles: Circle[] = kids.map((c) => ({ x: 0, y: 0, r: (c.r ?? 0) + padding }));
      const r = packSiblings(circles);
      kids.forEach((c, i) => rel.set(c, { x: circles[i]!.x, y: circles[i]!.y }));
      node.r = r;
    } else {
      node.r = Math.sqrt(Math.max(1e-6, node.value));
    }
  };
  packNode(root);

  root.x = 0;
  root.y = 0;
  const place2 = (node: HNode) => {
    if (node.children) {
      for (const c of node.children) {
        const o = rel.get(c)!;
        c.x = (node.x ?? 0) + o.x;
        c.y = (node.y ?? 0) + o.y;
        place2(c);
      }
    }
  };
  place2(root);

  const R = root.r ?? 1;
  const k = R > 0 ? size / (2 * R) : 1;
  const center = size / 2;
  for (const n of descendants(root)) {
    n.x = center + (n.x ?? 0) * k;
    n.y = center + (n.y ?? 0) * k;
    n.r = (n.r ?? 0) * k;
  }
}
