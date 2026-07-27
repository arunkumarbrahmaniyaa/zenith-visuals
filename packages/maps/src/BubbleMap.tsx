import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { extent, formatCompact } from "@zenith-visuals/utils";
import { getProjection, type GeoCoord, type ProjectionName } from "./projection";
import { computeFit } from "./lib/geo";

/** A bubble anchored to a geographic location. */
export interface BubbleDatum extends GeoCoord {
  id?: string;
  label?: string;
  /** Magnitude driving the bubble area. */
  value: number;
}

export interface BubbleMapProps extends BaseVisualizationProps {
  data: readonly BubbleDatum[];
  /** Map projection. Default "mercator". */
  projection?: ProjectionName;
  /** Max bubble radius in px (area scales with value). Default 40. */
  maxRadius?: number;
  /** Bubble fill color. Defaults to the theme primary. */
  color?: string;
  /** Show a proportional-size legend. Default true. */
  showLegend?: boolean;
  onBubbleClick?: (datum: BubbleDatum) => void;
  renderTooltip?: (datum: BubbleDatum) => ReactNode;
}

/**
 * A proportional-symbol (bubble) map: circles anchored to coordinates and
 * sized by value using perceptually correct area (√) scaling. Fits to the data
 * bounds — no tile server or GeoJSON required. Responsive and SSR-safe.
 *
 * @example
 * <BubbleMap data={[{ lat: 40.7, lon: -74, value: 8_400_000, label: "NYC" }]} />
 */
export function BubbleMap(props: BubbleMapProps) {
  const {
    data,
    projection = "mercator",
    maxRadius = 40,
    color,
    showLegend = true,
    onBubbleClick,
    renderTooltip,
    height = 360,
    ...base
  } = props;

  const tooltip = useTooltip<BubbleDatum>();
  const [hoverId, setHoverId] = useState<string | number | null>(null);
  const [, maxV] = extent(data, (d) => Math.max(0, d.value));

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
        const fill = color ?? theme.colors.primary;
        const safeMax = maxV <= 0 ? 1 : maxV;
        const radiusFor = (v: number) =>
          Math.max(2, Math.sqrt(Math.max(0, v) / safeMax) * maxRadius);

        // Largest bubbles first so small ones stay clickable on top.
        const order = data
          .map((d, i) => ({ d, i }))
          .sort((a, b) => b.d.value - a.d.value);

        const legendValues = [safeMax, safeMax / 2, safeMax / 8];

        return (
          <>
            <svg
              width={width}
              height={h}
              viewBox={`0 0 ${width} ${h}`}
              role="img"
              aria-label={base.labels?.ariaLabel ?? "Bubble map"}
              style={{ display: "block" }}
            >
              <rect
                width={width}
                height={h}
                fill={theme.colors.muted}
                opacity={0.4}
                rx={theme.radii.md}
              />
              {order.map(({ d, i }) => {
                const key = d.id ?? i;
                const { x, y } = fit.toXY(d);
                const active = hoverId === key;
                return (
                  <circle
                    key={key}
                    cx={x}
                    cy={y}
                    r={radiusFor(d.value)}
                    fill={fill}
                    fillOpacity={hoverId != null && !active ? 0.35 : 0.6}
                    stroke={theme.colors.background}
                    strokeWidth={1}
                    style={{ cursor: onBubbleClick ? "pointer" : "default" }}
                    onMouseEnter={(e) => {
                      setHoverId(key);
                      tooltip.show(d, e);
                    }}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => {
                      setHoverId(null);
                      tooltip.hide();
                    }}
                    onClick={() => onBubbleClick?.(d)}
                  >
                    <title>{d.label ?? `${d.lat}, ${d.lon}`}</title>
                  </circle>
                );
              })}

              {showLegend && (
                <g transform={`translate(${width - 60},${h - 12})`}>
                  {legendValues.map((v) => {
                    const r = radiusFor(v);
                    return (
                      <g key={v}>
                        <circle
                          cx={0}
                          cy={-r}
                          r={r}
                          fill="none"
                          stroke={theme.colors.textMuted}
                          strokeWidth={1}
                        />
                        <text
                          x={0}
                          y={-2 * r - 2}
                          textAnchor="middle"
                          fontSize={theme.typography.fontSizeSm}
                          fill={theme.colors.textMuted}
                        >
                          {formatCompact(v)}
                        </text>
                      </g>
                    );
                  })}
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
                    <strong>{tooltip.state.data.label ?? "Bubble"}</strong>
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
