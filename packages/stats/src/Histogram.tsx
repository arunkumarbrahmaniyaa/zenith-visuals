import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { linearScale } from "@zenith-visuals/utils";
import { defaultFormat, niceTicks, seriesColor } from "@zenith-visuals/charts";
import { histogramBins, type HistogramBin } from "./lib/stats";

export interface HistogramProps extends BaseVisualizationProps {
  /** Raw sample values to bin. */
  values: readonly number[];
  /** Number of equal-width bins. Default 12. */
  bins?: number;
  /** Bar color. Defaults to the theme's first palette color. */
  color?: string;
  showGrid?: boolean;
  yTickCount?: number;
  formatX?: (value: number) => string;
  formatCount?: (value: number) => string;
  onBinClick?: (bin: HistogramBin) => void;
  renderTooltip?: (bin: HistogramBin) => ReactNode;
}

/**
 * Histogram of a numeric distribution using equal-width binning. Responsive,
 * themeable, accessible and SSR-safe.
 *
 * @example
 * <Histogram values={[1, 2, 2, 3, 3, 3, 4, 4, 5]} bins={5} />
 */
export function Histogram(props: HistogramProps) {
  const {
    values,
    bins = 12,
    color,
    showGrid = true,
    yTickCount = 5,
    formatX = defaultFormat,
    formatCount = (v) => `${v}`,
    onBinClick,
    renderTooltip,
    height = 320,
    ...base
  } = props;

  const tooltip = useTooltip<HistogramBin>();
  const [hover, setHover] = useState<number | null>(null);

  return (
    <VisualizationContainer {...base} height={height} isEmpty={values.length === 0} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const data = histogramBins(values, bins);
        const barColor = color ?? seriesColor(theme, {}, 0);
        const maxCount = Math.max(1, ...data.map((b) => b.count));
        const padding = { top: 12, right: 16, bottom: 30, left: 44 };
        const plot = {
          x: padding.left,
          y: padding.top,
          w: Math.max(1, width - padding.left - padding.right),
          h: Math.max(1, h - padding.top - padding.bottom),
        };
        const x0 = data[0]?.x0 ?? 0;
        const x1 = data[data.length - 1]?.x1 ?? 1;
        const xScale = linearScale([x0, x1], [plot.x, plot.x + plot.w]);
        const yNice = niceTicks(0, maxCount, yTickCount, true);
        const yScale = linearScale([0, yNice.niceMax], [plot.y + plot.h, plot.y]);

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Histogram"} style={{ display: "block" }}>
              <g aria-hidden>
                {yNice.ticks.map((t) => {
                  const y = yScale(t);
                  return (
                    <g key={t}>
                      {showGrid && <line x1={plot.x} x2={plot.x + plot.w} y1={y} y2={y} stroke={theme.colors.border} opacity={0.6} />}
                      <text x={plot.x - 8} y={y} textAnchor="end" dominantBaseline="central" fontSize={theme.typography.fontSizeSm}
                        fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>{formatCount(t)}</text>
                    </g>
                  );
                })}
                <line x1={plot.x} x2={plot.x + plot.w} y1={plot.y + plot.h} y2={plot.y + plot.h} stroke={theme.colors.border} />
                {data.map((b, i) => {
                  if (i % Math.ceil(data.length / 8) !== 0) return null;
                  return (
                    <text key={i} x={xScale(b.x0)} y={plot.y + plot.h + 16} textAnchor="middle" fontSize={theme.typography.fontSizeSm}
                      fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>{formatX(b.x0)}</text>
                  );
                })}
              </g>
              {data.map((b, i) => {
                const bx = xScale(b.x0);
                const bw = Math.max(1, xScale(b.x1) - bx - 1);
                const by = yScale(b.count);
                const active = hover === i;
                return (
                  <rect key={i} x={bx + 0.5} y={by} width={bw} height={plot.y + plot.h - by} rx={2}
                    fill={barColor} opacity={active ? 1 : 0.85}
                    style={{ cursor: onBinClick ? "pointer" : "default" }}
                    onMouseEnter={(e) => {
                      setHover(i);
                      tooltip.show(b, e);
                    }}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => {
                      setHover(null);
                      tooltip.hide();
                    }}
                    onClick={() => onBinClick?.(b)}>
                    <title>{`${formatX(b.x0)}–${formatX(b.x1)}: ${b.count}`}</title>
                  </rect>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data) ?? (
                  <span>
                    <strong>{formatX(tooltip.state.data.x0)}–{formatX(tooltip.state.data.x1)}</strong>
                    <br />
                    count: {formatCount(tooltip.state.data.count)}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
