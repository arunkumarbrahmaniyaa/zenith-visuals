export interface SankeyNodeInput {
  id: string;
  label?: string;
  /** Optional explicit node color; otherwise assigned from the palette. */
  color?: string;
}

export interface SankeyLinkInput {
  source: string;
  target: string;
  value: number;
}

export interface SankeyNode {
  id: string;
  label: string;
  color: string;
  depth: number;
  value: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  width: number;
  sourceColor: string;
  targetColor: string;
  /** SVG cubic-bezier path string connecting source to target. */
  path: string;
}

export interface SankeyLayout {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface SankeyLayoutOptions {
  nodes?: readonly SankeyNodeInput[];
  links: readonly SankeyLinkInput[];
  width: number;
  height: number;
  nodeWidth?: number;
  nodePadding?: number;
  palette: readonly string[];
  /** Relaxation passes to reduce link crossings. Default 6. */
  iterations?: number;
}

interface InternalNode extends SankeyNode {
  sourceLinks: InternalLink[];
  targetLinks: InternalLink[];
}

interface InternalLink extends SankeyLink {
  sourceNode: InternalNode;
  targetNode: InternalNode;
  sy: number;
  ty: number;
}

/**
 * Compute a Sankey diagram layout. Nodes are assigned to layers via a
 * longest-path pass; node and link thicknesses are proportional to flow value.
 * A light iterative relaxation reduces link crossings.
 *
 * Pure and deterministic — safe for SSR, Web Workers and unit testing.
 */
export function computeSankeyLayout(options: SankeyLayoutOptions): SankeyLayout {
  const {
    links: linkInputs,
    width,
    height,
    nodeWidth = 18,
    nodePadding = 12,
    palette,
    iterations = 6,
  } = options;

  // 1. Collect nodes (declared + referenced by links).
  const nodeMap = new Map<string, InternalNode>();
  const ensure = (id: string, label?: string, color?: string): InternalNode => {
    let node = nodeMap.get(id);
    if (!node) {
      const idx = nodeMap.size;
      node = {
        id,
        label: label ?? id,
        color: color ?? palette[idx % palette.length] ?? "#888",
        depth: 0,
        value: 0,
        x0: 0,
        x1: 0,
        y0: 0,
        y1: 0,
        sourceLinks: [],
        targetLinks: [],
      };
      nodeMap.set(id, node);
    } else {
      if (label && node.label === id) node.label = label;
      if (color) node.color = color;
    }
    return node;
  };

  for (const n of options.nodes ?? []) ensure(n.id, n.label, n.color);

  const links: InternalLink[] = [];
  for (const l of linkInputs) {
    if (l.value <= 0) continue;
    const sourceNode = ensure(l.source);
    const targetNode = ensure(l.target);
    const link: InternalLink = {
      source: l.source,
      target: l.target,
      value: l.value,
      width: 0,
      sourceColor: sourceNode.color,
      targetColor: targetNode.color,
      path: "",
      sourceNode,
      targetNode,
      sy: 0,
      ty: 0,
    };
    sourceNode.sourceLinks.push(link);
    targetNode.targetLinks.push(link);
    links.push(link);
  }

  const nodes = [...nodeMap.values()];
  if (nodes.length === 0) return { nodes: [], links: [] };

  // 2. Node value = max(incoming, outgoing) flow.
  for (const node of nodes) {
    const incoming = node.targetLinks.reduce((s, l) => s + l.value, 0);
    const outgoing = node.sourceLinks.reduce((s, l) => s + l.value, 0);
    node.value = Math.max(incoming, outgoing);
  }

  // 3. Longest-path depth assignment (guards against cycles via a visit cap).
  assignDepths(nodes);
  const maxDepth = nodes.reduce((m, n) => Math.max(m, n.depth), 0);

  // 4. Horizontal positions per layer.
  const columnGap = maxDepth > 0 ? (width - nodeWidth) / maxDepth : 0;
  for (const node of nodes) {
    node.x0 = maxDepth > 0 ? node.depth * columnGap : 0;
    node.x1 = node.x0 + nodeWidth;
  }

  // 5. Vertical scale so the fullest layer fits the available height.
  const layers = groupByDepth(nodes, maxDepth);
  let ky = Infinity;
  for (const layer of layers) {
    if (layer.length === 0) continue;
    const totalValue = layer.reduce((s, n) => s + n.value, 0) || 1;
    const available = height - (layer.length - 1) * nodePadding;
    ky = Math.min(ky, available / totalValue);
  }
  if (!Number.isFinite(ky) || ky <= 0) ky = 1;

  // 6. Initial vertical stacking within each layer.
  for (const layer of layers) {
    let y = 0;
    for (const node of layer) {
      node.y0 = y;
      node.y1 = y + Math.max(1, node.value * ky);
      y = node.y1 + nodePadding;
    }
  }

  // 7. Relax node positions toward the weighted center of their links.
  for (let i = 0; i < iterations; i++) {
    const alpha = 1 - i / (iterations + 1);
    relaxLayers(layers, alpha, true);
    relaxLayers(layers, alpha, false);
    resolveCollisions(layers, height, nodePadding);
  }

  // 8. Assign link widths and endpoint offsets, then build paths.
  for (const node of nodes) {
    node.sourceLinks.sort((a, b) => a.targetNode.y0 - b.targetNode.y0);
    node.targetLinks.sort((a, b) => a.sourceNode.y0 - b.sourceNode.y0);
  }
  for (const node of nodes) {
    let sy = node.y0;
    for (const link of node.sourceLinks) {
      link.width = Math.max(1, link.value * ky);
      link.sy = sy + link.width / 2;
      sy += link.width;
    }
    let ty = node.y0;
    for (const link of node.targetLinks) {
      link.ty = ty + link.width / 2;
      ty += link.width;
    }
  }

  for (const link of links) {
    const x0 = link.sourceNode.x1;
    const x1 = link.targetNode.x0;
    const xc = (x0 + x1) / 2;
    link.path = `M${x0},${link.sy}C${xc},${link.sy} ${xc},${link.ty} ${x1},${link.ty}`;
  }

  return {
    nodes: nodes.map(stripInternal),
    links: links.map(stripLinkInternal),
  };
}

function assignDepths(nodes: InternalNode[]): void {
  const cap = nodes.length;
  for (const node of nodes) node.depth = 0;
  // Relax depths: depth(target) >= depth(source) + 1.
  for (let pass = 0; pass < cap; pass++) {
    let changed = false;
    for (const node of nodes) {
      for (const link of node.sourceLinks) {
        const wanted = node.depth + 1;
        if (link.targetNode.depth < wanted) {
          link.targetNode.depth = wanted;
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  // Pull pure-sink nodes back next to their deepest source (nicer spacing) is
  // intentionally skipped to keep layout predictable.
}

function groupByDepth(nodes: InternalNode[], maxDepth: number): InternalNode[][] {
  const layers: InternalNode[][] = Array.from({ length: maxDepth + 1 }, () => []);
  for (const node of nodes) layers[node.depth]!.push(node);
  return layers;
}

function relaxLayers(layers: InternalNode[][], alpha: number, forward: boolean): void {
  const ordered = forward ? layers : [...layers].reverse();
  for (const layer of ordered) {
    for (const node of layer) {
      const links = forward ? node.targetLinks : node.sourceLinks;
      if (links.length === 0) continue;
      const weightedCenter =
        links.reduce((sum, l) => {
          const other = forward ? l.sourceNode : l.targetNode;
          return sum + center(other) * l.value;
        }, 0) / links.reduce((s, l) => s + l.value, 0);
      const dy = (weightedCenter - center(node)) * alpha;
      node.y0 += dy;
      node.y1 += dy;
    }
  }
}

function resolveCollisions(layers: InternalNode[][], height: number, padding: number): void {
  for (const layer of layers) {
    layer.sort((a, b) => a.y0 - b.y0);
    let y = 0;
    for (const node of layer) {
      const shift = y - node.y0;
      if (shift > 0) {
        node.y0 += shift;
        node.y1 += shift;
      }
      y = node.y1 + padding;
    }
    // Push back down if we overflowed the bottom.
    const overflow = y - padding - height;
    if (overflow > 0) {
      let cursor = height;
      for (let i = layer.length - 1; i >= 0; i--) {
        const node = layer[i]!;
        const nodeHeight = node.y1 - node.y0;
        if (node.y1 > cursor) {
          node.y1 = cursor;
          node.y0 = cursor - nodeHeight;
        }
        cursor = node.y0 - padding;
      }
    }
  }
}

function center(node: InternalNode): number {
  return (node.y0 + node.y1) / 2;
}

function stripInternal(node: InternalNode): SankeyNode {
  const { sourceLinks: _s, targetLinks: _t, ...rest } = node;
  return rest;
}

function stripLinkInternal(link: InternalLink): SankeyLink {
  const { sourceNode: _s, targetNode: _t, sy: _sy, ty: _ty, ...rest } = link;
  return rest;
}
