import type { ReactNode } from "react";
import { VisualizationContainer, type BaseVisualizationProps } from "@zenith-visuals/core";
import { defaultFormat } from "./lib/ticks";
import { arcPath, polar } from "./lib/paths";

export interface GaugeChartProps extends BaseVisualizationProps {
  /** Current value. */
  value: number;
  /** Domain minimum. Default 0. */
  min?: number;
  /** Domain maximum. Default 100. */
  max?: number;
  /** Arc sweep in degrees (e.g. 270 for a ¾ dial). Default 270. */
  sweep?: number;
  /** Optional colored thresholds `[fraction 0..1, color]`, ascending. */
  thresholds?: readonly [number, string][];
  /** Unit or label shown under the value. */
  unit?: ReactNode;
  formatValue?: (value: number) => string;
}

/**
 * Gauge / dial chart showing a single value within a range, with an optional
 * colored threshold arc and center readout. Responsive and SSR-safe.
 *
 * @example
 * <GaugeChart value={72} max={100} unit="% CPU" />
 */
export function GaugeChart(props: GaugeChartProps) {
  const {
    value,
    min = 0,
    max = 100,
    sweep = 270,
    thresholds,
    unit,
    formatValue = defaultFormat,
    height = 260,
    ...base
  } = props;

  return (
    <VisualizationContainer {...base} height={height} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const cx = width / 2;
        const radius = Math.max(20, Math.min(width, h) / 2 - 16);
        const cy = h / 2 + radius * 0.25;
        const inner = radius * 0.7;
        const sweepRad = (sweep * Math.PI) / 180;
        const startAngle = -sweepRad / 2;
        const frac = max <= min ? 0 : Math.max(0, Math.min(1, (value - min) / (max - min)));
        const valueAngle = startAngle + frac * sweepRad;

        const activeColor = (() => {
          if (!thresholds || thresholds.length === 0) return theme.colors.primary;
          let color = thresholds[0]?.[1] ?? theme.colors.primary;
          for (const [t, c] of thresholds) if (frac >= t) color = c;
          return color;
        })();

        const needle = polar(cx, cy, inner + (radius - inner) / 2, valueAngle);

        return (
          <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
            aria-label={base.labels?.ariaLabel ?? `Gauge: ${formatValue(value)}`} style={{ display: "block" }}>
            <path d={arcPath(cx, cy, inner, radius, startAngle, startAngle + sweepRad)} fill={theme.colors.muted} opacity={0.5} />
            {thresholds && thresholds.length > 0
              ? thresholds.map(([t, c], i) => {
                  const next = thresholds[i + 1]?.[0] ?? 1;
                  const a0 = startAngle + t * sweepRad;
                  const a1 = startAngle + Math.min(frac, next) * sweepRad;
                  if (frac <= t) return null;
                  return <path key={i} d={arcPath(cx, cy, inner, radius, a0, a1)} fill={c} />;
                })
              : (
                <path d={arcPath(cx, cy, inner, radius, startAngle, valueAngle)} fill={activeColor} />
              )}
            <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke={theme.colors.text} strokeWidth={3} strokeLinecap="round" />
            <circle cx={cx} cy={cy} r={5} fill={theme.colors.text} />
            <text x={cx} y={cy - radius * 0.15} textAnchor="middle" fontSize={theme.typography.fontSizeLg * 1.4}
              fontWeight={theme.typography.fontWeightBold} fontFamily={theme.typography.fontFamily} fill={theme.colors.text}>
              {formatValue(value)}
            </text>
            {unit != null && (
              <text x={cx} y={cy + 4} textAnchor="middle" fontSize={theme.typography.fontSizeSm}
                fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>
                {typeof unit === "string" ? unit : ""}
              </text>
            )}
          </svg>
        );
      }}
    </VisualizationContainer>
  );
}
