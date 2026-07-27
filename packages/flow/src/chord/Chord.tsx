import { useMemo, useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { formatNumber } from "@zenith-visuals/utils";
import { computeChordLayout, type Chord as ChordDatum, type ChordGroup } from "./layout";

export interface ChordProps extends BaseVisualizationProps {
  /** Square flow matrix; `matrix[i][j]` is the flow from group i to group j. */
  matrix: readonly (readonly number[])[];
  /** Group labels, index-aligned with the matrix rows. */
  groupLabels?: readonly string[];
  /** Explicit per-group colors; otherwise assigned from the palette. */
  colors?: readonly string[];
  /** Gap between groups in radians. Default 0.03. */
  padAngle?: number;
  /** Ribbon fill opacity (0..1). Default 0.7. */
  ribbonOpacity?: number;
  onGroupClick?: (group: ChordGroup) => void;
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
 * Chord diagram — shows directed flows between a set of groups arranged on a
 * circle. Arc length encodes each group's total; ribbons encode pairwise flow.
 * Responsive and SSR-safe.
 *
 * @example
 * <Chord matrix={[[0, 5], [3, 0]]} labels={["A", "B"]} />
 */
export function Chord(props: ChordProps) {
  const {
    matrix,
    groupLabels = [],
    colors,
    padAngle = 0.03,
    ribbonOpacity = 0.7,
    onGroupClick,
    renderTooltip,
    height = 360,
    ...base
  } = props;

  const tooltip = useTooltip<ChordDatum>();
  const [hover, setHover] = useState<number | null>(null);
  const layout = useMemo(() => computeChordLayout(matrix, padAngle), [matrix, padAngle]);
  const labelList = useMemo(
    () => matrix.map((_, i) => groupLabels[i] ?? `Group ${i + 1}`),
    [matrix, groupLabels],
  );

  return (
    <VisualizationContainer {...base} height={height} isEmpty={layout.groups.length === 0} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const cx = width / 2;
        const cy = h / 2;
        const rOut = Math.min(width, h) / 2 - 18;
        const rIn = rOut - 12;
        const colorFor = (i: number) =>
          colors?.[i] ?? theme.palette[i % theme.palette.length] ?? theme.colors.primary;
        const dim = (i: number) => hover != null && hover !== i;

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Chord diagram"} style={{ display: "block" }}>
              {layout.chords.map((c, i) => {
                const active = hover == null || hover === c.source.index || hover === c.target.index;
                return (
                  <path key={i} d={ribbon(cx, cy, rIn, c)} fill={colorFor(c.source.index)}
                    fillOpacity={active ? ribbonOpacity : 0.08} stroke="none"
                    onMouseEnter={(e) => tooltip.show(c, e)}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => tooltip.hide()}>
                    <title>{`${labelList[c.source.index]} ↔ ${labelList[c.target.index]}: ${formatNumber(c.source.value + c.target.value)}`}</title>
                  </path>
                );
              })}
              {layout.groups.map((g) => {
                const mid = (g.startAngle + g.endAngle) / 2;
                const lp = px(cx, cy, rOut + 12, mid);
                const deg = ((mid % TAU) * 180) / Math.PI;
                const flip = deg > 180;
                return (
                  <g key={g.index}
                    onMouseEnter={() => setHover(g.index)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => onGroupClick?.(g)}
                    style={{ cursor: onGroupClick ? "pointer" : "default" }}>
                    <path d={arcBand(cx, cy, rIn, rOut, g.startAngle, g.endAngle)}
                      fill={colorFor(g.index)} fillOpacity={dim(g.index) ? 0.3 : 1} />
                    <text x={lp.x} y={lp.y} textAnchor={flip ? "end" : "start"} dominantBaseline="central"
                      fontSize={theme.typography.fontSizeSm} fontFamily={theme.typography.fontFamily}
                      fill={theme.colors.text}>
                      {labelList[g.index]}
                    </text>
                  </g>
                );
              })}
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data, labelList) ?? (
                  <span>
                    <strong>{labelList[tooltip.state.data.source.index]}</strong> ↔{" "}
                    <strong>{labelList[tooltip.state.data.target.index]}</strong>
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
