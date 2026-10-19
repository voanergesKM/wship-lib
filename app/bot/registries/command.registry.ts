import { startCommand } from "@/bot/commands/start.command";
import { playlistsCommand } from "@/bot/commands/playlists.command";
import { addCommand } from "@/bot/commands/add.command";
import { resetCommand } from "@/bot/commands/reset.command";
import { BOT_COMMANDS } from "@/bot/contsants";

export const commandRegistry = {
  [BOT_COMMANDS.START]: startCommand,
  [BOT_COMMANDS.PLAYLISTS]: playlistsCommand,
  [BOT_COMMANDS.LISTS]: playlistsCommand,
  // [BOT_COMMANDS.ADD]: addCommand,
  // [BOT_COMMANDS.RESET]: resetCommand,
  // [BOT_COMMANDS.CANCEL]: resetCommand,
};
