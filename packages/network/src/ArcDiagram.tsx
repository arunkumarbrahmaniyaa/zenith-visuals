import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { normalizeGraph, type GraphLinkInput, type GraphNode, type GraphNodeInput } from "./graph";

export interface ArcDiagramProps extends BaseVisualizationProps {
  data: {
    nodes?: readonly GraphNodeInput[];
    links: readonly GraphLinkInput[];
  };
  /** Show node labels beneath the axis. Default true. */
  showLabels?: boolean;
  renderTooltip?: (node: GraphNode) => ReactNode;
}

/**
 * An arc diagram: nodes sit on a single horizontal axis and links are drawn as
 * semicircular arcs above it. Ideal for revealing linear structure, sequences
 * and back-references in a graph. SSR-safe and deterministic.
 *
 * @example
 * <ArcDiagram data={{ links: [{ source: "a", target: "b" }] }} />
 */
export function ArcDiagram(props: ArcDiagramProps) {
  const { data, showLabels = true, renderTooltip, height = 360, ...base } = props;
  const tooltip = useTooltip<GraphNode>();
  const [hoverId, setHoverId] = useState<string | null>(null);
  const isEmpty = !data.links?.length && !data.nodes?.length;

  return (
    <VisualizationContainer {...base} height={height} isEmpty={isEmpty} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const graph = normalizeGraph(data.nodes, data.links);
        const n = graph.nodes.length;

        const marginX = 24;
        const marginBottom = showLabels ? 84 : 28;
        const marginTop = 16;
        const baselineY = h - marginBottom;
        const maxArc = Math.max(8, baselineY - marginTop);

        const step = n > 1 ? (width - marginX * 2) / (n - 1) : 0;
        const xOf = (index: number) => (n > 1 ? marginX + index * step : width / 2);
        const posById = new Map(graph.nodes.map((node) => [node.id, xOf(node.index)]));

        const maxValue = graph.links.reduce((m, l) => Math.max(m, l.value), 1);

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
              aria-label={base.labels?.ariaLabel ?? "Arc diagram"}
              style={{ display: "block" }}
            >
              <g fill="none">
                {graph.links.map((link, i) => {
                  const x1 = posById.get(link.source);
                  const x2 = posById.get(link.target);
                  if (x1 == null || x2 == null) return null;
                  const left = Math.min(x1, x2);
                  const right = Math.max(x1, x2);
                  const r = (right - left) / 2;
                  const ry = Math.min(r, maxArc);
                  const active = hoverId === link.source || hoverId === link.target;
                  const dim = hoverId != null && !active;
                  return (
                    <path
                      key={i}
                      d={`M${left},${baselineY} A${r},${ry} 0 0 1 ${right},${baselineY}`}
                      stroke={active ? theme.colors.primary : theme.colors.border}
                      strokeWidth={Math.max(1, (link.value / maxValue) * 4)}
                      strokeOpacity={dim ? 0.12 : active ? 0.9 : 0.5}
                    />
                  );
                })}
              </g>
              <line
                x1={marginX}
                y1={baselineY}
                x2={width - marginX}
                y2={baselineY}
                stroke={theme.colors.border}
                strokeWidth={1}
              />
              <g>
                {graph.nodes.map((node) => {
                  const x = xOf(node.index);
                  const color = theme.palette[node.group % theme.palette.length]!;
                  const radius = 3 + Math.sqrt(node.value) * 1.4;
                  return (
                    <g key={node.id}>
                      <circle
                        cx={x}
                        cy={baselineY}
                        r={radius}
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
                          x={x}
                          y={baselineY + 12}
                          transform={`rotate(45 ${x} ${baselineY + 12})`}
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
