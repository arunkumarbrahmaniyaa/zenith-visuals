import { useCallback, useRef, useState, type WheelEvent as ReactWheelEvent } from "react";

export interface Transform {
  x: number;
  y: number;
  scale: number;
}

export interface UseZoomPanOptions {
  minScale?: number;
  maxScale?: number;
  initial?: Partial<Transform>;
  /** Zoom sensitivity applied to wheel deltas. */
  zoomSpeed?: number;
}

const IDENTITY: Transform = { x: 0, y: 0, scale: 1 };

/**
 * Headless zoom & pan controller for canvas/SVG visualizations. Returns the
 * current transform plus wheel/pointer handlers to spread onto a surface.
 *
 * Zoom is anchored at the pointer position; panning is pointer-drag based.
 * Fully controlled by the consumer — no DOM assumptions beyond event coords.
 */
export function useZoomPan(options: UseZoomPanOptions = {}) {
  const { minScale = 0.2, maxScale = 8, zoomSpeed = 0.0015, initial } = options;
  const [transform, setTransform] = useState<Transform>({ ...IDENTITY, ...initial });
  const dragState = useRef<{ startX: number; startY: number; origin: Transform } | null>(null);

  const clampScale = useCallback(
    (scale: number) => Math.min(maxScale, Math.max(minScale, scale)),
    [minScale, maxScale],
  );

  const onWheel = useCallback(
    (event: ReactWheelEvent) => {
      event.preventDefault();
      setTransform((prev) => {
        const nextScale = clampScale(prev.scale * Math.exp(-event.deltaY * zoomSpeed));
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const px = event.clientX - rect.left;
        const py = event.clientY - rect.top;
        // Keep the point under the cursor stationary while scaling.
        const ratio = nextScale / prev.scale;
        return {
          scale: nextScale,
          x: px - (px - prev.x) * ratio,
          y: py - (py - prev.y) * ratio,
        };
      });
    },
    [clampScale, zoomSpeed],
  );

  const onPointerDown = useCallback(
    (event: { clientX: number; clientY: number; currentTarget: Element; pointerId?: number }) => {
      dragState.current = {
        startX: event.clientX,
        startY: event.clientY,
        origin: transform,
      };
      if (event.pointerId != null && "setPointerCapture" in event.currentTarget) {
        (event.currentTarget as Element).setPointerCapture(event.pointerId);
      }
    },
    [transform],
  );

  const onPointerMove = useCallback((event: { clientX: number; clientY: number }) => {
    const drag = dragState.current;
    if (!drag) return;
    setTransform({
      ...drag.origin,
      x: drag.origin.x + (event.clientX - drag.startX),
      y: drag.origin.y + (event.clientY - drag.startY),
    });
  }, []);

  const onPointerUp = useCallback(() => {
    dragState.current = null;
  }, []);

  const reset = useCallback(() => setTransform({ ...IDENTITY, ...initial }), [initial]);

  const zoomBy = useCallback(
    (factor: number) => setTransform((prev) => ({ ...prev, scale: clampScale(prev.scale * factor) })),
    [clampScale],
  );

  return {
    transform,
    setTransform,
    reset,
    zoomBy,
    /** `translate(x, y) scale(s)` string for SVG/CSS transforms. */
    toMatrix: () => `translate(${transform.x} ${transform.y}) scale(${transform.scale})`,
    handlers: { onWheel, onPointerDown, onPointerMove, onPointerUp, onPointerLeave: onPointerUp },
  };
}
