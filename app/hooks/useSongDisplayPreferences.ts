"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { type AuthUser, useAuth } from "@/components/providers/AuthContext";
import {
  DEFAULT_SONG_DISPLAY_PREFERENCES,
  type SongDisplayPreferences,
  type UserPreferences,
} from "@/types/user-preferences";

type PreferencesResponse = { preferences: UserPreferences };
type PreferencesPatch = Partial<SongDisplayPreferences>;

async function updatePreferences(patch: PreferencesPatch) {
  const response = await fetch("/api/users/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(body?.message || "Не вдалося зберегти налаштування");
  }

  return (await response.json()) as PreferencesResponse;
}

export function useSongDisplayPreferences() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [guestPreferences, setGuestPreferences] = useState<SongDisplayPreferences>(
    DEFAULT_SONG_DISPLAY_PREFERENCES,
  );

  const mutation = useMutation({
    scope: { id: "user-song-display-preferences" },
    mutationFn: updatePreferences,
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: ["authMe"] });
      const previousUser = queryClient.getQueryData<AuthUser | null>([
        "authMe",
      ]);

      queryClient.setQueryData<AuthUser | null>(["authMe"], (currentUser) =>
        currentUser
          ? {
              ...currentUser,
              preferences: {
                ...currentUser.preferences,
                songDisplay: {
                  ...currentUser.preferences.songDisplay,
                  ...patch,
                },
              },
            }
          : currentUser,
      );

      return { previousUser };
    },
    onError: (error, _patch, context) => {
      queryClient.setQueryData(["authMe"], context?.previousUser);
      toast.error(
        error instanceof Error
          ? error.message
          : "Не вдалося зберегти налаштування",
      );
    },
    onSuccess: ({ preferences }) => {
      queryClient.setQueryData<AuthUser | null>(["authMe"], (currentUser) =>
        currentUser ? { ...currentUser, preferences } : currentUser,
      );
    },
  });

  const songDisplayPreferences = isAuthenticated
    ? user?.preferences.songDisplay ?? DEFAULT_SONG_DISPLAY_PREFERENCES
    : guestPreferences;

  const updateSongDisplayPreferences = (patch: PreferencesPatch) => {
    if (!isAuthenticated) {
      setGuestPreferences((current) => ({ ...current, ...patch }));
      return;
    }

    mutation.mutate(patch);
  };

  return { songDisplayPreferences, updateSongDisplayPreferences };
}
