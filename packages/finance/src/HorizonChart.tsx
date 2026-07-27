import { useMemo, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
} from "@zenith-visuals/core";
import { linearScale } from "@zenith-visuals/utils";
import { areaPath, defaultFormat, type XY } from "@zenith-visuals/charts";
import type { FinanceChartProps, OHLCDatum } from "./types";

export interface HorizonChartProps extends FinanceChartProps {
  /** Number of stacked color bands per side. Default 3. */
  bands?: number;
  /** Reference value; deviations are measured from here. Defaults to the mean close. */
  baseline?: number;
  /** Metric to plot from each bar. Default "close". */
  field?: "open" | "high" | "low" | "close";
  renderTooltip?: (datum: OHLCDatum, index: number) => ReactNode;
}

/**
 * Horizon chart — a compact area chart that folds positive and negative
 * deviations from a baseline into stacked, color-graded bands. Great for dense
 * time-series comparison in little vertical space. Responsive & SSR-safe.
 *
 * @example
 * <HorizonChart data={ohlc} bands={3} />
 */
export function HorizonChart(props: HorizonChartProps) {
  const {
    data,
    bands = 3,
    baseline,
    field = "close",
    formatValue = defaultFormat,
    upColor,
    downColor,
    renderTooltip,
    height = 160,
    ...base
  } = props;

  const tooltip = useTooltip<{ d: OHLCDatum; i: number }>();
  const values = useMemo(() => data.map((d) => d[field]), [data, field]);
  const ref = useMemo(() => {
    if (baseline !== undefined) return baseline;
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }, [baseline, values]);

  return (
    <VisualizationContainer {...base} height={height} isEmpty={data.length < 2} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const pad = { top: 6, right: 8, bottom: 6, left: 8 };
        const plot = {
          x: pad.left,
          y: pad.top,
          w: Math.max(1, width - pad.left - pad.right),
          h: Math.max(1, h - pad.top - pad.bottom),
        };
        const bottom = plot.y + plot.h;
        const devs = values.map((v) => v - ref);
        const maxAbs = Math.max(1e-9, ...devs.map((d) => Math.abs(d)));
        const bandHeight = maxAbs / bands;
        const xAt = linearScale([0, Math.max(1, data.length - 1)], [plot.x, plot.x + plot.w]);
        const up = upColor ?? theme.colors.success;
        const down = downColor ?? theme.colors.danger;

        const bandArea = (b: number, sign: 1 | -1): string => {
          const points: XY[] = devs.map((d, i) => {
            const mag = sign === 1 ? Math.max(0, d) : Math.max(0, -d);
            const clipped = Math.min(bandHeight, Math.max(0, mag - b * bandHeight));
            const y = bottom - (clipped / bandHeight) * plot.h;
            return { x: xAt(i), y };
          });
          return areaPath(points, bottom);
        };

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Horizon chart"} style={{ display: "block" }}>
              {Array.from({ length: bands }, (_, b) => (
                <path key={`p-${b}`} d={bandArea(b, 1)} fill={up} fillOpacity={(b + 1) / (bands + 0.5)} />
              ))}
              {Array.from({ length: bands }, (_, b) => (
                <path key={`n-${b}`} d={bandArea(b, -1)} fill={down} fillOpacity={(b + 1) / (bands + 0.5)} />
              ))}
              <line x1={plot.x} x2={plot.x + plot.w} y1={bottom} y2={bottom}
                stroke={theme.colors.border} strokeWidth={1} />
              {data.map((d, i) => (
                <rect key={i} x={xAt(i) - plot.w / data.length / 2} y={plot.y}
                  width={Math.max(1, plot.w / data.length)} height={plot.h} fill="transparent"
                  onMouseEnter={(e) => tooltip.show({ d, i }, e)}
                  onMouseMove={(e) => tooltip.move(e)}
                  onMouseLeave={() => tooltip.hide()} />
              ))}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data.d, tooltip.state.data.i) ?? (
                  <span>
                    <strong>{tooltip.state.data.d.label}</strong>: {formatValue(tooltip.state.data.d[field])}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
