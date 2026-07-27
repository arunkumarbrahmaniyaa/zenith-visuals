import { useResolvedTheme, type BaseVisualizationProps } from "@zenith-visuals/core";
import { linePath, smoothPath, areaPath, type XY } from "./lib/paths";

export interface SparklineProps extends Pick<BaseVisualizationProps, "theme" | "className" | "style" | "labels"> {
  /** The numeric series to plot. */
  data: readonly number[];
  /** Render style. Default "line". */
  variant?: "line" | "area" | "bar";
  /** Width in px. Default 120. */
  width?: number;
  /** Height in px. Default 32. */
  height?: number;
  /** Stroke color. Defaults to theme primary. */
  color?: string;
  /** Smooth the line/area. Default false. */
  smooth?: boolean;
  /** Highlight the last point with a dot. Default true. */
  showLast?: boolean;
}

/**
 * Sparkline — a compact, inline trend chart with no axes, ideal for tables and
 * KPI cards. SSR-safe and themeable.
 *
 * @example
 * <Sparkline data={[3, 5, 4, 8, 6, 9]} variant="area" />
 */
export function Sparkline(props: SparklineProps) {
  const {
    data,
    variant = "line",
    width = 120,
    height = 32,
    color,
    smooth = false,
    showLast = true,
    theme: themeOverride,
    className,
    style,
    labels,
  } = props;

  const theme = useResolvedTheme(themeOverride);
  const stroke = color ?? theme.colors.primary;
  const pad = 2;

  if (data.length === 0) {
    return <svg width={width} height={height} className={className} style={style} aria-hidden />;
  }

  let min = Infinity;
  let max = -Infinity;
  for (const v of data) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const span = max - min || 1;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const xAt = (i: number) => (data.length === 1 ? pad + innerW / 2 : pad + (i / (data.length - 1)) * innerW);
  const yAt = (v: number) => pad + innerH - ((v - min) / span) * innerH;
  const points: XY[] = data.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
  const last = points[points.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
      role="img" aria-label={labels?.ariaLabel ?? "Sparkline"}>
      {variant === "bar" ? (
        data.map((v, i) => {
          const bw = Math.max(1, innerW / data.length - 1);
          const y = yAt(v);
          return <rect key={i} x={xAt(i) - bw / 2} y={y} width={bw} height={pad + innerH - y} rx={1} fill={stroke} />;
        })
      ) : (
        <>
          {variant === "area" && (
            <path d={areaPath(points, height - pad, smooth)} fill={stroke} fillOpacity={0.2} stroke="none" />
          )}
          <path d={smooth ? smoothPath(points) : linePath(points)} fill="none" stroke={stroke} strokeWidth={1.5}
            strokeLinejoin="round" strokeLinecap="round" />
        </>
      )}
      {showLast && last && variant !== "bar" && <circle cx={last.x} cy={last.y} r={2.5} fill={stroke} />}
    </svg>
  );
}
