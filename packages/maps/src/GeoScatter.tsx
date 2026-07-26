import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { extent, sequentialScale } from "@zenith-visuals/utils";
import { getProjection, type GeoCoord, type ProjectionName } from "./projection";

export interface GeoPoint extends GeoCoord {
  id?: string;
  label?: string;
  /** Magnitude driving marker size and color. */
  value?: number;
}

export interface GeoScatterProps extends BaseVisualizationProps {
  data: readonly GeoPoint[];
  /** Map projection. Default "mercator". */
  projection?: ProjectionName;
  /** Min/max marker radius in px. Default [3, 18]. */
  radiusRange?: [number, number];
  /** Draw a faint lat/lon graticule background. Default true. */
  showGraticule?: boolean;
  onPointClick?: (point: GeoPoint) => void;
  renderTooltip?: (point: GeoPoint) => ReactNode;
}

/**
 * Plot geographic points onto a projected canvas — no tile server or GeoJSON
 * required. Marker size and color encode `value`. Responsive and SSR-safe.
 *
 * @example
 * <GeoScatter data={[{ lat: 40.7, lon: -74, value: 12, label: "NYC" }]} />
 */
export function GeoScatter(props: GeoScatterProps) {
  const {
    data,
    projection = "mercator",
    radiusRange = [3, 18],
    showGraticule = true,
    onPointClick,
    renderTooltip,
    height = 360,
    ...base
  } = props;

  const tooltip = useTooltip<GeoPoint>();
  const [hoverId, setHoverId] = useState<string | number | null>(null);

  return (
    <VisualizationContainer {...base} height={height} isEmpty={data.length === 0} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const project = getProjection(projection);
        const [minV, maxV] = extent(data, (d) => d.value ?? 1);
        const ramp = sequentialScale(theme.sequential);
        const [rMin, rMax] = radiusRange;
        const sizeFor = (v: number) => {
          if (maxV <= minV) return (rMin + rMax) / 2;
          return rMin + ((v - minV) / (maxV - minV)) * (rMax - rMin);
        };
        const colorFor = (v: number) => (maxV <= minV ? theme.colors.primary : ramp((v - minV) / (maxV - minV)));

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Geographic scatter map"} style={{ display: "block" }}>
              <rect width={width} height={h} fill={theme.colors.muted} opacity={0.4} rx={theme.radii.md} />
              {showGraticule && (
                <g stroke={theme.colors.border} strokeWidth={0.5} opacity={0.6}>
                  {[-60, -30, 0, 30, 60].map((lat) => {
                    const { y } = project({ lat, lon: 0 }, width, h);
                    return <line key={`lat${lat}`} x1={0} y1={y} x2={width} y2={y} />;
                  })}
                  {[-120, -60, 0, 60, 120].map((lon) => {
                    const { x } = project({ lat: 0, lon }, width, h);
                    return <line key={`lon${lon}`} x1={x} y1={0} x2={x} y2={h} />;
                  })}
                </g>
              )}
              {data.map((point, i) => {
                const key = point.id ?? i;
                const { x, y } = project(point, width, h);
                const v = point.value ?? 1;
                const active = hoverId === key;
                return (
                  <circle
                    key={key}
                    cx={x}
                    cy={y}
                    r={sizeFor(v)}
                    fill={colorFor(v)}
                    fillOpacity={hoverId != null && !active ? 0.4 : 0.85}
                    stroke={theme.colors.background}
                    strokeWidth={1}
                    style={{ cursor: onPointClick ? "pointer" : "default" }}
                    onMouseEnter={(e) => {
                      setHoverId(key);
                      tooltip.show(point, e);
                    }}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => {
                      setHoverId(null);
                      tooltip.hide();
                    }}
                    onClick={() => onPointClick?.(point)}
                  >
                    <title>{point.label ?? `${point.lat}, ${point.lon}`}</title>
                  </circle>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data) ?? (
                  <span>
                    <strong>{tooltip.state.data.label ?? "Point"}</strong>
                    <br />
                    {tooltip.state.data.lat.toFixed(2)}, {tooltip.state.data.lon.toFixed(2)}
                    {tooltip.state.data.value != null && ` · ${tooltip.state.data.value}`}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
