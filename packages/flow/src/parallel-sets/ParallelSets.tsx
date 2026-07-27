import { useMemo, useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { formatNumber } from "@zenith-visuals/utils";
import { computeAlluvialLayout, type AlluvialFlow, type AlluvialRibbon } from "../alluvial/layout";
import { buildParallelSetFlows, firstDimensionCategories, type ParallelSetsRecord } from "./layout";

export interface ParallelSetsProps extends BaseVisualizationProps {
  /** Tabular records; each contributes to one flow through the dimensions. */
  data: readonly ParallelSetsRecord[];
  /** Ordered categorical dimension keys to render as vertical axes. */
  dimensions: readonly string[];
  /** Optional numeric key used to weight each record. Default: count of 1. */
  valueKey?: string;
  /** Human-readable labels for each dimension axis. */
  dimensionLabels?: readonly string[];
  /** Category bar thickness in px. Default 12. */
  nodeWidth?: number;
  /** Ribbon fill opacity (0..1). Default 0.55. */
  ribbonOpacity?: number;
  renderTooltip?: (ribbon: AlluvialRibbon) => ReactNode;
}

/**
 * Parallel sets — visualizes the joint distribution of several categorical
 * dimensions. Each dimension is a vertical axis of stacked category bands and
 * ribbons flow between adjacent axes, colored by the first dimension so you can
 * follow how one group splits across the others. Deterministic and SSR-safe.
 *
 * @example
 * <ParallelSets data={rows} dimensions={["class", "sex", "survived"]} />
 */
export function ParallelSets(props: ParallelSetsProps) {
  const {
    data,
    dimensions,
    valueKey,
    dimensionLabels,
    nodeWidth = 12,
    ribbonOpacity = 0.55,
    renderTooltip,
    height = 380,
    ...base
  } = props;

  const tooltip = useTooltip<AlluvialRibbon>();
  const [hover, setHover] = useState<string | null>(null);

  const flows = useMemo(
    () => buildParallelSetFlows(data, { dimensions, valueKey }),
    [data, dimensions, valueKey],
  );
  const isEmpty = flows.length === 0;

  return (
    <VisualizationContainer {...base} height={height} isEmpty={isEmpty} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const topPad = dimensionLabels ? 24 : 8;
        const firstCats = firstDimensionCategories(flows);
        const colorByFirst = new Map(
          firstCats.map((cat, i) => [cat, theme.palette[i % theme.palette.length]!] as const),
        );
        // Color each flow by its first-dimension category (the parallel-sets look).
        const colored: AlluvialFlow[] = flows.map((f) => ({
          ...f,
          color: colorByFirst.get(f.path[0] ?? "") ?? theme.colors.primary,
        }));

        const layout = computeAlluvialLayout({
          flows: colored,
          width,
          height: h - topPad,
          palette: theme.palette,
          nodeWidth,
          nodePadding: 10,
        });

        return (
          <>
            <svg
              width={width}
              height={h}
              viewBox={`0 0 ${width} ${h}`}
              role="img"
              aria-label={base.labels?.ariaLabel ?? "Parallel sets"}
              style={{ display: "block" }}
            >
              <g transform={`translate(0,${topPad})`}>
                <g>
                  {layout.ribbons.map((r, i) => {
                    const active = hover == null || hover === r.color;
                    return (
                      <path
                        key={i}
                        d={r.path}
                        fill="none"
                        stroke={r.color}
                        strokeOpacity={active ? ribbonOpacity : 0.08}
                        strokeWidth={r.width}
                        onMouseEnter={(e) => {
                          setHover(r.color);
                          tooltip.show(r, e);
                        }}
                        onMouseMove={(e) => tooltip.move(e)}
                        onMouseLeave={() => {
                          setHover(null);
                          tooltip.hide();
                        }}
                      >
                        <title>
                          {r.sourceCategory} → {r.targetCategory}: {formatNumber(r.value)}
                        </title>
                      </path>
                    );
                  })}
                </g>
                <g>
                  {layout.nodes.map((node) => (
                    <g key={`${node.stage}:${node.category}`}>
                      <rect
                        x={node.x0}
                        y={node.y0}
                        width={Math.max(1, node.x1 - node.x0)}
                        height={Math.max(0, node.y1 - node.y0)}
                        fill={theme.colors.textMuted}
                        rx={1}
                      />
                      <text
                        x={node.x0 + (node.stage === layout.stageCount - 1 ? -4 : nodeWidth + 4)}
                        y={(node.y0 + node.y1) / 2}
                        textAnchor={node.stage === layout.stageCount - 1 ? "end" : "start"}
                        dominantBaseline="middle"
                        fontSize={theme.typography.fontSizeSm}
                        fontFamily={theme.typography.fontFamily}
                        fill={theme.colors.text}
                      >
                        {node.category}
                      </text>
                    </g>
                  ))}
                </g>
              </g>
              {dimensionLabels && (
                <g>
                  {dimensions.map((_, s) => {
                    const x =
                      layout.stageCount === 1
                        ? 0
                        : (s / (layout.stageCount - 1)) * Math.max(1, width - nodeWidth) + nodeWidth / 2;
                    return (
                      <text
                        key={s}
                        x={x}
                        y={14}
                        textAnchor={s === 0 ? "start" : s === dimensions.length - 1 ? "end" : "middle"}
                        fontSize={theme.typography.fontSizeSm}
                        fontFamily={theme.typography.fontFamily}
                        fontWeight={theme.typography.fontWeightBold}
                        fill={theme.colors.textMuted}
                      >
                        {dimensionLabels[s] ?? ""}
                      </text>
                    );
                  })}
                </g>
              )}
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
