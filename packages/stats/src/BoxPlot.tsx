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
import { boxStats, type BoxStats } from "./lib/stats";

export interface BoxPlotProps extends DistributionChartProps {
  /** Draw a mean marker inside each box. Default true. */
  showMean?: boolean;
  /** Draw outlier points beyond the whiskers. Default true. */
  showOutliers?: boolean;
  onBoxClick?: (group: DistributionGroup, stats: BoxStats) => void;
  renderTooltip?: (group: DistributionGroup, stats: BoxStats) => ReactNode;
}

/**
 * Box-and-whisker plot showing quartiles, median, Tukey whiskers, outliers and
 * an optional mean marker for each group. Responsive, themeable and SSR-safe.
 *
 * @example
 * <BoxPlot groups={[{ label: "A", values: [3, 5, 6, 9, 12, 14, 22] }]} />
 */
export function BoxPlot(props: BoxPlotProps) {
  const {
    groups,
    showMean = true,
    showOutliers = true,
    showGrid = true,
    yTickCount = 5,
    formatValue = defaultFormat,
    onBoxClick,
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
        const stats = groups.map((g) => boxStats(g.values));
        let min = Infinity;
        let max = -Infinity;
        for (const s of stats) {
          if (s.min < min) min = s.min;
          if (s.max > max) max = s.max;
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
        const boxW = Math.min(56, layout.xBand.bandwidth * 0.6);

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Box plot"} style={{ display: "block" }}>
              <CartesianAxes theme={theme} layout={layout} categories={categories} formatValue={formatValue} showGrid={showGrid} />
              {groups.map((g, i) => {
                const s = stats[i]!;
                const cx = layout.categoryCenter(i);
                const color = g.color ?? seriesColor(theme, g, i);
                const dimmed = hover != null && hover !== g.label;
                const x = cx - boxW / 2;
                const yQ1 = layout.yScale(s.q1);
                const yQ3 = layout.yScale(s.q3);
                const yMed = layout.yScale(s.median);
                const yWLow = layout.yScale(s.whiskerLow);
                const yWHigh = layout.yScale(s.whiskerHigh);
                return (
                  <g key={g.label} opacity={dimmed ? 0.35 : 1}
                    onMouseEnter={(e) => {
                      setHover(g.label);
                      tooltip.show({ group: g, stats: s }, e);
                    }}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => {
                      setHover(null);
                      tooltip.hide();
                    }}
                    onClick={() => onBoxClick?.(g, s)}
                    style={{ cursor: onBoxClick ? "pointer" : "default" }}>
                    {/* whiskers */}
                    <line x1={cx} x2={cx} y1={yWHigh} y2={yQ3} stroke={color} strokeWidth={1.5} />
                    <line x1={cx} x2={cx} y1={yQ1} y2={yWLow} stroke={color} strokeWidth={1.5} />
                    <line x1={cx - boxW / 4} x2={cx + boxW / 4} y1={yWHigh} y2={yWHigh} stroke={color} strokeWidth={1.5} />
                    <line x1={cx - boxW / 4} x2={cx + boxW / 4} y1={yWLow} y2={yWLow} stroke={color} strokeWidth={1.5} />
                    {/* box */}
                    <rect x={x} y={Math.min(yQ1, yQ3)} width={boxW} height={Math.abs(yQ1 - yQ3)}
                      fill={color} fillOpacity={0.25} stroke={color} strokeWidth={1.5} rx={2} />
                    {/* median */}
                    <line x1={x} x2={x + boxW} y1={yMed} y2={yMed} stroke={color} strokeWidth={2.5} />
                    {/* mean */}
                    {showMean && (
                      <circle cx={cx} cy={layout.yScale(s.mean)} r={3} fill={theme.colors.background} stroke={color} strokeWidth={1.5} />
                    )}
                    {/* outliers */}
                    {showOutliers &&
                      s.outliers.map((o, oi) => (
                        <circle key={oi} cx={cx} cy={layout.yScale(o)} r={2.5} fill="none" stroke={color} strokeWidth={1.5} />
                      ))}
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
                    median {formatValue(tooltip.state.data.stats.median)} · IQR{" "}
                    {formatValue(tooltip.state.data.stats.q1)}–{formatValue(tooltip.state.data.stats.q3)}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
