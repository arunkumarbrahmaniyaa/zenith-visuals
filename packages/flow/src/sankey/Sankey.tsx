import { useId, useState, type ReactNode } from "react";
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
} from "./layout";

export interface SankeyProps extends BaseVisualizationProps {
  /** Flow links. Nodes referenced here are created automatically. */
  data: {
    nodes?: readonly SankeyNodeInput[];
    links: readonly SankeyLinkInput[];
  };
  /** Node rectangle thickness in px. Default 18. */
  nodeWidth?: number;
  /** Vertical gap between nodes in a layer. Default 12. */
  nodePadding?: number;
  /** Show node labels. Default true. */
  showLabels?: boolean;
  /** Link opacity (0..1). Default 0.45. */
  linkOpacity?: number;
  /** Use a source→target gradient for links. Default true. */
  linkGradient?: boolean;
  /** Locale for number formatting in tooltips. Default "en-US". */
  locale?: string;
  onNodeClick?: (node: SankeyNode) => void;
  onLinkClick?: (link: SankeyLink) => void;
  renderNodeTooltip?: (node: SankeyNode) => ReactNode;
  renderLinkTooltip?: (link: SankeyLink) => ReactNode;
}

type HoverTarget =
  | { kind: "node"; node: SankeyNode }
  | { kind: "link"; link: SankeyLink };

/**
 * A beautiful, animated Sankey diagram with gradient links, hover highlighting
 * and tooltips. Responsive and SSR-safe via VisualizationContainer.
 *
 * @example
 * <Sankey data={{ links: [{ source: "A", target: "B", value: 10 }] }} />
 */
export function Sankey(props: SankeyProps) {
  const {
    data,
    nodeWidth = 18,
    nodePadding = 12,
    showLabels = true,
    linkOpacity = 0.45,
    linkGradient = true,
    locale = "en-US",
    onNodeClick,
    onLinkClick,
    renderNodeTooltip,
    renderLinkTooltip,
    height = 360,
    ...base
  } = props;

  const gradientId = useId();
  const tooltip = useTooltip<HoverTarget>();
  const [hover, setHover] = useState<HoverTarget | null>(null);

  const isEmpty = !data.links || data.links.length === 0;

  return (
    <VisualizationContainer {...base} height={height} isEmpty={isEmpty} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        // Computed inline (not in a hook) because this render-prop is invoked
        // conditionally by VisualizationContainer — calling hooks here would
        // violate the rules of hooks. The layout algorithm is cheap and pure.
        const layout = computeSankeyLayout({
          nodes: data.nodes,
          links: data.links,
          width: Math.max(1, width - 8),
          height: Math.max(1, h - 8),
          nodeWidth,
          nodePadding,
          palette: theme.palette,
        });

        const nodeById = new Map(layout.nodes.map((n) => [n.id, n]));
        const isDimmed = (id: string) => {
          if (!hover) return false;
          if (hover.kind === "node") return hover.node.id !== id;
          return hover.link.source !== id && hover.link.target !== id;
        };

        return (
          <>
            <svg
              width={width}
              height={h}
              viewBox={`0 0 ${width} ${h}`}
              role="img"
              aria-label={base.labels?.ariaLabel ?? "Sankey flow diagram"}
              style={{ display: "block" }}
            >
              <g transform="translate(4,4)">
                {linkGradient && (
                  <defs>
                    {layout.links.map((link, i) => {
                      const s = nodeById.get(link.source);
                      const t = nodeById.get(link.target);
                      if (!s || !t) return null;
                      return (
                        <linearGradient
                          key={i}
                          id={`${gradientId}-${i}`}
                          gradientUnits="userSpaceOnUse"
                          x1={s.x1}
                          x2={t.x0}
                        >
                          <stop offset="0%" stopColor={link.sourceColor} />
                          <stop offset="100%" stopColor={link.targetColor} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                )}

                {/* Links */}
                <g fill="none">
                  {layout.links.map((link, i) => {
                    const dim = isDimmed(link.source) && isDimmed(link.target);
                    const active =
                      hover?.kind === "link" &&
                      hover.link.source === link.source &&
                      hover.link.target === link.target;
                    return (
                      <path
                        key={`${link.source}-${link.target}-${i}`}
                        d={link.path}
                        stroke={linkGradient ? `url(#${gradientId}-${i})` : link.sourceColor}
                        strokeWidth={link.width}
                        strokeOpacity={dim ? linkOpacity * 0.3 : active ? linkOpacity + 0.3 : linkOpacity}
                        style={{
                          cursor: onLinkClick ? "pointer" : "default",
                          transition: theme.motion.reducedMotion
                            ? undefined
                            : `stroke-opacity ${theme.motion.duration}ms ${theme.motion.easing}`,
                        }}
                        onMouseEnter={(e) => {
                          setHover({ kind: "link", link });
                          tooltip.show({ kind: "link", link }, e);
                        }}
                        onMouseMove={(e) => tooltip.move(e)}
                        onMouseLeave={() => {
                          setHover(null);
                          tooltip.hide();
                        }}
                        onClick={() => onLinkClick?.(link)}
                      >
                        <title>{`${link.source} → ${link.target}: ${formatNumber(link.value, { locale })}`}</title>
                      </path>
                    );
                  })}
                </g>

                {/* Nodes */}
                <g>
                  {layout.nodes.map((node) => (
                    <g key={node.id}>
                      <rect
                        x={node.x0}
                        y={node.y0}
                        width={node.x1 - node.x0}
                        height={Math.max(1, node.y1 - node.y0)}
                        rx={theme.radii.sm}
                        fill={node.color}
                        fillOpacity={isDimmed(node.id) ? 0.35 : 1}
                        stroke={theme.colors.background}
                        strokeWidth={1}
                        style={{ cursor: onNodeClick ? "pointer" : "default" }}
                        onMouseEnter={(e) => {
                          setHover({ kind: "node", node });
                          tooltip.show({ kind: "node", node }, e);
                        }}
                        onMouseMove={(e) => tooltip.move(e)}
                        onMouseLeave={() => {
                          setHover(null);
                          tooltip.hide();
                        }}
                        onClick={() => onNodeClick?.(node)}
                      >
                        <title>{`${node.label}: ${formatNumber(node.value, { locale })}`}</title>
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
                          fillOpacity={isDimmed(node.id) ? 0.4 : 1}
                          style={{ pointerEvents: "none" }}
                        >
                          {node.label}
                        </text>
                      )}
                    </g>
                  ))}
                </g>
              </g>
            </svg>

            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data?.kind === "node" &&
                (renderNodeTooltip?.(tooltip.state.data.node) ?? (
                  <span>
                    <strong>{tooltip.state.data.node.label}</strong>
                    <br />
                    {formatNumber(tooltip.state.data.node.value, { locale })}
                  </span>
                ))}
              {tooltip.state.data?.kind === "link" &&
                (renderLinkTooltip?.(tooltip.state.data.link) ?? (
                  <span>
                    <strong>
                      {tooltip.state.data.link.source} → {tooltip.state.data.link.target}
                    </strong>
                    <br />
                    {formatNumber(tooltip.state.data.link.value, { locale })}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
