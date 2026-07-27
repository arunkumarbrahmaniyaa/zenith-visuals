import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { linearScale } from "@zenith-visuals/utils";
import {
  Legend,
  areaPath,
  defaultFormat,
  linePath,
  niceTicks,
  seriesColor,
  type XY,
} from "@zenith-visuals/charts";
import type { DensitySeries } from "./types";
import { kde, linspace } from "./lib/stats";

export interface DensityPlotProps extends BaseVisualizationProps {
  series: readonly DensitySeries[];
  /** Number of density samples across the domain. Default 64. */
  resolution?: number;
  /** Kernel bandwidth; defaults to Silverman's rule per series. */
  bandwidth?: number;
  /** Fill the area under each curve. Default true. */
  fill?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  formatValue?: (value: number) => string;
  renderTooltip?: (series: string, x: number, density: number) => ReactNode;
}

/**
 * Kernel-density (KDE) plot overlaying smooth distribution curves for one or
 * more sample sets. Responsive, themeable and SSR-safe.
 *
 * @example
 * <DensityPlot series={[{ name: "A", values: [1, 2, 2, 3, 4, 5, 5, 6] }]} />
 */
export function DensityPlot(props: DensityPlotProps) {
  const {
    series,
    resolution = 64,
    bandwidth,
    fill = true,
    showLegend,
    showGrid = true,
    formatValue = defaultFormat,
    renderTooltip,
    height = 320,
    ...base
  } = props;

  const tooltip = useTooltip<{ series: string; x: number; density: number }>();
  const [hover, setHover] = useState<string | null>(null);
  const legend = showLegend ?? series.length > 1;

  return (
    <VisualizationContainer
      {...base}
      height={height}
      isEmpty={series.every((s) => s.values.length === 0)}
      defaultHeight={height}
    >
      {({ theme, width, height: h }) => {
        let min = Infinity;
        let max = -Infinity;
        for (const s of series) {
          for (const v of s.values) {
            if (v < min) min = v;
            if (v > max) max = v;
          }
        }
        if (!Number.isFinite(min)) {
          min = 0;
          max = 1;
        }
        const padding = { top: 12, right: 16, bottom: 30, left: 44 };
        const plot = {
          x: padding.left,
          y: padding.top,
          w: Math.max(1, width - padding.left - padding.right),
          h: Math.max(1, h - padding.top - padding.bottom),
        };
        const evalPts = linspace(min, max, resolution);
        const curves = series.map((s) => kde(s.values, evalPts, bandwidth));
        let maxD = 0;
        for (const c of curves) for (const d of c) if (d > maxD) maxD = d;
        const yNice = niceTicks(0, maxD, 4, true);
        const xScale = linearScale([min, max], [plot.x, plot.x + plot.w]);
        const yScale = linearScale([0, yNice.niceMax], [plot.y + plot.h, plot.y]);
        const baselineY = yScale(0);

        return (
          <>
            {legend && (
              <Legend theme={theme} items={series.map((s, i) => ({ label: s.name, color: s.color ?? seriesColor(theme, s, i) }))} />
            )}
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Density plot"} style={{ display: "block" }}>
              <g aria-hidden>
                {yNice.ticks.map((t) => {
                  const y = yScale(t);
                  return showGrid ? <line key={t} x1={plot.x} x2={plot.x + plot.w} y1={y} y2={y} stroke={theme.colors.border} opacity={0.5} /> : null;
                })}
                <line x1={plot.x} x2={plot.x + plot.w} y1={baselineY} y2={baselineY} stroke={theme.colors.border} />
                {niceTicks(min, max, 6, false).ticks.map((t) => {
                  const x = xScale(t);
                  if (x < plot.x - 1 || x > plot.x + plot.w + 1) return null;
                  return (
                    <text key={t} x={x} y={plot.y + plot.h + 16} textAnchor="middle" fontSize={theme.typography.fontSizeSm}
                      fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>{formatValue(t)}</text>
                  );
                })}
              </g>
              {series.map((s, si) => {
                const color = s.color ?? seriesColor(theme, s, si);
                const dimmed = hover != null && hover !== s.name;
                const dens = curves[si]!;
                const pts: XY[] = evalPts.map((v, j) => ({ x: xScale(v), y: yScale(dens[j]!) }));
                return (
                  <g key={s.name} opacity={dimmed ? 0.3 : 1}
                    onMouseMove={(e) => {
                      setHover(s.name);
                      const idx = Math.round(((e.clientX - plot.x) / plot.w) * (evalPts.length - 1));
                      const clamped = Math.min(evalPts.length - 1, Math.max(0, idx));
                      tooltip.show({ series: s.name, x: evalPts[clamped]!, density: dens[clamped]! }, e);
                    }}
                    onMouseLeave={() => {
                      setHover(null);
                      tooltip.hide();
                    }}>
                    {fill && <path d={areaPath(pts, baselineY, true)} fill={color} fillOpacity={0.18} stroke="none" />}
                    <path d={linePath(pts)} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
                  </g>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data.series, tooltip.state.data.x, tooltip.state.data.density) ?? (
                  <span>
                    <strong>{tooltip.state.data.series}</strong>
                    <br />
                    {formatValue(tooltip.state.data.x)} · density {tooltip.state.data.density.toFixed(3)}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
