import { useMemo, useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { extent, formatNumber, sequentialScale } from "@zenith-visuals/utils";
import { getProjection, type GeoCoord, type ProjectionName } from "./projection";

/** A map region defined by one or more lon/lat rings (first = outer). */
export interface ChoroplethRegion {
  id: string;
  label?: string;
  /** Value driving the fill color. */
  value?: number;
  /** Polygon rings; each ring is a closed loop of coordinates. */
  rings: readonly (readonly GeoCoord[])[];
}

export interface ChoroplethProps extends BaseVisualizationProps {
  regions: readonly ChoroplethRegion[];
  /** Map projection. Default "mercator". */
  projection?: ProjectionName;
  /** Show a min→max color legend. Default true. */
  showLegend?: boolean;
  onRegionClick?: (region: ChoroplethRegion) => void;
  renderTooltip?: (region: ChoroplethRegion) => ReactNode;
}

/**
 * Choropleth map — fills user-supplied polygon regions by value using the
 * theme's sequential color ramp. Dependency-free: pass your own lon/lat rings
 * (no GeoJSON loader or tile server required). Responsive and SSR-safe.
 *
 * @example
 * <Choropleth regions={[{ id: "a", value: 5, rings: [[{lat,lon}, …]] }]} />
 */
export function Choropleth(props: ChoroplethProps) {
  const {
    regions,
    projection = "mercator",
    showLegend = true,
    onRegionClick,
    renderTooltip,
    height = 360,
    ...base
  } = props;

  const tooltip = useTooltip<ChoroplethRegion>();
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [minV, maxV] = useMemo(() => extent(regions, (r) => r.value ?? 0), [regions]);

  // Fit all coordinates into the viewport with a small margin.
  const bounds = useMemo(() => {
    let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
    for (const r of regions) {
      for (const ring of r.rings) {
        for (const c of ring) {
          if (c.lat < minLat) minLat = c.lat;
          if (c.lat > maxLat) maxLat = c.lat;
          if (c.lon < minLon) minLon = c.lon;
          if (c.lon > maxLon) maxLon = c.lon;
        }
      }
    }
    return { minLat, maxLat, minLon, maxLon };
  }, [regions]);

  return (
    <VisualizationContainer {...base} height={height} isEmpty={regions.length === 0} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const project = getProjection(projection);
        const ramp = sequentialScale(theme.sequential);
        const colorFor = (v: number | undefined) => {
          if (v === undefined) return theme.colors.muted;
          if (maxV <= minV) return ramp(0.5);
          return ramp((v - minV) / (maxV - minV));
        };

        // Project world bounds to derive a fit transform.
        const p1 = project({ lat: bounds.maxLat, lon: bounds.minLon }, 1, 1);
        const p2 = project({ lat: bounds.minLat, lon: bounds.maxLon }, 1, 1);
        const spanX = Math.max(1e-6, Math.abs(p2.x - p1.x));
        const spanY = Math.max(1e-6, Math.abs(p2.y - p1.y));
        const margin = 12;
        const scale = Math.min((width - margin * 2) / spanX, (h - margin * 2) / spanY);
        const offX = margin + (width - margin * 2 - spanX * scale) / 2;
        const offY = margin + (h - margin * 2 - spanY * scale) / 2;
        const toXY = (c: GeoCoord) => {
          const p = project(c, 1, 1);
          return { x: offX + (p.x - Math.min(p1.x, p2.x)) * scale, y: offY + (p.y - Math.min(p1.y, p2.y)) * scale };
        };
        const ringPath = (ring: readonly GeoCoord[]) =>
          ring.map((c, i) => {
            const { x, y } = toXY(c);
            return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
          }).join(" ") + " Z";

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Choropleth map"} style={{ display: "block" }}>
              {regions.map((r) => {
                const active = hoverId === r.id;
                return (
                  <path key={r.id} d={r.rings.map(ringPath).join(" ")} fillRule="evenodd"
                    fill={colorFor(r.value)} fillOpacity={hoverId != null && !active ? 0.55 : 1}
                    stroke={theme.colors.background} strokeWidth={active ? 1.5 : 0.75}
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
                    style={{ cursor: onRegionClick ? "pointer" : "default" }}>
                    <title>{`${r.label ?? r.id}${r.value !== undefined ? `: ${formatNumber(r.value)}` : ""}`}</title>
                  </path>
                );
              })}
              {showLegend && maxV > minV && (
                <g transform={`translate(${width - 132},${h - 30})`}>
                  <defs>
                    <linearGradient id="cp-legend" x1="0" x2="1">
                      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                        <stop key={t} offset={`${t * 100}%`} stopColor={ramp(t)} />
                      ))}
                    </linearGradient>
                  </defs>
                  <rect x={0} y={0} width={120} height={8} rx={4} fill="url(#cp-legend)" />
                  <text x={0} y={22} fontSize={theme.typography.fontSizeSm}
                    fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>{formatNumber(minV)}</text>
                  <text x={120} y={22} textAnchor="end" fontSize={theme.typography.fontSizeSm}
                    fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>{formatNumber(maxV)}</text>
                </g>
              )}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data) ?? (
                  <span>
                    <strong>{tooltip.state.data.label ?? tooltip.state.data.id}</strong>
                    {tooltip.state.data.value !== undefined && <>: {formatNumber(tooltip.state.data.value)}</>}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
