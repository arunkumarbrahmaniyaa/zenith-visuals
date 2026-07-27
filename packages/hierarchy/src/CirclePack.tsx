import { useMemo, useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
} from "@zenith-visuals/core";
import { readableTextColor } from "@zenith-visuals/utils";
import { defaultFormat } from "@zenith-visuals/charts";
import type { HierarchyChartProps } from "./types";
import { descendants, hierarchy, type HNode } from "./lib/hierarchy";
import { packLayout } from "./lib/pack";
import { assignColors } from "./lib/color";

export interface CirclePackProps extends HierarchyChartProps {
  /** Gap (px) between packed circles. Default 3. */
  padding?: number;
  /** Show leaf labels when the circle is large enough. Default true. */
  showLabels?: boolean;
  onNodeClick?: (node: HNode) => void;
  renderTooltip?: (node: HNode) => ReactNode;
}

/**
 * Circle packing — nested enclosing circles whose leaf area encodes value.
 * Great for showing part-to-whole across many levels. Responsive and SSR-safe.
 *
 * @example
 * <CirclePack data={{ name: "root", children: [{ name: "A", value: 8 }] }} />
 */
export function CirclePack(props: CirclePackProps) {
  const {
    data,
    padding = 3,
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
    <VisualizationContainer {...base} height={height} isEmpty={root.value <= 0} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const size = Math.min(width, h);
        packLayout(root, size, padding);
        const colors = assignColors(theme, root);
        const offX = (width - size) / 2;
        const offY = (h - size) / 2;
        const nodes = descendants(root);

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Circle packing chart"} style={{ display: "block" }}>
              {nodes.map((node, i) => {
                const cx = offX + (node.x ?? 0);
                const cy = offY + (node.y ?? 0);
                const r = node.r ?? 0;
                const isLeaf = !node.children || node.children.length === 0;
                const color = colors.get(node) ?? theme.colors.primary;
                const active = hover === node;
                const showText = showLabels && isLeaf && r > 18;
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
                    <circle cx={cx} cy={cy} r={r}
                      fill={isLeaf ? color : theme.colors.muted}
                      fillOpacity={isLeaf ? (active ? 1 : 0.9) : 0.35}
                      stroke={isLeaf ? theme.colors.background : theme.colors.border}
                      strokeWidth={1} />
                    {showText && (
                      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                        fontSize={theme.typography.fontSizeSm} fontFamily={theme.typography.fontFamily}
                        fill={readableTextColor(color)} pointerEvents="none">
                        {node.data.name}
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
