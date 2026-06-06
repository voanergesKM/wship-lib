import { Asset } from "@/models/Asset";

export async function createAsset(data: any) {
  return Asset.create(data);
}

export async function searchAssets(query: string) {
  return Asset.find({
    $or: [{ title: new RegExp(query, "i") }, { tags: query }],
  }).limit(10);
}

export async function getAssetById(id: string) {
  return Asset.findById(id);
}
