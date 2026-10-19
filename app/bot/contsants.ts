export const MENU_ACTIONS = {
  FIND: "menu_find",
  ADD: "menu_add",
  RESET: "menu_reset",
  VIEW: "menu_view",
  PLAYLISTS: "menu_playlists",
  MAIN_MENU: "menu_main",
} as const;

export const STATE_STEPS = Object.freeze({
  IDLE: "idle",
  AWAITING_PHOTO: "awaiting_photo",
  AWAITING_META: "awaiting_meta",
  AWAITING_SEARCH: "awaiting_search",
});

export const BOT_COMMANDS = {
  START: "/start",
  PLAYLISTS: "/playlists",
  LISTS: "/lists",
  ADD: "/add",
  FIND: "/find",
  CANCEL: "/cancel",
  RESET: "/reset",
} as const;
