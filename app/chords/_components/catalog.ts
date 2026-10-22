import type { GuitarChordQuality } from "@/utils/guitarChords";

export type ChordCategory = "basic" | "jazz" | "suspended";
interface ChordEntry {
  quality: GuitarChordQuality;
  name: string;
  category: ChordCategory;
}

export const CHORD_CATALOG = [
  { quality: "", name: "Мажор", category: "basic" },
  { quality: "m", name: "Мінор", category: "basic" },
  { quality: "5", name: "Квінтакорд", category: "basic" },
  { quality: "7", name: "Домінантсептакорд", category: "jazz" },
  { quality: "maj7", name: "Великий мажорний септакорд", category: "jazz" },
  { quality: "m7", name: "Малий мінорний септакорд", category: "jazz" },
  { quality: "m7b5", name: "Напівзменшений септакорд", category: "jazz" },
  { quality: "6", name: "Мажор із секстою", category: "jazz" },
  { quality: "m6", name: "Мінор із секстою", category: "jazz" },
  { quality: "6/9", name: "Мажор із секстою та ноною", category: "jazz" },
  { quality: "9", name: "Домінантовий нонакорд", category: "jazz" },
  { quality: "maj9", name: "Мажорний нонакорд", category: "jazz" },
  { quality: "m9", name: "Мінорний нонакорд", category: "jazz" },
  { quality: "m11", name: "Мінорний ундецимакорд", category: "jazz" },
  { quality: "13", name: "Домінантовий терцдецимакорд", category: "jazz" },
  { quality: "dim", name: "Зменшений тризвук", category: "jazz" },
  { quality: "dim7", name: "Зменшений септакорд", category: "jazz" },
  { quality: "aug", name: "Збільшений тризвук", category: "jazz" },
  { quality: "7b9", name: "Домінантсептакорд із малою ноною", category: "jazz" },
  { quality: "7#9", name: "Домінантсептакорд зі збільшеною ноною", category: "jazz" },
  { quality: "7#5", name: "Домінантсептакорд зі збільшеною квінтою", category: "jazz" },
  { quality: "sus2", name: "Секунда замість терції", category: "suspended" },
  { quality: "sus4", name: "Кварта замість терції", category: "suspended" },
  { quality: "7sus2", name: "Септакорд із секундою замість терції", category: "suspended" },
  { quality: "7sus4", name: "Септакорд із квартою замість терції", category: "suspended" },
  { quality: "add9", name: "Мажор із доданою ноною", category: "suspended" },
  { quality: "madd9", name: "Мінор із доданою ноною", category: "suspended" },
] as const satisfies readonly ChordEntry[];
