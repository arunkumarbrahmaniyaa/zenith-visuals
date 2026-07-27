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
  computeEventDrops,
  type DropPoint,
  type EventDropsRow,
} from "./layout";
import { niceTimeTicks } from "../lib/time";

interface HoverDrop extends DropPoint {
  lane: string;
}

export interface EventDropsProps
  extends Omit<BaseVisualizationProps, "height"> {
  data: readonly EventDropsRow[];
  /** Height allotted to each row (px). Default 34. */
  rowHeight?: number;
  /** Width of the left row-name column (px). Default 140. */
  labelWidth?: number;
  /** Width of the plotting area (px). Default 640. */
  chartWidth?: number;
  /** Base drop radius (px). Default 4. */
  dropRadius?: number;
  /** Locale for date formatting. Default "en-US". */
  locale?: string;
  renderTooltip?: (drop: DropPoint & { lane: string }) => ReactNode;
}

/**
 * An event-drops chart: categorical event streams rendered as rows of dots
 * along a shared time axis, ideal for visualizing occurrence density over
 * time. Drop size scales with optional event magnitude. Accessible SVG.
 *
 * @example
 * <EventDrops data={[{ label: "Deploys", events: [{ time: "2026-01-01" }] }]} />
 */
export function EventDrops(props: EventDropsProps) {
  const {
    data,
    rowHeight = 34,
    labelWidth = 140,
    chartWidth = 640,
    dropRadius = 4,
    locale = "en-US",
    renderTooltip,
    theme: themeOverride,
    dir = "ltr",
    labels,
    className,
    style,
  } = props;

  const theme = useResolvedTheme(themeOverride);
  const tooltip = useTooltip<HoverDrop>();

  const model = useMemo(
    () => computeEventDrops(data, { rowHeight }),
    [data, rowHeight],
  );

  if (data.length === 0) {
    return (
      <div className={className} style={style}>
        <StateOverlay
          theme={theme}
          variant="empty"
          message={labels?.empty ?? "No events recorded"}
        />
      </div>
    );
  }

  const axisHeight = 26;
  const height = axisHeight + model.contentHeight + theme.spacing(2);
  const totalWidth = labelWidth + chartWidth;
  const x = linearScale([model.min, model.max], [0, chartWidth]);
  const ticks = niceTimeTicks(model.min, model.max, 6, locale);
  const radiusScale = linearScale([1, model.maxMagnitude], [dropRadius, dropRadius * 2.4]);

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
        aria-label={labels?.ariaLabel ?? "Event drops chart"}
        style={{ display: "block", fontFamily: theme.typography.fontFamily }}
      >
        {/* Axis */}
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
        {model.lanes.map((lane) => {
          const cy = axisHeight + lane.y;
          const color = lane.color ?? theme.palette[lane.index % theme.palette.length]!;
          return (
            <g key={lane.label}>
              {lane.index % 2 === 1 && (
                <rect
                  x={0}
                  y={axisHeight + lane.index * rowHeight}
                  width={totalWidth}
                  height={rowHeight}
                  fill={theme.colors.muted}
                  opacity={0.3}
                />
              )}
              <line
                x1={labelWidth}
                x2={totalWidth}
                y1={cy}
                y2={cy}
                stroke={theme.colors.border}
                strokeWidth={1}
                strokeDasharray="2 3"
              />
              <text
                x={theme.spacing(1.5)}
                y={cy}
                dominantBaseline="middle"
                fontSize={theme.typography.fontSize}
                fontWeight={theme.typography.fontWeightBold}
                fill={theme.colors.text}
              >
                {lane.label}
              </text>
              <text
                x={labelWidth - theme.spacing(1.5)}
                y={cy}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={theme.typography.fontSizeSm}
                fill={theme.colors.textMuted}
              >
                {lane.count}
              </text>
              <g transform={`translate(${labelWidth},0)`}>
                {lane.drops.map((drop, di) => (
                  <circle
                    key={di}
                    cx={x(drop.timeMs)}
                    cy={lane.y}
                    r={radiusScale(drop.magnitude)}
                    fill={color}
                    fillOpacity={0.7}
                    onMouseEnter={(e) => tooltip.show({ ...drop, lane: lane.label }, e)}
                    onMouseMove={(e) => tooltip.move(e)}
                    onMouseLeave={() => tooltip.hide()}
                  />
                ))}
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
        {tooltip.state.data && (
          <div>
            <strong>{tooltip.state.data.label || tooltip.state.data.lane}</strong>
            <div style={{ color: theme.colors.textMuted }}>
              {renderTooltip
                ? renderTooltip(tooltip.state.data)
                : formatDate(new Date(tooltip.state.data.timeMs), {
                    locale,
                    dateStyle: "medium",
                    timeStyle: undefined,
                  })}
            </div>
          </div>
        )}
      </Tooltip>
    </div>
  );
}
