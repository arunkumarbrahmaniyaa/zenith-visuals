import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { readableTextColor } from "@zenith-visuals/utils";
import type { CategoryDatum } from "./types";
import { defaultFormat } from "./lib/ticks";
import { seriesColor } from "./lib/series";

export interface FunnelChartProps extends BaseVisualizationProps {
  /** Stages ordered from widest (top) to narrowest (bottom). */
  data: readonly CategoryDatum[];
  /** Gap between stages in px. Default 4. */
  gap?: number;
  /** Show conversion percentage vs. the first stage. Default true. */
  showConversion?: boolean;
  formatValue?: (value: number) => string;
  onStageClick?: (datum: CategoryDatum, index: number) => void;
  renderTooltip?: (datum: CategoryDatum, conversion: number) => ReactNode;
}

/**
 * Funnel chart visualizing stage-by-stage drop-off (e.g. a sales or signup
 * pipeline). Each stage width encodes its value. Responsive and SSR-safe.
 *
 * @example
 * <FunnelChart data={[{ label: "Visits", value: 1000 }, { label: "Signups", value: 240 }]} />
 */
export function FunnelChart(props: FunnelChartProps) {
  const {
    data,
    gap = 4,
    showConversion = true,
    formatValue = defaultFormat,
    onStageClick,
    renderTooltip,
    height = 320,
    ...base
  } = props;

  const tooltip = useTooltip<{ datum: CategoryDatum; conversion: number }>();
  const [hover, setHover] = useState<number | null>(null);

  return (
    <VisualizationContainer {...base} height={height} isEmpty={data.length === 0} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const first = data[0]?.value ?? 1;
        const maxValue = Math.max(1, ...data.map((d) => d.value));
        const padX = 16;
        const usableW = width - padX * 2;
        const rowH = (h - gap * (data.length - 1)) / Math.max(1, data.length);

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Funnel chart"} style={{ display: "block" }}>
              {data.map((d, i) => {
                const next = data[i + 1];
                const topW = (d.value / maxValue) * usableW;
                const bottomW = ((next?.value ?? d.value) / maxValue) * usableW;
                const y = i * (rowH + gap);
                const color = d.color ?? seriesColor(theme, d, i);
                const cx = width / 2;
                const tl = cx - topW / 2;
                const tr = cx + topW / 2;
                const bl = cx - bottomW / 2;
                const br = cx + bottomW / 2;
                const conversion = first > 0 ? d.value / first : 0;
                const active = hover === i;
                return (
                  <g key={d.label}
                    onMouseEnter={(e) => {
                      setHover(i);
                      tooltip.show({ datum: d, conversion }, e);
                    }}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => {
                      setHover(null);
                      tooltip.hide();
                    }}
                    onClick={() => onStageClick?.(d, i)}
                    style={{ cursor: onStageClick ? "pointer" : "default" }}>
                    <polygon points={`${tl},${y} ${tr},${y} ${br},${y + rowH} ${bl},${y + rowH}`}
                      fill={color} opacity={active ? 1 : 0.9} />
                    <text x={cx} y={y + rowH / 2} textAnchor="middle" dominantBaseline="central"
                      fontSize={theme.typography.fontSize} fontWeight={theme.typography.fontWeightBold}
                      fill={readableTextColor(color)} pointerEvents="none">
                      {d.label}: {formatValue(d.value)}
                      {showConversion && i > 0 ? ` (${(conversion * 100).toFixed(0)}%)` : ""}
                    </text>
                  </g>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data.datum, tooltip.state.data.conversion) ?? (
                  <span>
                    <strong>{tooltip.state.data.datum.label}</strong>
                    <br />
                    {formatValue(tooltip.state.data.datum.value)} · {(tooltip.state.data.conversion * 100).toFixed(1)}%
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
