import { startFlow } from "@/bot/actions";
import { mainMenuKeyboard } from "@/bot/keyboards/main-menu";
import { editMessageText } from "@/services/telegram.service";
import { CallbackContext } from "@/types/telegram.types";

export const menuMainCallback = async (ctx: CallbackContext) => {
  const chatId = ctx.chat?.id || ctx.message?.chat?.id;
  const messageId = ctx.message?.message_id;

  if (chatId) {
    if (messageId) {
      try {
        const res = await editMessageText(chatId, messageId, "📸 Головне меню", {
          reply_markup: mainMenuKeyboard(),
        });
        if (res && res.ok) return;
      } catch (err) {
        console.error("Error editing message to main menu:", err);
      }
    }
    await startFlow(chatId);
  }
};
