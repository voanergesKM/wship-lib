import { Song, SongDocument } from "@/models/Song";
import { connectDB } from "../db";

export async function getSongBySlug(
  slug: string,
): Promise<SongDocument | null> {
  await connectDB();

  return Song.findOne({ slug }).populate("createdBy updatedBy");
}
