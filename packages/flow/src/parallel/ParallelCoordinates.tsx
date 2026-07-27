import { useMemo, useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { extent } from "@zenith-visuals/utils";

export interface ParallelDimension {
  /** Property key on each record. */
  key: string;
  /** Axis label; defaults to `key`. */
  label?: string;
  /** Format a value for the axis ticks/tooltip. */
  format?: (value: number) => string;
}

export interface ParallelCoordinatesProps extends BaseVisualizationProps {
  /** Records to plot; each must have a numeric value for every dimension key. */
  data: readonly Record<string, number>[];
  /** Ordered axes. */
  dimensions: readonly ParallelDimension[];
  /** Optional category per record (index-aligned) used for line color. */
  categories?: readonly string[];
  /** Line opacity (0..1). Default 0.55. */
  lineOpacity?: number;
  onLineClick?: (record: Record<string, number>, index: number) => void;
  renderTooltip?: (record: Record<string, number>, index: number) => ReactNode;
}

/**
 * Parallel coordinates — compares many records across several numeric
 * dimensions. Each record is a polyline crossing one vertical axis per
 * dimension (independently normalized). Responsive and SSR-safe.
 *
 * @example
 * <ParallelCoordinates data={rows} dimensions={[{ key: "mpg" }, { key: "hp" }]} />
 */
export function ParallelCoordinates(props: ParallelCoordinatesProps) {
  const {
    data,
    dimensions,
    categories,
    lineOpacity = 0.55,
    onLineClick,
    renderTooltip,
    height = 340,
    ...base
  } = props;

  const tooltip = useTooltip<{ record: Record<string, number>; index: number }>();
  const [hover, setHover] = useState<number | null>(null);

  const domains = useMemo(
    () => dimensions.map((d) => extent(data, (r) => r[d.key] ?? 0)),
    [data, dimensions],
  );
  const categoryColors = useMemo(() => {
    if (!categories) return null;
    const distinct = Array.from(new Set(categories));
    return { distinct, indexOf: (c: string) => distinct.indexOf(c) };
  }, [categories]);

  const isEmpty = data.length === 0 || dimensions.length < 2;

  return (
    <VisualizationContainer {...base} height={height} isEmpty={isEmpty} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const pad = { top: 24, right: 40, bottom: 24, left: 44 };
        const plot = {
          x: pad.left,
          y: pad.top,
          w: Math.max(1, width - pad.left - pad.right),
          h: Math.max(1, h - pad.top - pad.bottom),
        };
        const axisX = (i: number) =>
          dimensions.length === 1 ? plot.x : plot.x + (i / (dimensions.length - 1)) * plot.w;
        const yFor = (dimIdx: number, value: number) => {
          const [min, max] = domains[dimIdx]!;
          if (max <= min) return plot.y + plot.h / 2;
          return plot.y + plot.h - ((value - min) / (max - min)) * plot.h;
        };
        const colorFor = (i: number) => {
          if (categoryColors && categories) {
            const idx = categoryColors.indexOf(categories[i] ?? "");
            return theme.palette[idx % theme.palette.length] ?? theme.colors.primary;
          }
          return theme.colors.primary;
        };
        const linePath = (r: Record<string, number>) =>
          dimensions
            .map((d, di) => `${di === 0 ? "M" : "L"}${axisX(di).toFixed(1)},${yFor(di, r[d.key] ?? 0).toFixed(1)}`)
            .join(" ");

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Parallel coordinates chart"} style={{ display: "block" }}>
              {data.map((r, i) => {
                const active = hover == null || hover === i;
                return (
                  <path key={i} d={linePath(r)} fill="none" stroke={colorFor(i)}
                    strokeWidth={hover === i ? 2.5 : 1.25} strokeOpacity={active ? lineOpacity : 0.06}
                    onMouseEnter={(e) => {
                      setHover(i);
                      tooltip.show({ record: r, index: i }, e);
                    }}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => {
                      setHover(null);
                      tooltip.hide();
                    }}
                    onClick={() => onLineClick?.(r, i)}
                    style={{ cursor: onLineClick ? "pointer" : "default" }} />
                );
              })}
              {dimensions.map((d, di) => {
                const x = axisX(di);
                const [min, max] = domains[di]!;
                const fmt = d.format ?? ((v: number) => String(Math.round(v * 100) / 100));
                return (
                  <g key={d.key} aria-hidden>
                    <line x1={x} x2={x} y1={plot.y} y2={plot.y + plot.h} stroke={theme.colors.border} strokeWidth={1} />
                    <text x={x} y={plot.y - 10} textAnchor="middle" fontSize={theme.typography.fontSizeSm}
                      fontWeight={theme.typography.fontWeightBold} fontFamily={theme.typography.fontFamily}
                      fill={theme.colors.text}>{d.label ?? d.key}</text>
                    <text x={x} y={plot.y - 1} textAnchor="middle" fontSize={theme.typography.fontSizeSm}
                      fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>{fmt(max)}</text>
                    <text x={x} y={plot.y + plot.h + 14} textAnchor="middle" fontSize={theme.typography.fontSizeSm}
                      fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>{fmt(min)}</text>
                  </g>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data.record, tooltip.state.data.index) ?? (
                  <span>
                    {categories && (
                      <>
                        <strong>{categories[tooltip.state.data.index]}</strong>
                        <br />
                      </>
                    )}
                    {dimensions.map((d) => (
                      <span key={d.key}>
                        {d.label ?? d.key}: {tooltip.state.data!.record[d.key] ?? 0}
                        <br />
                      </span>
                    ))}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
