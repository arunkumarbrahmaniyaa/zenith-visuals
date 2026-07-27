import { useMemo, useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { formatNumber } from "@zenith-visuals/utils";
import type { Chord as ChordDatum } from "../chord/layout";
import {
  computeDependencyWheel,
  type WheelLinkInput,
  type WheelNodeInput,
} from "./layout";

export interface DependencyWheelProps extends BaseVisualizationProps {
  data: {
    nodes?: readonly WheelNodeInput[];
    links: readonly WheelLinkInput[];
  };
  /** Gap between nodes in radians. Default 0.03. */
  padAngle?: number;
  /** Ribbon fill opacity (0..1). Default 0.65. */
  ribbonOpacity?: number;
  renderTooltip?: (chord: ChordDatum, labels: readonly string[]) => ReactNode;
}

const TAU = Math.PI * 2;
const px = (cx: number, cy: number, r: number, a: number) => ({
  x: cx + r * Math.sin(a),
  y: cy - r * Math.cos(a),
});

function arcBand(cx: number, cy: number, rIn: number, rOut: number, a0: number, a1: number): string {
  const o0 = px(cx, cy, rOut, a0);
  const o1 = px(cx, cy, rOut, a1);
  const i1 = px(cx, cy, rIn, a1);
  const i0 = px(cx, cy, rIn, a0);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return [
    `M${o0.x},${o0.y}`,
    `A${rOut},${rOut} 0 ${large} 1 ${o1.x},${o1.y}`,
    `L${i1.x},${i1.y}`,
    `A${rIn},${rIn} 0 ${large} 0 ${i0.x},${i0.y}`,
    "Z",
  ].join(" ");
}

function ribbon(cx: number, cy: number, r: number, c: ChordDatum): string {
  const s0 = px(cx, cy, r, c.source.startAngle);
  const s1 = px(cx, cy, r, c.source.endAngle);
  const t0 = px(cx, cy, r, c.target.startAngle);
  const t1 = px(cx, cy, r, c.target.endAngle);
  const sLarge = c.source.endAngle - c.source.startAngle > Math.PI ? 1 : 0;
  const tLarge = c.target.endAngle - c.target.startAngle > Math.PI ? 1 : 0;
  return [
    `M${s0.x},${s0.y}`,
    `A${r},${r} 0 ${sLarge} 1 ${s1.x},${s1.y}`,
    `Q${cx},${cy} ${t0.x},${t0.y}`,
    `A${r},${r} 0 ${tLarge} 1 ${t1.x},${t1.y}`,
    `Q${cx},${cy} ${s0.x},${s0.y}`,
    "Z",
  ].join(" ");
}

/**
 * Dependency wheel — a chord diagram driven by directed node → node
 * dependencies. Nodes sit on a ring sized by total throughput and ribbons show
 * how much each node depends on the others. Great for module/package graphs.
 * Deterministic and SSR-safe.
 *
 * @example
 * <DependencyWheel data={{ links: [{ source: "app", target: "utils", value: 4 }] }} />
 */
export function DependencyWheel(props: DependencyWheelProps) {
  const { data, padAngle = 0.03, ribbonOpacity = 0.65, renderTooltip, height = 400, ...base } = props;
  const tooltip = useTooltip<ChordDatum>();
  const [hover, setHover] = useState<number | null>(null);

  const { data: wheel, layout } = useMemo(
    () => computeDependencyWheel(data.nodes, data.links, padAngle),
    [data.nodes, data.links, padAngle],
  );

  return (
    <VisualizationContainer
      {...base}
      height={height}
      isEmpty={layout.groups.length === 0}
      defaultHeight={height}
    >
      {({ theme, width, height: h }) => {
        const cx = width / 2;
        const cy = h / 2;
        const rOut = Math.min(width, h) / 2 - 20;
        const rIn = rOut - 12;
        const colorFor = (i: number) =>
          wheel.colors[i] ?? theme.palette[i % theme.palette.length] ?? theme.colors.primary;
        const dim = (i: number) => hover != null && hover !== i;

        return (
          <>
            <svg
              width={width}
              height={h}
              viewBox={`0 0 ${width} ${h}`}
              role="img"
              aria-label={base.labels?.ariaLabel ?? "Dependency wheel"}
              style={{ display: "block" }}
            >
              {layout.chords.map((c, i) => {
                const active = hover == null || hover === c.source.index || hover === c.target.index;
                return (
                  <path
                    key={i}
                    d={ribbon(cx, cy, rIn, c)}
                    fill={colorFor(c.source.index)}
                    fillOpacity={active ? ribbonOpacity : 0.06}
                    stroke="none"
                    onMouseEnter={(e) => tooltip.show(c, e)}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => tooltip.hide()}
                  >
                    <title>
                      {`${wheel.labels[c.source.index]} → ${wheel.labels[c.target.index]}: ${formatNumber(
                        c.source.value + c.target.value,
                      )}`}
                    </title>
                  </path>
                );
              })}
              {layout.groups.map((g) => {
                const mid = (g.startAngle + g.endAngle) / 2;
                const lp = px(cx, cy, rOut + 10, mid);
                const deg = ((mid % TAU) * 180) / Math.PI;
                const flip = deg > 180;
                return (
                  <g
                    key={g.index}
                    onMouseEnter={() => setHover(g.index)}
                    onMouseLeave={() => setHover(null)}
                  >
                    <path
                      d={arcBand(cx, cy, rIn, rOut, g.startAngle, g.endAngle)}
                      fill={colorFor(g.index)}
                      fillOpacity={dim(g.index) ? 0.3 : 1}
                    />
                    <text
                      x={lp.x}
                      y={lp.y}
                      textAnchor={flip ? "end" : "start"}
                      dominantBaseline="central"
                      fontSize={theme.typography.fontSizeSm}
                      fontFamily={theme.typography.fontFamily}
                      fill={dim(g.index) ? theme.colors.textMuted : theme.colors.text}
                    >
                      {wheel.labels[g.index]}
                    </text>
                  </g>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data, wheel.labels) ?? (
                  <span>
                    <strong>{wheel.labels[tooltip.state.data.source.index]}</strong> →{" "}
                    <strong>{wheel.labels[tooltip.state.data.target.index]}</strong>
                    <br />
                    {formatNumber(tooltip.state.data.source.value)} /{" "}
                    {formatNumber(tooltip.state.data.target.value)}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
