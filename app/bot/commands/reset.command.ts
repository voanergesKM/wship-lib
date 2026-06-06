import { resetFlow } from "@/bot/actions";
import { BotHandler } from "@/types/telegram.types";

export const resetCommand: BotHandler = async (ctx) => {
  await resetFlow(ctx.chat.id, ctx.from.id);
};
