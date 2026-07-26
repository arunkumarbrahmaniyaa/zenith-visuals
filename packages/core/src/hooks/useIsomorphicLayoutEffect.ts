import { useEffect, useLayoutEffect } from "react";

/**
 * useLayoutEffect that safely degrades to useEffect during server rendering,
 * avoiding React's SSR warning. Essential for SSR/Next.js compatibility.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
