"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface AutoRefreshProps {
  /** Milliseconds between refreshes. Default: 8000 (8 seconds). */
  intervalMs?: number;
}

/**
 * Silently polls the server by calling router.refresh() on an interval.
 *
 * - Only fires when the browser tab is visible (saves requests when tab is hidden)
 * - Re-fetches all Server Component data on the current page
 * - Does NOT lose React client state (forms, scroll position, useState values)
 * - Renders nothing — purely a side-effect component
 *
 * Usage: drop <AutoRefresh /> anywhere inside a layout or page to keep
 * its Server Component data fresh without a full page reload.
 */
export function AutoRefresh({ intervalMs = 8000 }: AutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    function tick() {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }

    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  // Renders nothing
  return null;
}
