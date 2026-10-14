import { baseFetcher } from "@/utils/baseFetcher";
import { SongDocument } from "../models/Song";
import { YouTubeLink } from "@/utils/youtubeLinks";

export type SongVisibility = "private" | "team" | "public";

export interface SongPayload {
  title: string;
  tags: string[];
  authors: string[];
  key?: string;
  bpm?: number;
  document: string;
  youtube: YouTubeLink[];
  visibility?: SongVisibility;
}

export interface ProposalPayload extends SongPayload {
  comment?: string;
}

export interface SongProposalItem {
  _id: string;
  song:
    | string
    | {
        _id: string;
        title: string;
        slug: string;
        key?: string;
        bpm?: number;
      };
  user: {
    _id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    photoUrl?: string;
  };
  status: "pending" | "approved" | "rejected" | "cancelled";
  comment?: string;
  proposedData: SongPayload;
  reviewedBy?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  };
  reviewedAt?: string;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SongProposalsResponse {
  proposals: SongProposalItem[];
  isOwnerOrAdmin: boolean;
}

export interface SongParams {
  page: number;
  limit: number;
  search: string;
}

export interface PaginatedSongsList {
  data: SongDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const songsService = {
  getPaginatedSongsList: (params: SongParams, signal?: AbortSignal) => {
    const query = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
    });

    if (params.search) {
      query.set("search", params.search);
    }

    return baseFetcher<PaginatedSongsList>(`/songs?${query.toString()}`, {
      method: "GET",
      signal,
    });
  },

  getSongBySlug: (slug: string, signal?: AbortSignal) => {
    return baseFetcher<SongDocument>(`/songs/${slug}`, {
      signal,
      method: "GET",
    });
  },

  create: (data: SongPayload) => {
    return baseFetcher<SongDocument>("/songs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: (slug: string, data: SongPayload) => {
    return baseFetcher<SongDocument>(`/songs/${slug}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  getProposals: (slug: string, signal?: AbortSignal) => {
    return baseFetcher<SongProposalsResponse>(`/songs/${slug}/proposals`, {
      method: "GET",
      signal,
    });
  },

  createProposal: (slug: string, data: ProposalPayload) => {
    return baseFetcher<SongProposalItem>(`/songs/${slug}/proposals`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateProposal: (slug: string, proposalId: string, data: ProposalPayload) => {
    return baseFetcher<SongProposalItem>(
      `/songs/${slug}/proposals/${proposalId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );
  },

  cancelProposal: (slug: string, proposalId: string) => {
    return baseFetcher<{ ok: boolean }>(
      `/songs/${slug}/proposals/${proposalId}`,
      {
        method: "DELETE",
      },
    );
  },

  reviewProposal: (
    slug: string,
    proposalId: string,
    action: "approve" | "reject",
    comment?: string,
  ) => {
    return baseFetcher<{
      ok: boolean;
      action: string;
      proposal: SongProposalItem;
    }>(`/songs/${slug}/proposals/${proposalId}/review`, {
      method: "POST",
      body: JSON.stringify({ action, comment }),
    });
  },

  getUserProposals: (signal?: AbortSignal) => {
    return baseFetcher<{ proposals: SongProposalItem[] }>("/users/proposals", {
      method: "GET",
      signal,
    });
  },
};
