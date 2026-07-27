import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import type { CategoryDatum } from "./types";
import { defaultFormat, niceTicks } from "./lib/ticks";
import { arcPath, polar } from "./lib/paths";
import { seriesColor } from "./lib/series";
import { Legend } from "./components/Legend";

export interface RoseChartProps extends BaseVisualizationProps {
  data: readonly CategoryDatum[];
  /** Gap between petals in radians. Default 0.02. */
  padAngle?: number;
  /**
   * Encode value by petal *area* (`true`, radius ∝ √value) rather than radius
   * (`false`). Area encoding is less misleading. Default true.
   */
  areaTrue?: boolean;
  /** Number of concentric grid rings. Default 4. */
  rings?: number;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
  onPetalClick?: (datum: CategoryDatum, index: number) => void;
  renderTooltip?: (datum: CategoryDatum) => ReactNode;
}

/**
 * Rose / Nightingale (polar area) chart — categories share equal angular
 * slices while the petal radius encodes each value. Responsive and SSR-safe.
 *
 * @example
 * <RoseChart data={[{ label: "Mon", value: 12 }, { label: "Tue", value: 30 }]} />
 */
export function RoseChart(props: RoseChartProps) {
  const {
    data,
    padAngle = 0.02,
    areaTrue = true,
    rings = 4,
    showLegend = true,
    formatValue = defaultFormat,
    onPetalClick,
    renderTooltip,
    height = 340,
    ...base
  } = props;

  const tooltip = useTooltip<CategoryDatum>();
  const [hover, setHover] = useState<number | null>(null);

  return (
    <VisualizationContainer {...base} height={height} isEmpty={data.length === 0} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const cx = width / 2;
        const cy = h / 2;
        const radius = Math.max(20, Math.min(width, h) / 2 - 24);
        const maxValue = Math.max(0, ...data.map((d) => d.value));
        const { niceMax, ticks } = niceTicks(0, maxValue, rings, true);
        const scale = (v: number) => {
          if (niceMax <= 0) return 0;
          const frac = Math.max(0, v) / niceMax;
          return (areaTrue ? Math.sqrt(frac) : frac) * radius;
        };
        const step = data.length > 0 ? (Math.PI * 2) / data.length : 0;

        return (
          <>
            {showLegend && (
              <Legend theme={theme} items={data.map((d, i) => ({ label: d.label, color: d.color ?? seriesColor(theme, d, i) }))} />
            )}
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Rose chart"} style={{ display: "block" }}>
              <g aria-hidden>
                {ticks.map((t) => {
                  const rr = scale(t);
                  if (rr <= 0) return null;
                  return <circle key={t} cx={cx} cy={cy} r={rr} fill="none" stroke={theme.colors.border} opacity={0.5} />;
                })}
              </g>
              {data.map((d, i) => {
                const start = i * step + padAngle / 2;
                const end = (i + 1) * step - padAngle / 2;
                const r = scale(d.value);
                const color = d.color ?? seriesColor(theme, d, i);
                const active = hover === i;
                const labelPos = polar(cx, cy, radius + 12, (start + end) / 2);
                return (
                  <g key={d.label}>
                    <path
                      d={arcPath(cx, cy, 0, Math.max(0.5, r), start, end)}
                      fill={color}
                      fillOpacity={active ? 1 : 0.85}
                      stroke={theme.colors.background}
                      strokeWidth={1}
                      style={{ cursor: onPetalClick ? "pointer" : "default" }}
                      onMouseEnter={(e) => {
                        setHover(i);
                        tooltip.show(d, e);
                      }}
                      onMouseMove={(e) => tooltip.move(e)}
                      onMouseLeave={() => {
                        setHover(null);
                        tooltip.hide();
                      }}
                      onClick={() => onPetalClick?.(d, i)}
                    >
                      <title>{`${d.label}: ${formatValue(d.value)}`}</title>
                    </path>
                    <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="central"
                      fontSize={theme.typography.fontSizeSm} fontFamily={theme.typography.fontFamily}
                      fill={theme.colors.textMuted} pointerEvents="none">
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data) ?? (
                  <span>
                    <strong>{tooltip.state.data.label}</strong>: {formatValue(tooltip.state.data.value)}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
