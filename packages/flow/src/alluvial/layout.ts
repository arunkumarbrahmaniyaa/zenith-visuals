/** A single multi-stage flow record. `path[s]` is the category at stage s. */
export interface AlluvialFlow {
  path: readonly string[];
  value: number;
  /** Optional explicit color for this flow's ribbons. */
  color?: string;
}

export interface AlluvialNode {
  stage: number;
  category: string;
  label: string;
  color: string;
  value: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface AlluvialRibbon {
  stage: number;
  sourceCategory: string;
  targetCategory: string;
  value: number;
  color: string;
  /** Cubic-bezier centerline; stroke this with `width`. */
  path: string;
  width: number;
}

export interface AlluvialLayout {
  nodes: AlluvialNode[];
  ribbons: AlluvialRibbon[];
  stageCount: number;
}

export interface AlluvialLayoutOptions {
  flows: readonly AlluvialFlow[];
  width: number;
  height: number;
  palette: readonly string[];
  /** Category bar thickness in px. Default 14. */
  nodeWidth?: number;
  /** Vertical gap between stacked categories in px. Default 8. */
  nodePadding?: number;
}

/**
 * Compute an alluvial (categorical flow) diagram layout. Categories are stacked
 * per stage with height proportional to throughput; ribbons connect adjacent
 * stages. Same category name shares a color across every stage. Pure.
 */
export function computeAlluvialLayout(opts: AlluvialLayoutOptions): AlluvialLayout {
  const { flows, width, height, palette, nodeWidth = 14, nodePadding = 8 } = opts;
  const stageCount = flows.reduce((m, f) => Math.max(m, f.path.length), 0);
  if (stageCount === 0 || flows.length === 0) return { nodes: [], ribbons: [], stageCount: 0 };

  const total = flows.reduce((a, f) => a + Math.max(0, f.value), 0);
  if (total <= 0) return { nodes: [], ribbons: [], stageCount };

  // Stable global color per distinct category (in order of appearance).
  const colorByCategory = new Map<string, string>();
  for (const f of flows) {
    for (const cat of f.path) {
      if (!colorByCategory.has(cat)) {
        const idx = colorByCategory.size;
        colorByCategory.set(cat, palette[idx % palette.length] ?? "#888");
      }
    }
  }

  // Per stage: ordered categories + aggregated value.
  const stageCats: { category: string; value: number }[][] = [];
  for (let s = 0; s < stageCount; s++) {
    const order: string[] = [];
    const values = new Map<string, number>();
    for (const f of flows) {
      const cat = f.path[s];
      if (cat === undefined) continue;
      if (!values.has(cat)) order.push(cat);
      values.set(cat, (values.get(cat) ?? 0) + Math.max(0, f.value));
    }
    stageCats.push(order.map((category) => ({ category, value: values.get(category)! })));
  }

  const maxCount = stageCats.reduce((m, s) => Math.max(m, s.length), 1);
  const scale = Math.max(0, (height - (maxCount - 1) * nodePadding)) / total;
  const stageX = (s: number) =>
    stageCount === 1 ? 0 : (s / (stageCount - 1)) * Math.max(1, width - nodeWidth);

  const nodes: AlluvialNode[] = [];
  const nodeByKey = new Map<string, AlluvialNode>();
  for (let s = 0; s < stageCount; s++) {
    const cats = stageCats[s]!;
    const stackHeight = cats.reduce((a, c) => a + c.value * scale, 0) + (cats.length - 1) * nodePadding;
    let y = (height - stackHeight) / 2;
    const x0 = stageX(s);
    for (const c of cats) {
      const nh = c.value * scale;
      const node: AlluvialNode = {
        stage: s,
        category: c.category,
        label: c.category,
        color: colorByCategory.get(c.category) ?? "#888",
        value: c.value,
        x0,
        x1: x0 + nodeWidth,
        y0: y,
        y1: y + nh,
      };
      nodes.push(node);
      nodeByKey.set(`${s}:${c.category}`, node);
      y += nh + nodePadding;
    }
  }

  // Ribbons: per adjacent stage pair, stack flow bands within source/target.
  const outOffset = new Map<string, number>();
  const inOffset = new Map<string, number>();
  const ribbons: AlluvialRibbon[] = [];
  for (let s = 0; s < stageCount - 1; s++) {
    for (const f of flows) {
      const sc = f.path[s];
      const tc = f.path[s + 1];
      if (sc === undefined || tc === undefined) continue;
      const sNode = nodeByKey.get(`${s}:${sc}`);
      const tNode = nodeByKey.get(`${s + 1}:${tc}`);
      if (!sNode || !tNode) continue;
      const w = Math.max(0.5, f.value * scale);
      const sKey = `${s}:${sc}`;
      const tKey = `${s + 1}:${tc}`;
      const so = outOffset.get(sKey) ?? 0;
      const to = inOffset.get(tKey) ?? 0;
      const syc = sNode.y0 + so + w / 2;
      const tyc = tNode.y0 + to + w / 2;
      const x0 = sNode.x1;
      const x1 = tNode.x0;
      const mx = (x0 + x1) / 2;
      ribbons.push({
        stage: s,
        sourceCategory: sc,
        targetCategory: tc,
        value: f.value,
        color: f.color ?? sNode.color,
        width: w,
        path: `M${x0},${syc} C${mx},${syc} ${mx},${tyc} ${x1},${tyc}`,
      });
      outOffset.set(sKey, so + w);
      inOffset.set(tKey, to + w);
    }
  }

  return { nodes, ribbons, stageCount };
}
