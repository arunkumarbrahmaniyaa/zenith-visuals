import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import {
  CartesianAxes,
  computeCartesianLayout,
  defaultFormat,
  seriesColor,
} from "@zenith-visuals/charts";
import type { ErrorDatum } from "./types";

export interface ErrorBarChartProps extends BaseVisualizationProps {
  data: readonly ErrorDatum[];
  /** Optionally connect the value markers with a line. Default false. */
  connect?: boolean;
  showGrid?: boolean;
  yTickCount?: number;
  formatValue?: (value: number) => string;
  onPointClick?: (datum: ErrorDatum, index: number) => void;
  renderTooltip?: (datum: ErrorDatum, low: number, high: number) => ReactNode;
}

function bounds(d: ErrorDatum): { low: number; high: number } {
  const err = d.error ?? 0;
  return { low: d.low ?? d.value - err, high: d.high ?? d.value + err };
}

/**
 * Error-bar chart plotting a value per category with symmetric or asymmetric
 * error ranges (confidence intervals, std-dev, min/max). Responsive and
 * SSR-safe.
 *
 * @example
 * <ErrorBarChart data={[{ label: "A", value: 10, error: 2 }]} />
 */
export function ErrorBarChart(props: ErrorBarChartProps) {
  const {
    data,
    connect = false,
    showGrid = true,
    yTickCount = 5,
    formatValue = defaultFormat,
    onPointClick,
    renderTooltip,
    height = 320,
    ...base
  } = props;

  const tooltip = useTooltip<{ datum: ErrorDatum; low: number; high: number }>();
  const [hover, setHover] = useState<number | null>(null);

  return (
    <VisualizationContainer {...base} height={height} isEmpty={data.length === 0} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        let min = Infinity;
        let max = -Infinity;
        for (const d of data) {
          const { low, high } = bounds(d);
          if (low < min) min = low;
          if (high > max) max = high;
        }
        if (!Number.isFinite(min)) {
          min = 0;
          max = 1;
        }
        const categories = data.map((d) => d.label);
        const layout = computeCartesianLayout({
          width,
          height: h,
          categories,
          valueMin: min,
          valueMax: max,
          yTickCount,
          includeZero: false,
        });
        const cap = Math.min(16, layout.xBand.bandwidth * 0.3);

        const linePts = data.map((d, i) => `${layout.categoryCenter(i).toFixed(2)},${layout.yScale(d.value).toFixed(2)}`);

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Error bar chart"} style={{ display: "block" }}>
              <CartesianAxes theme={theme} layout={layout} categories={categories} formatValue={formatValue} showGrid={showGrid} />
              {connect && data.length > 1 && (
                <polyline points={linePts.join(" ")} fill="none" stroke={theme.colors.textMuted} strokeWidth={1.5} strokeDasharray="4 4" opacity={0.7} />
              )}
              {data.map((d, i) => {
                const cx = layout.categoryCenter(i);
                const { low, high } = bounds(d);
                const color = d.color ?? seriesColor(theme, d, i);
                const active = hover === i;
                const yVal = layout.yScale(d.value);
                const yLow = layout.yScale(low);
                const yHigh = layout.yScale(high);
                return (
                  <g key={d.label} opacity={active || hover == null ? 1 : 0.4}
                    onMouseEnter={(e) => {
                      setHover(i);
                      tooltip.show({ datum: d, low, high }, e);
                    }}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => {
                      setHover(null);
                      tooltip.hide();
                    }}
                    onClick={() => onPointClick?.(d, i)}
                    style={{ cursor: onPointClick ? "pointer" : "default" }}>
                    <line x1={cx} x2={cx} y1={yHigh} y2={yLow} stroke={color} strokeWidth={2} />
                    <line x1={cx - cap / 2} x2={cx + cap / 2} y1={yHigh} y2={yHigh} stroke={color} strokeWidth={2} />
                    <line x1={cx - cap / 2} x2={cx + cap / 2} y1={yLow} y2={yLow} stroke={color} strokeWidth={2} />
                    <circle cx={cx} cy={yVal} r={4.5} fill={theme.colors.background} stroke={color} strokeWidth={2.5} />
                    <title>{`${d.label}: ${formatValue(d.value)} [${formatValue(low)}, ${formatValue(high)}]`}</title>
                  </g>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data.datum, tooltip.state.data.low, tooltip.state.data.high) ?? (
                  <span>
                    <strong>{tooltip.state.data.datum.label}</strong>
                    <br />
                    {formatValue(tooltip.state.data.datum.value)} [{formatValue(tooltip.state.data.low)},{" "}
                    {formatValue(tooltip.state.data.high)}]
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
