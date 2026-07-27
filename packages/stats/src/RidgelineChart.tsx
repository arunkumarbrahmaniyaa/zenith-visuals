import { useState } from "react";
import {
  VisualizationContainer,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { linearScale } from "@zenith-visuals/utils";
import { areaPath, defaultFormat, linePath, niceTicks, seriesColor, type XY } from "@zenith-visuals/charts";
import type { DistributionGroup } from "./types";
import { kde, linspace } from "./lib/stats";

export interface RidgelineChartProps extends BaseVisualizationProps {
  groups: readonly DistributionGroup[];
  /** Number of density samples across the domain. Default 96. */
  resolution?: number;
  /** Kernel bandwidth; defaults to Silverman's rule per group. */
  bandwidth?: number;
  /** Vertical overlap between ridges (1 = touch, 2 = strong overlap). Default 1.6. */
  overlap?: number;
  showGrid?: boolean;
  formatValue?: (value: number) => string;
}

/**
 * Ridgeline (joyplot) — stacked, slightly overlapping density curves that make
 * it easy to compare a distribution's shape across many groups. Responsive,
 * themeable and SSR-safe.
 *
 * @example
 * <RidgelineChart groups={[{ label: "Jan", values: [...] }, { label: "Feb", values: [...] }]} />
 */
export function RidgelineChart(props: RidgelineChartProps) {
  const {
    groups,
    resolution = 96,
    bandwidth,
    overlap = 1.6,
    showGrid = true,
    formatValue = defaultFormat,
    height = 360,
    ...base
  } = props;

  const [hover, setHover] = useState<string | null>(null);

  return (
    <VisualizationContainer {...base} height={height}
      isEmpty={groups.every((g) => g.values.length === 0)} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        let min = Infinity;
        let max = -Infinity;
        for (const g of groups) for (const v of g.values) {
          if (v < min) min = v;
          if (v > max) max = v;
        }
        if (!Number.isFinite(min)) { min = 0; max = 1; }
        const padding = { top: 16, right: 16, bottom: 30, left: 80 };
        const plot = {
          x: padding.left,
          y: padding.top,
          w: Math.max(1, width - padding.left - padding.right),
          h: Math.max(1, h - padding.top - padding.bottom),
        };
        const evalPts = linspace(min, max, resolution);
        const curves = groups.map((g) => kde(g.values, evalPts, bandwidth));
        let maxD = 0;
        for (const c of curves) for (const d of c) if (d > maxD) maxD = d;
        maxD = maxD || 1;

        const rows = groups.length;
        const rowStep = rows > 0 ? plot.h / rows : plot.h;
        const amplitude = rowStep * overlap;
        const xScale = linearScale([min, max], [plot.x, plot.x + plot.w]);
        // Baseline for group i (group 0 at bottom, later groups stacked upward).
        const baselineOf = (i: number) => plot.y + plot.h - i * rowStep;

        return (
          <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
            aria-label={base.labels?.ariaLabel ?? "Ridgeline chart"} style={{ display: "block" }}>
            <g aria-hidden>
              {niceTicks(min, max, 6, false).ticks.map((t) => {
                const x = xScale(t);
                if (x < plot.x - 1 || x > plot.x + plot.w + 1) return null;
                return (
                  <g key={t}>
                    {showGrid && <line x1={x} x2={x} y1={plot.y} y2={plot.y + plot.h} stroke={theme.colors.border} opacity={0.3} />}
                    <text x={x} y={plot.y + plot.h + 16} textAnchor="middle" fontSize={theme.typography.fontSizeSm}
                      fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>{formatValue(t)}</text>
                  </g>
                );
              })}
            </g>
            {/* Draw back-to-front: topmost group first so lower ridges overlap it. */}
            {groups.map((_, idx) => groups.length - 1 - idx).map((gi) => {
              const g = groups[gi]!;
              const color = g.color ?? seriesColor(theme, g, gi);
              const base0 = baselineOf(gi);
              const dens = curves[gi]!;
              const pts: XY[] = evalPts.map((v, j) => ({ x: xScale(v), y: base0 - (dens[j]! / maxD) * amplitude }));
              const dimmed = hover != null && hover !== g.label;
              return (
                <g key={g.label} opacity={dimmed ? 0.35 : 1}
                  onMouseEnter={() => setHover(g.label)} onMouseLeave={() => setHover(null)}>
                  <path d={areaPath(pts, base0, true)} fill={color} fillOpacity={0.7} stroke="none" />
                  <path d={linePath(pts)} fill="none" stroke={theme.colors.background} strokeWidth={1} />
                  <path d={linePath(pts)} fill="none" stroke={color} strokeWidth={1.5} />
                  <text x={plot.x - 10} y={base0} textAnchor="end" dominantBaseline="central" fontSize={theme.typography.fontSizeSm}
                    fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>{g.label}</text>
                </g>
              );
            })}
          </svg>
        );
      }}
    </VisualizationContainer>
  );
}
