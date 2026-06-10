import { StateMachine } from "@/lib/StateMachine";
import { sendMessage } from "@/services/telegram.service";

export async function finishAddFlow(chatId: number, userId: number) {
  await StateMachine.reset(userId);

  await sendMessage(chatId, "✅ Збережено");
}
