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

function getSongDisplayPreferences(user: AuthUser | null) {
  return {
    ...DEFAULT_SONG_DISPLAY_PREFERENCES,
    ...user?.preferences?.songDisplay,
  };
}

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
  const [localPreferences, setLocalPreferences] =
    useState<Partial<SongDisplayPreferences>>({});
  const songDisplayPreferences = {
    ...(isAuthenticated
      ? getSongDisplayPreferences(user)
      : DEFAULT_SONG_DISPLAY_PREFERENCES),
    ...localPreferences,
  };

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
                version: currentUser.preferences?.version ?? 1,
                songDisplay: {
                  ...getSongDisplayPreferences(currentUser),
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
      setLocalPreferences({});
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
      setLocalPreferences({});
    },
  });

  const updateSongDisplayPreferences = (patch: PreferencesPatch) => {
    setLocalPreferences((current) => ({ ...current, ...patch }));

    if (!isAuthenticated) {
      return;
    }

    mutation.mutate(patch);
  };

  return { songDisplayPreferences, updateSongDisplayPreferences };
}
