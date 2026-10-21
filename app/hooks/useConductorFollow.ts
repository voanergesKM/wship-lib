"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ConductorSessionState } from "@/types/conductor.types";

export function useConductorFollow(sessionId: string | null) {
  const queryClient = useQueryClient();
  const prevEndedAtRef = useRef<string | null>(null);
  const prevDisconnectedRef = useRef(false);

  const { data, isSuccess, error } = useQuery<ConductorSessionState>({
    queryKey: ["conductorSession", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/conductor/sessions/${sessionId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch conductor session");
      }
      return res.json();
    },
    enabled: Boolean(sessionId),
    refetchInterval: (query) => {
      const state = query.state.data;
      if (state?.endedAt) return false;
      return 2000;
    },
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!data) return;

    if (data.endedAt && !prevEndedAtRef.current) {
      toast.info("🎼 Репетицію завершено", {
        description: "Диригент закрив сесію",
      });
      // Invalidate general conductorSession queries across the app
      queryClient.invalidateQueries({ queryKey: ["conductorSession"] });
    }

    if (data.isDisconnected && !prevDisconnectedRef.current && !data.endedAt) {
      toast.warning("⚠️ Диригент від'єднався", {
        description: "Зв'язок з диригентом перервано. Очікуємо відновлення...",
      });
    } else if (
      !data.isDisconnected &&
      prevDisconnectedRef.current &&
      !data.endedAt
    ) {
      toast.success("✅ Диригент повернувся", {
        description: "Зв'язок з диригентом відновлено",
      });
    }

    prevEndedAtRef.current = data.endedAt;
    prevDisconnectedRef.current = data.isDisconnected;
  }, [data]);

  return {
    conductorState: data || null,
    isSessionActive: Boolean(data && !data.endedAt && !data.isDisconnected),
    isEnded: Boolean(data?.endedAt),
    isDisconnected: Boolean(data?.isDisconnected),
    isSuccess,
    error,
  };
}
