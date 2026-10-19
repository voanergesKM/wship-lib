import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Group } from "@/models/Group";
import { SongList } from "@/models/SongList";
import "@/models/Song"; // Ensure Song schema is loaded for Mongoose populate
import { getAppBaseUrl } from "@/services/notification.service";
import { editMessageText, sendMessage } from "@/services/telegram.service";
import { MENU_ACTIONS } from "../contsants";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function playlistsFlow(
  chatId: number,
  userId: number,
  messageId?: number,
) {
  await connectDB();
  const baseUrl = getAppBaseUrl();

  const sendOrEdit = async (text: string, replyMarkup: any) => {
    if (messageId) {
      try {
        const res = await editMessageText(chatId, messageId, text, {
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: replyMarkup,
        });
        if (res && res.ok) return;
      } catch {
        // Fall back to sendMessage below
      }
    }

    await sendMessage(chatId, text, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: replyMarkup,
    });
  };

  const dbUser = await User.findOne({ telegramId: String(userId) });

  if (!dbUser) {
    await sendOrEdit(
      "⚠️ <b>Ви ще не авторизовані</b>\n\nБудь ласка, спочатку авторизуйтесь на сайті через бота, щоб переглядати ваші списки відтворень.",
      {
        inline_keyboard: [
          [
            {
              text: "📚 Відкрити сайт",
              web_app: { url: baseUrl },
            },
          ],
          [
            {
              text: "⬅️ Головне меню",
              callback_data: MENU_ACTIONS.MAIN_MENU,
            },
          ],
        ],
      },
    );
    return;
  }

  const groups = await Group.find({ "members.userId": dbUser._id }).select("_id name");

  if (!groups || groups.length === 0) {
    await sendOrEdit(
      "ℹ️ <b>У вас немає доступних груп</b>\n\nПриєднайтесь до групи за запрошенням або створіть власну у додатку.",
      {
        inline_keyboard: [
          [
            {
              text: "👥 Перейти до груп",
              web_app: { url: `${baseUrl}/groups` },
            },
          ],
          [
            {
              text: "⬅️ Головне меню",
              callback_data: MENU_ACTIONS.MAIN_MENU,
            },
          ],
        ],
      },
    );
    return;
  }

  const groupIds = groups.map((g) => g._id);
  const lists = await SongList.find({ groupId: { $in: groupIds } })
    .populate<{ groupId: { _id: any; name: string } }>("groupId", "name")
    .populate<{ songs: { _id: any; title: string; slug: string }[] }>("songs", "title slug")
    .sort({ updatedAt: -1 })
    .limit(5);

  if (!lists || lists.length === 0) {
    await sendOrEdit(
      "ℹ️ <b>Списків відтворень не знайдено</b>\n\nУ ваших групах ще немає створених списків відтворень.",
      {
        inline_keyboard: [
          [
            {
              text: "➕ Створити список",
              web_app: { url: `${baseUrl}/groups` },
            },
          ],
          [
            {
              text: "⬅️ Головне меню",
              callback_data: MENU_ACTIONS.MAIN_MENU,
            },
          ],
        ],
      },
    );
    return;
  }

  let text = "📋 <b>Ваші списки відтворень:</b>\n\n";

  lists.forEach((list, i) => {
    const groupName = list.groupId?.name ? ` <i>(${escapeHtml(list.groupId.name)})</i>` : "";
    text += `<b>${i + 1}. ${escapeHtml(list.name)}</b>${groupName}\n`;

    if (list.songs && list.songs.length > 0) {
      list.songs.slice(0, 7).forEach((song, sIdx) => {
        const songUrl = `${baseUrl}/songs/${song.slug}`;
        text += `  ${sIdx + 1}. <a href="${songUrl}">${escapeHtml(song.title)}</a>\n`;
      });
      if (list.songs.length > 7) {
        text += `  <i>...та ще ${list.songs.length - 7} пісень</i>\n`;
      }
    } else {
      text += `  <i>(список поки порожній)</i>\n`;
    }
    text += "\n";
  });

  text += "<i>Натисніть кнопку нижче, щоб відкрити потрібний список у Telegram:</i>";

  const inline_keyboard: any[][] = lists.map((list) => {
    const gId = list.groupId?._id ? list.groupId._id.toString() : list.groupId?.toString();
    const listTitle = list.name.length > 25 ? list.name.slice(0, 22) + "..." : list.name;

    return [
      {
        text: `▶️ ${listTitle}`,
        web_app: {
          url: `${baseUrl}/groups/${gId}/lists/${list._id}`,
        },
      },
    ];
  });

  inline_keyboard.push([
    {
      text: "⬅️ Головне меню",
      callback_data: MENU_ACTIONS.MAIN_MENU,
    },
  ]);

  await sendOrEdit(text, { inline_keyboard });
}
