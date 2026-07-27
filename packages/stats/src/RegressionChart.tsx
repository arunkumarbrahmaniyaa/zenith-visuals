import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { linearScale } from "@zenith-visuals/utils";
import { defaultFormat, niceTicks, seriesColor } from "@zenith-visuals/charts";
import type { Point2D } from "./types";
import { linearRegression } from "./lib/stats";

export interface RegressionChartProps extends BaseVisualizationProps {
  points: readonly Point2D[];
  /** Point radius in px. Default 4. */
  pointRadius?: number;
  /** Line color. Defaults to the theme primary. */
  lineColor?: string;
  /** Show the R² badge. Default true. */
  showR2?: boolean;
  showGrid?: boolean;
  formatX?: (value: number) => string;
  formatY?: (value: number) => string;
  onPointClick?: (point: Point2D, index: number) => void;
  renderTooltip?: (point: Point2D) => ReactNode;
}

/**
 * Scatter plot with an ordinary-least-squares regression (trend) line and R²
 * readout. Responsive, themeable and SSR-safe.
 *
 * @example
 * <RegressionChart points={[{ x: 1, y: 2 }, { x: 2, y: 4.2 }, { x: 3, y: 5.8 }]} />
 */
export function RegressionChart(props: RegressionChartProps) {
  const {
    points,
    pointRadius = 4,
    lineColor,
    showR2 = true,
    showGrid = true,
    formatX = defaultFormat,
    formatY = defaultFormat,
    onPointClick,
    renderTooltip,
    height = 340,
    ...base
  } = props;

  const tooltip = useTooltip<Point2D>();
  const [hover, setHover] = useState<number | null>(null);

  return (
    <VisualizationContainer {...base} height={height} isEmpty={points.length === 0} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        let xMin = Infinity;
        let xMax = -Infinity;
        let yMin = Infinity;
        let yMax = -Infinity;
        for (const p of points) {
          if (p.x < xMin) xMin = p.x;
          if (p.x > xMax) xMax = p.x;
          if (p.y < yMin) yMin = p.y;
          if (p.y > yMax) yMax = p.y;
        }
        if (!Number.isFinite(xMin)) {
          xMin = 0; xMax = 1; yMin = 0; yMax = 1;
        }
        const padding = { top: 12, right: 16, bottom: 30, left: 44 };
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
        const fit = linearRegression(points);
        const color = seriesColor(theme, {}, 0);
        const line = lineColor ?? theme.colors.primary;
        const lx0 = xNice.niceMin;
        const lx1 = xNice.niceMax;

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Regression chart"} style={{ display: "block" }}>
              <g aria-hidden>
                {yNice.ticks.map((t) => {
                  const y = yScale(t);
                  return (
                    <g key={`y${t}`}>
                      {showGrid && <line x1={plot.x} x2={plot.x + plot.w} y1={y} y2={y} stroke={theme.colors.border} opacity={0.4} />}
                      <text x={plot.x - 8} y={y} textAnchor="end" dominantBaseline="central" fontSize={theme.typography.fontSizeSm}
                        fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>{formatY(t)}</text>
                    </g>
                  );
                })}
                {xNice.ticks.map((t) => (
                  <text key={`x${t}`} x={xScale(t)} y={plot.y + plot.h + 16} textAnchor="middle" fontSize={theme.typography.fontSizeSm}
                    fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>{formatX(t)}</text>
                ))}
              </g>
              <line x1={xScale(lx0)} y1={yScale(fit.predict(lx0))} x2={xScale(lx1)} y2={yScale(fit.predict(lx1))}
                stroke={line} strokeWidth={2} strokeDasharray="6 4" />
              {points.map((p, i) => {
                const active = hover === i;
                return (
                  <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={active ? pointRadius + 1.5 : pointRadius}
                    fill={color} fillOpacity={0.75} stroke={theme.colors.background} strokeWidth={1}
                    style={{ cursor: onPointClick ? "pointer" : "default" }}
                    onMouseEnter={(e) => {
                      setHover(i);
                      tooltip.show(p, e);
                    }}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => {
                      setHover(null);
                      tooltip.hide();
                    }}
                    onClick={() => onPointClick?.(p, i)}>
                    <title>{`(${formatX(p.x)}, ${formatY(p.y)})`}</title>
                  </circle>
                );
              })}
              {showR2 && (
                <text x={plot.x + plot.w} y={plot.y + 4} textAnchor="end" dominantBaseline="hanging"
                  fontSize={theme.typography.fontSizeSm} fontFamily={theme.typography.monoFamily} fill={theme.colors.textMuted}>
                  {`R² = ${fit.r2.toFixed(3)}`}
                </text>
              )}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data) ?? (
                  <span>
                    x: {formatX(tooltip.state.data.x)}
                    <br />
                    y: {formatY(tooltip.state.data.y)}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
