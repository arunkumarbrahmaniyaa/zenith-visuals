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
import { partitionLayout } from "./lib/partition";
import { assignColors } from "./lib/color";

export interface IcicleProps extends HierarchyChartProps {
  /** Orientation of increasing depth. Default "vertical" (top→down). */
  orientation?: "vertical" | "horizontal";
  /** Show node labels when the cell is large enough. Default true. */
  showLabels?: boolean;
  onNodeClick?: (node: HNode) => void;
  renderTooltip?: (node: HNode) => ReactNode;
}

/**
 * Icicle chart — a rectangular partition of a hierarchy where each level is a
 * row (or column) and cell size encodes value. Responsive and SSR-safe.
 *
 * @example
 * <Icicle data={{ name: "root", children: [{ name: "A", value: 8 }] }} />
 */
export function Icicle(props: IcicleProps) {
  const {
    data,
    orientation = "vertical",
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
        const nodes = descendants(root);
        const vertical = orientation === "vertical";

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Icicle chart"} style={{ display: "block" }}>
              {nodes.map((node, i) => {
                const x0 = node.x0 ?? 0;
                const x1 = node.x1 ?? 0;
                const y0 = node.y0 ?? 0;
                const y1 = node.y1 ?? 0;
                const rx = vertical ? x0 * width : y0 * width;
                const ry = vertical ? y0 * h : x0 * h;
                const rw = Math.max(0, (vertical ? x1 * width : y1 * width) - rx);
                const rh = Math.max(0, (vertical ? y1 * h : x1 * h) - ry);
                const color = colors.get(node) ?? theme.colors.primary;
                const active = hover === node;
                const showText = showLabels && rw > 40 && rh > 16;
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
                    <rect x={rx} y={ry} width={rw} height={rh} rx={2} fill={color}
                      fillOpacity={active ? 1 : 0.9 - node.depth * 0.05} stroke={theme.colors.background} strokeWidth={1} />
                    {showText && (
                      <text x={rx + 5} y={ry + rh / 2} dominantBaseline="central"
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
