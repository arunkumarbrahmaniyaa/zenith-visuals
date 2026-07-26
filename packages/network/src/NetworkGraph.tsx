import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { computeForceLayout, type NetworkLinkInput, type NetworkNode, type NetworkNodeInput } from "./layout";

export interface NetworkGraphProps extends BaseVisualizationProps {
  data: {
    nodes?: readonly NetworkNodeInput[];
    links: readonly NetworkLinkInput[];
  };
  /** Simulation iterations. Default 300. */
  iterations?: number;
  /** Ideal edge length in px. */
  linkDistance?: number;
  /** Show node labels. Default true. */
  showLabels?: boolean;
  onNodeClick?: (node: NetworkNode) => void;
  renderTooltip?: (node: NetworkNode) => ReactNode;
}

/**
 * A dependency / network graph rendered with a deterministic force layout.
 * Great for packages, microservices, APIs and modules. SSR-safe and responsive.
 *
 * @example
 * <NetworkGraph data={{ links: [{ source: "app", target: "api" }] }} />
 */
export function NetworkGraph(props: NetworkGraphProps) {
  const {
    data,
    iterations = 300,
    linkDistance,
    showLabels = true,
    onNodeClick,
    renderTooltip,
    height = 420,
    ...base
  } = props;

  const tooltip = useTooltip<NetworkNode>();
  const [hoverId, setHoverId] = useState<string | null>(null);
  const isEmpty = !data.links?.length && !data.nodes?.length;

  return (
    <VisualizationContainer {...base} height={height} isEmpty={isEmpty} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const layout = computeForceLayout({
          nodes: data.nodes ?? [],
          links: data.links,
          width: Math.max(1, width),
          height: Math.max(1, h),
          iterations,
          linkDistance,
        });
        const byId = new Map(layout.nodes.map((node) => [node.id, node]));

        const neighbors = new Set<string>();
        if (hoverId) {
          neighbors.add(hoverId);
          for (const link of layout.links) {
            if (link.source === hoverId) neighbors.add(link.target);
            if (link.target === hoverId) neighbors.add(link.source);
          }
        }
        const dimNode = (id: string) => hoverId != null && !neighbors.has(id);

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Network graph"} style={{ display: "block" }}>
              <g stroke={theme.colors.border}>
                {layout.links.map((link, i) => {
                  const s = byId.get(link.source);
                  const t = byId.get(link.target);
                  if (!s || !t) return null;
                  const active = hoverId === link.source || hoverId === link.target;
                  const dim = hoverId != null && !active;
                  return (
                    <line
                      key={i}
                      x1={s.x}
                      y1={s.y}
                      x2={t.x}
                      y2={t.y}
                      stroke={active ? theme.colors.primary : theme.colors.border}
                      strokeWidth={Math.max(1, link.value)}
                      strokeOpacity={dim ? 0.2 : 0.7}
                    />
                  );
                })}
              </g>
              <g>
                {layout.nodes.map((node) => {
                  const color = theme.palette[node.group % theme.palette.length]!;
                  return (
                    <g key={node.id}>
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.radius}
                        fill={color}
                        fillOpacity={dimNode(node.id) ? 0.35 : 1}
                        stroke={theme.colors.background}
                        strokeWidth={1.5}
                        style={{ cursor: onNodeClick ? "pointer" : "default" }}
                        onMouseEnter={(e) => {
                          setHoverId(node.id);
                          tooltip.show(node, e);
                        }}
                        onMouseMove={(e) => tooltip.move(e)}
                        onMouseLeave={() => {
                          setHoverId(null);
                          tooltip.hide();
                        }}
                        onClick={() => onNodeClick?.(node)}
                      >
                        <title>{node.label}</title>
                      </circle>
                      {showLabels && (
                        <text
                          x={node.x + node.radius + 3}
                          y={node.y + 3}
                          fontSize={theme.typography.fontSizeSm}
                          fontFamily={theme.typography.fontFamily}
                          fill={theme.colors.text}
                          fillOpacity={dimNode(node.id) ? 0.4 : 0.9}
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
