import { useMemo, useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
} from "@zenith-visuals/core";
import { defaultFormat } from "@zenith-visuals/charts";
import type { HierarchyChartProps } from "./types";
import { descendants, hierarchy, type HNode } from "./lib/hierarchy";
import { clusterLayout } from "./lib/tree";
import { assignColors } from "./lib/color";

export interface ClusterProps extends HierarchyChartProps {
  /** Layout direction. Default "vertical" (root at top). */
  orientation?: "vertical" | "horizontal";
  /** Node marker radius in px. Default 4. */
  nodeRadius?: number;
  /** Show node labels. Default true. */
  showLabels?: boolean;
  onNodeClick?: (node: HNode) => void;
  renderTooltip?: (node: HNode) => ReactNode;
}

/**
 * Cluster dendrogram — a node-link layout with smoothly curved links where all
 * leaves align at the same depth. Responsive, themeable and SSR-safe.
 *
 * @example
 * <Cluster data={{ name: "root", children: [{ name: "a" }, { name: "b" }] }} />
 */
export function Cluster(props: ClusterProps) {
  const {
    data,
    orientation = "vertical",
    nodeRadius = 4,
    showLabels = true,
    formatValue = defaultFormat,
    onNodeClick,
    renderTooltip,
    height = 380,
    ...base
  } = props;

  const tooltip = useTooltip<HNode>();
  const [hover, setHover] = useState<HNode | null>(null);
  const root = useMemo(() => hierarchy(data), [data]);

  return (
    <VisualizationContainer {...base} height={height} isEmpty={!root.children?.length && root.value <= 0} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        clusterLayout(root);
        const colors = assignColors(theme, root);
        const vertical = orientation === "vertical";
        const margin = { x: 48, y: 32 };
        const px = (node: HNode) => {
          const nx = node.x ?? 0.5;
          const ny = node.y ?? 0;
          return vertical
            ? { x: margin.x + nx * (width - margin.x * 2), y: margin.y + ny * (h - margin.y * 2) }
            : { x: margin.x + ny * (width - margin.x * 2), y: margin.y + nx * (h - margin.y * 2) };
        };
        const nodes = descendants(root);

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Cluster dendrogram"} style={{ display: "block" }}>
              <g>
                {nodes.map((node) =>
                  (node.children ?? []).map((child, ci) => {
                    const p = px(node);
                    const c = px(child);
                    const d = vertical
                      ? `M${p.x},${p.y} C${p.x},${(p.y + c.y) / 2} ${c.x},${(p.y + c.y) / 2} ${c.x},${c.y}`
                      : `M${p.x},${p.y} C${(p.x + c.x) / 2},${p.y} ${(p.x + c.x) / 2},${c.y} ${c.x},${c.y}`;
                    return <path key={`${node.depth}-${ci}-${child.data.name}`} d={d} fill="none" stroke={theme.colors.border} strokeWidth={1.5} />;
                  }),
                )}
              </g>
              {nodes.map((node, i) => {
                const p = px(node);
                const color = colors.get(node) ?? theme.colors.primary;
                const active = hover === node;
                const isLeaf = !node.children || node.children.length === 0;
                return (
                  <g key={i} transform={`translate(${p.x},${p.y})`}
                    onMouseEnter={(e) => {
                      setHover(node);
                      tooltip.show(node, e);
                    }}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => {
                      setHover(null);
                      tooltip.hide();
                    }}
                    onClick={() => onNodeClick?.(node)}
                    style={{ cursor: onNodeClick ? "pointer" : "default" }}>
                    <circle r={active ? nodeRadius + 1.5 : nodeRadius} fill={color}
                      stroke={theme.colors.background} strokeWidth={1.5} />
                    {showLabels && (
                      <text x={0} y={isLeaf && vertical ? nodeRadius + 12 : -(nodeRadius + 6)}
                        textAnchor="middle" fontSize={theme.typography.fontSizeSm}
                        fontFamily={theme.typography.fontFamily} fill={theme.colors.text} pointerEvents="none">
                        {node.data.name}
                      </text>
                    )}
                    <title>{`${node.data.name}${node.value ? `: ${formatValue(node.value)}` : ""}`}</title>
                  </g>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data) ?? (
                  <span>
                    <strong>{tooltip.state.data.data.name}</strong>
                    {tooltip.state.data.value ? `: ${formatValue(tooltip.state.data.value)}` : ""}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
