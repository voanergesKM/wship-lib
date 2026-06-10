import { sendMessage } from "@/services/telegram.service";
import { SongDocument } from "@/models/Song";

export async function searchFlow(chatId: number, results: SongDocument[]) {
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
