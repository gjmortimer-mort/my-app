"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-fetches the server component's data on an interval so an open tab keeps
 * showing fresh results without a manual reload. The server data itself is
 * cached for an hour (ISR), so this just pulls the latest cached/revalidated copy.
 */
export default function AutoRefresh({ intervalMs = 3600_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
