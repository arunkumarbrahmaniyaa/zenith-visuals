import type { ReactNode } from "react";

export interface OrgNode {
  id: string;
  /** Primary label (e.g., person name). */
  name: string;
  /** Secondary label (e.g., role/title). */
  title?: string;
  avatarUrl?: string;
  children?: OrgNode[];
}

export interface PositionedNode {
  node: OrgNode;
  x: number;
  y: number;
  depth: number;
  parentId: string | null;
}

export interface OrgLayout {
  nodes: PositionedNode[];
  edges: { from: string; to: string }[];
  width: number;
  height: number;
}

export interface OrgLayoutOptions {
  root: OrgNode;
  nodeWidth: number;
  nodeHeight: number;
  hGap: number;
  vGap: number;
  /** Set of collapsed node ids whose children are hidden. */
  collapsed?: ReadonlySet<string>;
}

/**
 * A tidy top-down tree layout. Leaves are packed left-to-right; each parent is
 * centered over its children. Pure and deterministic (SSR-safe, testable).
 */
export function computeOrgLayout(options: OrgLayoutOptions): OrgLayout {
  const { root, nodeWidth, nodeHeight, hGap, vGap, collapsed } = options;
  const positioned: PositionedNode[] = [];
  const edges: { from: string; to: string }[] = [];
  const stepX = nodeWidth + hGap;
  const stepY = nodeHeight + vGap;
  let nextLeafX = 0;

  const assign = (node: OrgNode, depth: number, parentId: string | null): number => {
    const y = depth * stepY;
    const hasChildren = !collapsed?.has(node.id) && node.children && node.children.length > 0;

    let x: number;
    if (!hasChildren) {
      x = nextLeafX * stepX;
      nextLeafX += 1;
    } else {
      const childXs = node.children!.map((child) => assign(child, depth + 1, node.id));
      x = (childXs[0]! + childXs[childXs.length - 1]!) / 2;
    }

    positioned.push({ node, x, y, depth, parentId });
    if (parentId != null) edges.push({ from: parentId, to: node.id });
    return x;
  };

  assign(root, 0, null);

  const xs = positioned.map((p) => p.x);
  const maxDepth = positioned.reduce((m, p) => Math.max(m, p.depth), 0);
  const width = (Math.max(...xs, 0)) + nodeWidth;
  const height = maxDepth * stepY + nodeHeight;

  return { nodes: positioned, edges, width, height };
}

export type OrgCardRenderer = (node: OrgNode) => ReactNode;
