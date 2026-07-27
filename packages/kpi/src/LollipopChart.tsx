import { useMemo, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
} from "@zenith-visuals/core";
import { bandScale, linearScale } from "@zenith-visuals/utils";
import { defaultFormat, niceTicks } from "@zenith-visuals/charts";
import type { KpiChartProps, ValueDatum } from "./types";

export interface LollipopChartProps extends KpiChartProps {
  /** Categories with a single value each. */
  data: readonly ValueDatum[];
  /** Sort rows by value. Default "none" (input order). */
  sort?: "asc" | "desc" | "none";
  /** Radius of the value dot. Default 6. */
  dotRadius?: number;
  /** Base color for stems/dots (per-item `color` overrides this). */
  color?: string;
  /** Show the numeric value beside each dot. Default true. */
  showValues?: boolean;
  onItemClick?: (datum: ValueDatum, index: number) => void;
  renderTooltip?: (datum: ValueDatum, index: number) => ReactNode;
}

/**
 * LollipopChart — a cleaner alternative to the bar chart: a thin stem from a
 * zero baseline topped with a dot. Reduces ink while preserving magnitude.
 * Horizontal, responsive, themed and SSR-safe.
 *
 * @example
 * <LollipopChart data={rows} sort="desc" />
 */
export function LollipopChart(props: LollipopChartProps) {
  const {
    data,
    sort = "none",
    dotRadius = 6,
    color,
    showValues = true,
    formatValue = defaultFormat,
    onItemClick,
    renderTooltip,
    height = 360,
    ...base
  } = props;

  const tooltip = useTooltip<{ d: ValueDatum; i: number }>();

  const rows = useMemo(() => {
    if (sort === "none") return data.slice();
    const sorted = data.slice().sort((a, b) => a.value - b.value);
    return sort === "desc" ? sorted.reverse() : sorted;
  }, [data, sort]);

  const { ticks, niceMin, niceMax } = useMemo(() => {
    const values = rows.map((d) => d.value);
    const lo = Math.min(0, ...values);
    const hi = Math.max(0, ...values);
    return niceTicks(lo, hi, 5, true);
  }, [rows]);

  return (
    <VisualizationContainer {...base} height={height} defaultHeight={height} isEmpty={data.length === 0}>
      {({ theme, width, height: h }) => {
        const pad = { top: 12, right: 48, bottom: 28, left: 110 };
        const plot = {
          x: pad.left,
          y: pad.top,
          w: Math.max(1, width - pad.left - pad.right),
          h: Math.max(1, h - pad.top - pad.bottom),
        };
        const x = linearScale([niceMin, niceMax], [plot.x, plot.x + plot.w], true);
        const yBand = bandScale(
          rows.map((d) => d.label),
          [plot.y, plot.y + plot.h],
          0.4,
        );
        const baseX = x(0);

        return (
          <>
            <svg
              width={width}
              height={h}
              viewBox={`0 0 ${width} ${h}`}
              role="img"
              aria-label={base.labels?.ariaLabel ?? "Lollipop chart"}
              style={{ display: "block" }}
            >
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={x(t)} x2={x(t)} y1={plot.y} y2={plot.y + plot.h} stroke={theme.colors.border} strokeOpacity={0.5} />
                  <text x={x(t)} y={plot.y + plot.h + 16} textAnchor="middle" fill={theme.colors.textMuted}
                    fontFamily={theme.typography.fontFamily} fontSize={theme.typography.fontSizeSm}>
                    {formatValue(t)}
                  </text>
                </g>
              ))}

              {rows.map((d, i) => {
                const cy = yBand(d.label) + yBand.bandwidth / 2;
                const cx = x(d.value);
                const fill = d.color ?? color ?? theme.colors.primary;
                return (
                  <g
                    key={d.label}
                    style={{ cursor: onItemClick ? "pointer" : "default" }}
                    onClick={() => onItemClick?.(d, i)}
                    onMouseEnter={(e) => tooltip.show({ d, i }, e)}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => tooltip.hide()}
                  >
                    <text x={plot.x - 12} y={cy} textAnchor="end" dominantBaseline="middle"
                      fill={theme.colors.text} fontFamily={theme.typography.fontFamily}
                      fontSize={theme.typography.fontSizeSm}>
                      {d.label}
                    </text>
                    <line x1={baseX} x2={cx} y1={cy} y2={cy} stroke={fill} strokeWidth={2} strokeOpacity={0.55} />
                    <circle cx={cx} cy={cy} r={dotRadius} fill={fill} />
                    {showValues && (
                      <text
                        x={cx + (d.value >= 0 ? dotRadius + 6 : -(dotRadius + 6))}
                        y={cy}
                        textAnchor={d.value >= 0 ? "start" : "end"}
                        dominantBaseline="middle"
                        fill={theme.colors.textMuted}
                        fontFamily={theme.typography.fontFamily}
                        fontSize={theme.typography.fontSizeSm}
                      >
                        {formatValue(d.value)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data.d, tooltip.state.data.i) ?? (
                  <span>
                    <strong>{tooltip.state.data.d.label}</strong>: {formatValue(tooltip.state.data.d.value)}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
