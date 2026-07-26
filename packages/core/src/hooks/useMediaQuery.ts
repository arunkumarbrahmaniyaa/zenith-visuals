import { useEffect, useState } from "react";

/**
 * Subscribe to a CSS media query in an SSR-safe way. Returns `false` on the
 * server and during the first client render, then updates after mount.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return matches;
}

/** True when the user prefers reduced motion. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** True when the OS/browser prefers a dark color scheme. */
export function usePrefersDark(): boolean {
  return useMediaQuery("(prefers-color-scheme: dark)");
}
