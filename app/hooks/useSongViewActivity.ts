"use client";
import { useEffect, useRef } from "react";

export function useSongViewActivity({ slug, userId, groupId, listId }: {
  slug?: string; userId?: string; groupId: string | null; listId: string | null;
}) {
  const last = useRef<{ key: string; eventId: string; sent: boolean } | null>(null);
  useEffect(() => {
    if (!slug || !userId) return;
    const key = JSON.stringify([slug, userId, groupId, listId]);
    if (last.current?.key !== key) {
      const eventId = globalThis.crypto?.randomUUID?.();
      if (!eventId) return;
      last.current = { key, eventId, sent: false };
    }
    const entry = last.current;
    const send = () => {
      if (document.visibilityState !== "visible" || entry.sent) return;
      entry.sent = true;
      void fetch("/api/activity", {
        method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
        body: JSON.stringify({ action: "song.view", eventId: entry.eventId, slug,
          ...(groupId ? { groupId } : {}), ...(groupId && listId ? { listId } : {}),
        }),
      }).catch(() => { /* Telemetry does not interrupt the song viewer. */ });
    };
    send();
    document.addEventListener("visibilitychange", send);
    return () => document.removeEventListener("visibilitychange", send);
  }, [slug, userId, groupId, listId]);
}
