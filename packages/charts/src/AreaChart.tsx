import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
} from "@zenith-visuals/core";
import type { CartesianChartProps } from "./types";
import { computeCartesianLayout } from "./lib/cartesian";
import { defaultFormat } from "./lib/ticks";
import { linePath, smoothPath, type XY } from "./lib/paths";
import { seriesColor, seriesExtent, stackedExtent } from "./lib/series";
import { CartesianAxes } from "./components/CartesianAxes";
import { Legend } from "./components/Legend";

export interface AreaChartProps extends CartesianChartProps {
  /** Stack series on top of one another. Default true for multi-series. */
  stacked?: boolean;
  /** Render smooth (spline) curves. Default false. */
  smooth?: boolean;
  onPointClick?: (series: string, index: number, value: number) => void;
  renderTooltip?: (info: AreaTooltipInfo) => ReactNode;
}

interface AreaTooltipInfo {
  series: string;
  category: string;
  value: number;
  color: string;
}

/**
 * Area chart with optional stacking and smoothing. Ideal for showing volume
 * over time and part-to-whole trends. Responsive and SSR-safe.
 *
 * @example
 * <AreaChart
 *   categories={["Q1", "Q2", "Q3"]}
 *   series={[{ name: "A", data: [3, 5, 4] }, { name: "B", data: [2, 2, 6] }]}
 * />
 */
export function AreaChart(props: AreaChartProps) {
  const {
    categories,
    series,
    stacked,
    smooth = false,
    showLegend,
    showGrid = true,
    yTickCount = 5,
    formatValue = defaultFormat,
    onPointClick,
    renderTooltip,
    height = 320,
    ...base
  } = props;

  const tooltip = useTooltip<AreaTooltipInfo>();
  const [hover, setHover] = useState<string | null>(null);
  const isStacked = stacked ?? series.length > 1;
  const legend = showLegend ?? series.length > 1;

  return (
    <VisualizationContainer
      {...base}
      height={height}
      isEmpty={series.length === 0 || categories.length === 0}
      defaultHeight={height}
    >
      {({ theme, width, height: h }) => {
        const [min, max] = isStacked
          ? stackedExtent(series, categories.length)
          : seriesExtent(series, true);
        const layout = computeCartesianLayout({
          width,
          height: h,
          categories,
          valueMin: min,
          valueMax: max,
          yTickCount,
          includeZero: true,
        });
        const zeroY = layout.yScale(0);

        // Precompute stacked baselines per category.
        const cumulative = categories.map(() => 0);

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
              aria-label={base.labels?.ariaLabel ?? "Area chart"}
              style={{ display: "block" }}
            >
              <CartesianAxes theme={theme} layout={layout} categories={categories} formatValue={formatValue} showGrid={showGrid} />
              {series.map((s, si) => {
                const color = seriesColor(theme, s, si);
                const dimmed = hover != null && hover !== s.name;
                const tops: XY[] = [];
                const bottoms: XY[] = [];
                categories.forEach((_, i) => {
                  const x = layout.categoryCenter(i);
                  const v = s.data[i] ?? 0;
                  const base0 = isStacked ? cumulative[i] ?? 0 : 0;
                  const top = base0 + v;
                  tops.push({ x, y: layout.yScale(top) });
                  bottoms.push({ x, y: layout.yScale(base0) });
                  if (isStacked) cumulative[i] = top;
                });
                const topLine = smooth ? smoothPath(tops) : linePath(tops);
                const bottomReversed = [...bottoms].reverse();
                const bottomLine = bottomReversed
                  .map((p, i) => `${i === 0 ? "L" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
                  .join(" ");
                const fill = isStacked
                  ? `${topLine} ${bottomLine} Z`
                  : `${topLine} L${tops[tops.length - 1]?.x.toFixed(2)},${zeroY.toFixed(2)} L${tops[0]?.x.toFixed(2)},${zeroY.toFixed(2)} Z`;
                return (
                  <g key={s.name} opacity={dimmed ? 0.3 : 1}>
                    <path d={fill} fill={color} fillOpacity={isStacked ? 0.75 : 0.25} stroke="none" />
                    <path d={topLine} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
                    {tops.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={4}
                        fill="transparent"
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
