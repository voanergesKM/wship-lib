import { extractYouTubeId } from "@/utils/extractYouTubeId";
import { z } from "zod";

export const songSchemaStep1 = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Назва повинна містити щонайменше 2 символи")
    .max(100, "Назва занадто довга"),
  tags: z.string().trim().min(1, "Потрібно додати хоча б один тег"),
  youtubeUrls: z
    .string()
    .trim()
    .refine((val) => !val || extractYouTubeId(val) !== null, {
      message:
        "Невірний формат посилання YouTube (має бути посилання на відео)",
    }),
  key: z.string().trim(),
  bpm: z
    .string()
    .trim()
    .refine((val) => !val || !isNaN(Number(val)), {
      message: "BPM має бути числом",
    }),
  authors: z.string().trim(),
});

export const songSchema = songSchemaStep1.extend({
  document: z.string().trim().min(1, "Текст пісні з акордами є обов'язковим"),
});
