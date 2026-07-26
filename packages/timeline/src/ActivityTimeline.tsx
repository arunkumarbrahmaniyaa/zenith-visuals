import {
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import {
  StateOverlay,
  useResolvedTheme,
  type BaseVisualizationProps,
  type ZenithTheme,
} from "@zenith-visuals/core";
import { formatDate, groupBy } from "@zenith-visuals/utils";
import type { ActivityItem, ActivityStatus } from "./types";

export interface ActivityTimelineProps extends Omit<BaseVisualizationProps, "width"> {
  /** The activity events, newest-first or oldest-first (see `order`). */
  data: readonly ActivityItem[];
  /** Group consecutive items by calendar day with a date header. Default true. */
  groupByDay?: boolean;
  /** Locale used for date/time formatting. Default "en-US". */
  locale?: string;
  /** More items are available; enables infinite-scroll sentinel. */
  hasMore?: boolean;
  /** Called when the scroll sentinel becomes visible. */
  onLoadMore?: () => void;
  /** Called when an item is activated. */
  onItemClick?: (item: ActivityItem) => void;
  /** Fully custom item renderer. */
  renderItem?: (item: ActivityItem) => ReactNode;
}

const STATUS_COLOR: Record<ActivityStatus, keyof ZenithTheme["colors"]> = {
  default: "primary",
  success: "success",
  warning: "warning",
  danger: "danger",
  info: "info",
};

/**
 * A modern, GitHub-style vertical activity timeline with avatars, status
 * nodes, nested events, day grouping and infinite scrolling.
 *
 * Renders semantic `<ol>`/`<li>` markup for accessibility. SSR-safe.
 */
export function ActivityTimeline(props: ActivityTimelineProps) {
  const {
    data,
    groupByDay = true,
    locale = "en-US",
    hasMore = false,
    onLoadMore,
    onItemClick,
    renderItem,
    theme: themeOverride,
    loading = false,
    error,
    height,
    dir = "ltr",
    labels,
    className,
    style,
    renderEmpty,
  } = props;

  const theme = useResolvedTheme(themeOverride);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || !onLoadMore || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onLoadMore();
      },
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  const groups = useMemo(() => {
    if (!groupByDay) return [{ label: null as string | null, items: [...data] }];
    const byDay = groupBy(data, (item) =>
      formatDate(new Date(item.timestamp), { locale, dateStyle: "full" }),
    );
    return [...byDay.entries()].map(([label, items]) => ({ label, items }));
  }, [data, groupByDay, locale]);

  const rootStyle = {
    background: theme.colors.background,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize,
    borderRadius: theme.radii.lg,
    direction: dir,
    maxHeight: height,
    overflowY: height ? ("auto" as const) : ("visible" as const),
    padding: theme.spacing(1),
    ...style,
  };

  if (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return (
      <div className={className} style={rootStyle}>
        <StateOverlay theme={theme} variant="error" message={labels?.error ?? err.message} />
      </div>
    );
  }

  if (!loading && data.length === 0) {
    return (
      <div className={className} style={rootStyle}>
        {renderEmpty?.() ?? (
          <StateOverlay theme={theme} variant="empty" message={labels?.empty ?? "No activity yet"} />
        )}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={rootStyle}
      role="feed"
      aria-busy={loading || undefined}
      aria-label={labels?.ariaLabel ?? "Activity timeline"}
    >
      {groups.map((group, gi) => (
        <section key={group.label ?? gi} aria-label={group.label ?? undefined}>
          {group.label && (
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 1,
                padding: `${theme.spacing(1.5)}px ${theme.spacing(2)}px`,
                fontSize: theme.typography.fontSizeSm,
                fontWeight: theme.typography.fontWeightBold,
                color: theme.colors.textMuted,
                background: theme.colors.background,
              }}
            >
              {group.label}
            </div>
          )}
          <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {group.items.map((item) => (
              <TimelineRow
                key={item.id}
                item={item}
                theme={theme}
                locale={locale}
                depth={0}
                onItemClick={onItemClick}
                renderItem={renderItem}
              />
            ))}
          </ol>
        </section>
      ))}

      {loading && (
        <StateOverlay theme={theme} variant="loading" message={labels?.loading ?? "Loading…"} />
      )}
      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />}
    </div>
  );
}

function TimelineRow(props: {
  item: ActivityItem;
  theme: ZenithTheme;
  locale: string;
  depth: number;
  onItemClick?: (item: ActivityItem) => void;
  renderItem?: (item: ActivityItem) => ReactNode;
}) {
  const { item, theme, locale, depth, onItemClick, renderItem } = props;
  const statusKey = STATUS_COLOR[item.status ?? "default"];
  const nodeColor = theme.colors[statusKey];
  const interactive = Boolean(onItemClick);

  return (
    <li
      style={{
        position: "relative",
        display: "flex",
        gap: theme.spacing(2.5),
        paddingLeft: depth * theme.spacing(6),
        paddingBottom: theme.spacing(4),
      }}
    >
      {/* Connector line + node */}
      <div style={{ position: "relative", width: 28, flexShrink: 0 }}>
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 13,
            top: 22,
            bottom: -theme.spacing(4),
            width: 2,
            background: theme.colors.border,
          }}
        />
        <span
          aria-hidden
          style={{
            position: "relative",
            zIndex: 1,
            display: "grid",
            placeItems: "center",
            width: 28,
            height: 28,
            borderRadius: theme.radii.full,
            background: theme.colors.surface,
            border: `2px solid ${nodeColor}`,
            color: nodeColor,
            fontSize: theme.typography.fontSizeSm,
          }}
        >
          {item.icon ?? <Dot color={nodeColor} />}
        </span>
      </div>

      {/* Body */}
      <div
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={interactive ? () => onItemClick?.(item) : undefined}
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onItemClick?.(item);
                }
              }
            : undefined
        }
        style={{
          flex: 1,
          minWidth: 0,
          cursor: interactive ? "pointer" : "default",
          outlineColor: theme.colors.focusRing,
        }}
      >
        {renderItem ? (
          renderItem(item)
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: theme.spacing(2) }}>
              {item.actor && <Avatar actor={item.actor} theme={theme} />}
              <div style={{ fontWeight: theme.typography.fontWeightBold }}>{item.title}</div>
              <time
                dateTime={new Date(item.timestamp).toISOString()}
                style={{ marginLeft: "auto", color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm }}
              >
                {formatDate(new Date(item.timestamp), { locale, timeStyle: "short" })}
              </time>
            </div>
            {item.description && (
              <div style={{ marginTop: theme.spacing(1), color: theme.colors.textMuted }}>
                {item.description}
              </div>
            )}
          </>
        )}

        {item.children && item.children.length > 0 && (
          <ol style={{ listStyle: "none", margin: `${theme.spacing(3)}px 0 0`, padding: 0 }}>
            {item.children.map((child) => (
              <TimelineRow
                key={child.id}
                item={child}
                theme={theme}
                locale={locale}
                depth={depth + 1}
                onItemClick={onItemClick}
                renderItem={renderItem}
              />
            ))}
          </ol>
        )}
      </div>
    </li>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      style={{ width: 8, height: 8, borderRadius: 9999, background: color, display: "block" }}
    />
  );
}

function Avatar({ actor, theme }: { actor: { name: string; avatarUrl?: string }; theme: ZenithTheme }) {
  const initials = actor.name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
  if (actor.avatarUrl) {
    return (
      <img
        src={actor.avatarUrl}
        alt={actor.name}
        width={20}
        height={20}
        style={{ borderRadius: theme.radii.full, objectFit: "cover" }}
      />
    );
  }
  return (
    <span
      aria-label={actor.name}
      style={{
        display: "grid",
        placeItems: "center",
        width: 20,
        height: 20,
        borderRadius: theme.radii.full,
        background: theme.colors.muted,
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: theme.typography.fontWeightBold,
      }}
    >
      {initials}
    </span>
  );
}
