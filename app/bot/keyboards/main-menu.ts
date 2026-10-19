import { MENU_ACTIONS } from "../contsants";
import { getAppBaseUrl } from "@/services/notification.service";

export function mainMenuKeyboard() {
  const baseUrl = getAppBaseUrl();

  return {
    inline_keyboard: [
      [
        {
          text: "📚 Відкрити бібліотеку",
          web_app: {
            url: baseUrl,
          },
        },
      ],
      [
        {
          text: "📋 Списки відтворень",
          callback_data: MENU_ACTIONS.PLAYLISTS,
        },
      ],
    ],
  };
}
