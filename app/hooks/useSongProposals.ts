"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ProposalPayload,
  songsService,
} from "@/services/songs.service";

export const songProposalsQueryKey = (slug: string) => ["songProposals", slug];
export const userProposalsQueryKey = ["userProposals"];

export function useSongProposals(slug: string, enabled = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: songProposalsQueryKey(slug),
    queryFn: ({ signal }) => songsService.getProposals(slug, signal),
    enabled: Boolean(slug) && enabled,
  });

  const createProposalMutation = useMutation({
    mutationFn: (data: ProposalPayload) =>
      songsService.createProposal(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: songProposalsQueryKey(slug) });
      queryClient.invalidateQueries({ queryKey: userProposalsQueryKey });
    },
  });

  const updateProposalMutation = useMutation({
    mutationFn: ({
      proposalId,
      data,
    }: {
      proposalId: string;
      data: ProposalPayload;
    }) => songsService.updateProposal(slug, proposalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: songProposalsQueryKey(slug) });
      queryClient.invalidateQueries({ queryKey: userProposalsQueryKey });
    },
  });

  const cancelProposalMutation = useMutation({
    mutationFn: (proposalId: string) =>
      songsService.cancelProposal(slug, proposalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: songProposalsQueryKey(slug) });
      queryClient.invalidateQueries({ queryKey: userProposalsQueryKey });
    },
  });

  const reviewProposalMutation = useMutation({
    mutationFn: ({
      proposalId,
      action,
      comment,
    }: {
      proposalId: string;
      action: "approve" | "reject";
      comment?: string;
    }) => songsService.reviewProposal(slug, proposalId, action, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["song", slug] });
      queryClient.invalidateQueries({ queryKey: songProposalsQueryKey(slug) });
      queryClient.invalidateQueries({ queryKey: userProposalsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["songsList"] });
    },
  });

  return {
    ...query,
    proposals: query.data?.proposals ?? [],
    isOwnerOrAdmin: query.data?.isOwnerOrAdmin ?? false,
    createProposal: createProposalMutation.mutateAsync,
    isCreating: createProposalMutation.isPending,
    updateProposal: updateProposalMutation.mutateAsync,
    isUpdating: updateProposalMutation.isPending,
    cancelProposal: cancelProposalMutation.mutateAsync,
    isCancelling: cancelProposalMutation.isPending,
    reviewProposal: reviewProposalMutation.mutateAsync,
    isReviewing: reviewProposalMutation.isPending,
  };
}

export function useUserProposals() {
  return useQuery({
    queryKey: userProposalsQueryKey,
    queryFn: ({ signal }) => songsService.getUserProposals(signal),
  });
}
