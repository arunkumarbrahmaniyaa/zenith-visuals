import {
  VisualizationContainer,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { sequentialScale, formatNumber } from "@zenith-visuals/utils";
import { bandPosition } from "./lib/kpi";

/** A qualitative zone within the band, starting at `from` (in value units). */
export interface BandZone {
  from: number;
  label?: string;
  color?: string;
}

export interface GradientBandProps extends BaseVisualizationProps {
  /** The measured value; a pointer marks its position on the band. */
  value: number;
  /** Range minimum (left edge). */
  min: number;
  /** Range maximum (right edge). */
  max: number;
  /** Optional target/reference value drawn as a dashed marker. */
  target?: number;
  /**
   * Qualitative zones. When provided the band is drawn as discrete colored
   * segments instead of a continuous gradient.
   */
  zones?: readonly BandZone[];
  /** Color ramp for the continuous gradient. Defaults to the theme ramp. */
  colors?: readonly string[];
  /** Band thickness in px. Default 14. */
  thickness?: number;
  formatValue?: (value: number) => string;
  /** Optional caption rendered above the band. */
  label?: string;
}

/**
 * GradientBand — a range/gradient band showing where a value sits between a
 * `min` and `max`, over a continuous color gradient or discrete qualitative
 * zones, with an optional target marker. Responsive, themeable and SSR-safe.
 *
 * @example
 * <GradientBand value={72} min={0} max={100} target={80} label="Health score" />
 */
export function GradientBand(props: GradientBandProps) {
  const {
    value,
    min,
    max,
    target,
    zones,
    colors,
    thickness = 14,
    formatValue = (v: number) => formatNumber(v),
    label,
    height = 96,
    ...base
  } = props;

  return (
    <VisualizationContainer {...base} height={height} isEmpty={max <= min} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const ramp = sequentialScale(colors ?? theme.sequential);
        const padX = 12;
        const bandW = Math.max(1, width - padX * 2);
        const bandY = h / 2 - thickness / 2 + 6;
        const xOf = (v: number) => padX + bandPosition(v, min, max) * bandW;
        const valueX = xOf(value);

        const sortedZones = zones ? [...zones].sort((a, b) => a.from - b.from) : null;

        return (
          <svg
            width={width}
            height={h}
            viewBox={`0 0 ${width} ${h}`}
            role="img"
            aria-label={base.labels?.ariaLabel ?? `${label ?? "Value"}: ${formatValue(value)}`}
            style={{ display: "block" }}
          >
            {label && (
              <text x={padX} y={16} fontFamily={theme.typography.fontFamily} fontSize={theme.typography.fontSizeSm} fill={theme.colors.textMuted}>
                {label}
              </text>
            )}

            <defs>
              <linearGradient id="zv-gradient-band" x1="0" y1="0" x2="1" y2="0">
                {Array.from({ length: 9 }, (_, i) => {
                  const t = i / 8;
                  return <stop key={i} offset={`${t * 100}%`} stopColor={ramp(t)} />;
                })}
              </linearGradient>
            </defs>

            {sortedZones ? (
              sortedZones.map((zone, i) => {
                const zStart = xOf(zone.from);
                const next = sortedZones[i + 1];
                const zEnd = next ? xOf(next.from) : padX + bandW;
                const t = sortedZones.length > 1 ? i / (sortedZones.length - 1) : 0;
                return (
                  <rect
                    key={i}
                    x={zStart}
                    y={bandY}
                    width={Math.max(0, zEnd - zStart)}
                    height={thickness}
                    fill={zone.color ?? ramp(t)}
                    rx={i === 0 || i === sortedZones.length - 1 ? thickness / 2 : 0}
                  />
                );
              })
            ) : (
              <rect x={padX} y={bandY} width={bandW} height={thickness} rx={thickness / 2} fill="url(#zv-gradient-band)" />
            )}

            {/* Target marker */}
            {target !== undefined && (
              <line
                x1={xOf(target)}
                y1={bandY - 5}
                x2={xOf(target)}
                y2={bandY + thickness + 5}
                stroke={theme.colors.text}
                strokeWidth={2}
                strokeDasharray="3 2"
              />
            )}

            {/* Value pointer */}
            <g>
              <path
                d={`M${valueX - 5},${bandY - 8} L${valueX + 5},${bandY - 8} L${valueX},${bandY - 1} Z`}
                fill={theme.colors.text}
              />
              <line x1={valueX} y1={bandY - 2} x2={valueX} y2={bandY + thickness + 2} stroke={theme.colors.text} strokeWidth={2} />
              <text
                x={Math.max(padX, Math.min(padX + bandW, valueX))}
                y={bandY + thickness + 18}
                textAnchor="middle"
                fontFamily={theme.typography.fontFamily}
                fontSize={theme.typography.fontSizeSm}
                fontWeight={theme.typography.fontWeightBold}
                fill={theme.colors.text}
              >
                {formatValue(value)}
              </text>
            </g>

            {/* End labels */}
            <text x={padX} y={bandY - 6} fontFamily={theme.typography.fontFamily} fontSize={theme.typography.fontSizeSm} fill={theme.colors.textMuted}>
              {formatValue(min)}
            </text>
            <text x={padX + bandW} y={bandY - 6} textAnchor="end" fontFamily={theme.typography.fontFamily} fontSize={theme.typography.fontSizeSm} fill={theme.colors.textMuted}>
              {formatValue(max)}
            </text>
          </svg>
        );
      }}
    </VisualizationContainer>
  );
}
