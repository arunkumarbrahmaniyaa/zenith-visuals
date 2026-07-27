import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { formatNumber } from "@zenith-visuals/utils";
import { computePyramid, type PyramidDatum, type PyramidRow } from "./layout";

export interface PyramidProps extends BaseVisualizationProps {
  data: readonly PyramidDatum[];
  /** Label for the left-hand series. Default "Left". */
  leftLabel?: string;
  /** Label for the right-hand series. Default "Right". */
  rightLabel?: string;
  /** Explicit color for the left bars. Defaults to palette[0]. */
  leftColor?: string;
  /** Explicit color for the right bars. Defaults to palette[1]. */
  rightColor?: string;
  renderTooltip?: (row: PyramidRow, side: "left" | "right") => ReactNode;
}

/**
 * Population pyramid — two horizontal bar series mirrored around a central label
 * gutter, sharing one value scale. Ideal for age/sex distributions and any
 * two-sided category comparison. Responsive and SSR-safe.
 *
 * @example
 * <Pyramid data={[{ label: "0–9", left: 40, right: 38 }]} leftLabel="Male" rightLabel="Female" />
 */
export function Pyramid(props: PyramidProps) {
  const {
    data,
    leftLabel = "Left",
    rightLabel = "Right",
    leftColor,
    rightColor,
    renderTooltip,
    height = 380,
    ...base
  } = props;

  const tooltip = useTooltip<{ row: PyramidRow; side: "left" | "right" }>();
  const [hover, setHover] = useState<"left" | "right" | null>(null);
  const isEmpty = data.length === 0;
  const headerH = 22;

  return (
    <VisualizationContainer {...base} height={height} isEmpty={isEmpty} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const layout = computePyramid(data, { width, height: h - headerH });
        const lColor = leftColor ?? theme.palette[0]!;
        const rColor = rightColor ?? theme.palette[1] ?? theme.colors.secondary;

        return (
          <>
            <svg
              width={width}
              height={h}
              viewBox={`0 0 ${width} ${h}`}
              role="img"
              aria-label={base.labels?.ariaLabel ?? "Population pyramid"}
              style={{ display: "block" }}
            >
              <g fontFamily={theme.typography.fontFamily} fontSize={theme.typography.fontSizeSm}>
                <text
                  x={layout.gutterLeft - 8}
                  y={12}
                  textAnchor="end"
                  fill={lColor}
                  fontWeight={theme.typography.fontWeightBold}
                >
                  {leftLabel}
                </text>
                <text
                  x={layout.gutterRight + 8}
                  y={12}
                  textAnchor="start"
                  fill={rColor}
                  fontWeight={theme.typography.fontWeightBold}
                >
                  {rightLabel}
                </text>
              </g>
              <g transform={`translate(0,${headerH})`}>
                {layout.rows.map((row) => (
                  <g key={row.label}>
                    <rect
                      x={row.leftX}
                      y={row.y}
                      width={row.leftWidth}
                      height={row.barHeight}
                      fill={lColor}
                      fillOpacity={hover === "right" ? 0.35 : 1}
                      rx={1}
                      onMouseEnter={(e) => {
                        setHover("left");
                        tooltip.show({ row, side: "left" }, e);
                      }}
                      onMouseMove={(e) => tooltip.move(e)}
                      onMouseLeave={() => {
                        setHover(null);
                        tooltip.hide();
                      }}
                    />
                    <rect
                      x={row.rightX}
                      y={row.y}
                      width={row.rightWidth}
                      height={row.barHeight}
                      fill={rColor}
                      fillOpacity={hover === "left" ? 0.35 : 1}
                      rx={1}
                      onMouseEnter={(e) => {
                        setHover("right");
                        tooltip.show({ row, side: "right" }, e);
                      }}
                      onMouseMove={(e) => tooltip.move(e)}
                      onMouseLeave={() => {
                        setHover(null);
                        tooltip.hide();
                      }}
                    />
                    <text
                      x={(layout.gutterLeft + layout.gutterRight) / 2}
                      y={row.y + row.barHeight / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={theme.typography.fontSizeSm}
                      fontFamily={theme.typography.fontFamily}
                      fill={theme.colors.textMuted}
                    >
                      {row.label}
                    </text>
                  </g>
                ))}
              </g>
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data.row, tooltip.state.data.side) ?? (
                  <span>
                    <strong>{tooltip.state.data.row.label}</strong> ·{" "}
                    {tooltip.state.data.side === "left" ? leftLabel : rightLabel}:{" "}
                    {formatNumber(
                      tooltip.state.data.side === "left"
                        ? tooltip.state.data.row.left
                        : tooltip.state.data.row.right,
                    )}
                  </span>
                ))}
            </Tooltip>
          </>
        );
      }}
    </VisualizationContainer>
  );
}
