import { playlistsFlow } from "@/bot/actions/playlists.action";
import { CallbackContext } from "@/types/telegram.types";

export const menuPlaylistsCallback = async (ctx: CallbackContext) => {
  const chatId = ctx.chat?.id || ctx.message?.chat?.id;
  const userId = ctx.from?.id;
  const messageId = ctx.message?.message_id;

  if (chatId && userId) {
    await playlistsFlow(chatId, userId, messageId);
  }
};
