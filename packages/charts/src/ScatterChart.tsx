import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { linearScale } from "@zenith-visuals/utils";
import type { ScatterSeries } from "./types";
import { defaultFormat, niceTicks } from "./lib/ticks";
import { seriesColor } from "./lib/series";
import { Legend } from "./components/Legend";

export interface ScatterChartProps extends BaseVisualizationProps {
  /** One or more series of `{ x, y, r? }` points. */
  series: readonly ScatterSeries[];
  /** Treat `r` as a bubble size weight. Radius range in px. Default [4, 28]. */
  radiusRange?: [number, number];
  showLegend?: boolean;
  showGrid?: boolean;
  xTickCount?: number;
  yTickCount?: number;
  formatX?: (value: number) => string;
  formatY?: (value: number) => string;
  onPointClick?: (series: string, index: number) => void;
  renderTooltip?: (info: ScatterTooltipInfo) => ReactNode;
}

interface ScatterTooltipInfo {
  series: string;
  x: number;
  y: number;
  r?: number;
  label?: string;
  color: string;
}

/**
 * Scatter / bubble chart with numeric x and y axes. When points carry an `r`
 * value it is encoded as bubble size. Responsive and SSR-safe.
 *
 * @example
 * <ScatterChart series={[{ name: "A", data: [{ x: 1, y: 2, r: 5 }] }]} />
 */
export function ScatterChart(props: ScatterChartProps) {
  const {
    series,
    radiusRange = [4, 28],
    showLegend,
    showGrid = true,
    xTickCount = 5,
    yTickCount = 5,
    formatX = defaultFormat,
    formatY = defaultFormat,
    onPointClick,
    renderTooltip,
    height = 340,
    ...base
  } = props;

  const tooltip = useTooltip<ScatterTooltipInfo>();
  const [hover, setHover] = useState<string | null>(null);
  const legend = showLegend ?? series.length > 1;

  return (
    <VisualizationContainer
      {...base}
      height={height}
      isEmpty={series.every((s) => s.data.length === 0)}
      defaultHeight={height}
    >
      {({ theme, width, height: h }) => {
        let xMin = Infinity;
        let xMax = -Infinity;
        let yMin = Infinity;
        let yMax = -Infinity;
        let rMin = Infinity;
        let rMax = -Infinity;
        for (const s of series) {
          for (const p of s.data) {
            if (p.x < xMin) xMin = p.x;
            if (p.x > xMax) xMax = p.x;
            if (p.y < yMin) yMin = p.y;
            if (p.y > yMax) yMax = p.y;
            const r = p.r ?? 1;
            if (r < rMin) rMin = r;
            if (r > rMax) rMax = r;
          }
        }
        if (!Number.isFinite(xMin)) {
          xMin = 0;
          xMax = 1;
          yMin = 0;
          yMax = 1;
        }

        const padding = { top: 12, right: 16, bottom: 28, left: 44 };
        const plot = {
          x: padding.left,
          y: padding.top,
          w: Math.max(1, width - padding.left - padding.right),
          h: Math.max(1, h - padding.top - padding.bottom),
        };
        const xNice = niceTicks(xMin, xMax, xTickCount, false);
        const yNice = niceTicks(yMin, yMax, yTickCount, false);
        const xScale = linearScale([xNice.niceMin, xNice.niceMax], [plot.x, plot.x + plot.w]);
        const yScale = linearScale([yNice.niceMin, yNice.niceMax], [plot.y + plot.h, plot.y]);
        const radiusFor = (r: number) => {
          if (rMax <= rMin) return radiusRange[0];
          return radiusRange[0] + ((r - rMin) / (rMax - rMin)) * (radiusRange[1] - radiusRange[0]);
        };

        return (
          <>
            {legend && (
              <Legend theme={theme} items={series.map((s, i) => ({ label: s.name, color: seriesColor(theme, s, i) }))} />
            )}
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Scatter chart"} style={{ display: "block" }}>
              <g aria-hidden>
                {yNice.ticks.map((t) => {
                  const y = yScale(t);
                  return (
                    <g key={`y${t}`}>
                      {showGrid && <line x1={plot.x} x2={plot.x + plot.w} y1={y} y2={y} stroke={theme.colors.border} opacity={0.6} />}
                      <text x={plot.x - 8} y={y} textAnchor="end" dominantBaseline="central" fontSize={theme.typography.fontSizeSm}
                        fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>{formatY(t)}</text>
                    </g>
                  );
                })}
                {xNice.ticks.map((t) => {
                  const x = xScale(t);
                  return (
                    <g key={`x${t}`}>
                      {showGrid && <line x1={x} x2={x} y1={plot.y} y2={plot.y + plot.h} stroke={theme.colors.border} opacity={0.4} />}
                      <text x={x} y={plot.y + plot.h + 16} textAnchor="middle" fontSize={theme.typography.fontSizeSm}
                        fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>{formatX(t)}</text>
                    </g>
                  );
                })}
              </g>
              {series.map((s, si) => {
                const color = seriesColor(theme, s, si);
                const dimmed = hover != null && hover !== s.name;
                const hasBubble = s.data.some((p) => p.r != null);
                return (
                  <g key={s.name} opacity={dimmed ? 0.25 : 1}>
                    {s.data.map((p, i) => (
                      <circle
                        key={i}
                        cx={xScale(p.x)}
                        cy={yScale(p.y)}
                        r={hasBubble ? radiusFor(p.r ?? 1) : 5}
                        fill={color}
                        fillOpacity={0.7}
                        stroke={theme.colors.background}
                        strokeWidth={1}
                        style={{ cursor: onPointClick ? "pointer" : "default" }}
                        onMouseEnter={(e) => {
                          setHover(s.name);
                          tooltip.show({ series: s.name, x: p.x, y: p.y, r: p.r, label: p.label, color }, e);
                        }}
                        onMouseMove={(e) => tooltip.move(e)}
                        onMouseLeave={() => {
                          setHover(null);
                          tooltip.hide();
                        }}
                        onClick={() => onPointClick?.(s.name, i)}
                      >
                        <title>{`${p.label ?? s.name}: (${formatX(p.x)}, ${formatY(p.y)})`}</title>
                      </circle>
                    ))}
                  </g>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data) ?? (
                  <span>
                    <strong>{tooltip.state.data.label ?? tooltip.state.data.series}</strong>
                    <br />
                    ({formatX(tooltip.state.data.x)}, {formatY(tooltip.state.data.y)})
                    {tooltip.state.data.r != null && ` · ${tooltip.state.data.r}`}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
