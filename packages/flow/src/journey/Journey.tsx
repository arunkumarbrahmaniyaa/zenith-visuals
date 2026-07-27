import { useState, type ReactNode } from "react";
import {
  Tooltip,
  VisualizationContainer,
  useTooltip,
  type BaseVisualizationProps,
} from "@zenith-visuals/core";
import { formatNumber } from "@zenith-visuals/utils";
import { computeJourney, type JourneyStage, type JourneyStagePoint } from "./layout";

export interface JourneyProps extends BaseVisualizationProps {
  data: readonly JourneyStage[];
  /** Band fill color. Defaults to palette[0]. */
  color?: string;
  /** Show drop-off percentage labels between stages. Default true. */
  showDropOff?: boolean;
  renderTooltip?: (stage: JourneyStagePoint) => ReactNode;
}

/**
 * Journey flow — a horizontal band whose thickness tracks the volume reaching
 * each stage, so drop-off shows as tapering, with an optional sentiment line
 * above. Ideal for funnels, onboarding and customer-journey maps. Deterministic
 * and SSR-safe.
 *
 * @example
 * <Journey data={[{ label: "Visit", value: 1000, sentiment: 0.4 }]} />
 */
export function Journey(props: JourneyProps) {
  const { data, color, showDropOff = true, renderTooltip, height = 340, ...base } = props;
  const tooltip = useTooltip<JourneyStagePoint>();
  const [hover, setHover] = useState<number | null>(null);
  const isEmpty = data.length === 0;

  return (
    <VisualizationContainer {...base} height={height} isEmpty={isEmpty} defaultHeight={height}>
      {({ theme, width, height: h }) => {
        const labelH = 34;
        const layout = computeJourney(data, { width, height: h - labelH });
        const band = color ?? theme.palette[0]!;

        const sentimentPath = layout.hasSentiment
          ? layout.stages
              .filter((s) => s.sentimentY != null)
              .map((s, i) => `${i === 0 ? "M" : "L"}${s.x},${s.sentimentY}`)
              .join(" ")
          : "";

        return (
          <>
            <svg
              width={width}
              height={h}
              viewBox={`0 0 ${width} ${h}`}
              role="img"
              aria-label={base.labels?.ariaLabel ?? "Journey flow"}
              style={{ display: "block" }}
            >
              <g>
                {layout.segments.map((seg, i) => (
                  <polygon
                    key={i}
                    points={seg.points}
                    fill={band}
                    fillOpacity={hover == null || hover === i || hover === i + 1 ? 0.5 : 0.18}
                  />
                ))}
              </g>

              {layout.hasSentiment && (
                <path
                  d={sentimentPath}
                  fill="none"
                  stroke={theme.colors.secondary}
                  strokeWidth={2}
                  strokeLinejoin="round"
                />
              )}

              <g>
                {layout.stages.map((stage, i) => (
                  <g key={stage.label}>
                    <rect
                      x={stage.x - 5}
                      y={stage.top}
                      width={10}
                      height={Math.max(2, stage.height)}
                      rx={2}
                      fill={band}
                      fillOpacity={hover != null && hover !== i ? 0.4 : 1}
                      onMouseEnter={(e) => {
                        setHover(i);
                        tooltip.show(stage, e);
                      }}
                      onMouseMove={(e) => tooltip.move(e)}
                      onMouseLeave={() => {
                        setHover(null);
                        tooltip.hide();
                      }}
                    />
                    {stage.sentimentY != null && (
                      <circle cx={stage.x} cy={stage.sentimentY} r={3.5} fill={theme.colors.secondary} />
                    )}
                    <text
                      x={stage.x}
                      y={h - labelH + 14}
                      textAnchor="middle"
                      fontSize={theme.typography.fontSizeSm}
                      fontFamily={theme.typography.fontFamily}
                      fontWeight={theme.typography.fontWeightBold}
                      fill={theme.colors.text}
                    >
                      {stage.label}
                    </text>
                    <text
                      x={stage.x}
                      y={h - labelH + 28}
                      textAnchor="middle"
                      fontSize={theme.typography.fontSizeSm}
                      fontFamily={theme.typography.fontFamily}
                      fill={theme.colors.textMuted}
                    >
                      {formatNumber(stage.value)}
                    </text>
                    {showDropOff && stage.dropFromPrev != null && stage.dropFromPrev > 0 && (
                      <text
                        x={(stage.x + layout.stages[i - 1]!.x) / 2}
                        y={layout.centerY - Math.max(stage.height, layout.stages[i - 1]!.height) / 2 - 6}
                        textAnchor="middle"
                        fontSize={theme.typography.fontSizeSm}
                        fontFamily={theme.typography.fontFamily}
                        fill={theme.colors.danger}
                      >
                        −{Math.round(stage.dropFromPrev * 100)}%
                      </text>
                    )}
                  </g>
                ))}
              </g>
            </svg>
            <Tooltip theme={theme} open={tooltip.state.open} x={tooltip.state.x} y={tooltip.state.y}>
              {tooltip.state.data &&
                (renderTooltip?.(tooltip.state.data) ?? (
                  <span>
                    <strong>{tooltip.state.data.label}</strong>: {formatNumber(tooltip.state.data.value)}
                    {tooltip.state.data.dropFromPrev != null && tooltip.state.data.dropFromPrev > 0 && (
                      <>
                        <br />
                        drop-off {Math.round(tooltip.state.data.dropFromPrev * 100)}%
                      </>
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
