import { parseSong } from "@/utils/parseSong";

export function buildSearchText(song: {
  title?: string;
  tags?: string[];
  authors?: string[];
  document?: string;
}) {
  return normalizeSearchText([
    song.title,
    ...(song.tags || []),
    ...(song.authors || []),
    getDocumentSearchText(song.document),
  ]);
}

function getDocumentSearchText(document?: string) {
  if (!document) {
    return "";
  }

  return parseSong(document)
    .map((block) => {
      if (block.type === "heading") {
        return block.text;
      }

      if (block.type === "lyrics") {
        return block.parts.map((part) => part.lyric).join("");
      }

      return "";
    })
    .join(" ");
}

function normalizeSearchText(values: Array<string | undefined>) {
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}
