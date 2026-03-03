import { useState } from "react";
import { CATALOG_PREV_CURSOR_HISTORY_KEY } from "../constants";

/**
 * Workaround: tracks previous page cursors in sessionStorage so the user can
 * navigate backwards through paginated results.
 *
 * This is needed because the catalog API only returns a `nextCursor` and does
 * not expose a `prevCursor`. Once the API supports bidirectional cursors this
 * hook can be removed and the cursor stack can be dropped entirely.
 *
 * sessionStorage is used instead of the URL to avoid polluting shareable links
 * with local navigation history. The stack survives page refreshes and is
 * scoped to the current browser tab.
 */
export function useSessionStack() {
  const [stack, setStack] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(
        sessionStorage.getItem(CATALOG_PREV_CURSOR_HISTORY_KEY) ?? "[]",
      );
    } catch {
      return [];
    }
  });

  const push = (value: string) => {
    try {
      const current = JSON.parse(
        sessionStorage.getItem(CATALOG_PREV_CURSOR_HISTORY_KEY) ?? "[]",
      ) as string[];
      const next = [...current, value];
      sessionStorage.setItem(
        CATALOG_PREV_CURSOR_HISTORY_KEY,
        JSON.stringify(next),
      );
      setStack(next);
    } catch {
      // sessionStorage may be unavailable (privacy mode) or contain corrupted
      // data — silently ignore so pagination degrades gracefully
    }
  };

  const pop = (): string => {
    try {
      const current = JSON.parse(
        sessionStorage.getItem(CATALOG_PREV_CURSOR_HISTORY_KEY) ?? "[]",
      ) as string[];
      const popped = current.at(-1) ?? "";
      const next = current.slice(0, -1);
      sessionStorage.setItem(
        CATALOG_PREV_CURSOR_HISTORY_KEY,
        JSON.stringify(next),
      );
      setStack(next);
      return popped;
    } catch {
      // sessionStorage may be unavailable (privacy mode) or contain corrupted
      // data — return empty string to navigate back to the first page
      return "";
    }
  };

  const clear = () => {
    sessionStorage.removeItem(CATALOG_PREV_CURSOR_HISTORY_KEY);
    setStack([]);
  };

  return { stack, push, pop, clear };
}
