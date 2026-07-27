import { useMemo, useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { extent, formatCompact, sequentialScale } from "@zenith-visuals/utils";
import { getProjection, type GeoCoord, type ProjectionName } from "./projection";
import { computeFit, polygonCentroid, scaleRingAround } from "./lib/geo";

/** A cartogram region defined by one or more lon/lat rings. */
export interface CartogramRegion {
  id: string;
  label?: string;
  /** Value driving the region's scale and fill. */
  value: number;
  /** Polygon rings; each ring is a closed loop of coordinates (first = outer). */
  rings: readonly (readonly GeoCoord[])[];
}

export interface CartogramProps extends BaseVisualizationProps {
  regions: readonly CartogramRegion[];
  /** Map projection. Default "mercator". */
  projection?: ProjectionName;
  /** Draw the original (unscaled) region outlines faintly. Default true. */
  showOutline?: boolean;
  onRegionClick?: (region: CartogramRegion) => void;
  renderTooltip?: (region: CartogramRegion) => ReactNode;
}

/**
 * A non-contiguous cartogram: each region polygon is scaled about its centroid
 * so its area is proportional to `value`, then filled by the theme's sequential
 * ramp. Dependency-free — pass your own lon/lat rings. Responsive and SSR-safe.
 *
 * @example
 * <Cartogram regions={[{ id: "a", value: 12, rings: [[{lat,lon}, …]] }]} />
 */
export function Cartogram(props: CartogramProps) {
  const {
    regions,
    projection = "mercator",
    showOutline = true,
    onRegionClick,
    renderTooltip,
    height = 360,
    ...base
  } = props;

  const tooltip = useTooltip<CartogramRegion>();
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [minV, maxV] = useMemo(
    () => extent(regions, (r) => Math.max(0, r.value)),
    [regions],
  );

  const allCoords = useMemo(
    () => regions.flatMap((r) => r.rings.flatMap((ring) => [...ring])),
    [regions],
  );

  return (
    <VisualizationContainer
      {...base}
      height={height}
      isEmpty={regions.length === 0}
      defaultHeight={height}
    >
      {({ theme, width, height: h }) => {
        const project = getProjection(projection);
        const fit = computeFit(allCoords, project, width, h);
        const ramp = sequentialScale(theme.sequential);
        const safeMax = maxV <= 0 ? 1 : maxV;
        const colorFor = (v: number) =>
          maxV <= minV ? ramp(0.5) : ramp((v - minV) / (maxV - minV));
        const factorFor = (v: number) =>
          Math.sqrt(Math.max(0, v) / safeMax);

        const ringToPath = (ring: readonly GeoCoord[]) =>
          ring
            .map((c, i) => {
              const { x, y } = fit.toXY(c);
              return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
            })
            .join(" ") + " Z";

        return (
          <>
            <svg
              width={width}
              height={h}
              viewBox={`0 0 ${width} ${h}`}
              role="img"
              aria-label={base.labels?.ariaLabel ?? "Cartogram"}
              style={{ display: "block" }}
            >
              {showOutline &&
                regions.map((r) => (
                  <path
                    key={`outline-${r.id}`}
                    d={r.rings.map(ringToPath).join(" ")}
                    fillRule="evenodd"
                    fill="none"
                    stroke={theme.colors.border}
                    strokeWidth={0.75}
                    strokeDasharray="2 2"
                  />
                ))}
              {regions.map((r) => {
                const center = polygonCentroid(r.rings[0] ?? []);
                const factor = factorFor(r.value);
                const active = hoverId === r.id;
                const d = r.rings
                  .map((ring) => ringToPath(scaleRingAround(ring, factor, center)))
                  .join(" ");
                return (
                  <path
                    key={r.id}
                    d={d}
                    fillRule="evenodd"
                    fill={colorFor(r.value)}
                    fillOpacity={hoverId != null && !active ? 0.55 : 1}
                    stroke={theme.colors.background}
                    strokeWidth={active ? 1.5 : 0.75}
                    style={{ cursor: onRegionClick ? "pointer" : "default" }}
                    onMouseEnter={(e) => {
                      setHoverId(r.id);
                      tooltip.show(r, e);
                    }}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => {
                      setHoverId(null);
                      tooltip.hide();
                    }}
                    onClick={() => onRegionClick?.(r)}
                  >
                    <title>{r.label ?? r.id}</title>
                  </path>
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
                    <strong>{tooltip.state.data.label ?? tooltip.state.data.id}</strong>
                    <br />
                    {formatCompact(tooltip.state.data.value)}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
