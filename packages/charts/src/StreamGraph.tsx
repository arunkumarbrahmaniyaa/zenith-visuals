import { useMemo, useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
} from "@zenith-visuals/core";
import { linearScale } from "@zenith-visuals/utils";
import type { CartesianChartProps } from "./types";
import { defaultFormat } from "./lib/ticks";
import { linePath, smoothPath, type XY } from "./lib/paths";
import { seriesColor } from "./lib/series";
import { Legend } from "./components/Legend";
import { computeStreamBands, type StreamOffset } from "./lib/transforms";

export interface StreamGraphProps extends CartesianChartProps {
  /** Stacking baseline: `"silhouette"` (centered river) or `"zero"` (stacked area). */
  offset?: StreamOffset;
  /** Smooth the flowing bands. Default true. */
  smooth?: boolean;
  renderTooltip?: (info: StreamTooltipInfo) => ReactNode;
}

interface StreamTooltipInfo {
  series: string;
  color: string;
}

/**
 * StreamGraph — a "ThemeRiver": stacked areas flowing around a central
 * baseline to show how category composition changes over an ordered axis.
 * Responsive, themed and SSR-safe.
 *
 * @example
 * <StreamGraph categories={weeks} series={topics} />
 */
export function StreamGraph(props: StreamGraphProps) {
  const {
    categories,
    series,
    offset = "silhouette",
    smooth = true,
    showLegend,
    formatValue = defaultFormat,
    renderTooltip,
    height = 320,
    ...base
  } = props;

  const tooltip = useTooltip<StreamTooltipInfo>();
  const [hover, setHover] = useState<string | null>(null);
  const legend = showLegend ?? series.length > 1;

  const { bands, min, max } = useMemo(
    () => computeStreamBands(series, categories.length, offset),
    [series, categories.length, offset],
  );

  return (
    <VisualizationContainer
      {...base}
      height={height}
      isEmpty={series.length === 0 || categories.length === 0}
      defaultHeight={height}
    >
      {({ theme, width, height: h }) => {
        const padding = { top: 12, right: 16, bottom: 28, left: 16 };
        const plot = {
          x: padding.left,
          y: padding.top,
          w: Math.max(1, width - padding.left - padding.right),
          h: Math.max(1, h - padding.top - padding.bottom),
        };
        const xAt = linearScale([0, Math.max(1, categories.length - 1)], [plot.x, plot.x + plot.w]);
        const yScale = linearScale([min, max], [plot.y + plot.h, plot.y]);

        const bandPath = (topPts: XY[], botPts: XY[]): string => {
          const top = smooth ? smoothPath(topPts) : linePath(topPts);
          const botReversed = [...botPts].reverse();
          const bot = smooth ? smoothPath(botReversed) : linePath(botReversed);
          return `${top} L${bot.slice(1)} Z`;
        };

        const legendNode = legend ? (
          <Legend theme={theme} items={series.map((s, i) => ({ label: s.name, color: seriesColor(theme, s, i) }))} />
        ) : null;

        return (
          <>
            {legendNode}
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Stream graph"} style={{ display: "block" }}>
              {categories.map((cat, ci) => (
                <text key={`${cat}-${ci}`} x={xAt(ci)} y={plot.y + plot.h + 16} textAnchor="middle"
                  fontSize={theme.typography.fontSizeSm} fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>
                  {ci % Math.ceil(categories.length / 12) === 0 ? cat : ""}
                </text>
              ))}

              {series.map((s, si) => {
                const seriesBands = bands[si]!;
                const topPts: XY[] = seriesBands.map((b, ci) => ({ x: xAt(ci), y: yScale(b.hi) }));
                const botPts: XY[] = seriesBands.map((b, ci) => ({ x: xAt(ci), y: yScale(b.lo) }));
                const color = seriesColor(theme, s, si);
                const dimmed = hover != null && hover !== s.name;
                return (
                  <path
                    key={s.name}
                    d={bandPath(topPts, botPts)}
                    fill={color}
                    opacity={dimmed ? 0.35 : 0.9}
                    stroke={theme.colors.surface}
                    strokeWidth={0.5}
                    onMouseEnter={(e) => {
                      setHover(s.name);
                      tooltip.show({ series: s.name, color }, e);
                    }}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => {
                      setHover(null);
                      tooltip.hide();
                    }}
                  >
                    <title>{s.name}</title>
                  </path>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data) ?? (
                  <span>
                    <strong>{tooltip.state.data.series}</strong>
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
