import type { ReactNode } from "react";
import { VisualizationContainer, type BaseVisualizationProps } from "@zenith-visuals/core";

export interface ProgressRingProps extends BaseVisualizationProps {
  /** Current value. */
  value: number;
  /** Value representing a full ring. Default 100. */
  max?: number;
  /** Ring thickness in px. Default 14. */
  thickness?: number;
  /** Progress color. Defaults to the theme primary. */
  color?: string;
  /** Round the progress ends. Default true. */
  rounded?: boolean;
  /** Center content. Defaults to the rounded percentage. */
  centerLabel?: ReactNode;
  /** Small caption under the center label. */
  caption?: ReactNode;
  formatValue?: (fraction: number) => string;
}

/**
 * Progress ring — a single value drawn as a circular arc against a track, with
 * a center readout. Great for completion / utilization KPIs. Responsive and
 * SSR-safe.
 *
 * @example
 * <ProgressRing value={68} caption="Storage used" />
 */
export function ProgressRing(props: ProgressRingProps) {
  const {
    value,
    max = 100,
    thickness = 14,
    color,
    rounded = true,
    centerLabel,
    caption,
    formatValue = (f) => `${Math.round(f * 100)}%`,
    height = 220,
    ...base
  } = props;

  return (
    <VisualizationContainer {...base} height={height} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const cx = width / 2;
        const cy = h / 2;
        const t = Math.max(2, thickness);
        const radius = Math.max(10, Math.min(width, h) / 2 - t / 2 - 8);
        const frac = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
        const circumference = 2 * Math.PI * radius;
        const dash = frac * circumference;
        const stroke = color ?? theme.colors.primary;

        return (
          <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
            aria-label={base.labels?.ariaLabel ?? `Progress: ${formatValue(frac)}`}
            style={{ display: "block" }}>
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke={theme.colors.muted} strokeWidth={t} opacity={0.4} />
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={stroke}
              strokeWidth={t}
              strokeLinecap={rounded ? "round" : "butt"}
              strokeDasharray={`${dash.toFixed(2)} ${(circumference - dash).toFixed(2)}`}
              strokeDashoffset={0}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: "stroke-dasharray 240ms ease" }}
            />
            <text x={cx} y={caption != null ? cy - 4 : cy} textAnchor="middle" dominantBaseline="central"
              fontSize={theme.typography.fontSizeLg * 1.4} fontWeight={theme.typography.fontWeightBold}
              fontFamily={theme.typography.fontFamily} fill={theme.colors.text}>
              {typeof centerLabel === "string" || typeof centerLabel === "number"
                ? centerLabel
                : centerLabel == null
                  ? formatValue(frac)
                  : ""}
            </text>
            {caption != null && (
              <text x={cx} y={cy + radius * 0.32} textAnchor="middle" dominantBaseline="central"
                fontSize={theme.typography.fontSizeSm} fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>
                {typeof caption === "string" || typeof caption === "number" ? caption : ""}
              </text>
            )}
          </svg>
        );
      }}
    </VisualizationContainer>
  );
}
