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
};
