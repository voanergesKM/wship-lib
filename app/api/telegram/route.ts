import { handleMessage } from "@/bot/handlers/message.handler";
import { handleCallback } from "@/bot/handlers/callback.handler";

export async function POST(req: Request) {
  try {
    const update = await req.json();

    if (update.message) {
      await handleMessage(update.message);
    }

    if (update.callback_query) {
      const cb = update.callback_query;
      await handleCallback({
        callbackQuery: cb,
        data: cb.data || "",
        chat: cb.message?.chat,
        from: cb.from,
        message: cb.message,
      });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("❌ TELEGRAM WEBHOOK ERROR:", err);

    return Response.json({ ok: false });
  }
}
