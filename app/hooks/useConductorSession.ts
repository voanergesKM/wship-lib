"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseConductorSessionOptions {
  groupId?: string;
  initialSessionId?: string | null;
}

export function useConductorSession({
  groupId,
  initialSessionId = null,
}: UseConductorSessionOptions = {}) {
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(sessionId);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    if (initialSessionId !== undefined) {
      setSessionId(initialSessionId);
    }
  }, [initialSessionId]);

  // Heartbeat every 10 seconds while conductor is active
  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(() => {
      fetch(`/api/conductor/sessions/${sessionId}/heartbeat`, {
        method: "POST",
      }).catch((err) => {
        console.error("Conductor heartbeat error:", err);
      });
    }, 10_000);

    return () => clearInterval(interval);
  }, [sessionId]);

  // Keep alive or report on pagehide
  useEffect(() => {
    if (!sessionId) return;

    const handlePageHide = () => {
      if (sessionIdRef.current) {
        navigator.sendBeacon(
          `/api/conductor/sessions/${sessionIdRef.current}/heartbeat`,
        );
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [sessionId]);

  const start = useCallback(
    async (
      listId: string,
      targetGroupId?: string,
    ): Promise<{
      sessionId: string;
      currentSongSlug: string;
      stepIndex: number;
    } | null> => {
      const gId = targetGroupId || groupId;
      if (!gId) {
        setError("groupId is required to start conductor session");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/conductor/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groupId: gId, listId }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errMsg = data.message || "Помилка при створенні сесії";
          setError(errMsg);
          throw new Error(errMsg);
        }

        setSessionId(data.sessionId);
        return data;
      } catch (err: any) {
        setError(err.message || "Помилка при створенні сесії");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [groupId],
  );

  const end = useCallback(async (): Promise<boolean> => {
    if (!sessionId) return false;

    try {
      const response = await fetch(`/api/conductor/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setSessionId(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error ending conductor session:", err);
      return false;
    }
  }, [sessionId]);

  const update = useCallback(
    async (songSlug?: string, stepIndex?: number): Promise<boolean> => {
      if (!sessionId) return false;

      try {
        const payload: { currentSongSlug?: string; stepIndex?: number } = {};
        if (songSlug !== undefined) payload.currentSongSlug = songSlug;
        if (stepIndex !== undefined) payload.stepIndex = stepIndex;

        const response = await fetch(`/api/conductor/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        return response.ok;
      } catch (err) {
        console.error("Error updating conductor session:", err);
        return false;
      }
    },
    [sessionId],
  );

  return {
    sessionId,
    isActive: Boolean(sessionId),
    isLoading,
    error,
    start,
    end,
    update,
  };
}
