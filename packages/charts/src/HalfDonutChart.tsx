import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import type { CategoryDatum } from "./types";
import { defaultFormat } from "./lib/ticks";
import { arcPath, polar } from "./lib/paths";
import { seriesColor } from "./lib/series";
import { Legend } from "./components/Legend";

export interface HalfDonutChartProps extends BaseVisualizationProps {
  data: readonly CategoryDatum[];
  /** Inner radius as a fraction of the outer radius. Default 0.6. */
  innerRadius?: number;
  /** Gap between slices in radians. Default 0.01. */
  padAngle?: number;
  showLegend?: boolean;
  /** Text shown in the empty center, e.g. a total. */
  centerLabel?: ReactNode;
  formatValue?: (value: number) => string;
  onSliceClick?: (datum: CategoryDatum, index: number) => void;
  renderTooltip?: (datum: CategoryDatum, percent: number) => ReactNode;
}

/**
 * Half-donut (semicircle) chart — a part-to-whole gauge that reads left→right
 * across the top. Great for compact dashboards. Responsive and SSR-safe.
 *
 * @example
 * <HalfDonutChart centerLabel="100%" data={[{ label: "A", value: 30 }, { label: "B", value: 70 }]} />
 */
export function HalfDonutChart(props: HalfDonutChartProps) {
  const {
    data,
    innerRadius = 0.6,
    padAngle = 0.01,
    showLegend = true,
    centerLabel,
    formatValue = defaultFormat,
    onSliceClick,
    renderTooltip,
    height = 220,
    ...base
  } = props;

  const tooltip = useTooltip<{ datum: CategoryDatum; percent: number }>();
  const [hover, setHover] = useState<number | null>(null);

  return (
    <VisualizationContainer {...base} height={height} isEmpty={data.length === 0} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const total = data.reduce((acc, d) => acc + Math.max(0, d.value), 0) || 1;
        const cx = width / 2;
        const outer = Math.max(20, Math.min(width / 2 - 12, h - 24));
        const inner = outer * Math.min(0.95, Math.max(0, innerRadius));
        const cy = h / 2 + outer / 2;
        const startAngle = -Math.PI / 2;

        let angle = startAngle;
        const slices = data.map((d, i) => {
          const value = Math.max(0, d.value);
          const frac = value / total;
          const start = angle + padAngle / 2;
          const end = angle + frac * Math.PI - padAngle / 2;
          angle += frac * Math.PI;
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
              aria-label={base.labels?.ariaLabel ?? "Half donut chart"} style={{ display: "block" }}>
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
                      style={{ cursor: onSliceClick ? "pointer" : "default" }}
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
                    {s.frac > 0.06 && (
                      <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="central"
                        fontSize={theme.typography.fontSizeSm} fontWeight={theme.typography.fontWeightBold}
                        fill={theme.colors.text} pointerEvents="none">
                        {(s.frac * 100).toFixed(0)}%
                      </text>
                    )}
                  </g>
                );
              })}
              {centerLabel != null && (
                <text x={cx} y={cy - inner * 0.25} textAnchor="middle" dominantBaseline="central"
                  fontSize={theme.typography.fontSizeLg * 1.2} fontWeight={theme.typography.fontWeightBold}
                  fontFamily={theme.typography.fontFamily} fill={theme.colors.text}>
                  {typeof centerLabel === "string" || typeof centerLabel === "number" ? centerLabel : ""}
                </text>
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
