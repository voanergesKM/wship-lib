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

export interface ArrangementItem {
  section: string;
  repeat: number;
}

export interface SongArrangement {
  _id: string;
  name: string;
  items: ArrangementItem[];
  song: string;
  createdBy?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateArrangementPayload {
  name: string;
  items: ArrangementItem[];
}

export interface UpdateArrangementPayload {
  name?: string;
  items?: ArrangementItem[];
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

  getArrangements: (slug: string, signal?: AbortSignal) => {
    return baseFetcher<{ arrangements: SongArrangement[] }>(
      `/songs/${slug}/arrangements`,
      {
        method: "GET",
        signal,
      },
    );
  },

  createArrangement: (slug: string, payload: CreateArrangementPayload) => {
    return baseFetcher<SongArrangement>(`/songs/${slug}/arrangements`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateArrangement: (
    slug: string,
    arrangementId: string,
    payload: UpdateArrangementPayload,
  ) => {
    return baseFetcher<SongArrangement>(
      `/songs/${slug}/arrangements/${arrangementId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
  },

  deleteArrangement: (slug: string, arrangementId: string) => {
    return baseFetcher<{ ok: boolean }>(
      `/songs/${slug}/arrangements/${arrangementId}`,
      {
        method: "DELETE",
      },
    );
  },

  deleteSong: (slug: string) => {
    return baseFetcher<{ success: boolean; message: string }>(
      `/songs/${slug}`,
      {
        method: "DELETE",
      },
    );
  },
};
