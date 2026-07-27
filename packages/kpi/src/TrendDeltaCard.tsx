import { useMemo, type CSSProperties, type ReactNode } from "react";
import { useResolvedTheme, type BaseVisualizationProps } from "@zenith-visuals/core";
import { formatNumber } from "@zenith-visuals/utils";
import { areaPath, type XY } from "@zenith-visuals/charts";
import { computeDelta } from "./lib/kpi";

export interface TrendDeltaCardProps extends Omit<BaseVisualizationProps, "loading" | "error"> {
  /** Metric name shown above the value. */
  label: string;
  /** The headline value. */
  value: number;
  /** Previous-period value; drives the delta chip and direction. */
  previousValue?: number;
  /** Trend series drawn as a filled area sparkline behind the value. */
  trend?: readonly number[];
  /** Format a numeric value. Defaults to a compact number formatter. */
  format?: (value: number) => string;
  /** Small unit/suffix rendered after the value (e.g. "%", "ms"). */
  unit?: string;
  /**
   * Which delta direction is "good" and therefore colored positively.
   * Default "up". Use "down" for metrics like error rate or cost.
   */
  goodDirection?: "up" | "down";
  /** Caption for the comparison period, e.g. "vs last week". Default "vs previous". */
  periodLabel?: string;
  /** Optional leading icon/element. */
  icon?: ReactNode;
}

const SPARK_W = 200;
const SPARK_H = 48;

/**
 * TrendDeltaCard — a compact KPI card that pairs a headline value with a
 * period-over-period delta (both absolute and percentage) and a filled area
 * sparkline of the trend. Themed, SSR-safe and accessible.
 *
 * @example
 * <TrendDeltaCard label="Signups" value={1280} previousValue={1104} trend={weekly} periodLabel="vs last week" />
 */
export function TrendDeltaCard(props: TrendDeltaCardProps) {
  const {
    label,
    value,
    previousValue,
    trend,
    format = (v: number) => formatNumber(v),
    unit,
    goodDirection = "up",
    periodLabel = "vs previous",
    icon,
    theme: themeOverride,
    className,
    style,
    labels,
  } = props;

  const theme = useResolvedTheme(themeOverride);
  const delta = useMemo(() => computeDelta(value, previousValue), [value, previousValue]);

  const deltaColor =
    delta.direction === "flat"
      ? theme.colors.textMuted
      : delta.direction === goodDirection
        ? theme.colors.success
        : theme.colors.danger;

  const area = useMemo(() => {
    if (!trend || trend.length < 2) return null;
    const min = Math.min(...trend);
    const max = Math.max(...trend);
    const span = max - min || 1;
    const step = SPARK_W / (trend.length - 1);
    const points: XY[] = trend.map((v, i) => ({
      x: i * step,
      y: SPARK_H - 4 - ((v - min) / span) * (SPARK_H - 8),
    }));
    return areaPath(points, SPARK_H, true);
  }, [trend]);

  const arrow = delta.direction === "up" ? "▲" : delta.direction === "down" ? "▼" : "■";
  const sign = delta.delta > 0 ? "+" : "";
  const pctLabel = delta.pct !== null ? `${sign}${(delta.pct * 100).toFixed(1)}%` : "—";
  const absLabel = `${sign}${format(delta.delta)}`;

  const cardStyle: CSSProperties = {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
    padding: theme.spacing(2),
    background: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radii.lg,
    fontFamily: theme.typography.fontFamily,
    color: theme.colors.text,
    minWidth: 220,
    overflow: "hidden",
    ...style,
  };

  const gradientId = useMemo(() => `zv-trend-${Math.random().toString(36).slice(2, 8)}`, []);

  return (
    <div
      className={className}
      style={cardStyle}
      role="group"
      aria-label={labels?.ariaLabel ?? `${label}: ${format(value)}, ${pctLabel} ${periodLabel}`}
    >
      <div style={{ display: "flex", alignItems: "center", gap: theme.spacing(1) }}>
        {icon && <span style={{ color: theme.colors.primary, display: "inline-flex" }}>{icon}</span>}
        <span style={{ fontSize: theme.typography.fontSizeSm, color: theme.colors.textMuted, fontWeight: theme.typography.fontWeight }}>
          {label}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: theme.spacing(1) }}>
        <span style={{ fontSize: theme.typography.fontSizeLg * 1.5, fontWeight: theme.typography.fontWeightBold, lineHeight: 1 }}>
          {format(value)}
          {unit && <span style={{ fontSize: theme.typography.fontSize, color: theme.colors.textMuted }}>{unit}</span>}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: theme.spacing(1) }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: theme.typography.fontSizeSm,
            fontWeight: theme.typography.fontWeightBold,
            color: deltaColor,
            background: `${deltaColor}1f`,
            borderRadius: theme.radii.sm,
            padding: `2px ${theme.spacing(1)}px`,
          }}
        >
          {arrow} {pctLabel}
        </span>
        <span style={{ fontSize: theme.typography.fontSizeSm, color: theme.colors.textMuted }}>
          {absLabel} {periodLabel}
        </span>
      </div>

      {area && (
        <svg
          width="100%"
          height={SPARK_H}
          viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{ display: "block", marginTop: theme.spacing(1) }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={deltaColor} stopOpacity={0.35} />
              <stop offset="100%" stopColor={deltaColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradientId})`} stroke={deltaColor} strokeWidth={1.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
    </div>
  );
}
