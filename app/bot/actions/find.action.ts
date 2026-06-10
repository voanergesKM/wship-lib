import { StateMachine } from "@/lib/StateMachine";
import { sendMessage } from "@/services/telegram.service";
import { STATE_STEPS } from "../contsants";

export async function startFindFlow(chatId: number, userId: number) {
  await StateMachine.set(userId, STATE_STEPS.AWAITING_SEARCH, {});

  await sendMessage(chatId, "🔍 Введи пошуковий запит");
}
