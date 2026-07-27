import { useMemo, useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
} from "@zenith-visuals/core";
import { defaultFormat } from "@zenith-visuals/charts";
import type { HierarchyChartProps } from "./types";
import { descendants, hierarchy, type HNode } from "./lib/hierarchy";
import { treeLayout } from "./lib/tree";
import { assignColors } from "./lib/color";

export interface RadialTreeProps extends HierarchyChartProps {
  /** Node marker radius in px. Default 4. */
  nodeRadius?: number;
  /** Show node labels. Default true. */
  showLabels?: boolean;
  onNodeClick?: (node: HNode) => void;
  renderTooltip?: (node: HNode) => ReactNode;
}

/**
 * Radial tidy tree — a node-link hierarchy laid out on concentric rings, with
 * the root at the center and depth increasing outward. Responsive, themeable
 * and SSR-safe.
 *
 * @example
 * <RadialTree data={{ name: "root", children: [{ name: "a" }, { name: "b" }] }} />
 */
export function RadialTree(props: RadialTreeProps) {
  const {
    data,
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
        treeLayout(root);
        const colors = assignColors(theme, root);
        const cx = width / 2;
        const cy = h / 2;
        const maxR = Math.max(10, Math.min(width, h) / 2 - 44);
        // Map normalized (x = angle fraction, y = depth fraction) to polar pixels.
        const pt = (node: HNode) => {
          const ang = (node.x ?? 0.5) * 2 * Math.PI - Math.PI / 2;
          const r = (node.y ?? 0) * maxR;
          return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang), ang, r };
        };
        const nodes = descendants(root);

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Radial tree diagram"} style={{ display: "block" }}>
              <g>
                {nodes.map((node) =>
                  (node.children ?? []).map((child, ci) => {
                    const p = pt(node);
                    const c = pt(child);
                    // Radial curve: bend along the parent's angle before reaching the child.
                    const ctrlX = cx + c.r * Math.cos(p.ang);
                    const ctrlY = cy + c.r * Math.sin(p.ang);
                    const d = `M${p.x.toFixed(2)},${p.y.toFixed(2)} Q${ctrlX.toFixed(2)},${ctrlY.toFixed(2)} ${c.x.toFixed(2)},${c.y.toFixed(2)}`;
                    return <path key={`${node.depth}-${ci}-${child.data.name}`} d={d} fill="none" stroke={theme.colors.border} strokeWidth={1.5} />;
                  }),
                )}
              </g>
              {nodes.map((node, i) => {
                const p = pt(node);
                const color = colors.get(node) ?? theme.colors.primary;
                const active = hover === node;
                const deg = (p.ang * 180) / Math.PI;
                const flip = deg > 90 || deg < -90;
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
                    {showLabels && node.depth > 0 && (
                      <text transform={`rotate(${flip ? deg + 180 : deg})`}
                        x={flip ? -(nodeRadius + 6) : nodeRadius + 6} y={0}
                        textAnchor={flip ? "end" : "start"} dominantBaseline="central"
                        fontSize={theme.typography.fontSizeSm} fontFamily={theme.typography.fontFamily}
                        fill={theme.colors.text} pointerEvents="none">
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
