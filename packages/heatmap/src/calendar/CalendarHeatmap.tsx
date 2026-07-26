import {
  useCallback,
  useMemo,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  Tooltip,
  useResolvedTheme,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { formatDate, quantizeIndex, sequentialScale } from "@zenith-visuals/utils";
import { buildCalendarLayout, type CalendarCell, type CalendarDatum } from "./layout";

export interface CalendarHeatmapProps
  extends Omit<BaseVisualizationProps, "height" | "width"> {
  /** Daily observations. Values on the same day are summed. */
  data: readonly CalendarDatum[];
  /** Start of the visible range. Defaults to `rangeDays` before `endDate`. */
  startDate?: Date;
  /** End of the visible range (inclusive). Defaults to today. */
  endDate?: Date;
  /** Days shown when `startDate` is omitted. Default 365. */
  rangeDays?: number;
  /** First day of the week: 0 = Sunday (default) .. 6 = Saturday. */
  weekStartsOn?: number;
  /** Square cell size in px. Default 12. */
  cellSize?: number;
  /** Gap between cells in px. Default 3. */
  cellGap?: number;
  /** Corner radius of each cell in px. Default 2. */
  cellRadius?: number;
  /** Override the low→high color ramp. Defaults to the theme's sequential ramp. */
  colors?: string[];
  /** Show the month labels above the grid. Default true. */
  showMonthLabels?: boolean;
  /** Show weekday labels to the left. Default true. */
  showWeekdayLabels?: boolean;
  /** Show the intensity legend below the grid. Default true. */
  showLegend?: boolean;
  /** Locale used for tooltip/label formatting. Default "en-US". */
  locale?: string;
  /** Called when a day cell is activated (click or Enter/Space). */
  onCellClick?: (cell: CalendarDatum & { date: Date }, event?: MouseEvent | KeyboardEvent) => void;
  /** Custom tooltip content per cell. */
  renderTooltip?: (cell: { date: Date; value: number }) => ReactNode;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * GitHub-style calendar contribution heatmap.
 *
 * Beautiful by default, fully themeable, SSR-safe, keyboard navigable and
 * screen-reader friendly. Renders as accessible SVG.
 *
 * @example
 * <CalendarHeatmap data={[{ date: "2026-01-01", value: 3 }]} />
 */
export function CalendarHeatmap(props: CalendarHeatmapProps) {
  const {
    data,
    startDate,
    endDate,
    rangeDays = 365,
    weekStartsOn = 0,
    cellSize = 12,
    cellGap = 3,
    cellRadius = 2,
    colors,
    showMonthLabels = true,
    showWeekdayLabels = true,
    showLegend = true,
    locale = "en-US",
    theme: themeOverride,
    dir = "ltr",
    labels,
    className,
    style,
    onCellClick,
    renderTooltip,
  } = props;

  const theme = useResolvedTheme(themeOverride);
  const tooltip = useTooltip<CalendarCell>();
  const [focusIndex, setFocusIndex] = useState(0);

  const layout = useMemo(
    () =>
      buildCalendarLayout({
        data,
        start: startDate,
        end: endDate,
        weekStartsOn,
        rangeDays,
      }),
    [data, startDate, endDate, weekStartsOn, rangeDays],
  );

  const ramp = colors ?? theme.sequential;
  const colorFor = useMemo(() => {
    const scale = sequentialScale(ramp);
    const buckets = ramp.length;
    return (value: number) => {
      if (value <= 0) return theme.colors.muted;
      const idx = quantizeIndex(value, [1, Math.max(1, layout.maxValue)], buckets);
      return scale(idx / Math.max(1, buckets - 1));
    };
  }, [ramp, layout.maxValue, theme.colors.muted]);

  const step = cellSize + cellGap;
  const leftPad = showWeekdayLabels ? 30 : 0;
  const topPad = showMonthLabels ? 18 : 0;
  const gridWidth = layout.weeks * step;
  const gridHeight = 7 * step;
  const legendHeight = showLegend ? 24 : 0;
  const svgWidth = leftPad + gridWidth + cellGap;
  const svgHeight = topPad + gridHeight + legendHeight;

  // Only in-range cells participate in keyboard navigation.
  const focusableCells = useMemo(
    () => layout.cells.filter((c) => !c.outOfRange),
    [layout.cells],
  );

  const activate = useCallback(
    (cell: CalendarCell, event?: MouseEvent | KeyboardEvent) => {
      onCellClick?.({ date: cell.date, value: cell.value }, event);
    },
    [onCellClick],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<SVGSVGElement>) => {
      const count = focusableCells.length;
      if (count === 0) return;
      let next = focusIndex;
      switch (event.key) {
        case "ArrowRight":
          next = Math.min(count - 1, focusIndex + 7);
          break;
        case "ArrowLeft":
          next = Math.max(0, focusIndex - 7);
          break;
        case "ArrowDown":
          next = Math.min(count - 1, focusIndex + 1);
          break;
        case "ArrowUp":
          next = Math.max(0, focusIndex - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = count - 1;
          break;
        case "Enter":
        case " ": {
          const cell = focusableCells[focusIndex];
          if (cell) activate(cell, event);
          event.preventDefault();
          return;
        }
        default:
          return;
      }
      event.preventDefault();
      setFocusIndex(next);
    },
    [focusIndex, focusableCells, activate],
  );

  const focusedCell = focusableCells[focusIndex];
  const describe = (cell: CalendarCell) =>
    `${formatDate(cell.date, { locale, dateStyle: "medium" })}: ${cell.value} ${
      cell.value === 1 ? "contribution" : "contributions"
    }`;

  return (
    <div
      className={className}
      style={{
        display: "inline-block",
        background: theme.colors.background,
        color: theme.colors.text,
        fontFamily: theme.typography.fontFamily,
        borderRadius: theme.radii.lg,
        direction: dir,
        ...style,
      }}
    >
      <svg
        role="grid"
        aria-label={labels?.ariaLabel ?? "Contribution calendar heatmap"}
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        style={{ maxWidth: "100%", outline: "none", overflow: "visible" }}
      >
        {showMonthLabels &&
          layout.monthLabels.map(({ col, label }) => (
            <text
              key={`${label}-${col}`}
              x={leftPad + col * step}
              y={topPad - 6}
              fontSize={theme.typography.fontSizeSm}
              fill={theme.colors.textMuted}
            >
              {label}
            </text>
          ))}

        {showWeekdayLabels &&
          [1, 3, 5].map((row) => (
            <text
              key={row}
              x={leftPad - 6}
              y={topPad + row * step + cellSize - 2}
              textAnchor="end"
              fontSize={theme.typography.fontSizeSm}
              fill={theme.colors.textMuted}
            >
              {WEEKDAY_LABELS[(row + weekStartsOn) % 7]}
            </text>
          ))}

        {layout.cells.map((cell) => {
          if (cell.outOfRange) return null;
          const x = leftPad + cell.col * step;
          const y = topPad + cell.row * step;
          const isFocused = focusedCell?.key === cell.key;
          return (
            <rect
              key={cell.key}
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
              rx={cellRadius}
              ry={cellRadius}
              role="gridcell"
              aria-label={describe(cell)}
              fill={colorFor(cell.value)}
              stroke={isFocused ? theme.colors.focusRing : "transparent"}
              strokeWidth={isFocused ? 2 : 0}
              style={{
                cursor: onCellClick ? "pointer" : "default",
                transition: theme.motion.reducedMotion
                  ? undefined
                  : `fill ${theme.motion.duration}ms ${theme.motion.easing}`,
              }}
              onMouseEnter={(e) => tooltip.show(cell, e)}
              onMouseMove={(e) => tooltip.move(e)}
              onMouseLeave={tooltip.hide}
              onClick={(e) => activate(cell, e)}
            />
          );
        })}

        {showLegend && (
          <Legend
            x={leftPad + gridWidth - 5 * (cellSize + 2)}
            y={topPad + gridHeight + 6}
            cellSize={cellSize}
            ramp={ramp}
            muted={theme.colors.muted}
            textColor={theme.colors.textMuted}
            fontSize={theme.typography.fontSizeSm}
          />
        )}
      </svg>

      <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
        {tooltip.state.data &&
          (renderTooltip?.({
            date: tooltip.state.data.date,
            value: tooltip.state.data.value,
          }) ?? (
            <span>
              <strong>{tooltip.state.data.value}</strong>{" "}
              {tooltip.state.data.value === 1 ? "contribution" : "contributions"}
              <br />
              {formatDate(tooltip.state.data.date, { locale, dateStyle: "medium" })}
            </span>
          ))}
      </Tooltip>
    </div>
  );
}

function Legend(props: {
  x: number;
  y: number;
  cellSize: number;
  ramp: string[];
  muted: string;
  textColor: string;
  fontSize: number;
}) {
  const { x, y, cellSize, ramp, muted, textColor, fontSize } = props;
  const swatches = [muted, ...ramp.slice(1)];
  const size = cellSize;
  return (
    <g>
      <text x={x - 6} y={y + size - 2} textAnchor="end" fontSize={fontSize} fill={textColor}>
        Less
      </text>
      {swatches.map((color, i) => (
        <rect
          key={i}
          x={x + i * (size + 2)}
          y={y}
          width={size}
          height={size}
          rx={2}
          ry={2}
          fill={color}
        />
      ))}
      <text
        x={x + swatches.length * (size + 2) + 4}
        y={y + size - 2}
        fontSize={fontSize}
        fill={textColor}
      >
        More
      </text>
    </g>
  );
}
