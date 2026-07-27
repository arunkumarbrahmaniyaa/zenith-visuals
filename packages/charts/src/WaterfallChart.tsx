import { useMemo, useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { computeCartesianLayout } from "./lib/cartesian";
import { defaultFormat } from "./lib/ticks";
import { computeWaterfall, type WaterfallBar, type WaterfallDatum } from "./lib/transforms";
import { CartesianAxes } from "./components/CartesianAxes";

export interface WaterfallChartProps extends BaseVisualizationProps {
  /** Ordered steps; mark cumulative bars with `isTotal: true`. */
  data: readonly WaterfallDatum[];
  /** Corner radius for bars. Default 4. */
  radius?: number;
  /** Draw connector lines between consecutive bars. Default true. */
  connectors?: boolean;
  /** Color for increases. Defaults to theme success. */
  upColor?: string;
  /** Color for decreases. Defaults to theme danger. */
  downColor?: string;
  /** Color for total/subtotal bars. Defaults to theme primary. */
  totalColor?: string;
  showGrid?: boolean;
  yTickCount?: number;
  formatValue?: (value: number) => string;
  onBarClick?: (bar: WaterfallBar, index: number) => void;
  renderTooltip?: (bar: WaterfallBar, index: number) => ReactNode;
}

/**
 * WaterfallChart — visualizes how sequential positive and negative
 * contributions build to a running total, with optional subtotal/total bars
 * and connector lines. Responsive, themed and SSR-safe.
 *
 * @example
 * <WaterfallChart data={[
 *   { label: "Start", value: 100 },
 *   { label: "Sales", value: 40 },
 *   { label: "Refunds", value: -15 },
 *   { label: "End", value: 0, isTotal: true },
 * ]} />
 */
export function WaterfallChart(props: WaterfallChartProps) {
  const {
    data,
    radius = 4,
    connectors = true,
    upColor,
    downColor,
    totalColor,
    showGrid = true,
    yTickCount = 5,
    formatValue = defaultFormat,
    onBarClick,
    renderTooltip,
    height = 320,
    ...base
  } = props;

  const tooltip = useTooltip<{ bar: WaterfallBar; i: number }>();
  const [hover, setHover] = useState<number | null>(null);
  const { bars, min, max } = useMemo(() => computeWaterfall(data), [data]);
  const categories = useMemo(() => bars.map((b) => b.label), [bars]);

  return (
    <VisualizationContainer {...base} height={height} isEmpty={data.length === 0} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const layout = computeCartesianLayout({
          width,
          height: h,
          categories,
          valueMin: min,
          valueMax: max,
          yTickCount,
          includeZero: true,
        });
        const up = upColor ?? theme.colors.success;
        const down = downColor ?? theme.colors.danger;
        const total = totalColor ?? theme.colors.primary;
        const colorFor = (b: WaterfallBar) =>
          b.direction === "total" ? total : b.direction === "up" ? up : down;

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Waterfall chart"} style={{ display: "block" }}>
              <CartesianAxes theme={theme} layout={layout} categories={categories}
                formatValue={formatValue} showGrid={showGrid} />

              {connectors &&
                bars.slice(0, -1).map((b, i) => {
                  const next = bars[i + 1]!;
                  const x1 = layout.xBand(b.label) + layout.xBand.bandwidth;
                  const x2 = layout.xBand(next.label);
                  const y = layout.yScale(b.end);
                  return (
                    <line key={`c-${i}`} x1={x1} x2={x2} y1={y} y2={y}
                      stroke={theme.colors.textMuted} strokeWidth={1} strokeDasharray="3 3" opacity={0.7} />
                  );
                })}

              {bars.map((b, i) => {
                const y0 = layout.yScale(b.start);
                const y1 = layout.yScale(b.end);
                const color = colorFor(b);
                const dimmed = hover != null && hover !== i;
                return (
                  <rect
                    key={`${b.label}-${i}`}
                    x={layout.xBand(b.label)}
                    y={Math.min(y0, y1)}
                    width={layout.xBand.bandwidth}
                    height={Math.max(1, Math.abs(y1 - y0))}
                    rx={radius}
                    fill={color}
                    opacity={dimmed ? 0.3 : 1}
                    style={{ cursor: onBarClick ? "pointer" : "default" }}
                    onMouseEnter={(e) => {
                      setHover(i);
                      tooltip.show({ bar: b, i }, e);
                    }}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => {
                      setHover(null);
                      tooltip.hide();
                    }}
                    onClick={() => onBarClick?.(b, i)}
                  >
                    <title>{`${b.label}: ${formatValue(b.isTotal ? b.end : b.value)}`}</title>
                  </rect>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data.bar, tooltip.state.data.i) ?? (
                  <span>
                    <strong>{tooltip.state.data.bar.label}</strong>:{" "}
                    {formatValue(tooltip.state.data.bar.isTotal ? tooltip.state.data.bar.end : tooltip.state.data.bar.value)}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
