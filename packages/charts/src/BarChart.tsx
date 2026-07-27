import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
} from "@zenith-visuals/core";
import { bandScale, linearScale } from "@zenith-visuals/utils";
import type { CartesianChartProps } from "./types";
import { computeCartesianLayout } from "./lib/cartesian";
import { defaultFormat, niceTicks } from "./lib/ticks";
import { seriesColor, seriesExtent, stackedExtent } from "./lib/series";
import { CartesianAxes } from "./components/CartesianAxes";
import { Legend } from "./components/Legend";

export interface BarChartProps extends CartesianChartProps {
  /** Stack series into a single bar per category. Default false. */
  stacked?: boolean;
  /** Render horizontal bars (categories on the y-axis). Default false. */
  horizontal?: boolean;
  /** Corner radius for bars in px. Default 4. */
  radius?: number;
  onBarClick?: (series: string, index: number, value: number) => void;
  renderTooltip?: (info: BarTooltipInfo) => ReactNode;
}

interface BarTooltipInfo {
  series: string;
  category: string;
  value: number;
  color: string;
}

/**
 * Bar / column chart supporting grouped and stacked layouts in both vertical
 * (column) and horizontal (bar) orientations. Responsive and SSR-safe.
 *
 * @example
 * <BarChart
 *   categories={["A", "B", "C"]}
 *   series={[{ name: "2023", data: [4, 8, 6] }, { name: "2024", data: [6, 5, 9] }]}
 * />
 */
export function BarChart(props: BarChartProps) {
  const {
    categories,
    series,
    stacked = false,
    horizontal = false,
    radius = 4,
    showLegend,
    showGrid = true,
    yTickCount = 5,
    formatValue = defaultFormat,
    onBarClick,
    renderTooltip,
    height = 320,
    ...base
  } = props;

  const tooltip = useTooltip<BarTooltipInfo>();
  const [hover, setHover] = useState<string | null>(null);
  const legend = showLegend ?? series.length > 1;

  return (
    <VisualizationContainer
      {...base}
      height={height}
      isEmpty={series.length === 0 || categories.length === 0}
      defaultHeight={height}
    >
      {({ theme, width, height: h }) => {
        const [min, max] = stacked ? stackedExtent(series, categories.length) : seriesExtent(series, true);

        const legendNode = legend ? (
          <Legend
            theme={theme}
            items={series.map((s, i) => ({ label: s.name, color: seriesColor(theme, s, i) }))}
          />
        ) : null;

        const handlers = (s: { name: string }, i: number, v: number, color: string) => ({
          style: { cursor: onBarClick ? "pointer" : "default" },
          onMouseEnter: (e: { clientX: number; clientY: number }) => {
            setHover(s.name);
            tooltip.show({ series: s.name, category: categories[i] ?? "", value: v, color }, e);
          },
          onMouseMove: (e: { clientX: number; clientY: number }) => tooltip.move(e),
          onMouseLeave: () => {
            setHover(null);
            tooltip.hide();
          },
          onClick: () => onBarClick?.(s.name, i, v),
        });

        const tooltipNode = (
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
        );

        if (horizontal) {
          const padding = { top: 8, right: 16, bottom: 24, left: 72 };
          const plot = {
            x: padding.left,
            y: padding.top,
            w: Math.max(1, width - padding.left - padding.right),
            h: Math.max(1, h - padding.top - padding.bottom),
          };
          const { ticks, niceMin, niceMax } = niceTicks(min, max, yTickCount, true);
          const xScale = linearScale([niceMin, niceMax], [plot.x, plot.x + plot.w]);
          const yBand = bandScale<string>(categories, [plot.y, plot.y + plot.h], 0.2);
          const zeroX = xScale(0);
          const groupCount = stacked ? 1 : series.length;
          const inner = yBand.bandwidth / groupCount;

          return (
            <>
              {legendNode}
              <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
                aria-label={base.labels?.ariaLabel ?? "Bar chart"} style={{ display: "block" }}>
                <g aria-hidden>
                  {ticks.map((t) => {
                    const x = xScale(t);
                    return (
                      <g key={t}>
                        {showGrid && <line x1={x} x2={x} y1={plot.y} y2={plot.y + plot.h} stroke={theme.colors.border} opacity={0.6} />}
                        <text x={x} y={plot.y + plot.h + 16} textAnchor="middle" fontSize={theme.typography.fontSizeSm}
                          fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>{formatValue(t)}</text>
                      </g>
                    );
                  })}
                  {categories.map((cat) => (
                    <text key={cat} x={plot.x - 8} y={yBand(cat) + yBand.bandwidth / 2} textAnchor="end" dominantBaseline="central"
                      fontSize={theme.typography.fontSizeSm} fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>{cat}</text>
                  ))}
                </g>
                {categories.map((cat, ci) => {
                  let posAcc = 0;
                  return series.map((s, si) => {
                    const color = seriesColor(theme, s, si);
                    const v = s.data[ci] ?? 0;
                    const dimmed = hover != null && hover !== s.name;
                    if (stacked) {
                      const x0 = xScale(posAcc);
                      const x1 = xScale(posAcc + v);
                      posAcc += v;
                      return (
                        <rect key={`${cat}-${s.name}`} x={Math.min(x0, x1)} y={yBand(cat)} width={Math.abs(x1 - x0)}
                          height={yBand.bandwidth} rx={radius} fill={color} opacity={dimmed ? 0.3 : 1} {...handlers(s, ci, v, color)}>
                          <title>{`${s.name} · ${cat}: ${formatValue(v)}`}</title>
                        </rect>
                      );
                    }
                    const x1 = xScale(v);
                    const y = yBand(cat) + si * inner;
                    return (
                      <rect key={`${cat}-${s.name}`} x={Math.min(zeroX, x1)} y={y + inner * 0.1} width={Math.abs(x1 - zeroX)}
                        height={inner * 0.8} rx={radius} fill={color} opacity={dimmed ? 0.3 : 1} {...handlers(s, ci, v, color)}>
                        <title>{`${s.name} · ${cat}: ${formatValue(v)}`}</title>
                      </rect>
                    );
                  });
                })}
              </svg>
              {tooltipNode}
            </>
          );
        }

        // Vertical columns
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
        const groupCount = stacked ? 1 : series.length;
        const inner = layout.xBand.bandwidth / groupCount;

        return (
          <>
            {legendNode}
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Column chart"} style={{ display: "block" }}>
              <CartesianAxes theme={theme} layout={layout} categories={categories} formatValue={formatValue} showGrid={showGrid} />
              {categories.map((cat, ci) => {
                let posAcc = 0;
                return series.map((s, si) => {
                  const color = seriesColor(theme, s, si);
                  const v = s.data[ci] ?? 0;
                  const dimmed = hover != null && hover !== s.name;
                  if (stacked) {
                    const y0 = layout.yScale(posAcc);
                    const y1 = layout.yScale(posAcc + v);
                    posAcc += v;
                    return (
                      <rect key={`${cat}-${s.name}`} x={layout.xBand(cat)} y={Math.min(y0, y1)} width={layout.xBand.bandwidth}
                        height={Math.abs(y1 - y0)} rx={radius} fill={color} opacity={dimmed ? 0.3 : 1} {...handlers(s, ci, v, color)}>
                        <title>{`${s.name} · ${cat}: ${formatValue(v)}`}</title>
                      </rect>
                    );
                  }
                  const y1 = layout.yScale(v);
                  const x = layout.xBand(cat) + si * inner;
                  return (
                    <rect key={`${cat}-${s.name}`} x={x + inner * 0.1} y={Math.min(zeroY, y1)} width={inner * 0.8}
                      height={Math.abs(y1 - zeroY)} rx={radius} fill={color} opacity={dimmed ? 0.3 : 1} {...handlers(s, ci, v, color)}>
                      <title>{`${s.name} · ${cat}: ${formatValue(v)}`}</title>
                    </rect>
                  );
                });
              })}
            </svg>
            {tooltipNode}
          </>
        );
      }}
    </VisualizationContainer>
  );
}
