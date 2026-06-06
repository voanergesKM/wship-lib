import { uploadFromUrl } from "@/lib/cloudinary";
import { createAsset } from "./asset.service";
import { getFile } from "./telegram.service";
import { getTelegramFileUrl } from "@/utils/getTelegramFileUrl";

type Params = {
  fileId: string;
  title: string;
  tags: string[];
  chatId: number;
  userId: number;
};

export async function saveAssetFromTelegram(params: Params) {
  const file = await getFile(params.fileId);

  const fileUrl = getTelegramFileUrl(file.result.file_path);

  const uploaded = await uploadFromUrl(fileUrl);

  return createAsset({
    title: params.title,
    tags: params.tags,

    image: {
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
    },

    telegram: {
      fileId: params.fileId,
      chatId: params.chatId,
      userId: params.userId,
    },
  });
}
