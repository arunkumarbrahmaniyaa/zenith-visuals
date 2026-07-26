import { useCallback, useEffect, useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Measure a DOM element with ResizeObserver. Returns a ref to attach and the
 * current dimensions. SSR-safe: dimensions start at 0 and update after mount.
 */
export function useResizeObserver<T extends HTMLElement = HTMLDivElement>(): {
  ref: (node: T | null) => void;
  dimensions: Dimensions;
} {
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 });
  const elementRef = useRef<T | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const measure = useCallback((node: T) => {
    const rect = node.getBoundingClientRect();
    setDimensions((prev) =>
      prev.width === rect.width && prev.height === rect.height
        ? prev
        : { width: rect.width, height: rect.height },
    );
  }, []);

  const ref = useCallback(
    (node: T | null) => {
      observerRef.current?.disconnect();
      elementRef.current = node;
      if (node && typeof ResizeObserver !== "undefined") {
        observerRef.current = new ResizeObserver(() => measure(node));
        observerRef.current.observe(node);
        measure(node);
      }
    },
    [measure],
  );

  useIsomorphicLayoutEffect(() => {
    if (elementRef.current) measure(elementRef.current);
  }, [measure]);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { ref, dimensions };
}
