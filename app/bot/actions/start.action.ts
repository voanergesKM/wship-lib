import { sendMessage } from "@/services/telegram.service";
import { mainMenuKeyboard } from "../keyboards/main-menu";

export async function startFlow(chatId: number) {
  const mainKBD = mainMenuKeyboard();
  await sendMessage(chatId, "📸 Головне меню", {
    reply_markup: mainKBD,
  });
}
