import type { ReactNode } from "react";
import { VisualizationContainer, type BaseVisualizationProps } from "@zenith-visuals/core";
import { defaultFormat } from "./lib/ticks";
import { arcPath } from "./lib/paths";

export interface SolidGaugeChartProps extends BaseVisualizationProps {
  /** Current value. */
  value: number;
  /** Domain minimum. Default 0. */
  min?: number;
  /** Domain maximum. Default 100. */
  max?: number;
  /** Arc sweep in degrees (e.g. 270 for a ¾ dial, 180 for a semicircle). Default 270. */
  sweep?: number;
  /** Ring thickness as a fraction of the radius. Default 0.28. */
  thickness?: number;
  /** Fill color. Defaults to the theme primary, or a threshold color. */
  color?: string;
  /** Optional colored thresholds `[fraction 0..1, color]`, ascending. */
  thresholds?: readonly [number, string][];
  /** Unit or label shown under the value. */
  unit?: ReactNode;
  formatValue?: (value: number) => string;
}

/**
 * Solid gauge — a value shown as a rounded, thick arc fill against a track
 * (no needle). Cleaner than a dial for progress-style KPIs. Responsive and
 * SSR-safe.
 *
 * @example
 * <SolidGaugeChart value={72} max={100} unit="% complete" />
 */
export function SolidGaugeChart(props: SolidGaugeChartProps) {
  const {
    value,
    min = 0,
    max = 100,
    sweep = 270,
    thickness = 0.28,
    color,
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
        const cy = h / 2 + radius * (sweep >= 300 ? 0 : 0.2);
        const t = Math.max(0.05, Math.min(0.6, thickness));
        const inner = radius * (1 - t);
        const sweepRad = (sweep * Math.PI) / 180;
        const startAngle = -sweepRad / 2;
        const frac = max <= min ? 0 : Math.max(0, Math.min(1, (value - min) / (max - min)));
        const valueAngle = startAngle + frac * sweepRad;

        const fillColor = (() => {
          if (color) return color;
          if (thresholds && thresholds.length > 0) {
            let c = thresholds[0]?.[1] ?? theme.colors.primary;
            for (const [th, col] of thresholds) if (frac >= th) c = col;
            return c;
          }
          return theme.colors.primary;
        })();

        return (
          <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
            aria-label={base.labels?.ariaLabel ?? `Solid gauge: ${formatValue(value)}`}
            style={{ display: "block" }}>
            <path d={arcPath(cx, cy, inner, radius, startAngle, startAngle + sweepRad)}
              fill={theme.colors.muted} opacity={0.4} />
            {frac > 0 && (
              <path d={arcPath(cx, cy, inner, radius, startAngle, Math.max(startAngle + 0.001, valueAngle))}
                fill={fillColor} />
            )}
            <text x={cx} y={cy - radius * 0.05} textAnchor="middle" dominantBaseline="central"
              fontSize={theme.typography.fontSizeLg * 1.5} fontWeight={theme.typography.fontWeightBold}
              fontFamily={theme.typography.fontFamily} fill={theme.colors.text}>
              {formatValue(value)}
            </text>
            {unit != null && (
              <text x={cx} y={cy + radius * 0.22} textAnchor="middle" fontSize={theme.typography.fontSizeSm}
                fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>
                {typeof unit === "string" || typeof unit === "number" ? unit : ""}
              </text>
            )}
          </svg>
        );
      }}
    </VisualizationContainer>
  );
}
