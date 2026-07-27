import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type ZenithTheme,
} from "@zenith-visuals/core";
import type { CartesianChartProps } from "./types";
import { computeCartesianLayout } from "./lib/cartesian";
import { defaultFormat } from "./lib/ticks";
import { linePath, smoothPath, areaPath, type XY } from "./lib/paths";
import { seriesColor, seriesExtent } from "./lib/series";
import { CartesianAxes } from "./components/CartesianAxes";
import { Legend } from "./components/Legend";

export interface LineChartProps extends CartesianChartProps {
  /** Render smooth (spline) curves instead of straight segments. */
  smooth?: boolean;
  /** Fill the area beneath each line. Default false (use `AreaChart` for stacks). */
  area?: boolean;
  /** Draw a marker dot at each data point. Default true for small datasets. */
  showPoints?: boolean;
  /** Line stroke width in px. Default 2. */
  strokeWidth?: number;
  onPointClick?: (series: string, index: number, value: number) => void;
  renderTooltip?: (info: TooltipInfo) => ReactNode;
}

interface TooltipInfo {
  series: string;
  category: string;
  value: number;
  color: string;
}

/**
 * Multi-series line chart with optional smoothing, area fill and point
 * markers. Responsive, themeable, accessible and SSR-safe.
 *
 * @example
 * <LineChart
 *   categories={["Jan", "Feb", "Mar"]}
 *   series={[{ name: "Sales", data: [10, 40, 25] }]}
 * />
 */
export function LineChart(props: LineChartProps) {
  const {
    categories,
    series,
    smooth = false,
    area = false,
    showPoints,
    strokeWidth = 2,
    showLegend,
    showGrid = true,
    yTickCount = 5,
    formatValue = defaultFormat,
    onPointClick,
    renderTooltip,
    height = 320,
    ...base
  } = props;

  const tooltip = useTooltip<TooltipInfo>();
  const [hover, setHover] = useState<string | null>(null);
  const legend = showLegend ?? series.length > 1;
  const points = showPoints ?? categories.length <= 40;

  return (
    <VisualizationContainer
      {...base}
      height={height}
      isEmpty={series.length === 0 || categories.length === 0}
      defaultHeight={height}
    >
      {({ theme, width, height: h }) => {
        const [min, max] = seriesExtent(series, area);
        const layout = computeCartesianLayout({
          width,
          height: h,
          categories,
          valueMin: min,
          valueMax: max,
          yTickCount,
          includeZero: area,
        });
        const baselineY = layout.yScale(Math.max(0, layout.yMin));

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
              aria-label={base.labels?.ariaLabel ?? "Line chart"}
              style={{ display: "block" }}
            >
              <CartesianAxes theme={theme} layout={layout} categories={categories} formatValue={formatValue} showGrid={showGrid} />
              {series.map((s, si) => {
                const color = seriesColor(theme, s, si);
                const pts: XY[] = categories.map((_, i) => ({
                  x: layout.categoryCenter(i),
                  y: layout.yScale(s.data[i] ?? 0),
                }));
                const dimmed = hover != null && hover !== s.name;
                return (
                  <g key={s.name} opacity={dimmed ? 0.25 : 1}>
                    {area && (
                      <path
                        d={areaPath(pts, baselineY, smooth)}
                        fill={color}
                        fillOpacity={0.15}
                        stroke="none"
                      />
                    )}
                    <path
                      d={smooth ? smoothPath(pts) : linePath(pts)}
                      fill="none"
                      stroke={color}
                      strokeWidth={strokeWidth}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {points &&
                      pts.map((p, i) => (
                        <circle
                          key={i}
                          cx={p.x}
                          cy={p.y}
                          r={3.5}
                          fill={theme.colors.background}
                          stroke={color}
                          strokeWidth={2}
                          style={{ cursor: onPointClick ? "pointer" : "default" }}
                          onMouseEnter={(e) => {
                            setHover(s.name);
                            tooltip.show(
                              { series: s.name, category: categories[i] ?? "", value: s.data[i] ?? 0, color },
                              e,
                            );
                          }}
                          onMouseMove={(e) => tooltip.move(e)}
                          onMouseLeave={() => {
                            setHover(null);
                            tooltip.hide();
                          }}
                          onClick={() => onPointClick?.(s.name, i, s.data[i] ?? 0)}
                        >
                          <title>{`${s.name} · ${categories[i] ?? ""}: ${formatValue(s.data[i] ?? 0)}`}</title>
                        </circle>
                      ))}
                  </g>
                );
              })}
            </svg>
            <ChartTooltip theme={theme} tooltip={tooltip} formatValue={formatValue} renderTooltip={renderTooltip} />
          </>
        );
      }}
    </VisualizationContainer>
  );
}

function ChartTooltip(props: {
  theme: ZenithTheme;
  tooltip: ReturnType<typeof useTooltip<TooltipInfo>>;
  formatValue: (v: number) => string;
  renderTooltip?: (info: TooltipInfo) => ReactNode;
}) {
  const { theme, tooltip, formatValue, renderTooltip } = props;
  const data = tooltip.state.data;
  return (
    <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
      {data &&
        (renderTooltip?.(data) ?? (
          <span>
            <strong>{data.series}</strong>
            <br />
            {data.category}: {formatValue(data.value)}
          </span>
        ))}
    </Tooltip>
  );
}
