import { useMemo, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
} from "@zenith-visuals/core";
import { linearScale } from "@zenith-visuals/utils";
import { defaultFormat, niceTicks } from "@zenith-visuals/charts";
import type { FinanceChartProps } from "./types";
import { computeKagi, type KagiVertex } from "./lib/finance";

export interface KagiChartProps extends FinanceChartProps {
  /**
   * Reversal amount. If ≤ 1 it is treated as a fraction of the mean price
   * (e.g. 0.04 = 4%); if > 1 it is an absolute price amount. Default 0.04.
   */
  reversal?: number;
  /** Show y gridlines. Default true. */
  showGrid?: boolean;
  renderTooltip?: (vertex: KagiVertex) => ReactNode;
}

/**
 * Kagi chart — a price line whose direction changes only after a reversal
 * threshold, thickening (yang) above prior shoulders and thinning (yin) below
 * prior waists. Time is ignored; each reversal is a column. Responsive & SSR-safe.
 *
 * @example
 * <KagiChart data={ohlc} reversal={0.03} />
 */
export function KagiChart(props: KagiChartProps) {
  const {
    data,
    reversal = 0.04,
    formatValue = defaultFormat,
    upColor,
    downColor,
    showGrid = true,
    renderTooltip,
    height = 320,
    ...base
  } = props;

  const tooltip = useTooltip<KagiVertex>();
  const closes = useMemo(() => data.map((d) => d.close), [data]);
  const verts = useMemo(() => {
    if (closes.length === 0) return [];
    const meanPrice = closes.reduce((a, b) => a + b, 0) / closes.length;
    const amount = reversal <= 1 ? meanPrice * reversal : reversal;
    return computeKagi(closes, amount);
  }, [closes, reversal]);

  return (
    <VisualizationContainer {...base} height={height} isEmpty={verts.length < 2} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const pad = { top: 12, right: 16, bottom: 20, left: 44 };
        const plot = {
          x: pad.left,
          y: pad.top,
          w: Math.max(1, width - pad.left - pad.right),
          h: Math.max(1, height - pad.top - pad.bottom),
        };
        const prices = verts.map((v) => v.y);
        const { ticks, niceMin, niceMax } = niceTicks(Math.min(...prices), Math.max(...prices), 5, false);
        const yScale = linearScale([niceMin, niceMax], [plot.y + plot.h, plot.y]);
        const maxCol = Math.max(1, verts[verts.length - 1]!.x);
        const colX = (c: number) => plot.x + (c / maxCol) * plot.w;
        const up = upColor ?? theme.colors.success;
        const down = downColor ?? theme.colors.danger;

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Kagi chart"} style={{ display: "block" }}>
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
              {verts.map((v, i) => {
                if (i === 0) return null;
                const prev = verts[i - 1]!;
                const px = colX(prev.x);
                const cxp = colX(v.x);
                const py = yScale(prev.y);
                const cy = yScale(v.y);
                const color = v.thick ? up : down;
                const sw = v.thick ? 3 : 1.25;
                return (
                  <g key={i}
                    onMouseEnter={(e) => tooltip.show(v, e)}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => tooltip.hide()}>
                    <path d={`M${px},${py} L${cxp},${py} L${cxp},${cy}`} fill="none"
                      stroke={color} strokeWidth={sw} strokeLinejoin="round" />
                  </g>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data) ?? (
                  <span>
                    {tooltip.state.data.thick ? "Yang" : "Yin"}: {formatValue(tooltip.state.data.y)}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
