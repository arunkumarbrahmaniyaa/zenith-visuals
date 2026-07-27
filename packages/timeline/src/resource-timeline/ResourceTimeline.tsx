import { useMemo, type ReactNode } from "react";
import {
  useResolvedTheme,
  StateOverlay,
  Tooltip,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { linearScale, formatDate } from "@zenith-visuals/utils";
import {
  computeResourceTimeline,
  type ResourceBar,
  type ResourceTask,
} from "./layout";
import { niceTimeTicks } from "../lib/time";

export interface ResourceTimelineProps
  extends Omit<BaseVisualizationProps, "height"> {
  data: readonly ResourceTask[];
  /** Height of a single stacked bar (px). Default 22. */
  barHeight?: number;
  /** Width of the left resource-name column (px). Default 160. */
  labelWidth?: number;
  /** Width of the plotting area (px). Default 640. */
  chartWidth?: number;
  /** Locale for date formatting. Default "en-US". */
  locale?: string;
  onTaskClick?: (task: ResourceBar) => void;
  renderTooltip?: (task: ResourceBar) => ReactNode;
}

/**
 * A resource-scheduling timeline: one row per resource, with allocations laid
 * out along a shared time axis and overlapping tasks stacked into sub-lanes.
 * Renders responsive, accessible SVG.
 *
 * @example
 * <ResourceTimeline data={[{ id: "1", resource: "Alice", start: "2026-01-01", end: "2026-01-05" }]} />
 */
export function ResourceTimeline(props: ResourceTimelineProps) {
  const {
    data,
    barHeight = 22,
    labelWidth = 160,
    chartWidth = 640,
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
  const tooltip = useTooltip<ResourceBar>();

  const model = useMemo(
    () => computeResourceTimeline(data, { barHeight }),
    [data, barHeight],
  );

  if (data.length === 0) {
    return (
      <div className={className} style={style}>
        <StateOverlay
          theme={theme}
          variant="empty"
          message={labels?.empty ?? "No allocations scheduled"}
        />
      </div>
    );
  }

  const axisHeight = 26;
  const height = axisHeight + model.contentHeight + theme.spacing(2);
  const totalWidth = labelWidth + chartWidth;
  const x = linearScale([model.min, model.max], [0, chartWidth]);
  const ticks = niceTimeTicks(model.min, model.max, 6, locale);

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
        aria-label={labels?.ariaLabel ?? "Resource timeline"}
        style={{ display: "block", fontFamily: theme.typography.fontFamily }}
      >
        {/* Axis + gridlines */}
        <g transform={`translate(${labelWidth},0)`}>
          {ticks.map((tick) => (
            <g key={tick.value}>
              <line
                x1={x(tick.value)}
                x2={x(tick.value)}
                y1={axisHeight - 6}
                y2={height}
                stroke={theme.colors.border}
                strokeWidth={1}
              />
              <text
                x={x(tick.value)}
                y={axisHeight - 12}
                textAnchor="middle"
                fontSize={theme.typography.fontSizeSm}
                fill={theme.colors.textMuted}
              >
                {tick.label}
              </text>
            </g>
          ))}
        </g>

        {/* Rows */}
        {model.rows.map((row, ri) => {
          const rowTop = axisHeight + row.y;
          return (
            <g key={row.resource}>
              {ri % 2 === 1 && (
                <rect
                  x={0}
                  y={rowTop - 2}
                  width={totalWidth}
                  height={row.height + 4}
                  fill={theme.colors.muted}
                  opacity={0.35}
                />
              )}
              <text
                x={theme.spacing(1.5)}
                y={rowTop + row.height / 2}
                dominantBaseline="middle"
                fontSize={theme.typography.fontSize}
                fontWeight={theme.typography.fontWeightBold}
                fill={theme.colors.text}
              >
                {row.resource}
              </text>
              <g transform={`translate(${labelWidth},0)`}>
                {row.bars.map((bar) => {
                  const bx = x(bar.startMs);
                  const bw = Math.max(2, x(bar.endMs) - bx);
                  const by = rowTop + bar.lane * (barHeight + 3);
                  const fill = bar.color ?? theme.palette[ri % theme.palette.length]!;
                  return (
                    <g
                      key={bar.id}
                      style={{ cursor: onTaskClick ? "pointer" : "default" }}
                      onClick={() => onTaskClick?.(bar)}
                      onMouseEnter={(e) => tooltip.show(bar, e)}
                      onMouseMove={(e) => tooltip.move(e)}
                      onMouseLeave={() => tooltip.hide()}
                    >
                      <rect
                        x={bx}
                        y={by}
                        width={bw}
                        height={barHeight}
                        rx={theme.radii.sm}
                        fill={fill}
                      />
                      {bar.label && bw > 34 && (
                        <text
                          x={bx + 6}
                          y={by + barHeight / 2}
                          dominantBaseline="middle"
                          fontSize={theme.typography.fontSizeSm}
                          fill={theme.colors.background}
                        >
                          {bar.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </g>
          );
        })}
      </svg>

      <Tooltip
        theme={theme}
        open={tooltip.state.open}
        x={tooltip.state.x}
        y={tooltip.state.y}
      >
        {tooltip.state.data &&
          (renderTooltip?.(tooltip.state.data) ?? (
            <div>
              <strong>{tooltip.state.data.label || tooltip.state.data.resource}</strong>
              <div style={{ color: theme.colors.textMuted }}>
                {formatDate(new Date(tooltip.state.data.startMs), {
                  locale,
                  dateStyle: "medium",
                })}
                {" – "}
                {formatDate(new Date(tooltip.state.data.endMs), {
                  locale,
                  dateStyle: "medium",
                })}
              </div>
            </div>
          ))}
      </Tooltip>
    </div>
  );
}
