import type { ReactNode } from "react";
import {
  VisualizationContainer,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { sequentialScale } from "@zenith-visuals/utils";
import { getProjection, type GeoCoord, type ProjectionName } from "./projection";
import { computeFit, densityGrid } from "./lib/geo";

/** A weighted geographic sample for the heatmap. */
export interface GeoHeatPoint extends GeoCoord {
  /** Optional weight (defaults to 1). */
  weight?: number;
}

export interface GeoHeatmapProps extends BaseVisualizationProps {
  data: readonly GeoHeatPoint[];
  /** Map projection. Default "mercator". */
  projection?: ProjectionName;
  /** Density raster cell size in px. Smaller = sharper. Default 14. */
  cellSize?: number;
  /** Gaussian bandwidth (std-dev) in px. Default cellSize * 1.6. */
  bandwidth?: number;
  /** Hide cells below this fraction of the peak density. Default 0.04. */
  threshold?: number;
  children?: ReactNode;
}

/**
 * A geographic density heatmap: projects weighted points and renders a
 * Gaussian kernel-density raster colored by the theme's sequential ramp.
 * Dependency-free and SSR-safe.
 *
 * @example
 * <GeoHeatmap data={[{ lat: 40.7, lon: -74 }, { lat: 40.8, lon: -73.9 }]} />
 */
export function GeoHeatmap(props: GeoHeatmapProps) {
  const {
    data,
    projection = "mercator",
    cellSize = 14,
    bandwidth,
    threshold = 0.04,
    height = 360,
    ...base
  } = props;

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
          return { x, y, weight: d.weight ?? 1 };
        });
        const grid = densityGrid(projected, width, h, cellSize, bandwidth);
        const ramp = sequentialScale(theme.sequential);

        const cells: ReactNode[] = [];
        for (let j = 0; j < grid.rows; j++) {
          for (let i = 0; i < grid.cols; i++) {
            const v = grid.values[j * grid.cols + i] ?? 0;
            const t = v / grid.max;
            if (t < threshold) continue;
            cells.push(
              <rect
                key={`${i}:${j}`}
                x={i * grid.cellSize}
                y={j * grid.cellSize}
                width={grid.cellSize + 0.5}
                height={grid.cellSize + 0.5}
                fill={ramp(t)}
                fillOpacity={0.15 + 0.75 * t}
              />,
            );
          }
        }

        return (
          <svg
            width={width}
            height={h}
            viewBox={`0 0 ${width} ${h}`}
            role="img"
            aria-label={base.labels?.ariaLabel ?? "Geographic heatmap"}
            style={{ display: "block" }}
          >
            <rect
              width={width}
              height={h}
              fill={theme.colors.muted}
              opacity={0.4}
              rx={theme.radii.md}
            />
            {cells}
          </svg>
        );
      }}
    </VisualizationContainer>
  );
}
