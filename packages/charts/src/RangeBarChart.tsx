import { useMemo, useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { bandScale, linearScale } from "@zenith-visuals/utils";
import { computeCartesianLayout } from "./lib/cartesian";
import { defaultFormat, niceTicks } from "./lib/ticks";
import { seriesColor } from "./lib/series";
import { CartesianAxes } from "./components/CartesianAxes";
import type { RangeDatum } from "./types";

export interface RangeBarChartProps extends BaseVisualizationProps {
  /** One floating bar per item, spanning `low`→`high`. */
  data: readonly RangeDatum[];
  /** Render horizontal bars (categories on the y-axis). Default false. */
  horizontal?: boolean;
  /** Corner radius for bars. Default 4. */
  radius?: number;
  showGrid?: boolean;
  yTickCount?: number;
  formatValue?: (value: number) => string;
  onBarClick?: (datum: RangeDatum, index: number) => void;
  renderTooltip?: (datum: RangeDatum, index: number) => ReactNode;
}

/**
 * RangeBarChart — floating bars that encode a `[low, high]` span per category
 * (temperature ranges, min/max, confidence bands, price ranges). Supports
 * vertical and horizontal orientations. Responsive, themed and SSR-safe.
 *
 * @example
 * <RangeBarChart data={[{ label: "Mon", low: 12, high: 21 }]} />
 */
export function RangeBarChart(props: RangeBarChartProps) {
  const {
    data,
    horizontal = false,
    radius = 4,
    showGrid = true,
    yTickCount = 5,
    formatValue = defaultFormat,
    onBarClick,
    renderTooltip,
    height = 320,
    ...base
  } = props;

  const tooltip = useTooltip<{ d: RangeDatum; i: number }>();
  const [hover, setHover] = useState<number | null>(null);
  const categories = useMemo(() => data.map((d) => d.label), [data]);
  const [vMin, vMax] = useMemo(() => {
    if (data.length === 0) return [0, 1] as [number, number];
    let lo = Infinity;
    let hi = -Infinity;
    for (const d of data) {
      lo = Math.min(lo, d.low, d.high);
      hi = Math.max(hi, d.low, d.high);
    }
    return [lo, hi] as [number, number];
  }, [data]);

  return (
    <VisualizationContainer {...base} height={height} isEmpty={data.length === 0} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const colorFor = (d: RangeDatum, i: number) => d.color ?? seriesColor(theme, {}, i);

        const tooltipNode = (
          <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
            {tooltip.state.data &&
              (renderTooltip?.(tooltip.state.data.d, tooltip.state.data.i) ?? (
                <span>
                  <strong>{tooltip.state.data.d.label}</strong>: {formatValue(tooltip.state.data.d.low)} – {formatValue(tooltip.state.data.d.high)}
                </span>
              ))}
          </Tooltip>
        );

        if (horizontal) {
          const padding = { top: 8, right: 16, bottom: 28, left: 72 };
          const plot = {
            x: padding.left,
            y: padding.top,
            w: Math.max(1, width - padding.left - padding.right),
            h: Math.max(1, h - padding.top - padding.bottom),
          };
          const { ticks, niceMin, niceMax } = niceTicks(vMin, vMax, yTickCount, false);
          const xScale = linearScale([niceMin, niceMax], [plot.x, plot.x + plot.w]);
          const yBand = bandScale<string>(categories, [plot.y, plot.y + plot.h], 0.3);
          return (
            <>
              <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
                aria-label={base.labels?.ariaLabel ?? "Range bar chart"} style={{ display: "block" }}>
                <g aria-hidden>
                  {ticks.map((t) => (
                    <g key={t}>
                      {showGrid && <line x1={xScale(t)} x2={xScale(t)} y1={plot.y} y2={plot.y + plot.h} stroke={theme.colors.border} opacity={0.6} />}
                      <text x={xScale(t)} y={plot.y + plot.h + 16} textAnchor="middle" fontSize={theme.typography.fontSizeSm}
                        fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>{formatValue(t)}</text>
                    </g>
                  ))}
                  {categories.map((cat) => (
                    <text key={cat} x={plot.x - 8} y={yBand(cat) + yBand.bandwidth / 2} textAnchor="end" dominantBaseline="central"
                      fontSize={theme.typography.fontSizeSm} fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>{cat}</text>
                  ))}
                </g>
                {data.map((d, i) => {
                  const x0 = xScale(Math.min(d.low, d.high));
                  const x1 = xScale(Math.max(d.low, d.high));
                  const dimmed = hover != null && hover !== i;
                  return (
                    <rect key={`${d.label}-${i}`} x={x0} y={yBand(d.label)} width={Math.max(1, x1 - x0)} height={yBand.bandwidth}
                      rx={radius} fill={colorFor(d, i)} opacity={dimmed ? 0.3 : 1} style={{ cursor: onBarClick ? "pointer" : "default" }}
                      onMouseEnter={(e) => { setHover(i); tooltip.show({ d, i }, e); }}
                      onMouseMove={(e) => tooltip.move(e)}
                      onMouseLeave={() => { setHover(null); tooltip.hide(); }}
                      onClick={() => onBarClick?.(d, i)}>
                      <title>{`${d.label}: ${formatValue(d.low)} – ${formatValue(d.high)}`}</title>
                    </rect>
                  );
                })}
              </svg>
              {tooltipNode}
            </>
          );
        }

        // Vertical
        const layout = computeCartesianLayout({
          width,
          height: h,
          categories,
          valueMin: vMin,
          valueMax: vMax,
          yTickCount,
          includeZero: false,
        });
        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Range bar chart"} style={{ display: "block" }}>
              <CartesianAxes theme={theme} layout={layout} categories={categories} formatValue={formatValue} showGrid={showGrid} />
              {data.map((d, i) => {
                const y0 = layout.yScale(Math.max(d.low, d.high));
                const y1 = layout.yScale(Math.min(d.low, d.high));
                const dimmed = hover != null && hover !== i;
                return (
                  <rect key={`${d.label}-${i}`} x={layout.xBand(d.label) + layout.xBand.bandwidth * 0.1} y={y0}
                    width={layout.xBand.bandwidth * 0.8} height={Math.max(1, y1 - y0)} rx={radius} fill={colorFor(d, i)}
                    opacity={dimmed ? 0.3 : 1} style={{ cursor: onBarClick ? "pointer" : "default" }}
                    onMouseEnter={(e) => { setHover(i); tooltip.show({ d, i }, e); }}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => { setHover(null); tooltip.hide(); }}
                    onClick={() => onBarClick?.(d, i)}>
                    <title>{`${d.label}: ${formatValue(d.low)} – ${formatValue(d.high)}`}</title>
                  </rect>
                );
              })}
            </svg>
            {tooltipNode}
          </>
        );
      }}
    </VisualizationContainer>
  );
}
