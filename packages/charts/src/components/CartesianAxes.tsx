import type { ZenithTheme } from "@zenith-visuals/core";
import type { CartesianLayout } from "../lib/cartesian";

export interface CartesianAxesProps {
  theme: ZenithTheme;
  layout: CartesianLayout;
  categories: readonly string[];
  formatValue: (value: number) => string;
  showGrid?: boolean;
  /** Skip category labels when there are too many to read. */
  maxCategoryLabels?: number;
}

/** Renders y gridlines, y tick labels, x category labels and the axis baseline. */
export function CartesianAxes({
  theme,
  layout,
  categories,
  formatValue,
  showGrid = true,
  maxCategoryLabels = 24,
}: CartesianAxesProps) {
  const { plot, yScale, yTicks } = layout;
  const labelEvery = Math.ceil(categories.length / maxCategoryLabels);

  return (
    <g aria-hidden>
      {yTicks.map((tick) => {
        const y = yScale(tick);
        return (
          <g key={`y-${tick}`}>
            {showGrid && (
              <line
                x1={plot.x}
                x2={plot.x + plot.w}
                y1={y}
                y2={y}
                stroke={theme.colors.border}
                strokeWidth={1}
                opacity={0.6}
              />
            )}
            <text
              x={plot.x - 8}
              y={y}
              textAnchor="end"
              dominantBaseline="central"
              fontSize={theme.typography.fontSizeSm}
              fontFamily={theme.typography.fontFamily}
              fill={theme.colors.textMuted}
            >
              {formatValue(tick)}
            </text>
          </g>
        );
      })}

      <line
        x1={plot.x}
        x2={plot.x + plot.w}
        y1={plot.y + plot.h}
        y2={plot.y + plot.h}
        stroke={theme.colors.border}
        strokeWidth={1}
      />

      {categories.map((cat, i) => {
        if (i % labelEvery !== 0) return null;
        const cx = layout.categoryCenter(i);
        return (
          <text
            key={`x-${cat}-${i}`}
            x={cx}
            y={plot.y + plot.h + 16}
            textAnchor="middle"
            fontSize={theme.typography.fontSizeSm}
            fontFamily={theme.typography.fontFamily}
            fill={theme.colors.textMuted}
          >
            {cat}
          </text>
        );
      })}
    </g>
  );
}
