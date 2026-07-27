import { useMemo, useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { extent, formatNumber } from "@zenith-visuals/utils";
import { getProjection, type GeoCoord, type ProjectionName } from "./projection";

export interface ConnectionPoint extends GeoCoord {
  id: string;
  label?: string;
  /** Magnitude driving marker size. */
  value?: number;
}

export interface Connection {
  source: string;
  target: string;
  /** Magnitude driving arc thickness. */
  value?: number;
  color?: string;
}

export interface ConnectionMapProps extends BaseVisualizationProps {
  points: readonly ConnectionPoint[];
  connections: readonly Connection[];
  /** Map projection. Default "mercator". */
  projection?: ProjectionName;
  /** Draw a faint lat/lon graticule background. Default true. */
  showGraticule?: boolean;
  /** Min/max arc stroke width in px. Default [1, 5]. */
  widthRange?: [number, number];
  /** How far arcs bow out (fraction of chord length). Default 0.2. */
  curvature?: number;
  onConnectionClick?: (connection: Connection) => void;
  renderTooltip?: (connection: Connection, points: Map<string, ConnectionPoint>) => ReactNode;
}

/**
 * Connection / flow map — draws curved arcs between geographic points to show
 * routes, migration or network links. Dependency-free projection, no tile
 * server. Responsive and SSR-safe.
 *
 * @example
 * <ConnectionMap points={cities} connections={[{ source: "NYC", target: "LON" }]} />
 */
export function ConnectionMap(props: ConnectionMapProps) {
  const {
    points,
    connections,
    projection = "mercator",
    showGraticule = true,
    widthRange = [1, 5],
    curvature = 0.2,
    onConnectionClick,
    renderTooltip,
    height = 360,
    ...base
  } = props;

  const tooltip = useTooltip<Connection>();
  const [hover, setHover] = useState<number | null>(null);
  const pointMap = useMemo(() => new Map(points.map((p) => [p.id, p])), [points]);
  const [minV, maxV] = useMemo(() => extent(connections, (c) => c.value ?? 1), [connections]);
  const [minPV, maxPV] = useMemo(() => extent(points, (p) => p.value ?? 1), [points]);

  const isEmpty = points.length === 0 || connections.length === 0;

  return (
    <VisualizationContainer {...base} height={height} isEmpty={isEmpty} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const project = getProjection(projection);
        const [wMin, wMax] = widthRange;
        const widthFor = (v: number) => (maxV <= minV ? (wMin + wMax) / 2 : wMin + ((v - minV) / (maxV - minV)) * (wMax - wMin));
        const rFor = (v: number) => (maxPV <= minPV ? 4 : 3 + ((v - minPV) / (maxPV - minPV)) * 7);

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Connection map"} style={{ display: "block" }}>
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
              {connections.map((c, i) => {
                const s = pointMap.get(c.source);
                const t = pointMap.get(c.target);
                if (!s || !t) return null;
                const p0 = project(s, width, h);
                const p1 = project(t, width, h);
                const mx = (p0.x + p1.x) / 2;
                const my = (p0.y + p1.y) / 2;
                const dx = p1.x - p0.x;
                const dy = p1.y - p0.y;
                const len = Math.hypot(dx, dy) || 1;
                const cxp = mx - (dy / len) * len * curvature;
                const cyp = my + (dx / len) * len * curvature;
                const active = hover == null || hover === i;
                return (
                  <path key={i} d={`M${p0.x},${p0.y} Q${cxp},${cyp} ${p1.x},${p1.y}`} fill="none"
                    stroke={c.color ?? theme.colors.primary} strokeWidth={widthFor(c.value ?? 1)}
                    strokeOpacity={active ? 0.75 : 0.12} strokeLinecap="round"
                    onMouseEnter={(e) => {
                      setHover(i);
                      tooltip.show(c, e);
                    }}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => {
                      setHover(null);
                      tooltip.hide();
                    }}
                    onClick={() => onConnectionClick?.(c)}
                    style={{ cursor: onConnectionClick ? "pointer" : "default" }}>
                    <title>{`${s.label ?? s.id} → ${t.label ?? t.id}${c.value !== undefined ? `: ${formatNumber(c.value)}` : ""}`}</title>
                  </path>
                );
              })}
              {points.map((p) => {
                const { x, y } = project(p, width, h);
                return (
                  <g key={p.id}>
                    <circle cx={x} cy={y} r={rFor(p.value ?? 1)} fill={theme.colors.secondary}
                      stroke={theme.colors.background} strokeWidth={1}>
                      <title>{p.label ?? p.id}</title>
                    </circle>
                  </g>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data, pointMap) ?? (
                  <span>
                    <strong>{pointMap.get(tooltip.state.data.source)?.label ?? tooltip.state.data.source}</strong>
                    {" → "}
                    <strong>{pointMap.get(tooltip.state.data.target)?.label ?? tooltip.state.data.target}</strong>
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
