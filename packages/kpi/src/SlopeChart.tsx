import { useMemo, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
} from "@zenith-visuals/core";
import { linearScale } from "@zenith-visuals/utils";
import { defaultFormat } from "@zenith-visuals/charts";
import type { KpiChartProps, PairedDatum } from "./types";
import { valueExtent } from "./lib/kpi";

export interface SlopeChartProps extends KpiChartProps {
  /** Categories, each with a `start` and `end` value. */
  data: readonly PairedDatum[];
  /** Heading for the left (start) axis. */
  startLabel?: string;
  /** Heading for the right (end) axis. */
  endLabel?: string;
  /**
   * Optional per-category color palette. When omitted, lines are colored by
   * direction (rising = success, falling = danger, flat = muted).
   */
  colors?: readonly string[];
  /** Show the numeric value beside each endpoint. Default true. */
  showValues?: boolean;
  onPointClick?: (datum: PairedDatum, index: number) => void;
  renderTooltip?: (datum: PairedDatum, index: number) => ReactNode;
}

/**
 * SlopeChart — a slope graph (a.k.a. slopegraph) connecting each category's
 * value at two points in time with a single line, making rank and magnitude
 * changes obvious at a glance. Responsive, themed and SSR-safe.
 *
 * @example
 * <SlopeChart data={rows} startLabel="2023" endLabel="2024" />
 */
export function SlopeChart(props: SlopeChartProps) {
  const {
    data,
    startLabel = "Before",
    endLabel = "After",
    colors,
    showValues = true,
    formatValue = defaultFormat,
    onPointClick,
    renderTooltip,
    height = 360,
    ...base
  } = props;

  const tooltip = useTooltip<{ d: PairedDatum; i: number }>();
  const [vMin, vMax] = useMemo(
    () => valueExtent(data, (d) => d.start, (d) => d.end),
    [data],
  );

  return (
    <VisualizationContainer {...base} height={height} defaultHeight={height} isEmpty={data.length === 0}>
      {({ theme, width, height: h }) => {
        const pad = { top: 28, right: 120, bottom: 16, left: 120 };
        const leftX = pad.left;
        const rightX = Math.max(leftX + 40, width - pad.right);
        const plotTop = pad.top;
        const plotBottom = Math.max(plotTop + 1, h - pad.bottom);
        const y = linearScale([vMin, vMax], [plotBottom, plotTop], true);

        const colorFor = (d: PairedDatum, i: number): string => {
          if (colors && colors.length > 0) return colors[i % colors.length]!;
          if (d.end > d.start) return theme.colors.success;
          if (d.end < d.start) return theme.colors.danger;
          return theme.colors.textMuted;
        };

        return (
          <>
            <svg
              width={width}
              height={h}
              viewBox={`0 0 ${width} ${h}`}
              role="img"
              aria-label={base.labels?.ariaLabel ?? `Slope chart from ${startLabel} to ${endLabel}`}
              style={{ display: "block" }}
            >
              {/* Axis rails */}
              <line x1={leftX} x2={leftX} y1={plotTop} y2={plotBottom} stroke={theme.colors.border} />
              <line x1={rightX} x2={rightX} y1={plotTop} y2={plotBottom} stroke={theme.colors.border} />

              {/* Axis headings */}
              <text x={leftX} y={plotTop - 12} textAnchor="middle" fill={theme.colors.textMuted}
                fontFamily={theme.typography.fontFamily} fontSize={theme.typography.fontSizeSm}
                fontWeight={theme.typography.fontWeightBold}>
                {startLabel}
              </text>
              <text x={rightX} y={plotTop - 12} textAnchor="middle" fill={theme.colors.textMuted}
                fontFamily={theme.typography.fontFamily} fontSize={theme.typography.fontSizeSm}
                fontWeight={theme.typography.fontWeightBold}>
                {endLabel}
              </text>

              {data.map((d, i) => {
                const color = colorFor(d, i);
                const y0 = y(d.start);
                const y1 = y(d.end);
                return (
                  <g
                    key={i}
                    style={{ cursor: onPointClick ? "pointer" : "default" }}
                    onClick={() => onPointClick?.(d, i)}
                    onMouseEnter={(e) => tooltip.show({ d, i }, e)}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => tooltip.hide()}
                  >
                    <line x1={leftX} y1={y0} x2={rightX} y2={y1} stroke={color} strokeWidth={2} />
                    <circle cx={leftX} cy={y0} r={4} fill={color} />
                    <circle cx={rightX} cy={y1} r={4} fill={color} />

                    <text x={leftX - 10} y={y0} textAnchor="end" dominantBaseline="middle"
                      fill={theme.colors.text} fontFamily={theme.typography.fontFamily}
                      fontSize={theme.typography.fontSizeSm}>
                      {d.label}
                      {showValues && (
                        <tspan fill={theme.colors.textMuted}>{"  "}{formatValue(d.start)}</tspan>
                      )}
                    </text>
                    <text x={rightX + 10} y={y1} textAnchor="start" dominantBaseline="middle"
                      fill={theme.colors.text} fontFamily={theme.typography.fontFamily}
                      fontSize={theme.typography.fontSizeSm}>
                      {showValues && (
                        <tspan fill={theme.colors.textMuted}>{formatValue(d.end)}{"  "}</tspan>
                      )}
                      {d.label}
                    </text>
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
