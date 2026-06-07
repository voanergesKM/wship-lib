import { MENU_ACTIONS } from "../contsants";

export function mainMenuKeyboard() {
  return {
    inline_keyboard: [
      // [{ text: "🔍 Find", callback_data: MENU_ACTIONS.FIND }],
      // [{ text: "➕ Add", callback_data: MENU_ACTIONS.ADD }],
      // [{ text: "🔄 Reset", callback_data: MENU_ACTIONS.RESET }],
      [
        {
          text: "📚 Open Library",
          web_app: {
            url: process.env.NEXT_PUBLIC_WEBAPP_URL,
          },
        },
      ],
    ],
  };
}
