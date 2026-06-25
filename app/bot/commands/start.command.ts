import { BotHandler } from "@/types/telegram.types";
import { startFlow } from "@/bot/actions";
import { connectDB } from "@/lib/db";
import { AuthSession } from "@/models/AuthSession";
import { User } from "@/models/User";
import { sendMessage } from "@/services/telegram.service";

export const startCommand: BotHandler = async (ctx) => {
  const text = ctx.text || "";
  const parts = text.split(" ");

  if (parts.length > 1 && parts[1].startsWith("auth_")) {
    const code = parts[1];
    
    try {
      await connectDB();
      const session = await AuthSession.findOne({ code, status: "pending" });
      
      if (session) {
        let dbUser = await User.findOne({ telegramId: String(ctx.from.id) });
        
        if (!dbUser) {
          dbUser = await User.create({
            telegramId: String(ctx.from.id),
            username: ctx.from.username || null,
            firstName: ctx.from.first_name,
            lastName: ctx.from.last_name || null,
            languageCode: ctx.from.language_code || null,
          });
        } else {
          // Update user fields
          dbUser.username = ctx.from.username || dbUser.username || null;
          dbUser.firstName = ctx.from.first_name || dbUser.firstName;
          dbUser.lastName = ctx.from.last_name || dbUser.lastName || null;
          await dbUser.save();
        }
        
        session.status = "completed";
        session.user = dbUser._id;
        await session.save();
        
        await sendMessage(
          ctx.chat.id,
          "✅ Ви успішно авторизовані на сайті! Можете закрити цей чат і повернутись у браузер."
        );
        return;
      }
    } catch (err) {
      console.error("Error processing auth code in bot:", err);
    }
  }

  await startFlow(ctx.chat.id);
};
