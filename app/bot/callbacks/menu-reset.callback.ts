import { resetFlow } from "@/bot/actions";
import { CallbackContext } from "@/types/telegram.types";

export const menuResetCallback = async (ctx: CallbackContext) => {
  const chatId = ctx.message.chat.id;
  const userId = ctx.from.id;

  await resetFlow(chatId, userId);
};
