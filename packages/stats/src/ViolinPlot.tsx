import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
} from "@zenith-visuals/core";
import {
  CartesianAxes,
  computeCartesianLayout,
  defaultFormat,
  seriesColor,
} from "@zenith-visuals/charts";
import type { DistributionChartProps, DistributionGroup } from "./types";
import { boxStats, kde, linspace, type BoxStats } from "./lib/stats";

export interface ViolinPlotProps extends DistributionChartProps {
  /** Number of density samples per violin. Default 48. */
  resolution?: number;
  /** Kernel bandwidth; defaults to Silverman's rule per group. */
  bandwidth?: number;
  /** Overlay a median line + quartile box. Default true. */
  showBox?: boolean;
  renderTooltip?: (group: DistributionGroup, stats: BoxStats) => ReactNode;
}

/**
 * Violin plot — a mirrored kernel-density estimate for each group, optionally
 * overlaid with quartile box and median. Responsive, themeable and SSR-safe.
 *
 * @example
 * <ViolinPlot groups={[{ label: "A", values: [3, 5, 6, 9, 12, 14, 22] }]} />
 */
export function ViolinPlot(props: ViolinPlotProps) {
  const {
    groups,
    resolution = 48,
    bandwidth,
    showBox = true,
    showGrid = true,
    yTickCount = 5,
    formatValue = defaultFormat,
    renderTooltip,
    height = 340,
    ...base
  } = props;

  const tooltip = useTooltip<{ group: DistributionGroup; stats: BoxStats }>();
  const [hover, setHover] = useState<string | null>(null);

  return (
    <VisualizationContainer
      {...base}
      height={height}
      isEmpty={groups.length === 0}
      defaultHeight={height}
    >
      {({ theme, width, height: h }) => {
        let min = Infinity;
        let max = -Infinity;
        for (const g of groups) {
          for (const v of g.values) {
            if (v < min) min = v;
            if (v > max) max = v;
          }
        }
        if (!Number.isFinite(min)) {
          min = 0;
          max = 1;
        }
        const categories = groups.map((g) => g.label);
        const layout = computeCartesianLayout({
          width,
          height: h,
          categories,
          valueMin: min,
          valueMax: max,
          yTickCount,
          includeZero: false,
        });
        const halfW = Math.min(48, layout.xBand.bandwidth * 0.42);

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Violin plot"} style={{ display: "block" }}>
              <CartesianAxes theme={theme} layout={layout} categories={categories} formatValue={formatValue} showGrid={showGrid} />
              {groups.map((g, i) => {
                const cx = layout.categoryCenter(i);
                const color = g.color ?? seriesColor(theme, g, i);
                const dimmed = hover != null && hover !== g.label;
                const stats = boxStats(g.values);
                let gMin = Infinity;
                let gMax = -Infinity;
                for (const v of g.values) {
                  if (v < gMin) gMin = v;
                  if (v > gMax) gMax = v;
                }
                if (!Number.isFinite(gMin)) return null;
                const evalPts = linspace(gMin, gMax, resolution);
                const dens = kde(g.values, evalPts, bandwidth);
                const maxD = Math.max(...dens, 1e-9);
                const right = evalPts.map((v, j) => ({ x: cx + (dens[j]! / maxD) * halfW, y: layout.yScale(v) }));
                const left = [...evalPts].map((v, j) => ({ x: cx - (dens[j]! / maxD) * halfW, y: layout.yScale(v) })).reverse();
                const d =
                  `M${right[0]!.x.toFixed(2)},${right[0]!.y.toFixed(2)} ` +
                  right.slice(1).map((p) => `L${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ") +
                  " " +
                  left.map((p) => `L${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ") +
                  " Z";
                return (
                  <g key={g.label} opacity={dimmed ? 0.35 : 1}
                    onMouseEnter={(e) => {
                      setHover(g.label);
                      tooltip.show({ group: g, stats }, e);
                    }}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => {
                      setHover(null);
                      tooltip.hide();
                    }}>
                    <path d={d} fill={color} fillOpacity={0.35} stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
                    {showBox && (
                      <>
                        <rect x={cx - 4} y={Math.min(layout.yScale(stats.q1), layout.yScale(stats.q3))} width={8}
                          height={Math.abs(layout.yScale(stats.q1) - layout.yScale(stats.q3))} fill={theme.colors.text} opacity={0.55} rx={2} />
                        <circle cx={cx} cy={layout.yScale(stats.median)} r={2.5} fill={theme.colors.background} />
                      </>
                    )}
                  </g>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data.group, tooltip.state.data.stats) ?? (
                  <span>
                    <strong>{tooltip.state.data.group.label}</strong>
                    <br />
                    median {formatValue(tooltip.state.data.stats.median)} · n {tooltip.state.data.group.values.length}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
