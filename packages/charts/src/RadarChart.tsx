import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import type { ChartSeries } from "./types";
import { defaultFormat, niceTicks } from "./lib/ticks";
import { polar, linePath } from "./lib/paths";
import { seriesColor, seriesExtent } from "./lib/series";
import { Legend } from "./components/Legend";

export interface RadarChartProps extends BaseVisualizationProps {
  /** Axis labels around the radar (one per data index). */
  indicators: readonly string[];
  /** Series aligned to `indicators`. */
  series: readonly ChartSeries[];
  /** Number of concentric grid rings. Default 4. */
  rings?: number;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
  renderTooltip?: (series: string, indicator: string, value: number) => ReactNode;
}

/**
 * Radar (spider) chart comparing multiple series across shared indicators.
 * Responsive, themeable and SSR-safe.
 *
 * @example
 * <RadarChart indicators={["Speed", "Power", "Range"]} series={[{ name: "A", data: [3, 5, 4] }]} />
 */
export function RadarChart(props: RadarChartProps) {
  const {
    indicators,
    series,
    rings = 4,
    showLegend,
    formatValue = defaultFormat,
    renderTooltip,
    height = 340,
    ...base
  } = props;

  const tooltip = useTooltip<{ series: string; indicator: string; value: number }>();
  const [hover, setHover] = useState<string | null>(null);
  const legend = showLegend ?? series.length > 1;
  const axes = indicators.length;

  return (
    <VisualizationContainer
      {...base}
      height={height}
      isEmpty={axes === 0 || series.length === 0}
      defaultHeight={height}
    >
      {({ theme, width, height: h }) => {
        const cx = width / 2;
        const cy = h / 2;
        const radius = Math.max(20, Math.min(width, h) / 2 - 28);
        const [, max] = seriesExtent(series, true);
        const { niceMax } = niceTicks(0, max, rings, true);
        const scale = (v: number) => (niceMax <= 0 ? 0 : (v / niceMax) * radius);
        const angleAt = (i: number) => (i / axes) * Math.PI * 2;

        return (
          <>
            {legend && (
              <Legend theme={theme} items={series.map((s, i) => ({ label: s.name, color: seriesColor(theme, s, i) }))} />
            )}
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Radar chart"} style={{ display: "block" }}>
              <g aria-hidden>
                {Array.from({ length: rings }, (_, r) => {
                  const rr = ((r + 1) / rings) * radius;
                  const pts = indicators.map((_, i) => polar(cx, cy, rr, angleAt(i)));
                  return <path key={r} d={`${linePath(pts)} Z`} fill="none" stroke={theme.colors.border} opacity={0.6} />;
                })}
                {indicators.map((label, i) => {
                  const outer = polar(cx, cy, radius, angleAt(i));
                  const labelPos = polar(cx, cy, radius + 16, angleAt(i));
                  return (
                    <g key={label}>
                      <line x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke={theme.colors.border} opacity={0.6} />
                      <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="central"
                        fontSize={theme.typography.fontSizeSm} fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>
                        {label}
                      </text>
                    </g>
                  );
                })}
              </g>
              {series.map((s, si) => {
                const color = seriesColor(theme, s, si);
                const dimmed = hover != null && hover !== s.name;
                const pts = indicators.map((_, i) => polar(cx, cy, scale(s.data[i] ?? 0), angleAt(i)));
                return (
                  <g key={s.name} opacity={dimmed ? 0.25 : 1}>
                    <path d={`${linePath(pts)} Z`} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={2} strokeLinejoin="round" />
                    {pts.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={color}
                        onMouseEnter={(e) => {
                          setHover(s.name);
                          tooltip.show({ series: s.name, indicator: indicators[i] ?? "", value: s.data[i] ?? 0 }, e);
                        }}
                        onMouseMove={(e) => tooltip.move(e)}
                        onMouseLeave={() => {
                          setHover(null);
                          tooltip.hide();
                        }}>
                        <title>{`${s.name} · ${indicators[i] ?? ""}: ${formatValue(s.data[i] ?? 0)}`}</title>
                      </circle>
                    ))}
                  </g>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data.series, tooltip.state.data.indicator, tooltip.state.data.value) ?? (
                  <span>
                    <strong>{tooltip.state.data.series}</strong>
                    <br />
                    {tooltip.state.data.indicator}: {formatValue(tooltip.state.data.value)}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
