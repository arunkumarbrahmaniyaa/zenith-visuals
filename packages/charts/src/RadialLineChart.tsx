import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import type { ChartSeries } from "./types";
import { defaultFormat, niceTicks } from "./lib/ticks";
import { polar, linePath, type XY } from "./lib/paths";
import { seriesColor, seriesExtent } from "./lib/series";
import { Legend } from "./components/Legend";

export interface RadialLineChartProps extends BaseVisualizationProps {
  /** Angular category labels (one per data index). */
  categories: readonly string[];
  /** One or more series aligned to `categories`, plotted around the circle. */
  series: readonly ChartSeries[];
  /** Fill the area under each line. Default false. */
  area?: boolean;
  /** Number of concentric grid rings. Default 4. */
  rings?: number;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
  renderTooltip?: (series: string, category: string, value: number) => ReactNode;
}

/**
 * Radial line chart — a line (optionally filled) wrapped around a circular
 * category axis. Ideal for cyclic data such as hours or months. Responsive
 * and SSR-safe.
 *
 * @example
 * <RadialLineChart categories={["Jan", "Feb", "Mar"]} series={[{ name: "2025", data: [3, 5, 4] }]} />
 */
export function RadialLineChart(props: RadialLineChartProps) {
  const {
    categories,
    series,
    area = false,
    rings = 4,
    showLegend,
    formatValue = defaultFormat,
    renderTooltip,
    height = 340,
    ...base
  } = props;

  const tooltip = useTooltip<{ series: string; category: string; value: number }>();
  const [hover, setHover] = useState<string | null>(null);
  const legend = showLegend ?? series.length > 1;
  const axes = categories.length;

  return (
    <VisualizationContainer {...base} height={height} isEmpty={axes === 0 || series.length === 0} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const cx = width / 2;
        const cy = h / 2;
        const radius = Math.max(20, Math.min(width, h) / 2 - 28);
        const [, max] = seriesExtent(series, true);
        const { niceMax, ticks } = niceTicks(0, max, rings, true);
        const scale = (v: number) => (niceMax <= 0 ? 0 : (v / niceMax) * radius);
        const angleAt = (i: number) => (i / axes) * Math.PI * 2;

        return (
          <>
            {legend && (
              <Legend theme={theme} items={series.map((s, i) => ({ label: s.name, color: seriesColor(theme, s, i) }))} />
            )}
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Radial line chart"} style={{ display: "block" }}>
              <g aria-hidden>
                {ticks.map((t) => {
                  const rr = scale(t);
                  if (rr <= 0) return null;
                  return <circle key={t} cx={cx} cy={cy} r={rr} fill="none" stroke={theme.colors.border} opacity={0.5} />;
                })}
                {categories.map((label, i) => {
                  const outer = polar(cx, cy, radius, angleAt(i));
                  const labelPos = polar(cx, cy, radius + 16, angleAt(i));
                  return (
                    <g key={label}>
                      <line x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke={theme.colors.border} opacity={0.4} />
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
                const pts: XY[] = categories.map((_, i) => polar(cx, cy, scale(s.data[i] ?? 0), angleAt(i)));
                return (
                  <g key={s.name} opacity={dimmed ? 0.25 : 1}>
                    <path d={`${linePath(pts)} Z`} fill={area ? color : "none"} fillOpacity={area ? 0.15 : 0}
                      stroke={color} strokeWidth={2} strokeLinejoin="round" />
                    {pts.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={color}
                        onMouseEnter={(e) => {
                          setHover(s.name);
                          tooltip.show({ series: s.name, category: categories[i] ?? "", value: s.data[i] ?? 0 }, e);
                        }}
                        onMouseMove={(e) => tooltip.move(e)}
                        onMouseLeave={() => {
                          setHover(null);
                          tooltip.hide();
                        }}>
                        <title>{`${s.name} · ${categories[i] ?? ""}: ${formatValue(s.data[i] ?? 0)}`}</title>
                      </circle>
                    ))}
                  </g>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data.series, tooltip.state.data.category, tooltip.state.data.value) ?? (
                  <span>
                    <strong>{tooltip.state.data.series}</strong>
                    <br />
                    {tooltip.state.data.category}: {formatValue(tooltip.state.data.value)}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
