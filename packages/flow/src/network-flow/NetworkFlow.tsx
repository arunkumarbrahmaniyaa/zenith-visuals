import { useMemo, useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { formatNumber } from "@zenith-visuals/utils";
import {
  computeSankeyLayout,
  type SankeyLink,
  type SankeyLinkInput,
  type SankeyNode,
  type SankeyNodeInput,
} from "../sankey/layout";
import { flowBalance, type FlowBalance } from "./layout";

export interface NetworkFlowProps extends BaseVisualizationProps {
  data: {
    nodes?: readonly SankeyNodeInput[];
    links: readonly SankeyLinkInput[];
  };
  /** Show node labels + throughput. Default true. */
  showLabels?: boolean;
  /** Max edge stroke width in px (thin directed arrows). Default 7. */
  maxEdgeWidth?: number;
  renderTooltip?: (node: SankeyNode, balance: FlowBalance | undefined) => ReactNode;
}

/**
 * Network flow diagram — a directed, layered flow graph with arrowheads and
 * per-node throughput. Unlike a Sankey (proportional ribbons), edges are drawn
 * as thin directed arrows scaled by flow, making capacities and direction easy
 * to read. Deterministic and SSR-safe.
 *
 * @example
 * <NetworkFlow data={{ links: [{ source: "in", target: "svc", value: 8 }] }} />
 */
export function NetworkFlow(props: NetworkFlowProps) {
  const { data, showLabels = true, maxEdgeWidth = 7, renderTooltip, height = 380, ...base } = props;
  const tooltip = useTooltip<SankeyNode>();
  const [hover, setHover] = useState<string | null>(null);

  const balances = useMemo(() => flowBalance(data.links), [data.links]);
  const balanceById = useMemo(() => new Map(balances.map((b) => [b.id, b])), [balances]);
  const isEmpty = !data.links?.length;

  return (
    <VisualizationContainer {...base} height={height} isEmpty={isEmpty} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const layout = computeSankeyLayout({
          nodes: data.nodes,
          links: data.links,
          width: Math.max(1, width - 8),
          height: Math.max(1, h - 8),
          palette: theme.palette,
          nodeWidth: 14,
        });
        const nodeById = new Map(layout.nodes.map((n) => [n.id, n]));
        const maxValue = layout.links.reduce((m, l) => Math.max(m, l.value), 1);
        const edgeWidth = (l: SankeyLink) => Math.max(1, (l.value / maxValue) * maxEdgeWidth);
        const arrowId = "zv-networkflow-arrow";

        const isDim = (id: string) => {
          if (!hover) return false;
          return id !== hover;
        };
        const linkDim = (l: SankeyLink) => hover != null && l.source !== hover && l.target !== hover;

        return (
          <>
            <svg
              width={width}
              height={h}
              viewBox={`0 0 ${width} ${h}`}
              role="img"
              aria-label={base.labels?.ariaLabel ?? "Network flow diagram"}
              style={{ display: "block" }}
            >
              <defs>
                <marker
                  id={arrowId}
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  markerUnits="userSpaceOnUse"
                  orient="auto-start-reverse"
                >
                  <path d="M0,0 L10,5 L0,10 z" fill={theme.colors.textMuted} />
                </marker>
              </defs>
              <g transform="translate(4,4)">
                <g fill="none">
                  {layout.links.map((link, i) => (
                    <path
                      key={`${link.source}-${link.target}-${i}`}
                      d={link.path}
                      stroke={link.sourceColor}
                      strokeWidth={edgeWidth(link)}
                      strokeOpacity={linkDim(link) ? 0.1 : 0.75}
                      markerEnd={`url(#${arrowId})`}
                      onMouseEnter={(e) => {
                        setHover(link.source);
                        const s = nodeById.get(link.source);
                        if (s) tooltip.show(s, e);
                      }}
                      onMouseMove={(e) => tooltip.move(e)}
                      onMouseLeave={() => {
                        setHover(null);
                        tooltip.hide();
                      }}
                    >
                      <title>{`${link.source} → ${link.target}: ${formatNumber(link.value)}`}</title>
                    </path>
                  ))}
                </g>
                <g>
                  {layout.nodes.map((node) => {
                    const bal = balanceById.get(node.id);
                    return (
                      <g key={node.id}>
                        <rect
                          x={node.x0}
                          y={node.y0}
                          width={node.x1 - node.x0}
                          height={Math.max(1, node.y1 - node.y0)}
                          rx={theme.radii.sm}
                          fill={node.color}
                          fillOpacity={isDim(node.id) ? 0.35 : 1}
                          stroke={theme.colors.background}
                          strokeWidth={1}
                          onMouseEnter={(e) => {
                            setHover(node.id);
                            tooltip.show(node, e);
                          }}
                          onMouseMove={(e) => tooltip.move(e)}
                          onMouseLeave={() => {
                            setHover(null);
                            tooltip.hide();
                          }}
                        >
                          <title>{`${node.label}: ${formatNumber(node.value)}`}</title>
                        </rect>
                        {showLabels && (
                          <text
                            x={node.x0 < width / 2 ? node.x1 + 6 : node.x0 - 6}
                            y={(node.y0 + node.y1) / 2}
                            textAnchor={node.x0 < width / 2 ? "start" : "end"}
                            dominantBaseline="middle"
                            fontSize={theme.typography.fontSizeSm}
                            fontFamily={theme.typography.fontFamily}
                            fill={theme.colors.text}
                            fillOpacity={isDim(node.id) ? 0.4 : 0.95}
                            style={{ pointerEvents: "none" }}
                          >
                            {node.label}
                            <tspan fill={theme.colors.textMuted}> · {formatNumber(bal?.through ?? node.value)}</tspan>
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              </g>
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data, balanceById.get(tooltip.state.data.id)) ?? (
                  <span>
                    <strong>{tooltip.state.data.label}</strong>
                    <br />
                    in {formatNumber(balanceById.get(tooltip.state.data.id)?.inflow ?? 0)} · out{" "}
                    {formatNumber(balanceById.get(tooltip.state.data.id)?.outflow ?? 0)}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
