import { Song } from "@/models/Song";

export async function createAsset(data: any) {
  return Song.create(data);
}

export async function searchAssets(query: string) {
  return Song.find({
    $or: [{ title: new RegExp(query, "i") }, { tags: query }],
  }).limit(10);
}

export async function getAssetById(id: string) {
  return Song.findById(id);
}
