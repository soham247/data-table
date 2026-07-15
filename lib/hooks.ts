import { useEffect, useState } from "react";

/**
 * Returns a debounced version of `value` that only updates
 * after `delayMs` milliseconds of inactivity.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
