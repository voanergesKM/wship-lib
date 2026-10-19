"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreateArrangementPayload,
  UpdateArrangementPayload,
  songsService,
} from "@/services/songs.service";

export const songArrangementsQueryKey = (slug: string) => [
  "songArrangements",
  slug,
];

export function useSongArrangements(slug: string, enabled = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: songArrangementsQueryKey(slug),
    queryFn: ({ signal }) => songsService.getArrangements(slug, signal),
    enabled: Boolean(slug) && enabled,
  });

  const createArrangementMutation = useMutation({
    mutationFn: (payload: CreateArrangementPayload) =>
      songsService.createArrangement(slug, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: songArrangementsQueryKey(slug),
      });
    },
  });

  const updateArrangementMutation = useMutation({
    mutationFn: ({
      arrangementId,
      payload,
    }: {
      arrangementId: string;
      payload: UpdateArrangementPayload;
    }) => songsService.updateArrangement(slug, arrangementId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: songArrangementsQueryKey(slug),
      });
    },
  });

  const deleteArrangementMutation = useMutation({
    mutationFn: (arrangementId: string) =>
      songsService.deleteArrangement(slug, arrangementId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: songArrangementsQueryKey(slug),
      });
    },
  });

  return {
    ...query,
    arrangements: query.data?.arrangements ?? [],
    createArrangement: createArrangementMutation.mutateAsync,
    isCreating: createArrangementMutation.isPending,
    updateArrangement: updateArrangementMutation.mutateAsync,
    isUpdating: updateArrangementMutation.isPending,
    deleteArrangement: deleteArrangementMutation.mutateAsync,
    isDeleting: deleteArrangementMutation.isPending,
  };
}
