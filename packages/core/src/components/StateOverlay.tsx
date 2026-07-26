import { useMemo, type ReactNode } from "react";
import type { ZenithTheme } from "../theme/types";
import { useTheme } from "../theme/ThemeProvider";
import { mergeTheme } from "../theme/defaultThemes";
import type { BaseVisualizationProps } from "../types";

/**
 * Resolve the effective theme for a component by merging its per-instance
 * `theme` override onto the ambient theme from context.
 */
export function useResolvedTheme(override?: BaseVisualizationProps["theme"]): ZenithTheme {
  const ambient = useTheme();
  return useMemo(() => mergeTheme(ambient, override), [ambient, override]);
}

export interface StateOverlayProps {
  theme: ZenithTheme;
  message: string;
  variant: "loading" | "empty" | "error";
  children?: ReactNode;
}

/**
 * Accessible overlay used for loading / empty / error states. Uses an ARIA
 * live region so status changes are announced to screen readers.
 */
export function StateOverlay({ theme, message, variant, children }: StateOverlayProps) {
  const color = variant === "error" ? theme.colors.danger : theme.colors.textMuted;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing(2),
        minHeight: 120,
        padding: theme.spacing(6),
        color,
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.fontSize,
        textAlign: "center",
      }}
    >
      {variant === "loading" && <Spinner theme={theme} />}
      {children ?? <span>{message}</span>}
    </div>
  );
}

function Spinner({ theme }: { theme: ZenithTheme }) {
  const animation = theme.motion.reducedMotion
    ? undefined
    : "zenith-spin 0.8s linear infinite";
  return (
    <>
      <span
        aria-hidden
        style={{
          width: 20,
          height: 20,
          borderRadius: theme.radii.full,
          border: `2px solid ${theme.colors.muted}`,
          borderTopColor: theme.colors.primary,
          animation,
          display: "inline-block",
        }}
      />
      <style>{"@keyframes zenith-spin{to{transform:rotate(360deg)}}"}</style>
    </>
  );
}
