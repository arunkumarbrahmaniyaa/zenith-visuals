import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { defaultFormat } from "./lib/ticks";
import { seriesColor } from "./lib/series";
import { Legend } from "./components/Legend";
import { computeWaffle, type WaffleDatum } from "./lib/radial";

export interface WaffleChartProps extends BaseVisualizationProps {
  data: readonly WaffleDatum[];
  /** Grid rows. Default 10. */
  rows?: number;
  /** Grid columns. Default 10. */
  cols?: number;
  /** Gap between cells in px. Default 3. */
  gap?: number;
  /** Corner radius of each cell in px. Default 2. */
  cellRadius?: number;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
  onCellClick?: (datum: WaffleDatum, index: number) => void;
  renderTooltip?: (datum: WaffleDatum, percent: number) => ReactNode;
}

/**
 * Waffle chart — a `rows × cols` grid of cells allocated across categories to
 * show parts of a whole (each cell ≈ `100 / (rows·cols)` %). Cells are assigned
 * with the largest-remainder method. Responsive and SSR-safe.
 *
 * @example
 * <WaffleChart data={[{ label: "Done", value: 68 }, { label: "Left", value: 32 }]} />
 */
export function WaffleChart(props: WaffleChartProps) {
  const {
    data,
    rows = 10,
    cols = 10,
    gap = 3,
    cellRadius = 2,
    showLegend = true,
    formatValue = defaultFormat,
    onCellClick,
    renderTooltip,
    height = 320,
    ...base
  } = props;

  const tooltip = useTooltip<{ datum: WaffleDatum; percent: number }>();
  const [hover, setHover] = useState<number | null>(null);

  return (
    <VisualizationContainer {...base} height={height} isEmpty={data.length === 0} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const { cells, total } = computeWaffle(data, rows, cols);
        const colorFor = (di: number) => data[di]?.color ?? seriesColor(theme, data[di] ?? {}, di);
        const size = Math.min((width - (cols - 1) * gap) / cols, (h - (rows - 1) * gap) / rows);
        const gridW = cols * size + (cols - 1) * gap;
        const gridH = rows * size + (rows - 1) * gap;
        const ox = (width - gridW) / 2;
        const oy = (h - gridH) / 2;

        return (
          <>
            {showLegend && (
              <Legend theme={theme} items={data.map((d, i) => ({ label: d.label, color: d.color ?? seriesColor(theme, d, i) }))} />
            )}
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Waffle chart"} style={{ display: "block" }}>
              {cells.map((c) => {
                const x = ox + c.col * (size + gap);
                const y = oy + c.row * (size + gap);
                const filled = c.datumIndex >= 0;
                const fill = filled ? colorFor(c.datumIndex) : theme.colors.muted;
                const active = filled && hover === c.datumIndex;
                const datum = filled ? data[c.datumIndex]! : null;
                return (
                  <rect
                    key={c.index}
                    x={x}
                    y={y}
                    width={size}
                    height={size}
                    rx={cellRadius}
                    fill={fill}
                    fillOpacity={filled ? (active ? 1 : 0.9) : 0.35}
                    style={{ cursor: filled && onCellClick ? "pointer" : "default" }}
                    onMouseEnter={(e) => {
                      if (!datum) return;
                      setHover(c.datumIndex);
                      tooltip.show({ datum, percent: total > 0 ? Math.max(0, datum.value) / total : 0 }, e);
                    }}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => {
                      setHover(null);
                      tooltip.hide();
                    }}
                    onClick={() => datum && onCellClick?.(datum, c.datumIndex)}
                  />
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data.datum, tooltip.state.data.percent) ?? (
                  <span>
                    <strong>{tooltip.state.data.datum.label}</strong>
                    <br />
                    {formatValue(tooltip.state.data.datum.value)} ({(tooltip.state.data.percent * 100).toFixed(1)}%)
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
