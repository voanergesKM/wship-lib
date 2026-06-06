import { StateMachine } from "@/lib/state-machine";
import { sendMessage } from "@/services/telegram.service";
import { STATE_STEPS } from "../contsants";

export async function startAddFlow(chatId: number, userId: number) {
  await StateMachine.set(userId, STATE_STEPS.AWAITING_PHOTO, {});

  await sendMessage(chatId, "📸 Надішли фото");
}
