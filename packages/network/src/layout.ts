export interface NetworkNodeInput {
  id: string;
  label?: string;
  /** Optional group index used for palette coloring. */
  group?: number;
  /** Relative importance (affects node radius). Default 1. */
  weight?: number;
}

export interface NetworkLinkInput {
  source: string;
  target: string;
  /** Relative strength (affects spring + stroke width). Default 1. */
  value?: number;
}

export interface NetworkNode {
  id: string;
  label: string;
  group: number;
  x: number;
  y: number;
  radius: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  value: number;
}

export interface NetworkLayout {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

export interface ForceLayoutOptions {
  nodes: readonly NetworkNodeInput[];
  links: readonly NetworkLinkInput[];
  width: number;
  height: number;
  /** Simulation iterations. Higher = more settled. Default 300. */
  iterations?: number;
  /** Ideal edge length in px. Default derived from area. */
  linkDistance?: number;
  /** Base node radius in px. Default 6. */
  nodeRadius?: number;
}

/**
 * A deterministic, synchronous force-directed layout. Nodes are seeded on a
 * circle (no RNG) then relaxed with repulsion + spring forces for a fixed
 * number of iterations. Being pure and deterministic, it is SSR-safe, testable
 * and can run in a Web Worker.
 */
export function computeForceLayout(options: ForceLayoutOptions): NetworkLayout {
  const { links, width, height, iterations = 300, nodeRadius = 6 } = options;
  const inputs = options.nodes.length
    ? options.nodes
    : dedupeNodesFromLinks(links);

  const n = inputs.length;
  if (n === 0) return { nodes: [], links: [] };

  const linkDistance = options.linkDistance ?? Math.max(30, Math.min(width, height) / Math.sqrt(n + 1));
  const cx = width / 2;
  const cy = height / 2;

  // Degree for radius scaling.
  const degree = new Map<string, number>();
  for (const l of links) {
    degree.set(l.source, (degree.get(l.source) ?? 0) + 1);
    degree.set(l.target, (degree.get(l.target) ?? 0) + 1);
  }

  // Seed positions on a circle (deterministic).
  const nodes: (NetworkNode & { vx: number; vy: number })[] = inputs.map((input, i) => {
    const angle = (i / n) * Math.PI * 2;
    const r = Math.min(width, height) / 3;
    return {
      id: input.id,
      label: input.label ?? input.id,
      group: input.group ?? 0,
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      radius: nodeRadius + Math.sqrt((input.weight ?? degree.get(input.id) ?? 1)) * 1.5,
      vx: 0,
      vy: 0,
    };
  });
  const byId = new Map(nodes.map((node) => [node.id, node]));

  const repulsion = linkDistance * linkDistance;
  let alpha = 1;
  const alphaDecay = 1 - Math.pow(0.001, 1 / iterations);

  for (let iter = 0; iter < iterations; iter++) {
    // Pairwise repulsion (O(n^2) — intended for small/medium graphs).
    for (let i = 0; i < n; i++) {
      const a = nodes[i]!;
      for (let j = i + 1; j < n; j++) {
        const b = nodes[j]!;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let distSq = dx * dx + dy * dy;
        if (distSq === 0) {
          dx = (i - j) * 0.01 + 0.01;
          dy = 0.01;
          distSq = dx * dx + dy * dy;
        }
        const force = (repulsion / distSq) * alpha;
        const fx = dx * force;
        const fy = dy * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }
    }

    // Spring forces along links.
    for (const link of links) {
      const a = byId.get(link.source);
      const b = byId.get(link.target);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const displacement = (dist - linkDistance) / dist;
      const strength = 0.1 * (link.value ?? 1) * alpha;
      const fx = dx * displacement * strength;
      const fy = dy * displacement * strength;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    // Integrate + gentle pull toward center; damp velocity.
    for (const node of nodes) {
      node.vx += (cx - node.x) * 0.005 * alpha;
      node.vy += (cy - node.y) * 0.005 * alpha;
      node.x += node.vx;
      node.y += node.vy;
      node.vx *= 0.85;
      node.vy *= 0.85;
    }

    alpha *= 1 - alphaDecay;
  }

  // Clamp inside bounds.
  for (const node of nodes) {
    node.x = Math.max(node.radius, Math.min(width - node.radius, node.x));
    node.y = Math.max(node.radius, Math.min(height - node.radius, node.y));
  }

  return {
    nodes: nodes.map(({ vx: _vx, vy: _vy, ...rest }) => rest),
    links: links.map((l) => ({ source: l.source, target: l.target, value: l.value ?? 1 })),
  };
}

function dedupeNodesFromLinks(links: readonly NetworkLinkInput[]): NetworkNodeInput[] {
  const ids = new Set<string>();
  for (const l of links) {
    ids.add(l.source);
    ids.add(l.target);
  }
  return [...ids].map((id) => ({ id }));
}
