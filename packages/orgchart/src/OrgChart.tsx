import { useState, type ReactNode } from "react";
import { useResolvedTheme, StateOverlay, type BaseVisualizationProps } from "@zenith-visuals/core";
import { computeOrgLayout, type OrgNode } from "./layout";

export interface OrgChartProps extends Omit<BaseVisualizationProps, "width" | "height"> {
  /** The root of the organization tree. */
  data: OrgNode;
  nodeWidth?: number;
  nodeHeight?: number;
  /** Horizontal gap between sibling cards. Default 24. */
  hGap?: number;
  /** Vertical gap between levels. Default 48. */
  vGap?: number;
  /** Allow collapsing/expanding subtrees by clicking a node. Default true. */
  collapsible?: boolean;
  onNodeClick?: (node: OrgNode) => void;
  /** Custom card renderer. */
  renderCard?: (node: OrgNode) => ReactNode;
}

/**
 * Enterprise-ready org chart with a tidy tree layout, collapsible subtrees and
 * custom cards. Renders accessible SVG connectors with HTML cards on top.
 *
 * @example
 * <OrgChart data={{ id: "1", name: "CEO", children: [...] }} />
 */
export function OrgChart(props: OrgChartProps) {
  const {
    data,
    nodeWidth = 180,
    nodeHeight = 64,
    hGap = 24,
    vGap = 48,
    collapsible = true,
    onNodeClick,
    renderCard,
    theme: themeOverride,
    dir = "ltr",
    labels,
    className,
    style,
  } = props;

  const theme = useResolvedTheme(themeOverride);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());

  if (!data) {
    return (
      <div className={className} style={style}>
        <StateOverlay theme={theme} variant="empty" message={labels?.empty ?? "No organization data"} />
      </div>
    );
  }

  const layout = computeOrgLayout({ root: data, nodeWidth, nodeHeight, hGap, vGap, collapsed });
  const posById = new Map(layout.nodes.map((p) => [p.node.id, p]));

  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div
      className={className}
      style={{
        position: "relative",
        overflow: "auto",
        background: theme.colors.background,
        borderRadius: theme.radii.lg,
        direction: dir,
        ...style,
      }}
      role="tree"
      aria-label={labels?.ariaLabel ?? "Organization chart"}
    >
      <div style={{ position: "relative", width: layout.width, height: layout.height }}>
        <svg
          width={layout.width}
          height={layout.height}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          aria-hidden
        >
          {layout.edges.map((edge, i) => {
            const from = posById.get(edge.from);
            const to = posById.get(edge.to);
            if (!from || !to) return null;
            const x1 = from.x + nodeWidth / 2;
            const y1 = from.y + nodeHeight;
            const x2 = to.x + nodeWidth / 2;
            const y2 = to.y;
            const midY = (y1 + y2) / 2;
            return (
              <path
                key={i}
                d={`M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}`}
                fill="none"
                stroke={theme.colors.border}
                strokeWidth={1.5}
              />
            );
          })}
        </svg>

        {layout.nodes.map((p) => {
          const hasChildren = p.node.children && p.node.children.length > 0;
          const isCollapsed = collapsed.has(p.node.id);
          return (
            <div
              key={p.node.id}
              role="treeitem"
              aria-expanded={hasChildren ? !isCollapsed : undefined}
              tabIndex={0}
              onClick={() => {
                onNodeClick?.(p.node);
                if (collapsible && hasChildren) toggle(p.node.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onNodeClick?.(p.node);
                  if (collapsible && hasChildren) toggle(p.node.id);
                }
              }}
              style={{
                position: "absolute",
                left: p.x,
                top: p.y,
                width: nodeWidth,
                height: nodeHeight,
                boxSizing: "border-box",
                cursor: collapsible && hasChildren ? "pointer" : onNodeClick ? "pointer" : "default",
                outlineColor: theme.colors.focusRing,
              }}
            >
              {renderCard ? (
                renderCard(p.node)
              ) : (
                <DefaultCard node={p.node} collapsed={isCollapsed} hasChildren={!!hasChildren} theme={theme} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DefaultCard(props: {
  node: OrgNode;
  collapsed: boolean;
  hasChildren: boolean;
  theme: ReturnType<typeof useResolvedTheme>;
}) {
  const { node, collapsed, hasChildren, theme } = props;
  const initials = node.name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(2),
        height: "100%",
        padding: theme.spacing(2),
        boxSizing: "border-box",
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radii.md,
        boxShadow: theme.shadows.sm,
        fontFamily: theme.typography.fontFamily,
      }}
    >
      {node.avatarUrl ? (
        <img
          src={node.avatarUrl}
          alt={node.name}
          width={36}
          height={36}
          style={{ borderRadius: theme.radii.full, objectFit: "cover", flexShrink: 0 }}
        />
      ) : (
        <span
          aria-hidden
          style={{
            display: "grid",
            placeItems: "center",
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: theme.radii.full,
            background: theme.colors.muted,
            color: theme.colors.textMuted,
            fontWeight: theme.typography.fontWeightBold,
          }}
        >
          {initials}
        </span>
      )}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: theme.typography.fontSize,
            fontWeight: theme.typography.fontWeightBold,
            color: theme.colors.text,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {node.name}
        </div>
        {node.title && (
          <div
            style={{
              fontSize: theme.typography.fontSizeSm,
              color: theme.colors.textMuted,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {node.title}
          </div>
        )}
      </div>
      {hasChildren && collapsed && (
        <span
          aria-hidden
          style={{
            marginLeft: "auto",
            fontSize: theme.typography.fontSizeSm,
            color: theme.colors.primary,
            fontWeight: theme.typography.fontWeightBold,
          }}
        >
          +
        </span>
      )}
    </div>
  );
}
