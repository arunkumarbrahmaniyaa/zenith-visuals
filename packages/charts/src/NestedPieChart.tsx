import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { readableTextColor } from "@zenith-visuals/utils";
import { defaultFormat } from "./lib/ticks";
import { arcPath, polar } from "./lib/paths";
import { seriesColor } from "./lib/series";
import { computeNestedPie, type NestedArc, type NestedSlice } from "./lib/radial";

export interface NestedPieChartProps extends BaseVisualizationProps {
  data: readonly NestedSlice[];
  /** Inner hole radius as a fraction of the outer radius. Default 0.2. */
  innerRadius?: number;
  /** Gap between rings in px. Default 2. */
  ringGap?: number;
  /** Show percentage labels on large arcs. Default true. */
  showLabels?: boolean;
  formatValue?: (value: number) => string;
  onArcClick?: (arc: NestedArc) => void;
  renderTooltip?: (arc: NestedArc, percent: number) => ReactNode;
}

/**
 * Nested (multi-level) pie / sunburst-lite chart. Each parent's angular span is
 * subdivided among its children across concentric rings. Responsive and SSR-safe.
 *
 * @example
 * <NestedPieChart data={[{ label: "A", children: [{ label: "A1", value: 3 }] }]} />
 */
export function NestedPieChart(props: NestedPieChartProps) {
  const {
    data,
    innerRadius = 0.2,
    ringGap = 2,
    showLabels = true,
    formatValue = defaultFormat,
    onArcClick,
    renderTooltip,
    height = 340,
    ...base
  } = props;

  const tooltip = useTooltip<{ arc: NestedArc; percent: number }>();
  const [hover, setHover] = useState<string | null>(null);

  return (
    <VisualizationContainer {...base} height={height} isEmpty={data.length === 0} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const cx = width / 2;
        const cy = h / 2;
        const { arcs, maxDepth } = computeNestedPie(data);
        const outer = Math.max(20, Math.min(width, h) / 2 - 12);
        const hole = outer * Math.min(0.9, Math.max(0, innerRadius));
        const ringThickness = maxDepth > 0 ? (outer - hole) / maxDepth : 0;
        const total = arcs.filter((a) => a.depth === 0).reduce((acc, a) => acc + a.value, 0) || 1;

        // Colors: each top-level arc takes a palette color; children inherit it
        // (arcs are in depth-first order, so a root always precedes its children).
        const colorOf = new Map<NestedArc, string>();
        let rootIndex = 0;
        let currentRoot = theme.colors.primary;
        for (const a of arcs) {
          if (a.depth === 0) {
            currentRoot = a.color ?? seriesColor(theme, { color: a.color }, rootIndex);
            rootIndex += 1;
          }
          colorOf.set(a, a.color ?? currentRoot);
        }

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Nested pie chart"} style={{ display: "block" }}>
              {arcs.map((a) => {
                const r0 = hole + a.depth * ringThickness + ringGap / 2;
                const r1 = hole + (a.depth + 1) * ringThickness - ringGap / 2;
                if (r1 <= r0) return null;
                const color = colorOf.get(a) ?? theme.colors.primary;
                const opacity = 1 - a.depth * 0.18;
                const key = `${a.depth}:${a.label}:${a.start.toFixed(4)}`;
                const active = hover === key;
                const mid = (a.start + a.end) / 2;
                const labelPos = polar(cx, cy, (r0 + r1) / 2, mid);
                const percent = a.value / total;
                const showText = showLabels && a.end - a.start > 0.25 && r1 - r0 > 14;
                return (
                  <g key={key}>
                    <path
                      d={arcPath(cx, cy, r0, r1, a.start, a.end)}
                      fill={color}
                      fillOpacity={active ? 1 : Math.max(0.35, opacity)}
                      stroke={theme.colors.background}
                      strokeWidth={1.5}
                      style={{ cursor: onArcClick ? "pointer" : "default" }}
                      onMouseEnter={(e) => {
                        setHover(key);
                        tooltip.show({ arc: a, percent }, e);
                      }}
                      onMouseMove={(e) => tooltip.move(e)}
                      onMouseLeave={() => {
                        setHover(null);
                        tooltip.hide();
                      }}
                      onClick={() => onArcClick?.(a)}
                    >
                      <title>{`${a.label}: ${formatValue(a.value)}`}</title>
                    </path>
                    {showText && (
                      <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="central"
                        fontSize={theme.typography.fontSizeSm} fontFamily={theme.typography.fontFamily}
                        fill={readableTextColor(color)} pointerEvents="none">
                        {a.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data.arc, tooltip.state.data.percent) ?? (
                  <span>
                    <strong>{tooltip.state.data.arc.label}</strong>
                    <br />
                    {formatValue(tooltip.state.data.arc.value)} ({(tooltip.state.data.percent * 100).toFixed(1)}%)
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
