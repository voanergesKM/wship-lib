import { BOT_COMMANDS, MENU_ACTIONS } from "@/bot/contsants";
import { callbackRegistry } from "@/bot/registries/callback.registry";
import { Step } from "@/lib/StateMachine";

export type TelegramChat = {
  id: number;
  type: string;
  first_name?: string;
  last_name?: string;
  username?: string;
};

export type TelegramUser = {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

export type TelegramPhoto = {
  file_id: string;
  file_unique_id: string;
  file_size?: number;
  width: number;
  height: number;
};

export type TelegramMessage = {
  message_id: number;
  text?: string;
  photo?: TelegramPhoto[];
  chat: TelegramChat;
  from: TelegramUser;
};

export type TelegramCallbackQuery = {
  id: string;
  data: string;
  from: TelegramUser;
  message: TelegramMessage;
};

export interface BotContext {
  message: TelegramMessage;
  photo?: TelegramPhoto[];
  text: string;
  chat: TelegramChat;
  from: TelegramUser;
  step: Step;
}

export interface CallbackContext {
  callbackQuery: TelegramCallbackQuery;
  data: string;
  chat: TelegramChat;
  from: TelegramUser;
  message: TelegramMessage;
}

export type BotHandler = (ctx: BotContext) => Promise<void>;

export type BotCommand = (typeof BOT_COMMANDS)[keyof typeof BOT_COMMANDS];

export type BotCallback =
  (typeof callbackRegistry)[keyof typeof callbackRegistry];

export type MenuActionType = (typeof MENU_ACTIONS)[keyof typeof MENU_ACTIONS];
