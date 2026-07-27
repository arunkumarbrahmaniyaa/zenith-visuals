import { useMemo, useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import {
  bundle,
  catmullRomPath,
  normalizeGraph,
  orderByGroup,
  type GraphLinkInput,
  type GraphNode,
  type GraphNodeInput,
  type XY,
} from "./graph";

export interface EdgeBundlingProps extends BaseVisualizationProps {
  data: {
    nodes?: readonly GraphNodeInput[];
    links: readonly GraphLinkInput[];
  };
  /** Bundling strength in [0, 1]. Lower = tighter bundles. Default 0.85. */
  beta?: number;
  /** Show node labels around the ring. Default true. */
  showLabels?: boolean;
  renderTooltip?: (node: GraphNode) => ReactNode;
}

/**
 * Hierarchical edge bundling: nodes are placed on a ring, grouped by their
 * `group`, and links are routed inward through each group's centroid and the
 * hub so related edges braid together. This dramatically reduces clutter for
 * densely connected graphs. Deterministic and SSR-safe.
 *
 * @example
 * <EdgeBundling data={{ nodes, links }} />
 */
export function EdgeBundling(props: EdgeBundlingProps) {
  const { data, beta = 0.85, showLabels = true, renderTooltip, height = 440, ...base } = props;
  const tooltip = useTooltip<GraphNode>();
  const [hoverId, setHoverId] = useState<string | null>(null);
  const isEmpty = !data.links?.length && !data.nodes?.length;

  const graph = useMemo(() => normalizeGraph(data.nodes, data.links), [data.nodes, data.links]);

  return (
    <VisualizationContainer {...base} height={height} isEmpty={isEmpty} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const order = orderByGroup(graph.nodes);
        const n = order.length;
        const cx = width / 2;
        const cy = h / 2;
        const labelSpace = showLabels ? 92 : 20;
        const R = Math.max(10, Math.min(width, h) / 2 - labelSpace);
        const innerR = R * 0.4;

        const angleOf = new Map<string, number>();
        order.forEach((node, i) => angleOf.set(node.id, n > 0 ? (i / n) * Math.PI * 2 - Math.PI / 2 : 0));
        const nodePos = (id: string): XY => {
          const a = angleOf.get(id) ?? 0;
          return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
        };

        // Group centroids (mean angle of members) on the inner ring.
        const groupAngles = new Map<number, number[]>();
        for (const node of order) {
          const list = groupAngles.get(node.group) ?? [];
          list.push(angleOf.get(node.id) ?? 0);
          groupAngles.set(node.group, list);
        }
        const groupCentroid = new Map<number, XY>();
        for (const [group, angles] of groupAngles) {
          const mean = angles.reduce((s, a) => s + a, 0) / angles.length;
          groupCentroid.set(group, { x: cx + Math.cos(mean) * innerR, y: cy + Math.sin(mean) * innerR });
        }

        const groupOf = new Map(order.map((node) => [node.id, node.group]));
        const center: XY = { x: cx, y: cy };

        const neighbors = new Set<string>();
        if (hoverId) {
          neighbors.add(hoverId);
          for (const link of graph.links) {
            if (link.source === hoverId) neighbors.add(link.target);
            if (link.target === hoverId) neighbors.add(link.source);
          }
        }
        const dimNode = (id: string) => hoverId != null && !neighbors.has(id);

        return (
          <>
            <svg
              width={width}
              height={h}
              viewBox={`0 0 ${width} ${h}`}
              role="img"
              aria-label={base.labels?.ariaLabel ?? "Hierarchical edge bundling"}
              style={{ display: "block" }}
            >
              <g fill="none">
                {graph.links.map((link, i) => {
                  const s = nodePos(link.source);
                  const t = nodePos(link.target);
                  const sg = groupOf.get(link.source) ?? 0;
                  const tg = groupOf.get(link.target) ?? 0;
                  const sc = groupCentroid.get(sg);
                  const tc = groupCentroid.get(tg);
                  const raw: XY[] =
                    sg === tg && sc
                      ? [s, sc, t]
                      : [s, ...(sc ? [sc] : []), center, ...(tc ? [tc] : []), t];
                  const d = catmullRomPath(bundle(raw, beta));
                  const active = hoverId === link.source || hoverId === link.target;
                  const dim = hoverId != null && !active;
                  const color = theme.palette[sg % theme.palette.length]!;
                  return (
                    <path
                      key={i}
                      d={d}
                      stroke={active ? theme.colors.primary : color}
                      strokeWidth={active ? 2 : Math.max(0.75, link.value)}
                      strokeOpacity={dim ? 0.08 : active ? 0.9 : 0.4}
                    />
                  );
                })}
              </g>
              <g>
                {order.map((node) => {
                  const a = angleOf.get(node.id) ?? 0;
                  const p = nodePos(node.id);
                  const color = theme.palette[node.group % theme.palette.length]!;
                  const deg = (a * 180) / Math.PI;
                  const flip = deg > 90 || deg < -90;
                  return (
                    <g key={node.id}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={3 + Math.sqrt(node.value) * 1.1}
                        fill={color}
                        fillOpacity={dimNode(node.id) ? 0.3 : 1}
                        stroke={theme.colors.background}
                        strokeWidth={1.5}
                        onMouseEnter={(e) => {
                          setHoverId(node.id);
                          tooltip.show(node, e);
                        }}
                        onMouseMove={(e) => tooltip.move(e)}
                        onMouseLeave={() => {
                          setHoverId(null);
                          tooltip.hide();
                        }}
                      >
                        <title>{node.label}</title>
                      </circle>
                      {showLabels && (
                        <text
                          x={cx + Math.cos(a) * (R + 8)}
                          y={cy + Math.sin(a) * (R + 8)}
                          transform={`rotate(${flip ? deg + 180 : deg} ${cx + Math.cos(a) * (R + 8)} ${
                            cy + Math.sin(a) * (R + 8)
                          })`}
                          textAnchor={flip ? "end" : "start"}
                          dominantBaseline="middle"
                          fontSize={theme.typography.fontSizeSm}
                          fontFamily={theme.typography.fontFamily}
                          fill={theme.colors.text}
                          fillOpacity={dimNode(node.id) ? 0.35 : 0.85}
                          style={{ pointerEvents: "none" }}
                        >
                          {node.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data) ?? <strong>{tooltip.state.data.label}</strong>)}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
