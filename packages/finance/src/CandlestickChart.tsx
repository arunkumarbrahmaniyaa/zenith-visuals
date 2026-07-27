import { useMemo, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
} from "@zenith-visuals/core";
import {
  CartesianAxes,
  computeCartesianLayout,
  defaultFormat,
} from "@zenith-visuals/charts";
import type { FinanceChartProps, OHLCDatum } from "./types";
import { priceExtent } from "./lib/finance";

export interface CandlestickChartProps extends FinanceChartProps {
  /** Show y gridlines. Default true. */
  showGrid?: boolean;
  onBarClick?: (datum: OHLCDatum, index: number) => void;
  renderTooltip?: (datum: OHLCDatum) => ReactNode;
}

/**
 * Candlestick chart — each bar shows open/high/low/close as a body plus wicks.
 * Rising bars use `upColor`, falling bars `downColor`. Responsive & SSR-safe.
 *
 * @example
 * <CandlestickChart data={[{ label: "Mon", open: 10, high: 14, low: 9, close: 13 }]} />
 */
export function CandlestickChart(props: CandlestickChartProps) {
  const {
    data,
    formatValue = defaultFormat,
    upColor,
    downColor,
    showGrid = true,
    onBarClick,
    renderTooltip,
    height = 320,
    ...base
  } = props;

  const tooltip = useTooltip<OHLCDatum>();
  const categories = useMemo(() => data.map((d) => d.label), [data]);
  const [lo, hi] = useMemo(() => priceExtent(data), [data]);

  return (
    <VisualizationContainer {...base} height={height} isEmpty={data.length === 0} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const layout = computeCartesianLayout({
          width,
          height: h,
          categories,
          valueMin: lo,
          valueMax: hi,
          includeZero: false,
        });
        const up = upColor ?? theme.colors.success;
        const down = downColor ?? theme.colors.danger;
        const bodyW = Math.max(2, layout.xBand.bandwidth * 0.7);

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Candlestick chart"} style={{ display: "block" }}>
              <CartesianAxes theme={theme} layout={layout} categories={categories}
                formatValue={formatValue} showGrid={showGrid} />
              {data.map((d, i) => {
                const cx = layout.categoryCenter(i);
                const rising = d.close >= d.open;
                const color = rising ? up : down;
                const yHigh = layout.yScale(d.high);
                const yLow = layout.yScale(d.low);
                const yOpen = layout.yScale(d.open);
                const yClose = layout.yScale(d.close);
                const top = Math.min(yOpen, yClose);
                const bodyH = Math.max(1, Math.abs(yClose - yOpen));
                return (
                  <g key={i}
                    onMouseEnter={(e) => tooltip.show(d, e)}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => tooltip.hide()}
                    onClick={() => onBarClick?.(d, i)}
                    style={{ cursor: onBarClick ? "pointer" : "default" }}>
                    <line x1={cx} x2={cx} y1={yHigh} y2={yLow} stroke={color} strokeWidth={1.5} />
                    <rect x={cx - bodyW / 2} y={top} width={bodyW} height={bodyH} rx={1}
                      fill={rising ? color : theme.colors.background} stroke={color} strokeWidth={1.5} />
                    <title>{`${d.label} · O ${formatValue(d.open)} H ${formatValue(d.high)} L ${formatValue(d.low)} C ${formatValue(d.close)}`}</title>
                  </g>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data) ?? (
                  <span>
                    <strong>{tooltip.state.data.label}</strong>
                    <br />O {formatValue(tooltip.state.data.open)} · H {formatValue(tooltip.state.data.high)}
                    <br />L {formatValue(tooltip.state.data.low)} · C {formatValue(tooltip.state.data.close)}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
