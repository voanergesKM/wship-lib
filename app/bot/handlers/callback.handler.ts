import { connectDB } from "@/lib/db";
import { sendPhoto, sendMessage } from "@/services/telegram.service";
import { getAssetById } from "@/services/asset.service";
import { resetFlow, startAddFlow, startFindFlow } from "@/bot/actions";
import { MENU_ACTIONS } from "../contsants";
import { BotCallback, CallbackContext } from "@/types/telegram.types";
import { callbackRegistry } from "../registries/callback.registry";
import { callbackMatchers } from "../callbacks/matchers.callback";

export async function handleCallback(ctx: CallbackContext) {
  await connectDB();

  // const data = cb.data;
  // const chatId = cb.message.chat.id;
  // const userId = cb.from.id;

  const staticHandler =
    callbackRegistry[ctx.data as keyof typeof callbackRegistry];

  if (staticHandler) {
    await staticHandler(ctx);

    return Response.json({ ok: true });
  }

  for (const matcher of callbackMatchers) {
    const match = ctx.data.match(matcher.pattern);

    if (match) {
      await matcher.handler(ctx, match);

      return Response.json({ ok: true });
    }
  }

  // MENU

  // if (data === MENU_ACTIONS.RESET) {
  //   await resetFlow(chatId, userId);
  // }

  return Response.json({ ok: true });
}
