import { useMemo, type ReactNode } from "react";
import {
  useResolvedTheme,
  StateOverlay,
  Tooltip,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { linearScale, formatDate } from "@zenith-visuals/utils";
import { computeSwimlane, type SwimlaneEvent, type SwimlaneItem } from "./layout";
import { niceTimeTicks } from "../lib/time";

export interface SwimlaneProps extends Omit<BaseVisualizationProps, "height"> {
  data: readonly SwimlaneEvent[];
  /** Height of a single stacked event row (px). Default 26. */
  eventHeight?: number;
  /** Width of the left lane-name column (px). Default 160. */
  labelWidth?: number;
  /** Width of the plotting area (px). Default 640. */
  chartWidth?: number;
  /** Locale for date formatting. Default "en-US". */
  locale?: string;
  onEventClick?: (event: SwimlaneItem) => void;
  renderTooltip?: (event: SwimlaneItem) => ReactNode;
}

/**
 * A swimlane chart: events grouped into horizontal lane bands along a shared
 * time axis. Spanning events render as pills, point events as milestone
 * diamonds; overlapping events stack within their lane. Accessible SVG.
 *
 * @example
 * <Swimlane data={[{ id: "1", lane: "Build", start: "2026-01-01", end: "2026-01-04" }]} />
 */
export function Swimlane(props: SwimlaneProps) {
  const {
    data,
    eventHeight = 26,
    labelWidth = 160,
    chartWidth = 640,
    locale = "en-US",
    onEventClick,
    renderTooltip,
    theme: themeOverride,
    dir = "ltr",
    labels,
    className,
    style,
  } = props;

  const theme = useResolvedTheme(themeOverride);
  const tooltip = useTooltip<SwimlaneItem>();

  const model = useMemo(
    () => computeSwimlane(data, { eventHeight }),
    [data, eventHeight],
  );

  if (data.length === 0) {
    return (
      <div className={className} style={style}>
        <StateOverlay
          theme={theme}
          variant="empty"
          message={labels?.empty ?? "No events to display"}
        />
      </div>
    );
  }

  const axisHeight = 26;
  const bandPadding = 6;
  const rowGap = 4;
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
        aria-label={labels?.ariaLabel ?? "Swimlane chart"}
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

        {/* Lane bands */}
        {model.bands.map((band) => {
          const bandTop = axisHeight + band.y;
          const laneColor = theme.palette[band.index % theme.palette.length]!;
          return (
            <g key={band.lane}>
              <rect
                x={0}
                y={bandTop}
                width={totalWidth}
                height={band.height}
                fill={laneColor}
                opacity={0.08}
              />
              <rect
                x={0}
                y={bandTop}
                width={4}
                height={band.height}
                fill={laneColor}
              />
              <text
                x={theme.spacing(2)}
                y={bandTop + band.height / 2}
                dominantBaseline="middle"
                fontSize={theme.typography.fontSize}
                fontWeight={theme.typography.fontWeightBold}
                fill={theme.colors.text}
              >
                {band.lane}
              </text>
              <g transform={`translate(${labelWidth},0)`}>
                {band.items.map((item) => {
                  const iy = bandTop + bandPadding + item.row * (eventHeight + rowGap);
                  const fill = item.color ?? laneColor;
                  const handlers = {
                    style: { cursor: onEventClick ? "pointer" : "default" },
                    onClick: () => onEventClick?.(item),
                    onMouseEnter: (e: React.MouseEvent) => tooltip.show(item, e),
                    onMouseMove: (e: React.MouseEvent) => tooltip.move(e),
                    onMouseLeave: () => tooltip.hide(),
                  };
                  if (item.milestone) {
                    const cx = x(item.startMs);
                    const cy = iy + eventHeight / 2;
                    const r = eventHeight / 2.6;
                    return (
                      <g key={item.id} {...handlers}>
                        <path
                          d={`M ${cx} ${cy - r} L ${cx + r} ${cy} L ${cx} ${cy + r} L ${cx - r} ${cy} Z`}
                          fill={fill}
                          stroke={theme.colors.background}
                          strokeWidth={1}
                        />
                      </g>
                    );
                  }
                  const bx = x(item.startMs);
                  const bw = Math.max(2, x(item.endMs) - bx);
                  return (
                    <g key={item.id} {...handlers}>
                      <rect
                        x={bx}
                        y={iy}
                        width={bw}
                        height={eventHeight}
                        rx={eventHeight / 2}
                        fill={fill}
                      />
                      {item.label && bw > 40 && (
                        <text
                          x={bx + 10}
                          y={iy + eventHeight / 2}
                          dominantBaseline="middle"
                          fontSize={theme.typography.fontSizeSm}
                          fill={theme.colors.background}
                        >
                          {item.label}
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
              <strong>{tooltip.state.data.label || tooltip.state.data.lane}</strong>
              <div style={{ color: theme.colors.textMuted }}>
                {tooltip.state.data.milestone
                  ? formatDate(new Date(tooltip.state.data.startMs), {
                      locale,
                      dateStyle: "medium",
                    })
                  : `${formatDate(new Date(tooltip.state.data.startMs), {
                      locale,
                      dateStyle: "medium",
                    })} – ${formatDate(new Date(tooltip.state.data.endMs), {
                      locale,
                      dateStyle: "medium",
                    })}`}
              </div>
            </div>
          ))}
      </Tooltip>
    </div>
  );
}
