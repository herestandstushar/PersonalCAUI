import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False during SSR and the first client render, true afterwards. Use it to gate
 * output that depends on browser-only state (theme, locale, media queries) so
 * the server and client markup agree on the first pass.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
