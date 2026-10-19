const BASE = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

export async function sendMessage(chatId: number, text: string, options?: any) {
  await fetch(`${BASE}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, ...options }),
  });
}

export async function sendPhoto(
  chatId: number,
  photo: string,
  caption?: string,
) {
  await fetch(`${BASE}/sendPhoto`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, photo, caption }),
  });
}

export async function editMessageText(
  chatId: number,
  messageId: number,
  text: string,
  options?: any,
) {
  try {
    const res = await fetch(`${BASE}/editMessageText`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        ...options,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error("Failed to editMessageText:", err);
  }
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  options?: { text?: string; show_alert?: boolean },
) {
  try {
    const res = await fetch(`${BASE}/answerCallbackQuery`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        ...options,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error("Failed to answerCallbackQuery:", err);
  }
}

export async function getFile(fileId: string) {
  const res = await fetch(`${BASE}/getFile?file_id=${fileId}`);

  return res.json();
}
