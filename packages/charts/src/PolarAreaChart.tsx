import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import type { ChartSeries } from "./types";
import { defaultFormat, niceTicks } from "./lib/ticks";
import { arcPath, polar } from "./lib/paths";
import { seriesColor } from "./lib/series";
import { computePolarArea, type PolarSegment } from "./lib/matrix";
import { Legend } from "./components/Legend";

export interface PolarAreaChartProps extends BaseVisualizationProps {
  /** Category labels — one equal-angle slice each. */
  categories: readonly string[];
  /** Series aligned index-for-index with `categories`; stacked radially. */
  series: readonly ChartSeries[];
  /** Gap between slices in radians. Default 0.02. */
  padAngle?: number;
  /** Number of concentric grid rings. Default 4. */
  rings?: number;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
  renderTooltip?: (category: string, segment: PolarSegment) => ReactNode;
}

/**
 * PolarAreaChart — a stacked polar-area (coxcomb) chart. Each category is an
 * equal-angle slice and every series stacks radially from the centre outward,
 * so the outer radius encodes each category's cumulative total. Responsive,
 * themeable and SSR-safe.
 *
 * @example
 * <PolarAreaChart categories={["Q1", "Q2"]} series={[{ name: "Web", data: [12, 18] }]} />
 */
export function PolarAreaChart(props: PolarAreaChartProps) {
  const {
    categories,
    series,
    padAngle = 0.02,
    rings = 4,
    showLegend,
    formatValue = defaultFormat,
    renderTooltip,
    height = 340,
    ...base
  } = props;

  const tooltip = useTooltip<{ category: string; segment: PolarSegment }>();
  const [hover, setHover] = useState<string | null>(null);
  const legend = showLegend ?? series.length > 1;

  const layout = computePolarArea(categories, series);

  return (
    <VisualizationContainer
      {...base}
      height={height}
      isEmpty={categories.length === 0 || series.length === 0}
      defaultHeight={height}
    >
      {({ theme, width, height: h }) => {
        const cx = width / 2;
        const cy = h / 2;
        const radius = Math.max(20, Math.min(width, h) / 2 - 28);
        const { niceMax, ticks } = niceTicks(0, layout.max, rings, true);
        const scale = (v: number) => (niceMax <= 0 ? 0 : (v / niceMax) * radius);
        const step = layout.slices.length > 0 ? (Math.PI * 2) / layout.slices.length : 0;
        const colorOf = (segment: PolarSegment, si: number) =>
          segment.color ?? seriesColor(theme, series[si] ?? {}, si);

        return (
          <>
            {legend && (
              <Legend
                theme={theme}
                items={series.map((s, i) => ({ label: s.name, color: seriesColor(theme, s, i) }))}
              />
            )}
            <svg
              width={width}
              height={h}
              viewBox={`0 0 ${width} ${h}`}
              role="img"
              aria-label={base.labels?.ariaLabel ?? "Polar area chart"}
              style={{ display: "block" }}
            >
              <g aria-hidden>
                {ticks.map((t) => {
                  const rr = scale(t);
                  if (rr <= 0) return null;
                  return <circle key={t} cx={cx} cy={cy} r={rr} fill="none" stroke={theme.colors.border} opacity={0.5} />;
                })}
              </g>
              {layout.slices.map((slice) => {
                const start = slice.index * step + padAngle / 2;
                const end = (slice.index + 1) * step - padAngle / 2;
                const labelPos = polar(cx, cy, radius + 14, (start + end) / 2);
                const active = hover === slice.category;
                return (
                  <g key={slice.category} opacity={hover != null && !active ? 0.5 : 1}>
                    {slice.segments.map((seg, si) => {
                      if (seg.value <= 0) return null;
                      const inner = scale(seg.from);
                      const outer = scale(seg.to);
                      const color = colorOf(seg, si);
                      return (
                        <path
                          key={seg.series}
                          d={arcPath(cx, cy, inner, Math.max(inner + 0.5, outer), start, end)}
                          fill={color}
                          fillOpacity={0.9}
                          stroke={theme.colors.background}
                          strokeWidth={1}
                          onMouseEnter={(e) => {
                            setHover(slice.category);
                            tooltip.show({ category: slice.category, segment: seg }, e);
                          }}
                          onMouseMove={(e) => tooltip.move(e)}
                          onMouseLeave={() => {
                            setHover(null);
                            tooltip.hide();
                          }}
                        >
                          <title>{`${slice.category} · ${seg.series}: ${formatValue(seg.value)}`}</title>
                        </path>
                      );
                    })}
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={theme.typography.fontSizeSm}
                      fontFamily={theme.typography.fontFamily}
                      fill={theme.colors.textMuted}
                      pointerEvents="none"
                    >
                      {slice.category}
                    </text>
                  </g>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data.category, tooltip.state.data.segment) ?? (
                  <span>
                    <strong>{tooltip.state.data.category}</strong>
                    <br />
                    {tooltip.state.data.segment.series}: {formatValue(tooltip.state.data.segment.value)}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
