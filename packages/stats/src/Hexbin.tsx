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

export interface HexbinProps extends BaseVisualizationProps {
  points: readonly Point2D[];
  /** Hexagon radius in px. Default 14. */
  radius?: number;
  showGrid?: boolean;
  formatX?: (value: number) => string;
  formatY?: (value: number) => string;
  onBinClick?: (bin: HexBin) => void;
  renderTooltip?: (bin: HexBin) => ReactNode;
}

export interface HexBin {
  x: number;
  y: number;
  count: number;
}

const THIRD_PI = Math.PI / 3;

function hexagonPath(r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = i * THIRD_PI;
    pts.push(`${(r * Math.sin(a)).toFixed(2)},${(-r * Math.cos(a)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

/**
 * Hexbin density plot — aggregates a 2D scatter into a hexagonal mesh, coloring
 * each cell by point count. Ideal for large or overlapping datasets.
 * Responsive, themeable and SSR-safe.
 *
 * @example
 * <Hexbin points={[{ x: 1, y: 2 }, { x: 1.1, y: 2.1 }]} radius={12} />
 */
export function Hexbin(props: HexbinProps) {
  const {
    points,
    radius = 14,
    showGrid = true,
    formatX = defaultFormat,
    formatY = defaultFormat,
    onBinClick,
    renderTooltip,
    height = 340,
    ...base
  } = props;

  const tooltip = useTooltip<HexBin>();
  const [hover, setHover] = useState<string | null>(null);

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
          xMin = 0;
          xMax = 1;
          yMin = 0;
          yMax = 1;
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

        // Hexagonal binning in pixel space (d3-hexbin mesh).
        const dx = radius * 2 * Math.sin(THIRD_PI);
        const dy = radius * 1.5;
        const map = new Map<string, HexBin>();
        for (const p of points) {
          const px = xScale(p.x);
          const py = yScale(p.y);
          const pyi = py / dy;
          let pj = Math.round(pyi);
          let pxi = px / dx - (pj & 1 ? 0.5 : 0);
          let pi = Math.round(pxi);
          const py1 = pyi - pj;
          if (Math.abs(py1) * 3 > 1) {
            const px1 = pxi - pi;
            const pi2 = pi + (px < pi ? -1 : 1) / 2;
            const pj2 = pj + (py < pj ? -1 : 1);
            const px2 = pxi - pi2;
            const py2 = pyi - pj2;
            if (px1 * px1 + py1 * py1 > px2 * px2 + py2 * py2) {
              pi = pi2 + (pj & 1 ? 1 : -1) / 2;
              pj = pj2;
            }
          }
          const cx = (pi + (pj & 1 ? 0.5 : 0)) * dx;
          const cy = pj * dy;
          const key = `${Math.round(cx)}_${Math.round(cy)}`;
          const existing = map.get(key);
          if (existing) existing.count += 1;
          else map.set(key, { x: cx, y: cy, count: 1 });
        }
        const cells = [...map.values()];
        const maxCount = Math.max(1, ...cells.map((c) => c.count));
        const ramp = sequentialScale(theme.sequential);
        const hexD = hexagonPath(radius);

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Hexbin density plot"} style={{ display: "block" }}>
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
              <clipPath id="hexbin-clip">
                <rect x={plot.x} y={plot.y} width={plot.w} height={plot.h} />
              </clipPath>
              <g clipPath="url(#hexbin-clip)">
                {cells.map((c) => {
                  const key = `${Math.round(c.x)}_${Math.round(c.y)}`;
                  const active = hover === key;
                  return (
                    <path key={key} d={hexD} transform={`translate(${c.x},${c.y})`} fill={ramp(c.count / maxCount)}
                      stroke={active ? theme.colors.text : theme.colors.background} strokeWidth={active ? 1.5 : 0.5}
                      style={{ cursor: onBinClick ? "pointer" : "default" }}
                      onMouseEnter={(e) => {
                        setHover(key);
                        tooltip.show(c, e);
                      }}
                      onMouseMove={(e) => tooltip.move(e)}
                      onMouseLeave={() => {
                        setHover(null);
                        tooltip.hide();
                      }}
                      onClick={() => onBinClick?.(c)}>
                      <title>{`count: ${c.count}`}</title>
                    </path>
                  );
                })}
              </g>
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data) ?? <span>count: {tooltip.state.data.count}</span>)}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
