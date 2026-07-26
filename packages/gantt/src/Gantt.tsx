import { useMemo, type ReactNode } from "react";
import {
  useResolvedTheme,
  StateOverlay,
  Tooltip,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { linearScale, formatDate, extent } from "@zenith-visuals/utils";

export interface GanttTask {
  id: string;
  name: string;
  start: Date | string;
  end: Date | string;
  /** Completion ratio 0..1, rendered as an overlay fill. */
  progress?: number;
  /** Optional grouping/swimlane label. */
  group?: string;
  /** Render as a zero-width milestone diamond. */
  milestone?: boolean;
  color?: string;
}

export interface GanttProps extends Omit<BaseVisualizationProps, "height"> {
  data: readonly GanttTask[];
  /** Row height in px. Default 34. */
  rowHeight?: number;
  /** Width of the left task-name column in px. Default 200. */
  labelWidth?: number;
  /** Locale for date formatting. Default "en-US". */
  locale?: string;
  onTaskClick?: (task: GanttTask) => void;
  renderTooltip?: (task: GanttTask) => ReactNode;
}

const DAY = 86_400_000;

/**
 * A modern Gantt chart with grouping/swimlanes, milestones, progress overlays
 * and a date axis. Renders responsive, accessible SVG.
 *
 * @example
 * <Gantt data={[{ id: "1", name: "Design", start: "2026-01-01", end: "2026-01-10" }]} />
 */
export function Gantt(props: GanttProps) {
  const {
    data,
    rowHeight = 34,
    labelWidth = 200,
    locale = "en-US",
    onTaskClick,
    renderTooltip,
    theme: themeOverride,
    dir = "ltr",
    labels,
    className,
    style,
  } = props;

  const theme = useResolvedTheme(themeOverride);
  const tooltip = useTooltip<GanttTask>();

  const model = useMemo(() => {
    const tasks = data.map((t) => ({
      ...t,
      startMs: new Date(t.start).getTime(),
      endMs: new Date(t.end).getTime(),
    }));
    const [min, max] = extent(
      tasks.flatMap((t) => [t.startMs, t.endMs]),
      (v) => v,
    );
    return { tasks, min, max: Math.max(max, min + DAY) };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className={className} style={style}>
        <StateOverlay theme={theme} variant="empty" message={labels?.empty ?? "No tasks scheduled"} />
      </div>
    );
  }

  const chartWidth = 720;
  const axisHeight = 28;
  const height = axisHeight + model.tasks.length * rowHeight + theme.spacing(2);
  const totalWidth = labelWidth + chartWidth;
  const x = linearScale([model.min, model.max], [0, chartWidth]);

  // Weekly gridlines / axis ticks.
  const ticks: number[] = [];
  const firstTick = Math.ceil(model.min / (7 * DAY)) * 7 * DAY;
  for (let t = firstTick; t <= model.max; t += 7 * DAY) ticks.push(t);

  return (
    <div
      className={className}
      style={{
        overflowX: "auto",
        background: theme.colors.background,
        borderRadius: theme.radii.lg,
        direction: dir,
        ...style,
      }}
    >
      <svg
        width={totalWidth}
        height={height}
        viewBox={`0 0 ${totalWidth} ${height}`}
        role="img"
        aria-label={labels?.ariaLabel ?? "Gantt chart"}
        style={{ display: "block", fontFamily: theme.typography.fontFamily }}
      >
        {/* Axis + gridlines */}
        <g transform={`translate(${labelWidth},0)`}>
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={x(t)}
                y1={axisHeight}
                x2={x(t)}
                y2={height}
                stroke={theme.colors.border}
                strokeWidth={1}
                strokeDasharray="2 3"
              />
              <text
                x={x(t)}
                y={axisHeight - 8}
                fontSize={theme.typography.fontSizeSm}
                fill={theme.colors.textMuted}
                textAnchor="middle"
              >
                {formatDate(new Date(t), { locale, month: "short", day: "numeric" })}
              </text>
            </g>
          ))}
        </g>

        {/* Rows */}
        {model.tasks.map((task, i) => {
          const y = axisHeight + i * rowHeight;
          const barX = labelWidth + x(task.startMs);
          const barW = Math.max(task.milestone ? 0 : 4, x(task.endMs) - x(task.startMs));
          const barH = rowHeight - 12;
          const barY = y + 6;
          const color = task.color ?? theme.palette[i % theme.palette.length]!;

          return (
            <g
              key={task.id}
              style={{ cursor: onTaskClick ? "pointer" : "default" }}
              onClick={() => onTaskClick?.(task)}
              onMouseEnter={(e) => tooltip.show(task, e)}
              onMouseMove={(e) => tooltip.move(e)}
              onMouseLeave={tooltip.hide}
            >
              {i % 2 === 1 && (
                <rect x={0} y={y} width={totalWidth} height={rowHeight} fill={theme.colors.muted} opacity={0.35} />
              )}
              <text
                x={theme.spacing(2)}
                y={y + rowHeight / 2 + 4}
                fontSize={theme.typography.fontSize}
                fill={theme.colors.text}
              >
                {truncate(task.name, 26)}
              </text>

              {task.milestone ? (
                <path
                  d={diamond(barX, barY + barH / 2, barH / 1.4)}
                  fill={color}
                  stroke={theme.colors.background}
                />
              ) : (
                <>
                  <rect x={barX} y={barY} width={barW} height={barH} rx={theme.radii.sm} fill={color} opacity={0.35} />
                  <rect
                    x={barX}
                    y={barY}
                    width={barW * Math.min(1, Math.max(0, task.progress ?? 1))}
                    height={barH}
                    rx={theme.radii.sm}
                    fill={color}
                  />
                </>
              )}
            </g>
          );
        })}
      </svg>

      <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
        {tooltip.state.data &&
          (renderTooltip?.(tooltip.state.data) ?? (
            <span>
              <strong>{tooltip.state.data.name}</strong>
              <br />
              {formatDate(new Date(tooltip.state.data.start), { locale, dateStyle: "medium" })} →{" "}
              {formatDate(new Date(tooltip.state.data.end), { locale, dateStyle: "medium" })}
            </span>
          ))}
      </Tooltip>
    </div>
  );
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function diamond(cx: number, cy: number, r: number): string {
  return `M${cx},${cy - r} L${cx + r},${cy} L${cx},${cy + r} L${cx - r},${cy} Z`;
}
