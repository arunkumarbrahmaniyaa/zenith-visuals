import { useMemo, useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { formatNumber } from "@zenith-visuals/utils";
import {
  computeAlluvialLayout,
  type AlluvialFlow,
  type AlluvialNode,
  type AlluvialRibbon,
} from "./layout";

export interface AlluvialProps extends BaseVisualizationProps {
  /** Multi-stage flow records; each `path` lists one category per stage. */
  flows: readonly AlluvialFlow[];
  /** Labels shown above each stage (index-aligned). */
  stageLabels?: readonly string[];
  /** Category bar thickness in px. Default 14. */
  nodeWidth?: number;
  /** Vertical gap between stacked categories in px. Default 8. */
  nodePadding?: number;
  /** Ribbon fill opacity (0..1). Default 0.45. */
  ribbonOpacity?: number;
  /** Show category labels. Default true. */
  showLabels?: boolean;
  onNodeClick?: (node: AlluvialNode) => void;
  renderTooltip?: (ribbon: AlluvialRibbon) => ReactNode;
}

/**
 * Alluvial diagram — categorical flows across ordered stages. Category bars are
 * stacked per stage; ribbons show how records move between categories.
 * Responsive and SSR-safe.
 *
 * @example
 * <Alluvial flows={[{ path: ["A", "X"], value: 10 }]} />
 */
export function Alluvial(props: AlluvialProps) {
  const {
    flows,
    stageLabels,
    nodeWidth = 14,
    nodePadding = 8,
    ribbonOpacity = 0.45,
    showLabels = true,
    onNodeClick,
    renderTooltip,
    height = 360,
    ...base
  } = props;

  const tooltip = useTooltip<AlluvialRibbon>();
  const [hover, setHover] = useState<string | null>(null);
  const isEmpty = flows.length === 0;

  const topPad = stageLabels ? 22 : 6;

  return (
    <VisualizationContainer {...base} height={height} isEmpty={isEmpty} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const plotH = Math.max(1, h - topPad - 6);
        const layout = computeAlluvialLayout({
          flows,
          width: Math.max(1, width - 8),
          height: plotH,
          palette: theme.palette,
          nodeWidth,
          nodePadding,
        });

        return (
          <>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
              aria-label={base.labels?.ariaLabel ?? "Alluvial flow diagram"} style={{ display: "block" }}>
              <g transform={`translate(4,${topPad})`}>
                {stageLabels &&
                  Array.from({ length: layout.stageCount }, (_, s) => {
                    const node = layout.nodes.find((n) => n.stage === s);
                    if (!node) return null;
                    return (
                      <text key={s} x={(node.x0 + node.x1) / 2} y={-8} textAnchor="middle"
                        fontSize={theme.typography.fontSizeSm} fontWeight={theme.typography.fontWeightBold}
                        fontFamily={theme.typography.fontFamily} fill={theme.colors.textMuted}>
                        {stageLabels[s] ?? ""}
                      </text>
                    );
                  })}
                {layout.ribbons.map((r, i) => {
                  const key = `${r.stage}:${r.sourceCategory}`;
                  const key2 = `${r.stage + 1}:${r.targetCategory}`;
                  const active = hover == null || hover === key || hover === key2;
                  return (
                    <path key={i} d={r.path} fill="none" stroke={r.color}
                      strokeWidth={r.width} strokeOpacity={active ? ribbonOpacity : 0.08}
                      onMouseEnter={(e) => tooltip.show(r, e)}
                      onMouseMove={(e) => tooltip.move(e)}
                      onMouseLeave={() => tooltip.hide()}>
                      <title>{`${r.sourceCategory} → ${r.targetCategory}: ${formatNumber(r.value)}`}</title>
                    </path>
                  );
                })}
                {layout.nodes.map((n, i) => {
                  const key = `${n.stage}:${n.category}`;
                  return (
                    <g key={i}
                      onMouseEnter={() => setHover(key)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => onNodeClick?.(n)}
                      style={{ cursor: onNodeClick ? "pointer" : "default" }}>
                      <rect x={n.x0} y={n.y0} width={n.x1 - n.x0} height={Math.max(1, n.y1 - n.y0)}
                        rx={2} fill={n.color} />
                      {showLabels && n.y1 - n.y0 > 10 && (
                        <text x={n.stage === layout.stageCount - 1 ? n.x0 - 6 : n.x1 + 6}
                          y={(n.y0 + n.y1) / 2} dominantBaseline="central"
                          textAnchor={n.stage === layout.stageCount - 1 ? "end" : "start"}
                          fontSize={theme.typography.fontSizeSm} fontFamily={theme.typography.fontFamily}
                          fill={theme.colors.text}>
                          {n.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data) ?? (
                  <span>
                    <strong>{tooltip.state.data.sourceCategory}</strong> →{" "}
                    <strong>{tooltip.state.data.targetCategory}</strong>:{" "}
                    {formatNumber(tooltip.state.data.value)}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
