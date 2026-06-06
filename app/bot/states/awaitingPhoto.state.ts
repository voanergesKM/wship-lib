import { sendMessage } from "@/services/telegram.service";
import { startMetaFlow } from "../actions";
import { BotContext } from "@/types/telegram.types";

export const awaitingPhotoState = async (ctx: BotContext) => {
  const { photo, from, chat } = ctx;
  const userId = from.id;
  const chatId = chat.id;

  const fileId = photo?.at(-1)?.file_id;

  if (!fileId) {
    await sendMessage(chatId, "Будь ласка, надішліть фото");
  } else {
    await startMetaFlow(chatId, userId, fileId);
  }
};
