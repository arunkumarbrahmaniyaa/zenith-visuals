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
import { kdeGrid2d, marchingSquares } from "./lib/density2d";

export interface ContourPlotProps extends BaseVisualizationProps {
  points: readonly Point2D[];
  /** Grid resolution for the density estimate. Default 40. */
  resolution?: number;
  /** Number of contour bands. Default 6. */
  levels?: number;
  /** Kernel bandwidth; defaults to a Scott-style rule per dimension. */
  bandwidth?: number;
  /** Fill the bands with the sequential ramp (band plot). Default true. */
  fill?: boolean;
  /** Overlay the source points. Default false. */
  showPoints?: boolean;
  showGrid?: boolean;
  formatX?: (value: number) => string;
  formatY?: (value: number) => string;
  renderTooltip?: (level: { level: number; density: number }) => ReactNode;
}

/**
 * Contour (density isoline) plot — estimates a smooth 2D kernel density and
 * traces iso-level lines with marching squares. Optionally fills the bands with
 * the sequential ramp. Responsive, themeable and SSR-safe.
 *
 * @example
 * <ContourPlot points={cluster} levels={8} showPoints />
 */
export function ContourPlot(props: ContourPlotProps) {
  const {
    points,
    resolution = 40,
    levels = 6,
    bandwidth,
    fill = true,
    showPoints = false,
    showGrid = false,
    formatX = defaultFormat,
    formatY = defaultFormat,
    renderTooltip,
    height = 360,
    ...base
  } = props;

  const tooltip = useTooltip<{ level: number; density: number }>();
  const [hover, setHover] = useState<number | null>(null);

  return (
    <VisualizationContainer {...base} height={height} isEmpty={points.length === 0} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const field = kdeGrid2d(points, resolution, bandwidth);
        const padding = { top: 12, right: 16, bottom: 34, left: 48 };
        const plot = {
          x: padding.left,
          y: padding.top,
          w: Math.max(1, width - padding.left - padding.right),
          h: Math.max(1, h - padding.top - padding.bottom),
        };
        const xNice = niceTicks(field.xMin, field.xMax, 5, false);
        const yNice = niceTicks(field.yMin, field.yMax, 5, false);
        const xScale = linearScale([field.xMin, field.xMax], [plot.x, plot.x + plot.w]);
        const yScale = linearScale([field.yMin, field.yMax], [plot.y + plot.h, plot.y]);
        const ramp = sequentialScale(theme.sequential);

        // Map a grid-index coordinate to pixel space.
        const gx = (i: number) => xScale(field.xMin + (i / (field.size - 1)) * (field.xMax - field.xMin));
        const gy = (j: number) => yScale(field.yMin + (j / (field.size - 1)) * (field.yMax - field.yMin));

        const bandCount = Math.max(2, Math.floor(levels));
        const thresholds = Array.from({ length: bandCount }, (_, k) => (field.max * (k + 1)) / (bandCount + 1));
        const bands = thresholds.map((t, k) => {
          const segs = marchingSquares(field.grid, field.size, field.size, t);
          const d = segs
            .map((s) => `M${gx(s.x1).toFixed(2)},${gy(s.y1).toFixed(2)}L${gx(s.x2).toFixed(2)},${gy(s.y2).toFixed(2)}`)
            .join("");
          return { d, level: k, density: t, tint: (k + 1) / bandCount };
        });

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Density contour plot"} style={{ display: "block" }}>
              {fill && <rect x={plot.x} y={plot.y} width={plot.w} height={plot.h} fill={ramp(0)} opacity={0.35} />}
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
              <clipPath id="contour-clip">
                <rect x={plot.x} y={plot.y} width={plot.w} height={plot.h} />
              </clipPath>
              <g clipPath="url(#contour-clip)">
                {bands.map((b) => {
                  const active = hover === b.level;
                  return (
                    <path key={b.level} d={b.d} fill="none"
                      stroke={fill ? ramp(b.tint) : theme.colors.primary}
                      strokeWidth={active ? 2.5 : 1.5} strokeOpacity={active ? 1 : 0.85}
                      strokeLinejoin="round" strokeLinecap="round"
                      onMouseEnter={(e) => {
                        setHover(b.level);
                        tooltip.show({ level: b.level, density: b.density }, e);
                      }}
                      onMouseMove={(e) => tooltip.move(e)}
                      onMouseLeave={() => {
                        setHover(null);
                        tooltip.hide();
                      }} />
                  );
                })}
              </g>
              {showPoints &&
                points.map((p, i) => (
                  <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={2} fill={theme.colors.text} fillOpacity={0.35} />
                ))}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data) ?? (
                  <span>level {tooltip.state.data.level + 1}</span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
