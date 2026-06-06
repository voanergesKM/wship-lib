import { StateMachine } from "@/lib/state-machine";
import { sendMessage } from "@/services/telegram.service";

export async function resetFlow(chatId: number, userId: number) {
  await StateMachine.reset(userId);

  await sendMessage(chatId, "🧹 Стан скинуто. Можеш почати заново.");
}
