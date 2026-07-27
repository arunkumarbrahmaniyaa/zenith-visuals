import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { sequentialScale } from "@zenith-visuals/utils";
import { adjacencyMatrix, normalizeGraph, type GraphLinkInput, type GraphNode, type GraphNodeInput } from "./graph";

export interface AdjacencyCell {
  source: GraphNode;
  target: GraphNode;
  value: number;
}

export interface AdjacencyMatrixProps extends BaseVisualizationProps {
  data: {
    nodes?: readonly GraphNodeInput[];
    links: readonly GraphLinkInput[];
  };
  /** Show row / column labels. Default true. */
  showLabels?: boolean;
  renderTooltip?: (cell: AdjacencyCell) => ReactNode;
}

/**
 * An adjacency matrix: every node forms a row and a column, and each cell is
 * shaded by the strength of the connection between the two nodes. Rows and
 * columns are ordered by group so communities appear as diagonal blocks.
 * Scales gracefully to dense graphs where node-link diagrams turn to spaghetti.
 *
 * @example
 * <AdjacencyMatrix data={{ links: [{ source: "a", target: "b" }] }} />
 */
export function AdjacencyMatrix(props: AdjacencyMatrixProps) {
  const { data, showLabels = true, renderTooltip, height = 400, ...base } = props;
  const tooltip = useTooltip<AdjacencyCell>();
  const [hover, setHover] = useState<{ i: number; j: number } | null>(null);
  const isEmpty = !data.links?.length && !data.nodes?.length;

  return (
    <VisualizationContainer {...base} height={height} isEmpty={isEmpty} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const graph = normalizeGraph(data.nodes, data.links);
        const { order, matrix, max } = adjacencyMatrix(graph);
        const n = order.length;

        const labelSpace = showLabels ? 96 : 12;
        const pad = 8;
        const available = Math.max(1, Math.min(width, h) - labelSpace - pad);
        const cell = n > 0 ? available / n : 0;
        const gridX = labelSpace;
        const gridY = labelSpace;

        const ramp = sequentialScale(theme.sequential);
        const colorFor = (v: number) => (v <= 0 || max <= 0 ? theme.colors.surface : ramp(0.15 + (v / max) * 0.85));

        return (
          <>
            <svg
              width={width}
              height={h}
              viewBox={`0 0 ${width} ${h}`}
              role="img"
              aria-label={base.labels?.ariaLabel ?? "Adjacency matrix"}
              style={{ display: "block" }}
            >
              {showLabels &&
                order.map((node, i) => {
                  const active = hover != null && (hover.i === i || hover.j === i);
                  return (
                    <g key={`lbl-${node.id}`}>
                      <text
                        x={gridX - 6}
                        y={gridY + i * cell + cell / 2}
                        textAnchor="end"
                        dominantBaseline="middle"
                        fontSize={theme.typography.fontSizeSm}
                        fontFamily={theme.typography.fontFamily}
                        fill={active ? theme.colors.primary : theme.colors.textMuted}
                        fontWeight={active ? theme.typography.fontWeightBold : theme.typography.fontWeight}
                      >
                        {node.label}
                      </text>
                      <text
                        x={gridX + i * cell + cell / 2}
                        y={gridY - 6}
                        transform={`rotate(-45 ${gridX + i * cell + cell / 2} ${gridY - 6})`}
                        textAnchor="start"
                        dominantBaseline="middle"
                        fontSize={theme.typography.fontSizeSm}
                        fontFamily={theme.typography.fontFamily}
                        fill={active ? theme.colors.primary : theme.colors.textMuted}
                        fontWeight={active ? theme.typography.fontWeightBold : theme.typography.fontWeight}
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              <g>
                {order.map((rowNode, i) =>
                  order.map((colNode, j) => {
                    const value = matrix[i]![j]!;
                    const isHoverLine = hover != null && (hover.i === i || hover.j === j);
                    return (
                      <rect
                        key={`${i}-${j}`}
                        x={gridX + j * cell}
                        y={gridY + i * cell}
                        width={Math.max(0, cell - 1)}
                        height={Math.max(0, cell - 1)}
                        rx={1}
                        fill={i === j ? theme.colors.muted : colorFor(value)}
                        stroke={isHoverLine ? theme.colors.focusRing : "transparent"}
                        strokeWidth={isHoverLine ? 1 : 0}
                        onMouseEnter={(e) => {
                          setHover({ i, j });
                          if (i !== j) tooltip.show({ source: rowNode, target: colNode, value }, e);
                        }}
                        onMouseMove={(e) => tooltip.move(e)}
                        onMouseLeave={() => {
                          setHover(null);
                          tooltip.hide();
                        }}
                      >
                        <title>
                          {rowNode.label} → {colNode.label}: {value}
                        </title>
                      </rect>
                    );
                  }),
                )}
              </g>
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data) ?? (
                  <span>
                    <strong>{tooltip.state.data.source.label}</strong> →{" "}
                    <strong>{tooltip.state.data.target.label}</strong>: {tooltip.state.data.value}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
