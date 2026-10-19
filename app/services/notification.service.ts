import { connectDB } from "@/lib/db";
import { SongProposal } from "@/models/SongProposal";
import { Song } from "@/models/Song";
import { User, UserDocument } from "@/models/User";
import { sendMessage } from "./telegram.service";

export function getAppBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_WEBAPP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  if (url) {
    return url.replace(/\/$/, "");
  }

  return "https://wship-library.vercel.app";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const notificationService = {
  /**
   * Notify song creator and admins about a new or updated song change proposal
   */
  notifyProposalCreatedOrUpdated: async ({
    proposalId,
    isUpdate = false,
  }: {
    proposalId: string;
    isUpdate?: boolean;
  }) => {
    try {
      await connectDB();

      const proposal = await SongProposal.findById(proposalId)
        .populate<{ user: UserDocument }>("user")
        .populate("song");

      if (!proposal || !proposal.song) {
        return;
      }

      const song = await Song.findById(proposal.song._id).populate<{
        createdBy: UserDocument;
      }>("createdBy");

      if (!song) {
        return;
      }

      const proposer = proposal.user;
      const proposerName =
        [proposer.firstName, proposer.lastName].filter(Boolean).join(" ") ||
        proposer.username ||
        "Користувач";

      // Collect target users: song creator + all admins
      const targetUserIds = new Set<string>();

      if (song.createdBy?._id) {
        targetUserIds.add(song.createdBy._id.toString());
      }

      const admins = await User.find({ role: "admin", isActive: true });
      for (const admin of admins) {
        targetUserIds.add(admin._id.toString());
      }

      // Exclude proposer themselves
      if (proposer?._id) {
        targetUserIds.delete(proposer._id.toString());
      }

      if (targetUserIds.size === 0) {
        return;
      }

      const recipients = await User.find({
        _id: { $in: Array.from(targetUserIds) },
        telegramId: { $exists: true, $ne: null },
      });

      const actionTitle = isUpdate
        ? "✏️ <b>Оновлено пропозицію змін</b>"
        : "📝 <b>Нова пропозиція змін</b>";
      const songTitle = song.title;
      const commentText = proposal.comment
        ? `\n💬 <b>Коментар:</b> <i>${escapeHtml(proposal.comment)}</i>`
        : "";
      const songUrl = `${getAppBaseUrl()}/songs/${song.slug}`;

      const text =
        `${actionTitle} до пісні «${escapeHtml(songTitle)}»!\n\n` +
        `👤 <b>Від:</b> ${escapeHtml(proposerName)}${commentText}\n\n` +
        `🔗 <a href="${songUrl}">Відкрити у браузері</a>`;

      await Promise.allSettled(
        recipients.map((recipient) => {
          if (!recipient.telegramId) return Promise.resolve();
          const chatId = Number(recipient.telegramId);
          if (isNaN(chatId)) return Promise.resolve();

          return sendMessage(chatId, text, {
            parse_mode: "HTML",
            disable_web_page_preview: true,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "📖 Відкрити в Telegram",
                    web_app: {
                      url: songUrl,
                    },
                  },
                ],
              ],
            },
          });
        }),
      );
    } catch (err) {
      console.error("❌ Failed to send proposal Telegram notifications:", err);
    }
  },

  /**
   * Notify proposal author that their proposal was approved or rejected
   */
  notifyProposalReviewed: async ({
    proposalId,
    action,
    reason,
  }: {
    proposalId: string;
    action: "approve" | "reject";
    reason?: string;
  }) => {
    try {
      await connectDB();

      const proposal = await SongProposal.findById(proposalId)
        .populate<{ user: UserDocument }>("user")
        .populate("song");

      if (!proposal || !proposal.user?.telegramId || !proposal.song) {
        return;
      }

      const song = await Song.findById(proposal.song._id);
      if (!song) return;

      const chatId = Number(proposal.user.telegramId);
      if (isNaN(chatId)) return;

      const isApproved = action === "approve";
      const songTitle = song.title;
      const songUrl = `${getAppBaseUrl()}/songs/${song.slug}`;

      const statusEmoji = isApproved ? "🎉" : "❌";
      const statusTitle = isApproved
        ? `Вашу пропозицію змін до пісні «${escapeHtml(songTitle)}» <b>прийнято</b>!`
        : `Вашу пропозицію змін до пісні «${escapeHtml(songTitle)}» <b>відхилено</b>.`;

      const reasonBlock =
        !isApproved && reason
          ? `\n💬 <b>Причина:</b> <i>${escapeHtml(reason)}</i>`
          : "";

      const text =
        `${statusEmoji} ${statusTitle}${reasonBlock}\n\n` +
        `🔗 <a href="${songUrl}">Відкрити у браузері</a>`;

      await sendMessage(chatId, text, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "📖 Відкрити в Telegram",
                web_app: {
                  url: songUrl,
                },
              },
            ],
          ],
        },
      });
    } catch (err) {
      console.error(
        "❌ Failed to send proposal review Telegram notification:",
        err,
      );
    }
  },
};
