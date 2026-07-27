import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { linearScale } from "@zenith-visuals/utils";
import { defaultFormat, niceTicks, seriesColor } from "@zenith-visuals/charts";
import { linearRegression, qqPoints } from "./lib/stats";

export interface QQPlotProps extends BaseVisualizationProps {
  /** Raw sample values, compared against a standard normal distribution. */
  values: readonly number[];
  /** Point radius in px. Default 3.5. */
  pointRadius?: number;
  /** Reference-line color. Defaults to the theme primary. */
  lineColor?: string;
  showGrid?: boolean;
  formatValue?: (value: number) => string;
  renderTooltip?: (point: { theoretical: number; sample: number }) => ReactNode;
}

/**
 * Quantile-quantile plot comparing a sample against a normal distribution. A
 * fitted reference line makes departures from normality (skew, tails) easy to
 * read. Responsive, themeable and SSR-safe.
 *
 * @example
 * <QQPlot values={[2.1, 3.4, 1.9, 4.2, 2.8, 3.1]} />
 */
export function QQPlot(props: QQPlotProps) {
  const {
    values,
    pointRadius = 3.5,
    lineColor,
    showGrid = true,
    formatValue = defaultFormat,
    renderTooltip,
    height = 340,
    ...base
  } = props;

  const tooltip = useTooltip<{ theoretical: number; sample: number }>();
  const [hover, setHover] = useState<number | null>(null);

  return (
    <VisualizationContainer {...base} height={height} isEmpty={values.length === 0} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const pts = qqPoints(values).filter((p) => Number.isFinite(p.theoretical));
        let xMin = Infinity;
        let xMax = -Infinity;
        let yMin = Infinity;
        let yMax = -Infinity;
        for (const p of pts) {
          if (p.theoretical < xMin) xMin = p.theoretical;
          if (p.theoretical > xMax) xMax = p.theoretical;
          if (p.sample < yMin) yMin = p.sample;
          if (p.sample > yMax) yMax = p.sample;
        }
        if (!Number.isFinite(xMin)) { xMin = -1; xMax = 1; yMin = 0; yMax = 1; }
        const padding = { top: 12, right: 16, bottom: 34, left: 48 };
        const plot = {
          x: padding.left,
          y: padding.top,
          w: Math.max(1, width - padding.left - padding.right),
          h: Math.max(1, h - padding.top - padding.bottom),
        };
        const xNice = niceTicks(xMin, xMax, 5, false);
        const yNice = niceTicks(yMin, yMax, 5, false);
        const xScale = linearScale([xNice.niceMin, xNice.niceMax], [plot.x, plot.x + plot.w]);
        const yScale = linearScale([yNice.niceMin, yNice.niceMax], [plot.y + plot.h, plot.y]);
        const fit = linearRegression(pts.map((p) => ({ x: p.theoretical, y: p.sample })));
        const color = seriesColor(theme, {}, 0);
        const line = lineColor ?? theme.colors.primary;

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Q-Q plot"} style={{ display: "block" }}>
              <g aria-hidden>
                {yNice.ticks.map((t) => {
                  const y = yScale(t);
                  return (
                    <g key={`y${t}`}>
                      {showGrid && <line x1={plot.x} x2={plot.x + plot.w} y1={y} y2={y} stroke={theme.colors.border} opacity={0.4} />}
                      <text x={plot.x - 8} y={y} textAnchor="end" dominantBaseline="central" fontSize={theme.typography.fontSizeSm}
                        fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>{formatValue(t)}</text>
                    </g>
                  );
                })}
                {xNice.ticks.map((t) => (
                  <text key={`x${t}`} x={xScale(t)} y={plot.y + plot.h + 16} textAnchor="middle" fontSize={theme.typography.fontSizeSm}
                    fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>{t.toFixed(1)}</text>
                ))}
                <text x={plot.x + plot.w / 2} y={plot.y + plot.h + 30} textAnchor="middle" fontSize={theme.typography.fontSizeSm}
                  fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>Theoretical quantiles</text>
              </g>
              <line x1={xScale(xNice.niceMin)} y1={yScale(fit.predict(xNice.niceMin))}
                x2={xScale(xNice.niceMax)} y2={yScale(fit.predict(xNice.niceMax))}
                stroke={line} strokeWidth={2} strokeDasharray="6 4" />
              {pts.map((p, i) => {
                const active = hover === i;
                return (
                  <circle key={i} cx={xScale(p.theoretical)} cy={yScale(p.sample)} r={active ? pointRadius + 1.5 : pointRadius}
                    fill={color} fillOpacity={0.8} stroke={theme.colors.background} strokeWidth={0.75}
                    onMouseEnter={(e) => {
                      setHover(i);
                      tooltip.show(p, e);
                    }}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => {
                      setHover(null);
                      tooltip.hide();
                    }}>
                    <title>{`theoretical ${p.theoretical.toFixed(2)} · sample ${formatValue(p.sample)}`}</title>
                  </circle>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data) ?? (
                  <span>
                    theoretical: {tooltip.state.data.theoretical.toFixed(2)}
                    <br />
                    sample: {formatValue(tooltip.state.data.sample)}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
