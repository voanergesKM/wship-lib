import { playlistsFlow } from "@/bot/actions/playlists.action";
import { CallbackContext } from "@/types/telegram.types";

export const menuPlaylistsPageCallback = async (
  ctx: CallbackContext,
  match: RegExpMatchArray,
) => {
  const chatId = ctx.chat?.id || ctx.message?.chat?.id;
  const userId = ctx.from?.id;
  const messageId = ctx.message?.message_id;
  const page = parseInt(match[1], 10) || 1;

  if (chatId && userId) {
    await playlistsFlow(chatId, userId, messageId, page);
  }
};
