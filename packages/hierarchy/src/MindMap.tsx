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

export interface MindMapProps extends HierarchyChartProps {
  /** Node label font size override (defaults to the theme small size). */
  fontSize?: number;
  onNodeClick?: (node: HNode) => void;
  renderTooltip?: (node: HNode) => ReactNode;
}

/**
 * Mind map — a left-to-right tidy tree with branch-colored, organic curved
 * links and pill labels radiating from a central root. Responsive, themeable
 * and SSR-safe.
 *
 * @example
 * <MindMap data={{ name: "Idea", children: [{ name: "Branch A" }, { name: "Branch B" }] }} />
 */
export function MindMap(props: MindMapProps) {
  const {
    data,
    fontSize,
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
        const margin = { left: 70, right: 120, y: 28 };
        const fs = fontSize ?? theme.typography.fontSize;
        // Horizontal: depth → x, breadth → y.
        const px = (node: HNode) => ({
          x: margin.left + (node.y ?? 0) * (width - margin.left - margin.right),
          y: margin.y + (node.x ?? 0.5) * (h - margin.y * 2),
        });
        const nodes = descendants(root);

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Mind map"} style={{ display: "block" }}>
              <g>
                {nodes.map((node) =>
                  (node.children ?? []).map((child, ci) => {
                    const p = px(node);
                    const c = px(child);
                    const color = colors.get(child) ?? theme.colors.primary;
                    const mx = (p.x + c.x) / 2;
                    const d = `M${p.x},${p.y} C${mx},${p.y} ${mx},${c.y} ${c.x},${c.y}`;
                    return (
                      <path key={`${node.depth}-${ci}-${child.data.name}`} d={d} fill="none"
                        stroke={color} strokeWidth={Math.max(1.5, 4 - child.depth)} strokeOpacity={0.75}
                        strokeLinecap="round" />
                    );
                  }),
                )}
              </g>
              {nodes.map((node, i) => {
                const p = px(node);
                const color = colors.get(node) ?? theme.colors.primary;
                const active = hover === node;
                const isRoot = node.depth === 0;
                const label = node.data.name;
                const padX = 8;
                const boxW = label.length * fs * 0.58 + padX * 2;
                const boxH = fs + 10;
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
                    <rect x={-boxW / 2} y={-boxH / 2} width={boxW} height={boxH} rx={boxH / 2}
                      fill={isRoot ? color : theme.colors.surface}
                      stroke={color} strokeWidth={active ? 2 : 1.25} />
                    <text x={0} y={0} textAnchor="middle" dominantBaseline="central"
                      fontSize={fs} fontFamily={theme.typography.fontFamily}
                      fontWeight={isRoot ? theme.typography.fontWeightBold : theme.typography.fontWeight}
                      fill={isRoot ? theme.colors.background : theme.colors.text} pointerEvents="none">
                      {label}
                    </text>
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
