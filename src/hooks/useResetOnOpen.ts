import { useState } from "react";

/**
 * Runs `reset` at the moment a dialog transitions from closed to open, so the
 * form starts from a clean slate without waiting for an effect to fire (which
 * would render one frame of stale values). This is React's documented
 * "adjusting state when a prop changes" pattern.
 */
export function useResetOnOpen(open: boolean, reset: () => void) {
  const [wasOpen, setWasOpen] = useState(false);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) reset();
  }
}
