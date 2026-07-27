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
import { histogramBins } from "./lib/stats";

export interface MarginalHistogramProps extends BaseVisualizationProps {
  points: readonly Point2D[];
  /** Point radius in px. Default 3.5. */
  pointRadius?: number;
  /** Number of bins on each marginal axis. Default 16. */
  bins?: number;
  /** Size of the marginal histogram strips in px. Default 56. */
  marginalSize?: number;
  showGrid?: boolean;
  formatX?: (value: number) => string;
  formatY?: (value: number) => string;
  onPointClick?: (point: Point2D) => void;
  renderTooltip?: (point: Point2D) => ReactNode;
}

/**
 * Marginal-histogram scatter — a central scatter plot flanked by histograms of
 * the x and y distributions along the top and right margins. Responsive,
 * themeable and SSR-safe.
 *
 * @example
 * <MarginalHistogram points={[{ x: 1, y: 2 }, { x: 1.4, y: 2.2 }]} bins={20} />
 */
export function MarginalHistogram(props: MarginalHistogramProps) {
  const {
    points,
    pointRadius = 3.5,
    bins = 16,
    marginalSize = 56,
    showGrid = true,
    formatX = defaultFormat,
    formatY = defaultFormat,
    onPointClick,
    renderTooltip,
    height = 360,
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
        if (!Number.isFinite(xMin)) { xMin = 0; xMax = 1; yMin = 0; yMax = 1; }

        const gap = 8;
        const padding = { top: marginalSize + gap, right: marginalSize + gap, bottom: 34, left: 48 };
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
        const color = seriesColor(theme, {}, 0);

        const xBins = histogramBins(points.map((p) => p.x), bins);
        const yBins = histogramBins(points.map((p) => p.y), bins);
        const xMaxCount = Math.max(1, ...xBins.map((b) => b.count));
        const yMaxCount = Math.max(1, ...yBins.map((b) => b.count));

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Scatter with marginal histograms"} style={{ display: "block" }}>
              <g aria-hidden>
                {yNice.ticks.map((t) => {
                  const y = yScale(t);
                  return (
                    <g key={`y${t}`}>
                      {showGrid && <line x1={plot.x} x2={plot.x + plot.w} y1={y} y2={y} stroke={theme.colors.border} opacity={0.35} />}
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

              {/* Top marginal: distribution of x. */}
              {xBins.map((b, i) => {
                const bx = xScale(b.x0);
                const bw = Math.max(0.5, xScale(b.x1) - xScale(b.x0) - 1);
                const bh = (b.count / xMaxCount) * marginalSize;
                return (
                  <rect key={`hx${i}`} x={bx} y={plot.y - gap - bh} width={bw} height={bh}
                    fill={color} fillOpacity={0.55} rx={1} />
                );
              })}

              {/* Right marginal: distribution of y. */}
              {yBins.map((b, i) => {
                const by = yScale(b.x1);
                const bhpx = Math.max(0.5, yScale(b.x0) - yScale(b.x1) - 1);
                const bw = (b.count / yMaxCount) * marginalSize;
                return (
                  <rect key={`hy${i}`} x={plot.x + plot.w + gap} y={by} width={bw} height={bhpx}
                    fill={color} fillOpacity={0.55} rx={1} />
                );
              })}

              {/* Central scatter. */}
              {points.map((p, i) => {
                const active = hover === i;
                return (
                  <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={active ? pointRadius + 1.5 : pointRadius}
                    fill={color} fillOpacity={0.75} stroke={theme.colors.background} strokeWidth={0.75}
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
                    onClick={() => onPointClick?.(p)}>
                    <title>{`x ${formatX(p.x)} · y ${formatY(p.y)}`}</title>
                  </circle>
                );
              })}
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
