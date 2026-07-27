import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { sequentialScale, readableTextColor } from "@zenith-visuals/utils";
import { defaultFormat } from "./lib/ticks";
import { buildMatrix, type MatrixCell, type MatrixDatum } from "./lib/matrix";

export interface HeatmapMatrixProps extends BaseVisualizationProps {
  /** Sparse `{ row, col, value }` observations. Missing cells render empty. */
  data: readonly MatrixDatum[];
  /** Explicit row order (top → bottom). Defaults to first appearance. */
  rows?: readonly string[];
  /** Explicit column order (left → right). Defaults to first appearance. */
  cols?: readonly string[];
  /** Color ramp for the value scale. Defaults to the theme's sequential ramp. */
  colors?: readonly string[];
  /** Show the value inside each cell when it fits. Default true. */
  showValues?: boolean;
  /** Rounded cell corner radius in px. Default 2. */
  cellRadius?: number;
  formatValue?: (value: number) => string;
  onCellClick?: (cell: MatrixCell) => void;
  renderTooltip?: (cell: MatrixCell) => ReactNode;
}

const LABEL_GAP = 8;

/**
 * HeatmapMatrix — a categorical matrix heatmap. Rows × columns of cells are
 * colored on a sequential scale by value, with axis labels, an inline color
 * legend and tooltips. Responsive, themeable and SSR-safe.
 *
 * @example
 * <HeatmapMatrix data={[{ row: "Mon", col: "9am", value: 12 }]} />
 */
export function HeatmapMatrix(props: HeatmapMatrixProps) {
  const {
    data,
    rows,
    cols,
    colors,
    showValues = true,
    cellRadius = 2,
    formatValue = defaultFormat,
    onCellClick,
    renderTooltip,
    height = 340,
    ...base
  } = props;

  const tooltip = useTooltip<MatrixCell>();
  const [hover, setHover] = useState<string | null>(null);

  const layoutOptions: { rows?: readonly string[]; cols?: readonly string[] } = {};
  if (rows) layoutOptions.rows = rows;
  if (cols) layoutOptions.cols = cols;
  const matrix = buildMatrix(data, layoutOptions);

  return (
    <VisualizationContainer
      {...base}
      height={height}
      isEmpty={matrix.rows.length === 0 || matrix.cols.length === 0}
      defaultHeight={height}
    >
      {({ theme, width, height: h }) => {
        const ramp = sequentialScale(colors ?? theme.sequential);
        const span = matrix.max - matrix.min || 1;

        // Measure the label gutters from the longest strings (approximate).
        const rowLabelW = Math.min(
          140,
          Math.max(24, ...matrix.rows.map((r) => r.length * 7 + LABEL_GAP)),
        );
        const colLabelH = 22;
        const legendH = 26;

        const gridX = rowLabelW;
        const gridY = colLabelH;
        const gridW = Math.max(1, width - rowLabelW);
        const gridH = Math.max(1, h - colLabelH - legendH);
        const cellW = gridW / matrix.cols.length;
        const cellH = gridH / matrix.rows.length;
        const pad = 1.5;

        const color = (v: number) => ramp((v - matrix.min) / span);

        return (
          <>
            <svg
              width={width}
              height={h}
              viewBox={`0 0 ${width} ${h}`}
              role="img"
              aria-label={base.labels?.ariaLabel ?? "Heatmap matrix"}
              style={{ display: "block" }}
            >
              {/* Column labels */}
              <g aria-hidden fontFamily={theme.typography.fontFamily} fontSize={theme.typography.fontSizeSm} fill={theme.colors.textMuted}>
                {matrix.cols.map((c, i) => (
                  <text key={c} x={gridX + i * cellW + cellW / 2} y={gridY - 6} textAnchor="middle">
                    {c}
                  </text>
                ))}
                {matrix.rows.map((r, i) => (
                  <text key={r} x={gridX - LABEL_GAP} y={gridY + i * cellH + cellH / 2} textAnchor="end" dominantBaseline="central">
                    {r}
                  </text>
                ))}
              </g>

              {/* Cells */}
              {matrix.cells.map((cell) => {
                const x = gridX + cell.colIndex * cellW;
                const y = gridY + cell.rowIndex * cellH;
                const key = `${cell.row}\u0000${cell.col}`;
                const active = hover === key;
                if (cell.value === null) {
                  return (
                    <rect
                      key={key}
                      x={x + pad}
                      y={y + pad}
                      width={Math.max(0, cellW - pad * 2)}
                      height={Math.max(0, cellH - pad * 2)}
                      rx={cellRadius}
                      fill="none"
                      stroke={theme.colors.border}
                      strokeDasharray="2 2"
                      opacity={0.5}
                    />
                  );
                }
                const bg = color(cell.value);
                const fits = showValues && cellW > 30 && cellH > 18;
                return (
                  <g key={key}>
                    <rect
                      x={x + pad}
                      y={y + pad}
                      width={Math.max(0, cellW - pad * 2)}
                      height={Math.max(0, cellH - pad * 2)}
                      rx={cellRadius}
                      fill={bg}
                      stroke={active ? theme.colors.focusRing : "transparent"}
                      strokeWidth={active ? 2 : 0}
                      style={{ cursor: onCellClick ? "pointer" : "default" }}
                      onMouseEnter={(e) => {
                        setHover(key);
                        tooltip.show(cell, e);
                      }}
                      onMouseMove={(e) => tooltip.move(e)}
                      onMouseLeave={() => {
                        setHover(null);
                        tooltip.hide();
                      }}
                      onClick={() => onCellClick?.(cell)}
                    >
                      <title>{`${cell.row} · ${cell.col}: ${formatValue(cell.value)}`}</title>
                    </rect>
                    {fits && (
                      <text
                        x={x + cellW / 2}
                        y={y + cellH / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontFamily={theme.typography.fontFamily}
                        fontSize={theme.typography.fontSizeSm}
                        fill={readableTextColor(bg)}
                        pointerEvents="none"
                      >
                        {formatValue(cell.value)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Color legend */}
              <g aria-hidden transform={`translate(${gridX}, ${gridY + gridH + 12})`}>
                <defs>
                  <linearGradient id="zv-heatmap-ramp" x1="0" y1="0" x2="1" y2="0">
                    {Array.from({ length: 7 }, (_, i) => {
                      const t = i / 6;
                      return <stop key={i} offset={`${t * 100}%`} stopColor={ramp(t)} />;
                    })}
                  </linearGradient>
                </defs>
                <rect x={0} y={0} width={Math.min(160, gridW)} height={8} rx={2} fill="url(#zv-heatmap-ramp)" />
                <text x={0} y={20} fontFamily={theme.typography.fontFamily} fontSize={theme.typography.fontSizeSm} fill={theme.colors.textMuted}>
                  {formatValue(matrix.min)}
                </text>
                <text x={Math.min(160, gridW)} y={20} textAnchor="end" fontFamily={theme.typography.fontFamily} fontSize={theme.typography.fontSizeSm} fill={theme.colors.textMuted}>
                  {formatValue(matrix.max)}
                </text>
              </g>
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                tooltip.state.data.value !== null &&
                (renderTooltip?.(tooltip.state.data) ?? (
                  <span>
                    <strong>{tooltip.state.data.row}</strong> · {tooltip.state.data.col}
                    <br />
                    {formatValue(tooltip.state.data.value)}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
