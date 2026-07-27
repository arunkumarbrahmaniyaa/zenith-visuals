import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
} from "@zenith-visuals/core";
import type { CartesianChartProps } from "./types";
import { computeCartesianLayout } from "./lib/cartesian";
import { defaultFormat } from "./lib/ticks";
import { stepPath, type StepMode, type XY } from "./lib/paths";
import { seriesColor, seriesExtent } from "./lib/series";
import { CartesianAxes } from "./components/CartesianAxes";
import { Legend } from "./components/Legend";

export interface StepLineChartProps extends CartesianChartProps {
  /** Riser placement: `after` (default), `before`, or `center`. */
  mode?: StepMode;
  /** Draw a marker dot at each data point. Default true for small datasets. */
  showPoints?: boolean;
  /** Line stroke width in px. Default 2. */
  strokeWidth?: number;
  onPointClick?: (series: string, index: number, value: number) => void;
  renderTooltip?: (info: { series: string; category: string; value: number }) => ReactNode;
}

/**
 * Step (staircase) line chart — values hold constant between categories, ideal
 * for discrete state changes, rates and inventory levels. Responsive, themeable
 * and SSR-safe.
 *
 * @example
 * <StepLineChart categories={["Q1", "Q2", "Q3"]} series={[{ name: "Rate", data: [2, 2.5, 2.5] }]} />
 */
export function StepLineChart(props: StepLineChartProps) {
  const {
    categories,
    series,
    mode = "after",
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

  const tooltip = useTooltip<{ series: string; category: string; value: number }>();
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
        const [min, max] = seriesExtent(series, false);
        const layout = computeCartesianLayout({
          width,
          height: h,
          categories,
          valueMin: min,
          valueMax: max,
          yTickCount,
        });

        return (
          <>
            {legend && (
              <Legend theme={theme} items={series.map((s, i) => ({ label: s.name, color: seriesColor(theme, s, i) }))} />
            )}
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Step line chart"} style={{ display: "block" }}>
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
                    <path d={stepPath(pts, mode)} fill="none" stroke={color} strokeWidth={strokeWidth}
                      strokeLinejoin="round" strokeLinecap="round" />
                    {points &&
                      pts.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={theme.colors.background} stroke={color} strokeWidth={2}
                          style={{ cursor: onPointClick ? "pointer" : "default" }}
                          onMouseEnter={(e) => {
                            setHover(s.name);
                            tooltip.show({ series: s.name, category: categories[i] ?? "", value: s.data[i] ?? 0 }, e);
                          }}
                          onMouseMove={(e) => tooltip.move(e)}
                          onMouseLeave={() => {
                            setHover(null);
                            tooltip.hide();
                          }}
                          onClick={() => onPointClick?.(s.name, i, s.data[i] ?? 0)}>
                          <title>{`${s.name} · ${categories[i] ?? ""}: ${formatValue(s.data[i] ?? 0)}`}</title>
                        </circle>
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
