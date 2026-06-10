import { connectDB } from "@/lib/db";
import { StateMachine } from "@/lib/StateMachine";
import { getCommand } from "@/utils/getCommand";
import { commandRegistry } from "../registries/command.registry";
import { stateRegistry } from "../registries/state.registry";
import { BotContext } from "@/types/telegram.types";

export async function handleMessage(msg: BotContext) {
  await connectDB();

  const text = msg.text || "";
  const userId = msg.from.id;

  const command = getCommand(text);

  if (command) {
    const commandHandler =
      commandRegistry[command as keyof typeof commandRegistry];

    await commandHandler(msg);

    return Response.json({ ok: true });
  }

  // const state = await StateMachine.get(userId);

  // const stateHandler = stateRegistry[state.step as keyof typeof stateRegistry];

  // if (stateHandler) {
  //   await stateHandler(msg, state);
  // }

  return Response.json({ ok: true });
}
