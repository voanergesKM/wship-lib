export const getTelegramFileUrl = (filePath: string) => {
  return `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${filePath}`;
};
