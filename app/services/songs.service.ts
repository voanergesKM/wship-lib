import { baseFetcher } from "@/utils/baseFetcher";
import { SongDocument } from "../models/Song";

export interface SongParams {
  page: number;
  limit: number;
  search: string;
}

export interface PaginatedSongsList {
  data: SongDocument[];
  total: number;
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

    console.log("🚀 ~ query:", query);
    return baseFetcher<PaginatedSongsList>(`/songs?${query.toString()}`, {
      method: "GET",
      signal,
    });
  },

  fetchById: (id: string, signal?: AbortSignal) => {
    return baseFetcher<SongDocument>(`/songs/${id}`, { signal });
  },

  create: (data: Omit<SongDocument, "id">) => {
    return baseFetcher<SongDocument>("/songs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
