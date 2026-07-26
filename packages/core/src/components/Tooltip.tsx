import { type ReactNode } from "react";
import type { ZenithTheme } from "../theme/types";

export interface TooltipProps {
  theme: ZenithTheme;
  open: boolean;
  /** Viewport-relative x (clientX). */
  x: number;
  /** Viewport-relative y (clientY). */
  y: number;
  children: ReactNode;
}

/**
 * A themed, fixed-position tooltip surface. Rendered inline (no portal) so it
 * inherits SSR compatibility; positioned via `position: fixed` at the pointer.
 */
export function Tooltip({ theme, open, x, y, children }: TooltipProps) {
  if (!open) return null;
  return (
    <div
      role="tooltip"
      style={{
        position: "fixed",
        top: y + 12,
        left: x + 12,
        zIndex: 1000,
        pointerEvents: "none",
        maxWidth: 260,
        padding: `${theme.spacing(1.5)}px ${theme.spacing(2.5)}px`,
        background: theme.colors.surface,
        color: theme.colors.text,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radii.md,
        boxShadow: theme.shadows.md,
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.fontSizeSm,
        lineHeight: 1.4,
        transition: theme.motion.reducedMotion
          ? undefined
          : `opacity ${theme.motion.duration}ms ${theme.motion.easing}`,
      }}
    >
      {children}
    </div>
  );
}
