import { useMemo, useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
} from "@zenith-visuals/core";
import { readableTextColor } from "@zenith-visuals/utils";
import { defaultFormat } from "@zenith-visuals/charts";
import type { HierarchyChartProps } from "./types";
import { hierarchy, leaves, type HNode } from "./lib/hierarchy";
import { treemapLayout } from "./lib/treemap";
import { assignColors } from "./lib/color";

export interface TreemapProps extends HierarchyChartProps {
  /** Inset (px) applied around each parent before packing its children. */
  padding?: number;
  /** Show leaf labels when the cell is large enough. Default true. */
  showLabels?: boolean;
  onNodeClick?: (node: HNode) => void;
  renderTooltip?: (node: HNode) => ReactNode;
}

/**
 * Squarified treemap — nested rectangles whose area encodes value. Ideal for
 * budgets, disk usage and portfolio composition. Responsive and SSR-safe.
 *
 * @example
 * <Treemap data={{ name: "root", children: [{ name: "A", value: 8 }] }} />
 */
export function Treemap(props: TreemapProps) {
  const {
    data,
    padding = 2,
    showLabels = true,
    formatValue = defaultFormat,
    onNodeClick,
    renderTooltip,
    height = 360,
    ...base
  } = props;

  const tooltip = useTooltip<HNode>();
  const [hover, setHover] = useState<HNode | null>(null);
  const root = useMemo(() => hierarchy(data), [data]);

  return (
    <VisualizationContainer
      {...base}
      height={height}
      isEmpty={root.value <= 0}
      defaultHeight={height}
    >
      {({ theme, width, height: h }) => {
        treemapLayout(root, width, h, padding);
        const colors = assignColors(theme, root);
        const cells = leaves(root);

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Treemap"} style={{ display: "block" }}>
              {cells.map((node, i) => {
                const x = node.x0 ?? 0;
                const y = node.y0 ?? 0;
                const w = Math.max(0, (node.x1 ?? 0) - x);
                const hh = Math.max(0, (node.y1 ?? 0) - y);
                const color = colors.get(node) ?? theme.colors.primary;
                const active = hover === node;
                const showText = showLabels && w > 44 && hh > 22;
                return (
                  <g key={i}
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
                    <rect x={x} y={y} width={w} height={hh} rx={3} fill={color}
                      fillOpacity={active ? 1 : 0.88} stroke={theme.colors.background} strokeWidth={1} />
                    {showText && (
                      <text x={x + 6} y={y + 16} fontSize={theme.typography.fontSizeSm}
                        fontFamily={theme.typography.fontFamily} fill={readableTextColor(color)} pointerEvents="none">
                        <tspan fontWeight={theme.typography.fontWeightBold}>{node.data.name}</tspan>
                        {hh > 36 && <tspan x={x + 6} dy={15}>{formatValue(node.value)}</tspan>}
                      </text>
                    )}
                    <title>{`${node.data.name}: ${formatValue(node.value)}`}</title>
                  </g>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data) ?? (
                  <span>
                    <strong>{tooltip.state.data.data.name}</strong>: {formatValue(tooltip.state.data.value)}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
