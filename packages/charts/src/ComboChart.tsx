import { useMemo, useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
} from "@zenith-visuals/core";
import { linearScale } from "@zenith-visuals/utils";
import type { CartesianChartProps, ChartSeries } from "./types";
import { computeCartesianLayout } from "./lib/cartesian";
import { defaultFormat, niceTicks } from "./lib/ticks";
import { linePath, smoothPath, type XY } from "./lib/paths";
import { seriesColor, seriesExtent } from "./lib/series";
import { CartesianAxes } from "./components/CartesianAxes";
import { Legend } from "./components/Legend";

export interface ComboChartProps extends CartesianChartProps {
  /** Series drawn as lines on top of the `series` bars. */
  lineSeries: readonly ChartSeries[];
  /** Plot the line series against an independent right-hand axis. Default false. */
  secondaryAxis?: boolean;
  /** Corner radius for bars. Default 4. */
  radius?: number;
  /** Smooth the lines. Default false. */
  smooth?: boolean;
  renderTooltip?: (info: ComboTooltipInfo) => ReactNode;
}

interface ComboTooltipInfo {
  series: string;
  category: string;
  value: number;
  color: string;
}

const PAD_RIGHT = 44;

/**
 * ComboChart — grouped bars overlaid with one or more trend lines, optionally
 * on an independent secondary axis. Ideal for value-plus-rate dashboards
 * (e.g. revenue bars + growth-rate line). Responsive, themed and SSR-safe.
 *
 * @example
 * <ComboChart
 *   categories={months}
 *   series={[{ name: "Revenue", data: rev }]}
 *   lineSeries={[{ name: "Growth %", data: growth }]}
 *   secondaryAxis
 * />
 */
export function ComboChart(props: ComboChartProps) {
  const {
    categories,
    series,
    lineSeries,
    secondaryAxis = false,
    radius = 4,
    smooth = false,
    showLegend,
    showGrid = true,
    yTickCount = 5,
    formatValue = defaultFormat,
    renderTooltip,
    height = 320,
    ...base
  } = props;

  const tooltip = useTooltip<ComboTooltipInfo>();
  const [hover, setHover] = useState<string | null>(null);
  const legend = showLegend ?? series.length + lineSeries.length > 1;

  const [barMin, barMax] = useMemo(() => seriesExtent(series, true), [series]);
  const [lineMin, lineMax] = useMemo(() => seriesExtent(lineSeries, true), [lineSeries]);

  return (
    <VisualizationContainer
      {...base}
      height={height}
      isEmpty={categories.length === 0 || (series.length === 0 && lineSeries.length === 0)}
      defaultHeight={height}
    >
      {({ theme, width, height: h }) => {
        const layout = computeCartesianLayout({
          width,
          height: h,
          categories,
          valueMin: barMin,
          valueMax: barMax,
          yTickCount,
          includeZero: true,
          padding: { top: 12, right: 16 + (secondaryAxis ? PAD_RIGHT : 0), bottom: 28, left: 44 },
        });
        const { plot } = layout;

        const lineTicks = secondaryAxis ? niceTicks(lineMin, lineMax, yTickCount, true) : null;
        const lineY = lineTicks
          ? linearScale([lineTicks.niceMin, lineTicks.niceMax], [plot.y + plot.h, plot.y])
          : layout.yScale;

        const groupCount = Math.max(1, series.length);
        const inner = layout.xBand.bandwidth / groupCount;
        const zeroY = layout.yScale(0);

        const legendNode = legend ? (
          <Legend
            theme={theme}
            items={[
              ...series.map((s, i) => ({ label: s.name, color: seriesColor(theme, s, i) })),
              ...lineSeries.map((s, i) => ({ label: s.name, color: seriesColor(theme, s, series.length + i) })),
            ]}
          />
        ) : null;

        return (
          <>
            {legendNode}
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Combo chart"} style={{ display: "block" }}>
              <CartesianAxes theme={theme} layout={layout} categories={categories}
                formatValue={formatValue} showGrid={showGrid} />

              {secondaryAxis && lineTicks &&
                lineTicks.ticks.map((t) => (
                  <text key={t} x={plot.x + plot.w + 8} y={lineY(t)} textAnchor="start" dominantBaseline="central"
                    fontSize={theme.typography.fontSizeSm} fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>
                    {formatValue(t)}
                  </text>
                ))}

              {categories.map((cat, ci) =>
                series.map((s, si) => {
                  const color = seriesColor(theme, s, si);
                  const v = s.data[ci] ?? 0;
                  const y1 = layout.yScale(v);
                  const x = layout.xBand(cat) + si * inner;
                  const dimmed = hover != null && hover !== s.name;
                  return (
                    <rect
                      key={`${cat}-${s.name}`}
                      x={x + inner * 0.1}
                      y={Math.min(zeroY, y1)}
                      width={inner * 0.8}
                      height={Math.max(1, Math.abs(zeroY - y1))}
                      rx={radius}
                      fill={color}
                      opacity={dimmed ? 0.3 : 1}
                      onMouseEnter={(e) => {
                        setHover(s.name);
                        tooltip.show({ series: s.name, category: cat, value: v, color }, e);
                      }}
                      onMouseMove={(e) => tooltip.move(e)}
                      onMouseLeave={() => {
                        setHover(null);
                        tooltip.hide();
                      }}
                    >
                      <title>{`${s.name} · ${cat}: ${formatValue(v)}`}</title>
                    </rect>
                  );
                }),
              )}

              {lineSeries.map((s, si) => {
                const color = seriesColor(theme, s, series.length + si);
                const points: XY[] = categories.map((_, ci) => ({
                  x: layout.categoryCenter(ci),
                  y: lineY(s.data[ci] ?? 0),
                }));
                const dimmed = hover != null && hover !== s.name;
                return (
                  <g key={s.name} opacity={dimmed ? 0.3 : 1}>
                    <path d={smooth ? smoothPath(points) : linePath(points)} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
                    {points.map((p, ci) => (
                      <circle key={ci} cx={p.x} cy={p.y} r={3} fill={color}
                        onMouseEnter={(e) => {
                          setHover(s.name);
                          tooltip.show({ series: s.name, category: categories[ci] ?? "", value: s.data[ci] ?? 0, color }, e);
                        }}
                        onMouseMove={(e) => tooltip.move(e)}
                        onMouseLeave={() => {
                          setHover(null);
                          tooltip.hide();
                        }} />
                    ))}
                  </g>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data) ?? (
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
