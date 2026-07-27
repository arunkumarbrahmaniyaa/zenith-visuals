import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { readableTextColor } from "@zenith-visuals/utils";
import type { CategoryDatum } from "./types";
import { defaultFormat } from "./lib/ticks";
import { arcPath, polar } from "./lib/paths";
import { seriesColor } from "./lib/series";
import { Legend } from "./components/Legend";

export interface PieChartProps extends BaseVisualizationProps {
  data: readonly CategoryDatum[];
  /** Inner radius as a fraction of the outer radius (0 = pie, 0.6 = donut). */
  innerRadius?: number;
  /** Gap between slices in radians. Default 0.005. */
  padAngle?: number;
  /** Show percentage labels on slices. Default true. */
  showLabels?: boolean;
  showLegend?: boolean;
  /** Center text (donut only), e.g. a total. */
  centerLabel?: ReactNode;
  formatValue?: (value: number) => string;
  onSliceClick?: (datum: CategoryDatum, index: number) => void;
  renderTooltip?: (datum: CategoryDatum, percent: number) => ReactNode;
}

/**
 * Pie or donut chart. Set `innerRadius` above 0 for a donut, with optional
 * center label. Slices show percentage labels. Responsive and SSR-safe.
 *
 * @example
 * <PieChart innerRadius={0.6} data={[{ label: "A", value: 30 }, { label: "B", value: 70 }]} />
 */
export function PieChart(props: PieChartProps) {
  const {
    data,
    innerRadius = 0,
    padAngle = 0.005,
    showLabels = true,
    showLegend = true,
    centerLabel,
    formatValue = defaultFormat,
    onSliceClick,
    renderTooltip,
    height = 320,
    ...base
  } = props;

  const tooltip = useTooltip<{ datum: CategoryDatum; percent: number }>();
  const [hover, setHover] = useState<number | null>(null);

  return (
    <VisualizationContainer {...base} height={height} isEmpty={data.length === 0} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const total = data.reduce((acc, d) => acc + Math.max(0, d.value), 0) || 1;
        const cx = width / 2;
        const cy = h / 2;
        const outer = Math.max(10, Math.min(width, h) / 2 - 12);
        const inner = outer * Math.min(0.95, Math.max(0, innerRadius));

        let angle = 0;
        const slices = data.map((d, i) => {
          const value = Math.max(0, d.value);
          const frac = value / total;
          const start = angle + padAngle / 2;
          const end = angle + frac * Math.PI * 2 - padAngle / 2;
          angle += frac * Math.PI * 2;
          const color = d.color ?? seriesColor(theme, d, i);
          const mid = (start + end) / 2;
          return { d, i, start, end, mid, frac, color };
        });

        return (
          <>
            {showLegend && (
              <Legend theme={theme} items={data.map((d, i) => ({ label: d.label, color: d.color ?? seriesColor(theme, d, i) }))} />
            )}
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Pie chart"} style={{ display: "block" }}>
              {slices.map((s) => {
                const active = hover === s.i;
                const grow = active ? 4 : 0;
                const labelPos = polar(cx, cy, (outer + inner) / 2, s.mid);
                return (
                  <g key={s.d.label}>
                    <path
                      d={arcPath(cx, cy, inner, outer + grow, s.start, s.end)}
                      fill={s.color}
                      stroke={theme.colors.background}
                      strokeWidth={1.5}
                      style={{ cursor: onSliceClick ? "pointer" : "default", transition: "d 120ms" }}
                      onMouseEnter={(e) => {
                        setHover(s.i);
                        tooltip.show({ datum: s.d, percent: s.frac }, e);
                      }}
                      onMouseMove={(e) => tooltip.move(e)}
                      onMouseLeave={() => {
                        setHover(null);
                        tooltip.hide();
                      }}
                      onClick={() => onSliceClick?.(s.d, s.i)}
                    >
                      <title>{`${s.d.label}: ${formatValue(s.d.value)} (${(s.frac * 100).toFixed(1)}%)`}</title>
                    </path>
                    {showLabels && s.frac > 0.04 && (
                      <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="central"
                        fontSize={theme.typography.fontSizeSm} fontWeight={theme.typography.fontWeightBold}
                        fill={inner > 0 ? theme.colors.text : readableTextColor(s.color)} pointerEvents="none">
                        {(s.frac * 100).toFixed(0)}%
                      </text>
                    )}
                  </g>
                );
              })}
              {inner > 0 && centerLabel != null && (
                <foreignObject x={cx - inner} y={cy - inner} width={inner * 2} height={inner * 2}>
                  <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", textAlign: "center",
                    color: theme.colors.text, fontFamily: theme.typography.fontFamily,
                    fontSize: theme.typography.fontSizeLg, fontWeight: theme.typography.fontWeightBold }}>
                    {centerLabel}
                  </div>
                </foreignObject>
              )}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data.datum, tooltip.state.data.percent) ?? (
                  <span>
                    <strong>{tooltip.state.data.datum.label}</strong>
                    <br />
                    {formatValue(tooltip.state.data.datum.value)} ({(tooltip.state.data.percent * 100).toFixed(1)}%)
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
