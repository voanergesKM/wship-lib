import { commandRegistry } from "@/bot/registries/command.registry";
import { BotCommand } from "@/types/telegram.types";

export function getCommand(text: string): BotCommand | null {
  const command = text.split(" ")[0];

  if (command in commandRegistry) {
    return command as BotCommand;
  }

  return null;
}
