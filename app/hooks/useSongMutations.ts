"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { songOptions } from "@/lib/queries/songQueries";
import {
  SongPayload,
  songsService,
} from "@/services/songs.service";

interface SongsListCache {
  data: { slug: string }[];
  pagination: { total: number; [key: string]: unknown };
}

interface UseSongMutationsOptions {
  slug: string;
  onDeleteSuccess: () => void | Promise<void>;
  onError: (message: string) => void;
  onUpdateSuccess: (updatedSlug: string) => void | Promise<void>;
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export function useSongMutations({
  slug,
  onDeleteSuccess,
  onError,
  onUpdateSuccess,
}: UseSongMutationsOptions) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (payload: SongPayload) => songsService.update(slug, payload),
    onSuccess: async (updatedSong) => {
      queryClient.setQueryData(songOptions({ slug }).queryKey, updatedSong);

      if (updatedSong.slug !== slug) {
        queryClient.setQueryData(
          songOptions({ slug: updatedSong.slug }).queryKey,
          updatedSong,
        );
      }

      await queryClient.invalidateQueries({
        queryKey: songOptions({ slug: updatedSong.slug }).queryKey,
      });
      await onUpdateSuccess(updatedSong.slug);
    },
    onError: (error) =>
      onError(getErrorMessage(error, "Не вдалося зберегти пісню")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => songsService.deleteSong(slug),
    onSuccess: async () => {
      queryClient.setQueriesData<SongsListCache>(
        { queryKey: ["songsList"] },
        (old) => {
          if (!old?.data) return old;

          return {
            ...old,
            data: old.data.filter((song) => song.slug !== slug),
            pagination: {
              ...old.pagination,
              total: Math.max(0, (old.pagination?.total || 1) - 1),
            },
          };
        },
      );

      queryClient.removeQueries({ queryKey: ["song", slug] });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["songsList"] }),
        queryClient.invalidateQueries({ queryKey: ["songList"] }),
        queryClient.invalidateQueries({ queryKey: ["groupLists"] }),
      ]);
      await onDeleteSuccess();
    },
    onError: (error) =>
      onError(getErrorMessage(error, "Не вдалося видалити пісню")),
  });

  return {
    updateSong: updateMutation.mutateAsync,
    deleteSong: deleteMutation.mutateAsync,
    isDeletingSong: deleteMutation.isPending,
  };
}
