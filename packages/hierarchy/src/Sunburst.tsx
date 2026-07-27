import { useMemo, useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
} from "@zenith-visuals/core";
import { readableTextColor } from "@zenith-visuals/utils";
import { arcPath, defaultFormat, polar } from "@zenith-visuals/charts";
import type { HierarchyChartProps } from "./types";
import { descendants, hierarchy, type HNode } from "./lib/hierarchy";
import { partitionLayout } from "./lib/partition";
import { assignColors } from "./lib/color";

export interface SunburstProps extends HierarchyChartProps {
  /** Radius of the empty center hole as a fraction of the ring band. Default 0. */
  innerRadius?: number;
  /** Show arc labels when the slice is large enough. Default true. */
  showLabels?: boolean;
  onNodeClick?: (node: HNode) => void;
  renderTooltip?: (node: HNode) => ReactNode;
}

/**
 * Sunburst — a radial, multi-level partition of a hierarchy. Each ring is a
 * depth level; arc sweep encodes value. Responsive and SSR-safe.
 *
 * @example
 * <Sunburst data={{ name: "root", children: [{ name: "A", value: 8 }] }} />
 */
export function Sunburst(props: SunburstProps) {
  const {
    data,
    innerRadius = 0,
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
        partitionLayout(root);
        const colors = assignColors(theme, root);
        const cx = width / 2;
        const cy = h / 2;
        const maxR = Math.min(width, h) / 2 - 4;
        const rings = root.height + 1;
        const hole = innerRadius * (maxR / rings);
        const radiusAt = (y: number) => hole + y * (maxR - hole);
        const nodes = descendants(root).filter((n) => n.depth > 0);

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Sunburst chart"} style={{ display: "block" }}>
              {nodes.map((node, i) => {
                const a0 = (node.x0 ?? 0) * Math.PI * 2;
                const a1 = (node.x1 ?? 0) * Math.PI * 2;
                const r0 = radiusAt(node.y0 ?? 0);
                const r1 = radiusAt(node.y1 ?? 0);
                const color = colors.get(node) ?? theme.colors.primary;
                const active = hover === node;
                const mid = (a0 + a1) / 2;
                const labelR = (r0 + r1) / 2;
                const lp = polar(cx, cy, labelR, mid);
                const sweep = a1 - a0;
                const showText = showLabels && sweep > 0.18 && r1 - r0 > 16;
                const rotate = ((mid * 180) / Math.PI) - 90;
                const flip = rotate > 90 && rotate < 270;
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
                    <path d={arcPath(cx, cy, r0, r1, a0, a1)} fill={color}
                      fillOpacity={active ? 1 : 0.85 - node.depth * 0.06} stroke={theme.colors.background} strokeWidth={1} />
                    {showText && (
                      <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="central"
                        fontSize={theme.typography.fontSizeSm} fontFamily={theme.typography.fontFamily}
                        fill={readableTextColor(color)} pointerEvents="none"
                        transform={`rotate(${flip ? rotate + 180 : rotate} ${lp.x} ${lp.y})`}>
                        {node.data.name}
                      </text>
                    )}
                    <title>{`${node.data.name}: ${formatValue(node.value)}`}</title>
                  </g>
                );
              })}
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                fontSize={theme.typography.fontSizeSm} fontFamily={theme.typography.fontFamily}
                fontWeight={theme.typography.fontWeightBold} fill={theme.colors.textMuted}>
                {root.data.name}
              </text>
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
