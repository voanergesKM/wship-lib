import { startFindFlow } from "@/bot/actions";
import { CallbackContext } from "@/types/telegram.types";

export const menuFindCallback = async (ctx: CallbackContext) => {
  const chatId = ctx.message.chat.id;
  const userId = ctx.from.id;

  await startFindFlow(chatId, userId);
};
