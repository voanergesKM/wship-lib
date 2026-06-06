import { sendMessage } from "@/services/telegram.service";
import { StateMachine } from "@/lib/state-machine";
import { STATE_STEPS } from "../contsants";

export async function startMetaFlow(
  chatId: number,
  userId: number,
  fileId: string,
) {
  await StateMachine.set(userId, STATE_STEPS.AWAITING_META, { fileId });

  await sendMessage(chatId, "Тепер: #tags + назва");
}
