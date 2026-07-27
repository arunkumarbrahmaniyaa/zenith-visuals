import { useMemo, useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { linearScale } from "@zenith-visuals/utils";
import { computeCartesianLayout } from "./lib/cartesian";
import { defaultFormat } from "./lib/ticks";
import { linePath, type XY } from "./lib/paths";
import { computePareto, type ParetoBar } from "./lib/transforms";
import { CartesianAxes } from "./components/CartesianAxes";
import type { CategoryDatum } from "./types";

export interface ParetoChartProps extends BaseVisualizationProps {
  /** Items to rank; sorted by value descending automatically. */
  data: readonly CategoryDatum[];
  /** Corner radius for bars. Default 4. */
  radius?: number;
  /** Color of the cumulative line. Defaults to theme secondary. */
  lineColor?: string;
  /** Draw the 80% reference line. Default true. */
  showReference?: boolean;
  showGrid?: boolean;
  yTickCount?: number;
  formatValue?: (value: number) => string;
  onBarClick?: (bar: ParetoBar, index: number) => void;
  renderTooltip?: (bar: ParetoBar, index: number) => ReactNode;
}

const PAD_RIGHT = 44;

/**
 * ParetoChart — descending bars paired with a cumulative-percentage line on a
 * secondary axis, highlighting the "vital few" (the 80/20 rule). Responsive,
 * themed and SSR-safe.
 *
 * @example
 * <ParetoChart data={[{ label: "A", value: 50 }, { label: "B", value: 30 }]} />
 */
export function ParetoChart(props: ParetoChartProps) {
  const {
    data,
    radius = 4,
    lineColor,
    showReference = true,
    showGrid = true,
    yTickCount = 5,
    formatValue = defaultFormat,
    onBarClick,
    renderTooltip,
    height = 320,
    ...base
  } = props;

  const tooltip = useTooltip<{ bar: ParetoBar; i: number }>();
  const [hover, setHover] = useState<number | null>(null);
  const { bars } = useMemo(() => computePareto(data), [data]);
  const categories = useMemo(() => bars.map((b) => b.label), [bars]);
  const maxValue = useMemo(() => bars.reduce((m, b) => Math.max(m, b.value), 0), [bars]);

  return (
    <VisualizationContainer {...base} height={height} isEmpty={data.length === 0} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const layout = computeCartesianLayout({
          width,
          height: h,
          categories,
          valueMin: 0,
          valueMax: maxValue,
          yTickCount,
          includeZero: true,
          padding: { top: 12, right: 16 + PAD_RIGHT, bottom: 28, left: 44 },
        });
        const { plot } = layout;
        const line = lineColor ?? theme.colors.secondary;
        const pctScale = linearScale([0, 1], [plot.y + plot.h, plot.y]);

        const points: XY[] = bars.map((b, i) => ({
          x: layout.categoryCenter(i),
          y: pctScale(b.cumulativePct),
        }));

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Pareto chart"} style={{ display: "block" }}>
              <CartesianAxes theme={theme} layout={layout} categories={categories}
                formatValue={formatValue} showGrid={showGrid} />

              {/* Secondary (percentage) axis on the right */}
              {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                <text key={p} x={plot.x + plot.w + 8} y={pctScale(p)} textAnchor="start" dominantBaseline="central"
                  fontSize={theme.typography.fontSizeSm} fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>
                  {Math.round(p * 100)}%
                </text>
              ))}

              {showReference && (
                <line x1={plot.x} x2={plot.x + plot.w} y1={pctScale(0.8)} y2={pctScale(0.8)}
                  stroke={theme.colors.textMuted} strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />
              )}

              {bars.map((b, i) => {
                const y1 = layout.yScale(b.value);
                const zeroY = layout.yScale(0);
                const dimmed = hover != null && hover !== i;
                return (
                  <rect
                    key={`${b.label}-${i}`}
                    x={layout.xBand(b.label) + layout.xBand.bandwidth * 0.1}
                    y={Math.min(zeroY, y1)}
                    width={layout.xBand.bandwidth * 0.8}
                    height={Math.max(1, Math.abs(zeroY - y1))}
                    rx={radius}
                    fill={b.color ?? theme.colors.primary}
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
                    <title>{`${b.label}: ${formatValue(b.value)} (${Math.round(b.cumulativePct * 100)}%)`}</title>
                  </rect>
                );
              })}

              <path d={linePath(points)} fill="none" stroke={line} strokeWidth={2} strokeLinejoin="round" />
              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={3} fill={line} />
              ))}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data.bar, tooltip.state.data.i) ?? (
                  <span>
                    <strong>{tooltip.state.data.bar.label}</strong>: {formatValue(tooltip.state.data.bar.value)}
                    <br />
                    Cumulative: {Math.round(tooltip.state.data.bar.cumulativePct * 100)}%
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
