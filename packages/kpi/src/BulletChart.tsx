import { type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
} from "@zenith-visuals/core";
import { linearScale } from "@zenith-visuals/utils";
import { defaultFormat } from "@zenith-visuals/charts";
import type { KpiChartProps } from "./types";

export interface BulletChartProps extends KpiChartProps {
  /** The primary measured value (the featured bar). */
  measure: number;
  /** Comparative target; drawn as a vertical tick marker. */
  target?: number;
  /**
   * Ascending qualitative range thresholds (e.g. `[50, 80, 100]`) drawn as
   * graded background bands from `min`. The last value also sets `max` unless
   * `max` is provided explicitly.
   */
  ranges?: readonly number[];
  /** Axis minimum. Default 0. */
  min?: number;
  /** Axis maximum. Defaults to the largest of measure/target/ranges. */
  max?: number;
  /** Optional caption rendered to the left of the track. */
  label?: string;
  renderTooltip?: (info: { measure: number; target?: number }) => ReactNode;
}

/**
 * BulletChart — Stephen Few's bullet graph: a featured measure bar over graded
 * qualitative ranges with a comparative target marker. A space-efficient
 * gauge replacement. Responsive, themed and SSR-safe.
 *
 * @example
 * <BulletChart label="Revenue" measure={82} target={90} ranges={[50, 75, 100]} />
 */
export function BulletChart(props: BulletChartProps) {
  const {
    measure,
    target,
    ranges = [],
    min = 0,
    max,
    label,
    formatValue = defaultFormat,
    renderTooltip,
    height = 56,
    ...base
  } = props;

  const tooltip = useTooltip<{ measure: number; target?: number }>();

  const rangeMax = ranges.length > 0 ? ranges[ranges.length - 1]! : undefined;
  const domainMax = max ?? Math.max(measure, target ?? -Infinity, rangeMax ?? -Infinity, min + 1);

  return (
    <VisualizationContainer {...base} height={height} defaultHeight={height} isEmpty={false}>
      {({ theme, width, height: h }) => {
        const labelW = label ? Math.min(140, width * 0.28) : 0;
        const pad = { top: 8, right: 12, bottom: 8, left: 8 + labelW };
        const track = {
          x: pad.left,
          y: pad.top,
          w: Math.max(1, width - pad.left - pad.right),
          h: Math.max(1, h - pad.top - pad.bottom),
        };
        const x = linearScale([min, domainMax], [track.x, track.x + track.w], true);
        const measureH = track.h * 0.4;
        const measureY = track.y + (track.h - measureH) / 2;
        const targetH = track.h * 0.8;

        // Graded background bands from min through each range threshold.
        const bandBounds = [min, ...ranges];
        const bands = bandBounds.slice(0, -1).map((lo, i) => {
          const hi = bandBounds[i + 1]!;
          const shade = 0.28 - (i / Math.max(1, ranges.length)) * 0.2;
          return { lo, hi, opacity: Math.max(0.06, shade) };
        });

        return (
          <>
            <svg
              width={width}
              height={h}
              viewBox={`0 0 ${width} ${h}`}
              role="img"
              aria-label={base.labels?.ariaLabel ?? `${label ?? "Bullet"}: ${formatValue(measure)}${target !== undefined ? ` of ${formatValue(target)}` : ""}`}
              style={{ display: "block" }}
            >
              {label && (
                <text
                  x={pad.left - 10}
                  y={track.y + track.h / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill={theme.colors.text}
                  fontFamily={theme.typography.fontFamily}
                  fontSize={theme.typography.fontSizeSm}
                  fontWeight={theme.typography.fontWeightBold}
                >
                  {label}
                </text>
              )}

              {bands.map((b, i) => (
                <rect
                  key={i}
                  x={x(b.lo)}
                  y={track.y}
                  width={Math.max(0, x(b.hi) - x(b.lo))}
                  height={track.h}
                  fill={theme.colors.text}
                  fillOpacity={b.opacity}
                  rx={theme.radii.sm}
                />
              ))}

              <rect
                x={x(min)}
                y={measureY}
                width={Math.max(0, x(measure) - x(min))}
                height={measureH}
                fill={theme.colors.primary}
                rx={theme.radii.sm}
                onMouseEnter={(e) => tooltip.show({ measure, target }, e)}
                onMouseMove={(e) => tooltip.move(e)}
                onMouseLeave={() => tooltip.hide()}
              />

              {target !== undefined && (
                <line
                  x1={x(target)}
                  x2={x(target)}
                  y1={track.y + (track.h - targetH) / 2}
                  y2={track.y + (track.h + targetH) / 2}
                  stroke={theme.colors.text}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              )}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data) ?? (
                  <span>
                    <strong>{formatValue(tooltip.state.data.measure)}</strong>
                    {tooltip.state.data.target !== undefined && (
                      <> / target {formatValue(tooltip.state.data.target)}</>
                    )}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
