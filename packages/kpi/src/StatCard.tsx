import { useMemo, type CSSProperties, type ReactNode } from "react";
import { useResolvedTheme, type BaseVisualizationProps } from "@zenith-visuals/core";
import { formatNumber } from "@zenith-visuals/utils";
import { linePath, type XY } from "@zenith-visuals/charts";
import { computeDelta } from "./lib/kpi";

export interface StatCardProps extends Omit<BaseVisualizationProps, "loading" | "error"> {
  /** Metric name shown above the value. */
  label: string;
  /** The headline value. Numbers are formatted with `format`; strings render as-is. */
  value: number | string;
  /** Previous-period value; when provided a delta badge is shown. */
  previousValue?: number;
  /** Format a numeric value. Defaults to a compact number formatter. */
  format?: (value: number) => string;
  /** Small unit/suffix rendered after the value (e.g. "%", "ms"). */
  unit?: string;
  /** Optional trend series drawn as a mini sparkline in the card. */
  trend?: readonly number[];
  /**
   * Which delta direction is "good" and therefore colored positively.
   * Default "up" (growth is good). Use "down" for metrics like error rate.
   */
  goodDirection?: "up" | "down";
  /** Optional leading icon/element. */
  icon?: ReactNode;
}

const SPARK_W = 96;
const SPARK_H = 32;

/**
 * StatCard — a compact KPI tile showing a headline value, an optional
 * period-over-period delta badge and a mini trend sparkline. Themed,
 * SSR-safe and accessible.
 *
 * @example
 * <StatCard label="MRR" value={48200} previousValue={44100} unit="$" trend={mrr} />
 */
export function StatCard(props: StatCardProps) {
  const {
    label,
    value,
    previousValue,
    format = (v: number) => formatNumber(v),
    unit,
    trend,
    goodDirection = "up",
    icon,
    theme: themeOverride,
    className,
    style,
    labels,
  } = props;

  const theme = useResolvedTheme(themeOverride);

  const numericValue = typeof value === "number" ? value : undefined;
  const delta = useMemo(
    () => (numericValue !== undefined ? computeDelta(numericValue, previousValue) : undefined),
    [numericValue, previousValue],
  );

  const deltaColor =
    delta === undefined || delta.direction === "flat"
      ? theme.colors.textMuted
      : delta.direction === goodDirection
        ? theme.colors.success
        : theme.colors.danger;

  const sparkPath = useMemo(() => {
    if (!trend || trend.length < 2) return null;
    const min = Math.min(...trend);
    const max = Math.max(...trend);
    const span = max - min || 1;
    const step = SPARK_W / (trend.length - 1);
    const points: XY[] = trend.map((v, i) => ({
      x: i * step,
      y: SPARK_H - ((v - min) / span) * SPARK_H,
    }));
    return linePath(points);
  }, [trend]);

  const cardStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
    padding: theme.spacing(2),
    background: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radii.lg,
    fontFamily: theme.typography.fontFamily,
    color: theme.colors.text,
    minWidth: 160,
    ...style,
  };

  const sign = delta && delta.delta > 0 ? "+" : "";
  const deltaLabel =
    delta === undefined
      ? undefined
      : delta.pct !== null
        ? `${sign}${(delta.pct * 100).toFixed(1)}%`
        : `${sign}${format(delta.delta)}`;

  return (
    <div
      className={className}
      style={cardStyle}
      role="group"
      aria-label={labels?.ariaLabel ?? `${label}: ${typeof value === "number" ? format(value) : value}`}
    >
      <div style={{ display: "flex", alignItems: "center", gap: theme.spacing(1) }}>
        {icon && <span style={{ color: theme.colors.primary, display: "inline-flex" }}>{icon}</span>}
        <span
          style={{
            fontSize: theme.typography.fontSizeSm,
            color: theme.colors.textMuted,
            fontWeight: theme.typography.fontWeight,
          }}
        >
          {label}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: theme.spacing(1) }}>
        <span
          style={{
            fontSize: theme.typography.fontSizeLg * 1.4,
            fontWeight: theme.typography.fontWeightBold,
            lineHeight: 1,
          }}
        >
          {typeof value === "number" ? format(value) : value}
          {unit && (
            <span style={{ fontSize: theme.typography.fontSize, color: theme.colors.textMuted }}>
              {unit}
            </span>
          )}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: theme.spacing(1) }}>
        {deltaLabel !== undefined ? (
          <span
            style={{
              fontSize: theme.typography.fontSizeSm,
              fontWeight: theme.typography.fontWeightBold,
              color: deltaColor,
            }}
          >
            {delta && delta.direction === "up" ? "▲" : delta && delta.direction === "down" ? "▼" : "■"} {deltaLabel}
          </span>
        ) : (
          <span />
        )}
        {sparkPath && (
          <svg
            width={SPARK_W}
            height={SPARK_H}
            viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
            aria-hidden="true"
            style={{ display: "block", overflow: "visible" }}
          >
            <path d={sparkPath} fill="none" stroke={deltaColor} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  );
}
