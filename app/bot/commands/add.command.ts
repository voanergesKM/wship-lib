import { startAddFlow } from "@/bot/actions";
import { BotHandler } from "@/types/telegram.types";

export const addCommand: BotHandler = async (ctx) => {
  await startAddFlow(ctx.chat.id, ctx.from.id);
};
