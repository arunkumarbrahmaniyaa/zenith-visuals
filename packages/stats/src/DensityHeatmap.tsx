import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { linearScale, sequentialScale } from "@zenith-visuals/utils";
import { defaultFormat, niceTicks } from "@zenith-visuals/charts";
import type { Point2D } from "./types";
import { bin2d, type Bin2D } from "./lib/density2d";

export interface DensityHeatmapProps extends BaseVisualizationProps {
  points: readonly Point2D[];
  /** Number of columns in the grid. Default 24. */
  binsX?: number;
  /** Number of rows in the grid. Default 24. */
  binsY?: number;
  showGrid?: boolean;
  formatX?: (value: number) => string;
  formatY?: (value: number) => string;
  onCellClick?: (cell: Bin2D) => void;
  renderTooltip?: (cell: Bin2D) => ReactNode;
}

/**
 * 2D density heatmap — aggregates a scatter into a rectangular grid and colors
 * each cell by point count using the theme's sequential ramp. Ideal for dense
 * or overlapping data. Responsive, themeable and SSR-safe.
 *
 * @example
 * <DensityHeatmap points={[{ x: 1, y: 2 }, { x: 1.1, y: 2.2 }]} binsX={20} binsY={20} />
 */
export function DensityHeatmap(props: DensityHeatmapProps) {
  const {
    points,
    binsX = 24,
    binsY = 24,
    showGrid = false,
    formatX = defaultFormat,
    formatY = defaultFormat,
    onCellClick,
    renderTooltip,
    height = 340,
    ...base
  } = props;

  const tooltip = useTooltip<Bin2D>();
  const [hover, setHover] = useState<string | null>(null);

  return (
    <VisualizationContainer {...base} height={height} isEmpty={points.length === 0} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const grid = bin2d(points, binsX, binsY);
        const padding = { top: 12, right: 16, bottom: 34, left: 48 };
        const plot = {
          x: padding.left,
          y: padding.top,
          w: Math.max(1, width - padding.left - padding.right),
          h: Math.max(1, h - padding.top - padding.bottom),
        };
        const xNice = niceTicks(grid.xMin, grid.xMax, 5, false);
        const yNice = niceTicks(grid.yMin, grid.yMax, 5, false);
        const xScale = linearScale([grid.xMin, grid.xMax], [plot.x, plot.x + plot.w]);
        const yScale = linearScale([grid.yMin, grid.yMax], [plot.y + plot.h, plot.y]);
        const cellW = plot.w / grid.binsX;
        const cellH = plot.h / grid.binsY;
        const ramp = sequentialScale(theme.sequential);
        const denom = grid.maxCount || 1;

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "2D density heatmap"} style={{ display: "block" }}>
              <rect x={plot.x} y={plot.y} width={plot.w} height={plot.h} fill={ramp(0)} opacity={0.5} />
              <g aria-hidden>
                {yNice.ticks.map((t) => {
                  const y = yScale(t);
                  if (y < plot.y - 1 || y > plot.y + plot.h + 1) return null;
                  return (
                    <g key={`y${t}`}>
                      {showGrid && <line x1={plot.x} x2={plot.x + plot.w} y1={y} y2={y} stroke={theme.colors.border} opacity={0.3} />}
                      <text x={plot.x - 8} y={y} textAnchor="end" dominantBaseline="central" fontSize={theme.typography.fontSizeSm}
                        fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>{formatY(t)}</text>
                    </g>
                  );
                })}
                {xNice.ticks.map((t) => {
                  const x = xScale(t);
                  if (x < plot.x - 1 || x > plot.x + plot.w + 1) return null;
                  return (
                    <text key={`x${t}`} x={x} y={plot.y + plot.h + 16} textAnchor="middle" fontSize={theme.typography.fontSizeSm}
                      fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>{formatX(t)}</text>
                  );
                })}
              </g>
              {grid.cells.map((c) => {
                const key = `${c.ix}_${c.iy}`;
                const active = hover === key;
                const rx = plot.x + c.ix * cellW;
                // Grid rows count upward from yMin, so flip for pixel space.
                const ry = plot.y + plot.h - (c.iy + 1) * cellH;
                return (
                  <rect key={key} x={rx} y={ry} width={cellW + 0.5} height={cellH + 0.5}
                    fill={ramp(c.count / denom)} opacity={active ? 1 : 0.92}
                    stroke={active ? theme.colors.text : "none"} strokeWidth={active ? 1 : 0}
                    style={{ cursor: onCellClick ? "pointer" : "default" }}
                    onMouseEnter={(e) => {
                      setHover(key);
                      tooltip.show(c, e);
                    }}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => {
                      setHover(null);
                      tooltip.hide();
                    }}
                    onClick={() => onCellClick?.(c)}>
                    <title>{`${c.count} point${c.count === 1 ? "" : "s"}`}</title>
                  </rect>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data) ?? (
                  <span>
                    {tooltip.state.data.count} point{tooltip.state.data.count === 1 ? "" : "s"}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
