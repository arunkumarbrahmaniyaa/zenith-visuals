import { useMemo, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
} from "@zenith-visuals/core";
import { linearScale } from "@zenith-visuals/utils";
import { defaultFormat, niceTicks } from "@zenith-visuals/charts";
import type { FinanceChartProps } from "./types";
import { computeRenko, type RenkoBrick } from "./lib/finance";

export interface RenkoChartProps extends FinanceChartProps {
  /**
   * Brick size. If ≤ 1 it is treated as a fraction of the mean price
   * (e.g. 0.02 = 2%); if > 1 it is an absolute price amount. Default 0.02.
   */
  boxSize?: number;
  /** Show y gridlines. Default true. */
  showGrid?: boolean;
  renderTooltip?: (brick: RenkoBrick) => ReactNode;
}

/**
 * Renko chart — fixed-size price "bricks" that ignore time and only advance
 * when price moves a full box. Filters noise to reveal trend. Responsive & SSR-safe.
 *
 * @example
 * <RenkoChart data={ohlc} boxSize={0.02} />
 */
export function RenkoChart(props: RenkoChartProps) {
  const {
    data,
    boxSize = 0.02,
    formatValue = defaultFormat,
    upColor,
    downColor,
    showGrid = true,
    renderTooltip,
    height = 320,
    ...base
  } = props;

  const tooltip = useTooltip<RenkoBrick>();
  const closes = useMemo(() => data.map((d) => d.close), [data]);
  const bricks = useMemo(() => {
    if (closes.length === 0) return [];
    const meanPrice = closes.reduce((a, b) => a + b, 0) / closes.length;
    const box = boxSize <= 1 ? meanPrice * boxSize : boxSize;
    return computeRenko(closes, box);
  }, [closes, boxSize]);

  return (
    <VisualizationContainer {...base} height={height} isEmpty={bricks.length === 0} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const pad = { top: 12, right: 16, bottom: 20, left: 44 };
        const plot = {
          x: pad.left,
          y: pad.top,
          w: Math.max(1, width - pad.left - pad.right),
          h: Math.max(1, height - pad.top - pad.bottom),
        };
        const lows = bricks.map((b) => b.low);
        const highs = bricks.map((b) => b.high);
        const { ticks, niceMin, niceMax } = niceTicks(Math.min(...lows), Math.max(...highs), 5, false);
        const yScale = linearScale([niceMin, niceMax], [plot.y + plot.h, plot.y]);
        const cols = Math.max(1, bricks[bricks.length - 1]!.x + 1);
        const brickW = plot.w / cols;
        const up = upColor ?? theme.colors.success;
        const down = downColor ?? theme.colors.danger;

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Renko chart"} style={{ display: "block" }}>
              <g aria-hidden>
                {ticks.map((t) => {
                  const y = yScale(t);
                  return (
                    <g key={t}>
                      {showGrid && <line x1={plot.x} x2={plot.x + plot.w} y1={y} y2={y}
                        stroke={theme.colors.border} strokeWidth={1} opacity={0.6} />}
                      <text x={plot.x - 8} y={y} textAnchor="end" dominantBaseline="central"
                        fontSize={theme.typography.fontSizeSm} fontFamily={theme.typography.fontFamily}
                        fill={theme.colors.textMuted}>{formatValue(t)}</text>
                    </g>
                  );
                })}
              </g>
              {bricks.map((b, i) => {
                const x = plot.x + b.x * brickW;
                const yTop = yScale(b.high);
                const yBot = yScale(b.low);
                const color = b.dir === 1 ? up : down;
                return (
                  <g key={i}
                    onMouseEnter={(e) => tooltip.show(b, e)}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => tooltip.hide()}>
                    <rect x={x + brickW * 0.08} y={yTop} width={brickW * 0.84}
                      height={Math.max(1, yBot - yTop)} rx={1} fill={color} fillOpacity={0.85}
                      stroke={color} strokeWidth={1} />
                    <title>{`${b.dir === 1 ? "▲" : "▼"} ${formatValue(b.low)} – ${formatValue(b.high)}`}</title>
                  </g>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data) ?? (
                  <span>
                    {tooltip.state.data.dir === 1 ? "Up" : "Down"} brick:{" "}
                    {formatValue(tooltip.state.data.low)} – {formatValue(tooltip.state.data.high)}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
