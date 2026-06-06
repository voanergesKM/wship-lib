import { getAssetById } from "@/services/asset.service";
import { sendPhoto, sendMessage } from "@/services/telegram.service";
import { CallbackContext } from "@/types/telegram.types";

export const viewAssetCallback = async (
  ctx: CallbackContext,
  match: RegExpMatchArray,
) => {
  const id = match[1];

  const asset = await getAssetById(id);

  await sendPhoto(
    ctx.message.chat.id,
    asset.image.url,
    `${asset.title}\n#${asset.tags.join(" #")}`,
  );
};
