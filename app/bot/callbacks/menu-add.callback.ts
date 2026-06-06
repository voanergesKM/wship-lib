import { startAddFlow } from "@/bot/actions";
import { CallbackContext } from "@/types/telegram.types";

export const menuAddCallback = async (ctx: CallbackContext) => {
  const chatId = ctx.message.chat.id;
  const userId = ctx.from.id;

  await startAddFlow(chatId, userId);
};
