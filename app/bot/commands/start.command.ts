import { BotHandler } from "@/types/telegram.types";

import { startFlow } from "@/bot/actions";

export const startCommand: BotHandler = async (ctx) => {
  await startFlow(ctx.chat.id);
};
