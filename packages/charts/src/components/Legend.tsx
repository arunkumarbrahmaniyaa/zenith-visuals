import type { ZenithTheme } from "@zenith-visuals/core";

export interface LegendItem {
  label: string;
  color: string;
}

export interface LegendProps {
  theme: ZenithTheme;
  items: readonly LegendItem[];
}

/** A compact, wrapping, theme-aware legend rendered as HTML above the chart. */
export function Legend({ theme, items }: LegendProps) {
  if (items.length === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: `${theme.spacing(1)}px ${theme.spacing(3)}px`,
        justifyContent: "center",
        marginBottom: theme.spacing(1),
        fontSize: theme.typography.fontSizeSm,
        color: theme.colors.textMuted,
      }}
    >
      {items.map((item) => (
        <span key={item.label} style={{ display: "inline-flex", alignItems: "center", gap: theme.spacing(1) }}>
          <span
            aria-hidden
            style={{
              width: 10,
              height: 10,
              borderRadius: theme.radii.sm,
              background: item.color,
              display: "inline-block",
            }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}
