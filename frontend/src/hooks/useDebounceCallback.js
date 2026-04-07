import { useCallback, useRef } from "react";

/**
 * Returns a debounced version of the callback.
 * Multiple calls within `delay` ms will only fire once (after the last call).
 */
export function useDebounceCallback(fn, delay = 1000) {
  const timer = useRef(null);

  return useCallback((...args) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fn(...args);
    }, delay);
  }, [fn, delay]);
}
