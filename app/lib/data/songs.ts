import { cache } from "react";

import { Song, SongDocument } from "@/models/Song";
import { User } from "@/models/User";
import { connectDB } from "../db";

export async function getSongBySlug(
  slug: string,
): Promise<SongDocument | null> {
  await connectDB();

  return Song.findOne({ slug }).populate("createdBy updatedBy");
}

/**
 * Memoized version of getSongBySlug using React.cache().
 * Deduplicates MongoDB queries within a single HTTP request lifecycle —
 * so calling this in both generateMetadata and Page component only
 * results in one actual database round-trip.
 */
export const getCachedSongBySlug = cache(getSongBySlug);
