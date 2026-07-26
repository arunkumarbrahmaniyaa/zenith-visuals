import { useResolvedTheme, StateOverlay, type BaseVisualizationProps, type ZenithTheme } from "@zenith-visuals/core";
import {
  computeAgentLayout,
  type AgentEdgeInput,
  type AgentNode,
  type AgentNodeInput,
  type AgentNodeStatus,
} from "./layout";

export interface AgentGraphProps extends Omit<BaseVisualizationProps, "width" | "height"> {
  data: {
    nodes: readonly AgentNodeInput[];
    edges: readonly AgentEdgeInput[];
  };
  nodeWidth?: number;
  nodeHeight?: number;
  hGap?: number;
  vGap?: number;
  /** Show token/latency badges under running/finished nodes. Default true. */
  showMetrics?: boolean;
  onNodeClick?: (node: AgentNode) => void;
}

const STATUS_COLOR = (status: AgentNodeStatus | undefined, theme: ZenithTheme): string => {
  switch (status) {
    case "running":
    case "streaming":
      return theme.colors.info;
    case "success":
      return theme.colors.success;
    case "error":
      return theme.colors.danger;
    default:
      return theme.colors.border;
  }
};

/**
 * Visualize an AI system's execution graph — agents, planners, retrievers,
 * vector stores, LLMs, tools and memory — with live status, token usage and
 * latency. Layered DAG layout; accessible SVG. SSR-safe.
 *
 * @example
 * <AgentGraph data={{ nodes, edges }} />
 */
export function AgentGraph(props: AgentGraphProps) {
  const {
    data,
    nodeWidth = 150,
    nodeHeight = 60,
    hGap = 56,
    vGap = 24,
    showMetrics = true,
    onNodeClick,
    theme: themeOverride,
    dir = "ltr",
    labels,
    className,
    style,
  } = props;

  const theme = useResolvedTheme(themeOverride);

  if (!data.nodes?.length) {
    return (
      <div className={className} style={style}>
        <StateOverlay theme={theme} variant="empty" message={labels?.empty ?? "No agent graph"} />
      </div>
    );
  }

  const layout = computeAgentLayout({
    nodes: data.nodes,
    edges: data.edges,
    nodeWidth,
    nodeHeight,
    hGap,
    vGap,
  });
  const byId = new Map(layout.nodes.map((n) => [n.id, n]));
  const pad = 8;

  return (
    <div
      className={className}
      style={{ overflow: "auto", background: theme.colors.background, borderRadius: theme.radii.lg, direction: dir, ...style }}
    >
      <svg
        width={layout.width + pad * 2}
        height={layout.height + pad * 2}
        viewBox={`0 0 ${layout.width + pad * 2} ${layout.height + pad * 2}`}
        role="img"
        aria-label={labels?.ariaLabel ?? "AI agent execution graph"}
        style={{ display: "block", fontFamily: theme.typography.fontFamily }}
      >
        <defs>
          <marker id="zv-ai-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={theme.colors.textMuted} />
          </marker>
        </defs>
        <g transform={`translate(${pad},${pad})`}>
          {layout.edges.map((edge, i) => {
            const s = byId.get(edge.source);
            const t = byId.get(edge.target);
            if (!s || !t) return null;
            const x1 = s.x + nodeWidth;
            const y1 = s.y + nodeHeight / 2;
            const x2 = t.x;
            const y2 = t.y + nodeHeight / 2;
            const mx = (x1 + x2) / 2;
            return (
              <path
                key={i}
                d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                fill="none"
                stroke={edge.active ? theme.colors.info : theme.colors.border}
                strokeWidth={edge.active ? 2.5 : 1.5}
                strokeDasharray={edge.active ? "6 4" : undefined}
                markerEnd="url(#zv-ai-arrow)"
              >
                {edge.active && !theme.motion.reducedMotion && (
                  <animate attributeName="stroke-dashoffset" from="10" to="0" dur="0.6s" repeatCount="indefinite" />
                )}
              </path>
            );
          })}

          {layout.nodes.map((node) => {
            const accent = STATUS_COLOR(node.status, theme);
            return (
              <g
                key={node.id}
                transform={`translate(${node.x},${node.y})`}
                style={{ cursor: onNodeClick ? "pointer" : "default" }}
                onClick={() => onNodeClick?.(node)}
              >
                <rect
                  width={nodeWidth}
                  height={nodeHeight}
                  rx={theme.radii.md}
                  fill={theme.colors.surface}
                  stroke={accent}
                  strokeWidth={2}
                />
                <rect width={4} height={nodeHeight} rx={2} fill={accent} />
                {node.type && (
                  <text x={12} y={20} fontSize={theme.typography.fontSizeSm} fill={theme.colors.textMuted}>
                    {node.type.toUpperCase()}
                  </text>
                )}
                <text
                  x={12}
                  y={node.type ? 38 : 26}
                  fontSize={theme.typography.fontSize}
                  fontWeight={theme.typography.fontWeightBold}
                  fill={theme.colors.text}
                >
                  {node.label}
                </text>
                {showMetrics && (node.tokens != null || node.latencyMs != null) && (
                  <text x={12} y={nodeHeight - 10} fontSize={theme.typography.fontSizeSm} fill={theme.colors.textMuted}>
                    {[
                      node.tokens != null ? `${node.tokens} tok` : null,
                      node.latencyMs != null ? `${node.latencyMs} ms` : null,
                      node.retries ? `↻${node.retries}` : null,
                    ]
                      .filter(Boolean)
                      .join("  ·  ")}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
