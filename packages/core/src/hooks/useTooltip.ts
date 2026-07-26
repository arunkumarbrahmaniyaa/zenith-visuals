import { useCallback, useState } from "react";

export interface TooltipState<T> {
  open: boolean;
  x: number;
  y: number;
  data: T | null;
}

/**
 * Minimal, dependency-free tooltip controller. Track pointer position and the
 * hovered datum, then render with the `<Tooltip />` primitive.
 */
export function useTooltip<T>() {
  const [state, setState] = useState<TooltipState<T>>({
    open: false,
    x: 0,
    y: 0,
    data: null,
  });

  const show = useCallback((data: T, event: { clientX: number; clientY: number }) => {
    setState({ open: true, x: event.clientX, y: event.clientY, data });
  }, []);

  const move = useCallback((event: { clientX: number; clientY: number }) => {
    setState((prev) => (prev.open ? { ...prev, x: event.clientX, y: event.clientY } : prev));
  }, []);

  const hide = useCallback(() => {
    setState((prev) => (prev.open ? { ...prev, open: false } : prev));
  }, []);

  return { state, show, move, hide };
}
