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

export async function getFile(fileId: string) {
  const res = await fetch(`${BASE}/getFile?file_id=${fileId}`);

  return res.json();
}
