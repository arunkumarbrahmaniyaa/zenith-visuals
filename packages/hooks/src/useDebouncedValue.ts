import { useEffect, useState } from "react";

/**
 * Return a debounced copy of `value` that only updates after `delay` ms of no
 * changes. Useful for search inputs and expensive layout recomputation.
 */
export function useDebouncedValue<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
