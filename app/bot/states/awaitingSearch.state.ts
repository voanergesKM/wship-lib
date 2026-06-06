import { StateMachine } from "@/lib/state-machine";
import { searchAssets } from "@/services/asset.service";
import { sendMessage } from "@/services/telegram.service";
import { searchFlow } from "../actions";
import { BotContext } from "@/types/telegram.types";

export const awaitingSearchState = async (ctx: BotContext) => {
  const query = ctx.text.trim();
  const userId = ctx.from.id;
  const chatId = ctx.chat.id;

  const results = await searchAssets(query);

  if (!results.length) {
    await sendMessage(chatId, "Нічого не знайдено");
  } else {
    await searchFlow(chatId, results);
  }

  await StateMachine.reset(userId);
};
