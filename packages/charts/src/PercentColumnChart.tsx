import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
} from "@zenith-visuals/core";
import type { CartesianChartProps } from "./types";
import { computeCartesianLayout } from "./lib/cartesian";
import { seriesColor } from "./lib/series";
import { CartesianAxes } from "./components/CartesianAxes";
import { Legend } from "./components/Legend";

export interface PercentColumnChartProps extends CartesianChartProps {
  /** Corner radius for bars in px. Default 3. */
  radius?: number;
  onBarClick?: (series: string, index: number, value: number) => void;
  renderTooltip?: (info: { series: string; category: string; value: number; percent: number }) => ReactNode;
}

const percentAxis = (v: number) => `${Math.round(v * 100)}%`;

/**
 * 100% stacked column chart — every category is normalized to a full height so
 * bars encode each series' *share* of the total. Responsive and SSR-safe.
 *
 * @example
 * <PercentColumnChart
 *   categories={["Q1", "Q2"]}
 *   series={[{ name: "A", data: [3, 5] }, { name: "B", data: [7, 5] }]}
 * />
 */
export function PercentColumnChart(props: PercentColumnChartProps) {
  const {
    categories,
    series,
    radius = 3,
    showLegend,
    showGrid = true,
    yTickCount = 5,
    formatValue,
    onBarClick,
    renderTooltip,
    height = 320,
    ...base
  } = props;

  const tooltip = useTooltip<{ series: string; category: string; value: number; percent: number }>();
  const [hover, setHover] = useState<string | null>(null);
  const legend = showLegend ?? series.length > 1;
  const fmt = formatValue ?? ((v: number) => `${v}`);

  return (
    <VisualizationContainer
      {...base}
      height={height}
      isEmpty={series.length === 0 || categories.length === 0}
      defaultHeight={height}
    >
      {({ theme, width, height: h }) => {
        const totals = categories.map((_, ci) =>
          series.reduce((acc, s) => acc + Math.max(0, s.data[ci] ?? 0), 0),
        );
        const layout = computeCartesianLayout({
          width,
          height: h,
          categories,
          valueMin: 0,
          valueMax: 1,
          yTickCount,
          includeZero: true,
        });

        return (
          <>
            {legend && (
              <Legend theme={theme} items={series.map((s, i) => ({ label: s.name, color: seriesColor(theme, s, i) }))} />
            )}
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "100% stacked column chart"} style={{ display: "block" }}>
              <CartesianAxes theme={theme} layout={layout} categories={categories} formatValue={percentAxis} showGrid={showGrid} />
              {categories.map((cat, ci) => {
                const total = totals[ci] ?? 0;
                let posAcc = 0;
                return series.map((s, si) => {
                  const color = seriesColor(theme, s, si);
                  const v = Math.max(0, s.data[ci] ?? 0);
                  const frac = total > 0 ? v / total : 0;
                  const y0 = layout.yScale(posAcc);
                  const y1 = layout.yScale(posAcc + frac);
                  posAcc += frac;
                  const dimmed = hover != null && hover !== s.name;
                  return (
                    <rect key={`${cat}-${s.name}`} x={layout.xBand(cat)} y={Math.min(y0, y1)} width={layout.xBand.bandwidth}
                      height={Math.abs(y1 - y0)} rx={radius} fill={color} opacity={dimmed ? 0.3 : 1}
                      style={{ cursor: onBarClick ? "pointer" : "default" }}
                      onMouseEnter={(e) => {
                        setHover(s.name);
                        tooltip.show({ series: s.name, category: cat, value: s.data[ci] ?? 0, percent: frac }, e);
                      }}
                      onMouseMove={(e) => tooltip.move(e)}
                      onMouseLeave={() => {
                        setHover(null);
                        tooltip.hide();
                      }}
                      onClick={() => onBarClick?.(s.name, ci, s.data[ci] ?? 0)}>
                      <title>{`${s.name} · ${cat}: ${(frac * 100).toFixed(1)}%`}</title>
                    </rect>
                  );
                });
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data) ?? (
                  <span>
                    <strong>{tooltip.state.data.series}</strong>
                    <br />
                    {tooltip.state.data.category}: {fmt(tooltip.state.data.value)} ({(tooltip.state.data.percent * 100).toFixed(1)}%)
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
