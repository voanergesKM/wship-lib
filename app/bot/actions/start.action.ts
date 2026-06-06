import { sendMessage } from "@/services/telegram.service";
import { mainMenuKeyboard } from "../keyboards/main-menu";

const mainKBD = mainMenuKeyboard();

export async function startFlow(chatId: number) {
  await sendMessage(chatId, "📸 Menu", {
    reply_markup: mainKBD,
  });
}
