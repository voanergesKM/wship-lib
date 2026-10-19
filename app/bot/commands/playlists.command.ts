import { BotHandler } from "@/types/telegram.types";
import { playlistsFlow } from "@/bot/actions/playlists.action";

export const playlistsCommand: BotHandler = async (ctx) => {
  await playlistsFlow(ctx.chat.id, ctx.from.id, ctx.message?.message_id);
};
