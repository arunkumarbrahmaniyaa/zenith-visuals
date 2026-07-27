import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { formatCompact, sequentialScale } from "@zenith-visuals/utils";
import { getProjection, type GeoCoord, type ProjectionName } from "./projection";
import { computeFit, hexagonPath, hexbin, type HexCell } from "./lib/geo";

/** A geographic sample for hex binning. */
export interface HexbinPoint extends GeoCoord {
  /** Optional value aggregated (summed) into the bin. Defaults to 1. */
  value?: number;
}

export interface HexbinMapProps extends BaseVisualizationProps {
  data: readonly HexbinPoint[];
  /** Map projection. Default "mercator". */
  projection?: ProjectionName;
  /** Hexagon radius in px. Default 16. */
  radius?: number;
  /** Aggregate by summed `value` instead of point count. Default false. */
  byValue?: boolean;
  onCellClick?: (cell: HexCell) => void;
  renderTooltip?: (cell: HexCell) => ReactNode;
}

/**
 * A hexbin map: projects geographic points, aggregates them into a hexagonal
 * lattice and colors each bin by count (or summed value) using the theme's
 * sequential ramp. Dependency-free and SSR-safe.
 *
 * @example
 * <HexbinMap data={[{ lat: 40.7, lon: -74 }, { lat: 40.8, lon: -73.9 }]} />
 */
export function HexbinMap(props: HexbinMapProps) {
  const {
    data,
    projection = "mercator",
    radius = 16,
    byValue = false,
    onCellClick,
    renderTooltip,
    height = 360,
    ...base
  } = props;

  const tooltip = useTooltip<HexCell>();
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  return (
    <VisualizationContainer
      {...base}
      height={height}
      isEmpty={data.length === 0}
      defaultHeight={height}
    >
      {({ theme, width, height: h }) => {
        const project = getProjection(projection);
        const fit = computeFit(data, project, width, h);
        const projected = data.map((d) => {
          const { x, y } = fit.toXY(d);
          return { x, y, value: d.value ?? 1 };
        });
        const cells = hexbin(projected, radius);
        const metric = (c: HexCell) => (byValue ? c.value : c.count);
        let max = 1;
        for (const c of cells) max = Math.max(max, metric(c));
        const ramp = sequentialScale(theme.sequential);

        return (
          <>
            <svg
              width={width}
              height={h}
              viewBox={`0 0 ${width} ${h}`}
              role="img"
              aria-label={base.labels?.ariaLabel ?? "Hexbin map"}
              style={{ display: "block" }}
            >
              <rect
                width={width}
                height={h}
                fill={theme.colors.muted}
                opacity={0.4}
                rx={theme.radii.md}
              />
              {cells.map((cell) => {
                const key = `${cell.i}:${cell.j}`;
                const t = metric(cell) / max;
                const active = hoverKey === key;
                return (
                  <path
                    key={key}
                    d={hexagonPath(cell.x, cell.y, radius - 0.75)}
                    fill={ramp(0.15 + t * 0.85)}
                    fillOpacity={hoverKey != null && !active ? 0.5 : 0.9}
                    stroke={theme.colors.background}
                    strokeWidth={active ? 1.5 : 0.5}
                    style={{ cursor: onCellClick ? "pointer" : "default" }}
                    onMouseEnter={(e) => {
                      setHoverKey(key);
                      tooltip.show(cell, e);
                    }}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => {
                      setHoverKey(null);
                      tooltip.hide();
                    }}
                    onClick={() => onCellClick?.(cell)}
                  />
                );
              })}
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
                    <strong>
                      {byValue
                        ? formatCompact(tooltip.state.data.value)
                        : tooltip.state.data.count}
                    </strong>{" "}
                    {byValue ? "total" : "points"}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
