import { useMemo, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
} from "@zenith-visuals/core";
import { bandScale, linearScale } from "@zenith-visuals/utils";
import { defaultFormat, niceTicks } from "@zenith-visuals/charts";
import type { KpiChartProps, PairedDatum } from "./types";
import { valueExtent } from "./lib/kpi";

export interface DumbbellChartProps extends KpiChartProps {
  /** Categories, each with a `start` and `end` value. */
  data: readonly PairedDatum[];
  /** Legend label for the start dot. Default "Before". */
  startLabel?: string;
  /** Legend label for the end dot. Default "After". */
  endLabel?: string;
  /** Color of the start dot. Defaults to theme muted-text. */
  startColor?: string;
  /** Color of the end dot. Defaults to theme primary. */
  endColor?: string;
  /** Radius of each endpoint dot. Default 6. */
  dotRadius?: number;
  /** Show the start/end legend. Default true. */
  showLegend?: boolean;
  onRowClick?: (datum: PairedDatum, index: number) => void;
  renderTooltip?: (datum: PairedDatum, index: number) => ReactNode;
}

/**
 * DumbbellChart — a horizontal "dumbbell" (a.k.a. DNA / connected-dot) plot
 * showing the gap between two values per category. Ideal for before/after,
 * min/max or gender-gap comparisons. Responsive, themed and SSR-safe.
 *
 * @example
 * <DumbbellChart data={rows} startLabel="2023" endLabel="2024" />
 */
export function DumbbellChart(props: DumbbellChartProps) {
  const {
    data,
    startLabel = "Before",
    endLabel = "After",
    startColor,
    endColor,
    dotRadius = 6,
    showLegend = true,
    formatValue = defaultFormat,
    onRowClick,
    renderTooltip,
    height = 360,
    ...base
  } = props;

  const tooltip = useTooltip<{ d: PairedDatum; i: number }>();
  const [vMin, vMax] = useMemo(
    () => valueExtent(data, (d) => d.start, (d) => d.end),
    [data],
  );
  const { ticks, niceMin, niceMax } = useMemo(
    () => niceTicks(vMin, vMax, 5, false),
    [vMin, vMax],
  );

  return (
    <VisualizationContainer {...base} height={height} defaultHeight={height} isEmpty={data.length === 0}>
      {({ theme, width, height: h }) => {
        const legendH = showLegend ? 22 : 0;
        const pad = { top: 10 + legendH, right: 44, bottom: 28, left: 110 };
        const plot = {
          x: pad.left,
          y: pad.top,
          w: Math.max(1, width - pad.left - pad.right),
          h: Math.max(1, h - pad.top - pad.bottom),
        };
        const x = linearScale([niceMin, niceMax], [plot.x, plot.x + plot.w], true);
        const yBand = bandScale(
          data.map((d) => d.label),
          [plot.y, plot.y + plot.h],
          0.4,
        );
        const rowCenter = (i: number) => yBand(data[i]!.label) + yBand.bandwidth / 2;
        const sColor = startColor ?? theme.colors.textMuted;
        const eColor = endColor ?? theme.colors.primary;

        return (
          <>
            <svg
              width={width}
              height={h}
              viewBox={`0 0 ${width} ${h}`}
              role="img"
              aria-label={base.labels?.ariaLabel ?? "Dumbbell comparison chart"}
              style={{ display: "block" }}
            >
              {showLegend && (
                <g fontFamily={theme.typography.fontFamily} fontSize={theme.typography.fontSizeSm}>
                  <circle cx={plot.x + 6} cy={12} r={5} fill={sColor} />
                  <text x={plot.x + 16} y={12} dominantBaseline="middle" fill={theme.colors.text}>{startLabel}</text>
                  <circle cx={plot.x + 16 + startLabel.length * 7 + 18} cy={12} r={5} fill={eColor} />
                  <text x={plot.x + 16 + startLabel.length * 7 + 28} y={12} dominantBaseline="middle" fill={theme.colors.text}>{endLabel}</text>
                </g>
              )}

              {/* Vertical gridlines + value axis */}
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={x(t)} x2={x(t)} y1={plot.y} y2={plot.y + plot.h} stroke={theme.colors.border} strokeOpacity={0.5} />
                  <text x={x(t)} y={plot.y + plot.h + 16} textAnchor="middle" fill={theme.colors.textMuted}
                    fontFamily={theme.typography.fontFamily} fontSize={theme.typography.fontSizeSm}>
                    {formatValue(t)}
                  </text>
                </g>
              ))}

              {data.map((d, i) => {
                const cy = rowCenter(i);
                const x0 = x(d.start);
                const x1 = x(d.end);
                return (
                  <g
                    key={i}
                    style={{ cursor: onRowClick ? "pointer" : "default" }}
                    onClick={() => onRowClick?.(d, i)}
                    onMouseEnter={(e) => tooltip.show({ d, i }, e)}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => tooltip.hide()}
                  >
                    <text x={plot.x - 12} y={cy} textAnchor="end" dominantBaseline="middle"
                      fill={theme.colors.text} fontFamily={theme.typography.fontFamily}
                      fontSize={theme.typography.fontSizeSm}>
                      {d.label}
                    </text>
                    <line x1={x0} x2={x1} y1={cy} y2={cy} stroke={theme.colors.border} strokeWidth={3} strokeLinecap="round" />
                    <circle cx={x0} cy={cy} r={dotRadius} fill={sColor} />
                    <circle cx={x1} cy={cy} r={dotRadius} fill={eColor} />
                  </g>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data.d, tooltip.state.data.i) ?? (
                  <span>
                    <strong>{tooltip.state.data.d.label}</strong>: {formatValue(tooltip.state.data.d.start)} → {formatValue(tooltip.state.data.d.end)}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
