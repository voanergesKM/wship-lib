import { sendMessage } from "@/services/telegram.service";
import { AssetDocument } from "@/models/Asset";

export async function searchFlow(chatId: number, results: AssetDocument[]) {
  await sendMessage(chatId, "Результати:", {
    reply_markup: {
      inline_keyboard: results.map((r) => [
        {
          text: r.title,
          callback_data: `view_${r._id}`,
        },
      ]),
    },
  });
}
