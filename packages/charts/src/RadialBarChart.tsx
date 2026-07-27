import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import type { CategoryDatum } from "./types";
import { defaultFormat } from "./lib/ticks";
import { arcPath } from "./lib/paths";
import { seriesColor } from "./lib/series";
import { Legend } from "./components/Legend";

export interface RadialBarChartProps extends BaseVisualizationProps {
  data: readonly CategoryDatum[];
  /** Max value for a full ring. Defaults to the largest datum value. */
  maxValue?: number;
  /** Track thickness in px. Auto-computed when omitted. */
  barThickness?: number;
  /** Gap between rings in px. Default 6. */
  gap?: number;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
  onBarClick?: (datum: CategoryDatum, index: number) => void;
  renderTooltip?: (datum: CategoryDatum) => ReactNode;
}

/**
 * Radial (concentric) bar chart — each category is a ring whose sweep encodes
 * its value. Great for progress dashboards. Responsive and SSR-safe.
 *
 * @example
 * <RadialBarChart data={[{ label: "CPU", value: 72 }, { label: "RAM", value: 40 }]} maxValue={100} />
 */
export function RadialBarChart(props: RadialBarChartProps) {
  const {
    data,
    maxValue,
    barThickness,
    gap = 6,
    showLegend = true,
    formatValue = defaultFormat,
    onBarClick,
    renderTooltip,
    height = 320,
    ...base
  } = props;

  const tooltip = useTooltip<CategoryDatum>();
  const [hover, setHover] = useState<number | null>(null);

  return (
    <VisualizationContainer {...base} height={height} isEmpty={data.length === 0} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const cx = width / 2;
        const cy = h / 2;
        const max = maxValue ?? Math.max(1, ...data.map((d) => d.value));
        const outer = Math.max(20, Math.min(width, h) / 2 - 8);
        const thickness = barThickness ?? Math.max(6, (outer - 20) / data.length - gap);

        return (
          <>
            {showLegend && (
              <Legend theme={theme} items={data.map((d, i) => ({ label: d.label, color: d.color ?? seriesColor(theme, d, i) }))} />
            )}
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Radial bar chart"} style={{ display: "block" }}>
              {data.map((d, i) => {
                const r1 = outer - i * (thickness + gap);
                const r0 = r1 - thickness;
                if (r0 <= 0) return null;
                const color = d.color ?? seriesColor(theme, d, i);
                const frac = Math.max(0, Math.min(1, d.value / max));
                const active = hover === i;
                return (
                  <g key={d.label}>
                    <path d={arcPath(cx, cy, r0, r1, 0, Math.PI * 2 - 0.0001)} fill={theme.colors.muted} opacity={0.5} />
                    <path
                      d={arcPath(cx, cy, r0, r1, 0, Math.max(0.0001, frac * Math.PI * 2 - 0.0001))}
                      fill={color}
                      opacity={active ? 1 : 0.9}
                      style={{ cursor: onBarClick ? "pointer" : "default" }}
                      onMouseEnter={(e) => {
                        setHover(i);
                        tooltip.show(d, e);
                      }}
                      onMouseMove={(e) => tooltip.move(e)}
                      onMouseLeave={() => {
                        setHover(null);
                        tooltip.hide();
                      }}
                      onClick={() => onBarClick?.(d, i)}
                    >
                      <title>{`${d.label}: ${formatValue(d.value)}`}</title>
                    </path>
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
