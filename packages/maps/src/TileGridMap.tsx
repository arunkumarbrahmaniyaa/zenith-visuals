import { useMemo, useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import {
  extent,
  formatCompact,
  readableTextColor,
  sequentialScale,
} from "@zenith-visuals/utils";
import { tileGridExtent } from "./lib/geo";

/** A tile placed at a fixed row/column on the grid. */
export interface TileDatum {
  id: string;
  /** Short code shown inside the tile (falls back to `id`). */
  label?: string;
  row: number;
  col: number;
  /** Value driving the fill color. */
  value?: number;
}

export interface TileGridMapProps extends BaseVisualizationProps {
  data: readonly TileDatum[];
  /** Gap between tiles in px. Default 4. */
  gap?: number;
  /** Show a min→max color legend. Default true. */
  showLegend?: boolean;
  onTileClick?: (tile: TileDatum) => void;
  renderTooltip?: (tile: TileDatum) => ReactNode;
}

/**
 * A tile-grid map (grid cartogram): every region is an equal-size square placed
 * on a fixed row/column lattice and colored by value — ideal for comparing
 * regions without geographic area bias. Responsive and SSR-safe.
 *
 * @example
 * <TileGridMap data={[{ id: "CA", row: 2, col: 0, value: 39 }]} />
 */
export function TileGridMap(props: TileGridMapProps) {
  const {
    data,
    gap = 4,
    showLegend = true,
    onTileClick,
    renderTooltip,
    height = 360,
    ...base
  } = props;

  const tooltip = useTooltip<TileDatum>();
  const [hoverId, setHoverId] = useState<string | null>(null);
  const grid = useMemo(() => tileGridExtent(data), [data]);
  const [minV, maxV] = useMemo(
    () => extent(data, (d) => d.value ?? 0),
    [data],
  );

  return (
    <VisualizationContainer
      {...base}
      height={height}
      isEmpty={data.length === 0}
      defaultHeight={height}
    >
      {({ theme, width, height: h }) => {
        const legendH = showLegend ? 22 : 0;
        const cell = Math.min(
          (width - (grid.cols - 1) * gap) / grid.cols,
          (h - legendH - (grid.rows - 1) * gap) / grid.rows,
        );
        const gridW = grid.cols * cell + (grid.cols - 1) * gap;
        const gridH = grid.rows * cell + (grid.rows - 1) * gap;
        const offX = (width - gridW) / 2;
        const offY = (h - legendH - gridH) / 2;
        const ramp = sequentialScale(theme.sequential);
        const colorFor = (v: number | undefined) => {
          if (v === undefined) return theme.colors.muted;
          if (maxV <= minV) return ramp(0.5);
          return ramp((v - minV) / (maxV - minV));
        };

        return (
          <>
            <svg
              width={width}
              height={h}
              viewBox={`0 0 ${width} ${h}`}
              role="img"
              aria-label={base.labels?.ariaLabel ?? "Tile-grid map"}
              style={{ display: "block", fontFamily: theme.typography.fontFamily }}
            >
              {data.map((tile) => {
                const x = offX + (tile.col - grid.minCol) * (cell + gap);
                const y = offY + (tile.row - grid.minRow) * (cell + gap);
                const fill = colorFor(tile.value);
                const active = hoverId === tile.id;
                const textColor =
                  tile.value === undefined
                    ? theme.colors.textMuted
                    : readableTextColor(fill);
                return (
                  <g
                    key={tile.id}
                    style={{ cursor: onTileClick ? "pointer" : "default" }}
                    onMouseEnter={(e) => {
                      setHoverId(tile.id);
                      tooltip.show(tile, e);
                    }}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => {
                      setHoverId(null);
                      tooltip.hide();
                    }}
                    onClick={() => onTileClick?.(tile)}
                  >
                    <rect
                      x={x}
                      y={y}
                      width={cell}
                      height={cell}
                      rx={theme.radii.sm}
                      fill={fill}
                      fillOpacity={hoverId != null && !active ? 0.55 : 1}
                      stroke={active ? theme.colors.focusRing : "transparent"}
                      strokeWidth={2}
                    />
                    {cell > 22 && (
                      <text
                        x={x + cell / 2}
                        y={y + cell / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={Math.min(theme.typography.fontSize, cell / 3)}
                        fontWeight={theme.typography.fontWeightBold}
                        fill={textColor}
                      >
                        {tile.label ?? tile.id}
                      </text>
                    )}
                  </g>
                );
              })}

              {showLegend && maxV > minV && (
                <g transform={`translate(${offX},${h - 14})`}>
                  {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
                    <rect
                      key={t}
                      x={i * 18}
                      y={0}
                      width={18}
                      height={10}
                      fill={ramp(t)}
                    />
                  ))}
                  <text
                    x={0}
                    y={-3}
                    fontSize={theme.typography.fontSizeSm}
                    fill={theme.colors.textMuted}
                  >
                    {formatCompact(minV)}
                  </text>
                  <text
                    x={5 * 18}
                    y={-3}
                    textAnchor="end"
                    fontSize={theme.typography.fontSizeSm}
                    fill={theme.colors.textMuted}
                  >
                    {formatCompact(maxV)}
                  </text>
                </g>
              )}
            </svg>
            <Tooltip
              theme={theme}
              open={tooltip.state.open}
              x={tooltip.state.x}
              y={tooltip.state.y}
            >
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data) ?? (
                  <span>
                    <strong>{tooltip.state.data.label ?? tooltip.state.data.id}</strong>
                    {tooltip.state.data.value != null &&
                      ` · ${formatCompact(tooltip.state.data.value)}`}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
