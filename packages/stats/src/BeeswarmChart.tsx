import { useState } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
} from "@zenith-visuals/core";
import { bandScale, linearScale } from "@zenith-visuals/utils";
import { defaultFormat, niceTicks, seriesColor } from "@zenith-visuals/charts";
import type { DistributionChartProps } from "./types";
import { beeswarmLayout } from "./lib/stats";

export interface BeeswarmChartProps extends DistributionChartProps {
  /** Dot radius in px. Default 4. */
  pointRadius?: number;
  /** Dot opacity. Default 0.85. */
  pointOpacity?: number;
}

/**
 * Beeswarm plot — every observation is a dot, packed sideways so none overlap
 * while preserving its exact value on the shared axis. One swarm per group.
 * Uses the pure `beeswarmLayout` helper. Responsive, themeable and SSR-safe.
 *
 * @example
 * <BeeswarmChart groups={[{ label: "A", values: [1, 2, 2, 3, 3, 3, 4] }]} />
 */
export function BeeswarmChart(props: BeeswarmChartProps) {
  const {
    groups,
    pointRadius = 4,
    pointOpacity = 0.85,
    showGrid = true,
    yTickCount = 5,
    formatValue = defaultFormat,
    height = 360,
    ...base
  } = props;

  const tooltip = useTooltip<{ label: string; value: number }>();
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
        const padding = { top: 12, right: 16, bottom: 34, left: 48 };
        const plot = {
          x: padding.left,
          y: padding.top,
          w: Math.max(1, width - padding.left - padding.right),
          h: Math.max(1, h - padding.top - padding.bottom),
        };
        const yNice = niceTicks(min, max, yTickCount, false);
        const yScale = linearScale([yNice.niceMin, yNice.niceMax], [plot.y + plot.h, plot.y]);
        const xBand = bandScale<string>(groups.map((g) => g.label), [plot.x, plot.x + plot.w], 0.2);

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Beeswarm plot"} style={{ display: "block" }}>
              <g aria-hidden>
                {yNice.ticks.map((t) => {
                  const y = yScale(t);
                  return (
                    <g key={t}>
                      {showGrid && <line x1={plot.x} x2={plot.x + plot.w} y1={y} y2={y} stroke={theme.colors.border} opacity={0.4} />}
                      <text x={plot.x - 8} y={y} textAnchor="end" dominantBaseline="central" fontSize={theme.typography.fontSizeSm}
                        fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>{formatValue(t)}</text>
                    </g>
                  );
                })}
                {groups.map((g) => (
                  <text key={g.label} x={xBand(g.label) + xBand.bandwidth / 2} y={plot.y + plot.h + 18} textAnchor="middle"
                    fontSize={theme.typography.fontSizeSm} fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>{g.label}</text>
                ))}
              </g>
              {groups.map((g, gi) => {
                const color = g.color ?? seriesColor(theme, g, gi);
                const cx = xBand(g.label) + xBand.bandwidth / 2;
                const dots = beeswarmLayout(g.values, (v) => yScale(v), pointRadius);
                return (
                  <g key={g.label}>
                    {dots.map((d, i) => {
                      const active = hover === `${gi}:${i}`;
                      return (
                        <circle key={i} cx={cx + d.offset} cy={yScale(d.value)} r={active ? pointRadius + 1.5 : pointRadius}
                          fill={color} fillOpacity={active ? 1 : pointOpacity} stroke={theme.colors.background} strokeWidth={0.75}
                          onMouseEnter={(e) => {
                            setHover(`${gi}:${i}`);
                            tooltip.show({ label: g.label, value: d.value }, e);
                          }}
                          onMouseMove={(e) => tooltip.move(e)}
                          onMouseLeave={() => {
                            setHover(null);
                            tooltip.hide();
                          }}>
                          <title>{`${g.label}: ${formatValue(d.value)}`}</title>
                        </circle>
                      );
                    })}
                  </g>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (
                  <span>
                    <strong>{tooltip.state.data.label}</strong>: {formatValue(tooltip.state.data.value)}
                  </span>
                )}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
