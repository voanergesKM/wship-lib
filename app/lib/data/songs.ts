import { cache } from "react";

import { Song, SongDocument } from "@/models/Song";
import "@/models/User";
import { connectDB } from "../db";

export interface GetSongsListParams {
  page?: number;
  limit?: number;
  search?: string;
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

export async function getSongBySlug(
  slug: string,
): Promise<SongDocument | null> {
  await connectDB();

  return Song.findOne({ slug }).populate("createdBy updatedBy");
}

/**
 * Memoized version of getSongBySlug using React.cache().
 * Deduplicates MongoDB queries within a single HTTP request lifecycle.
 */
export const getCachedSongBySlug = cache(getSongBySlug);

export async function getSongsList({
  page = 1,
  limit = 18,
  search = "",
}: GetSongsListParams = {}): Promise<PaginatedSongsList> {
  await connectDB();

  const query: {
    $or?: Array<
      | { title: { $regex: string; $options: string } }
      | { tags: { $in: RegExp[] } }
      | { authors: { $in: RegExp[] } }
      | { searchText: { $regex: string; $options: string } }
    >;
  } = {};

  if (search) {
    query.$or = [
      {
        title: {
          $regex: search,
          $options: "i",
        },
      },
      {
        tags: {
          $in: [new RegExp(search, "i")],
        },
      },
      {
        authors: {
          $in: [new RegExp(search, "i")],
        },
      },
      {
        searchText: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  const [songs, total] = await Promise.all([
    Song.find(query)
      .select("-document -searchText")
      .sort({
        createdAt: -1,
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Song.countDocuments(query),
  ]);

  return {
    data: songs as unknown as SongDocument[],
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Memoized version of getSongsList using React.cache().
 * Deduplicates calls across Server Components within the same render pass.
 */
export const getCachedSongsList = cache(getSongsList);
